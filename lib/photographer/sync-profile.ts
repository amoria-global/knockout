/**
 * Progressive, best-effort server autosave for the photographer onboarding
 * wizard. Runs on a 5s debounce while the user fills the wizard so every
 * section lands in the DB as they go - a dropped network just means a tick
 * is skipped, the next tick (or the final finalize) retries, and a returning
 * user resumes from whatever the server already has (via the prefill).
 *
 * Contract: this NEVER throws. It is the resilient layer; the authoritative
 * "everything must be saved or surface an error" step is still
 * persistPhotographerProfile() at finalize. The two compose because persist
 * is idempotent (it skips sections this sync already created).
 *
 * Upsert strategy per section:
 *   - important-details / package have UPDATE endpoints → re-save on change
 *     so the server always reflects the latest text.
 *   - project: add first time, then update-by-id.
 *   - work-experience has NO update endpoint → add first time; on later
 *     edits, ADD the new one FIRST and only delete the old on success
 *     (add-first ordering = the photographer is never left with zero work
 *     experience if the network dies mid-replace). Any not-yet-deleted old
 *     rows are tracked and retried so duplicates self-heal.
 *
 * Duplicate-safety: once a section has been created we remember that in
 * SyncState (not just in the server snapshot), so a failed profile-summary
 * fetch can never make us add a second project / package / work experience.
 */

import type { OnboardingPayload } from '@/app/components/PhotographerOnboarding';

export interface SyncState {
  // What we've confirmed exists server-side (sticky - never cleared, so a
  // flaky summary fetch can't trigger a duplicate create).
  created: { project: boolean; workExp: boolean; pkg: boolean };
  ids: { projectId?: string; workExpId?: string; pkgId?: string };
  // Stale work-experience rows whose delete hasn't confirmed yet - retried
  // every tick until gone.
  staleWorkExpIds: string[];
  // File object refs we already uploaded (re-upload only when a NEW file is
  // picked, not on every debounce tick).
  uploadedProfileFile: File | null;
  uploadedCoverFile: File | null;
  uploadedProjFile: File | null;
  // Per-section signatures of the last successfully-synced values, so we
  // only hit an endpoint when that section actually changed. `pkgs` is
  // keyed by tier name (Silver/Gold/Diamond) - each upserts independently.
  sigs: { important?: string; project?: string; workExp?: string; pkgs?: Record<string, string> };
}

export function initialSyncState(): SyncState {
  return {
    created: { project: false, workExp: false, pkg: false },
    ids: {},
    staleWorkExpIds: [],
    uploadedProfileFile: null,
    uploadedCoverFile: null,
    uploadedProjFile: null,
    sigs: {},
  };
}

/** Presence the wizard feeds into persistPhotographerProfile's `existing`. */
export interface SyncPresence {
  profilePhoto: boolean;
  coverPhoto: boolean;
  project: boolean;
  workExp: boolean;
  pkg: boolean;
}

const BASE = '/api/remote/photographer';

export async function syncPhotographerProfile(
  payload: OnboardingPayload,
  who: { firstName: string; lastName: string; phone: string },
  state: SyncState
): Promise<{ state: SyncState; presence: SyncPresence }> {
  // Mutate a shallow copy so the caller can swap refs atomically.
  const s: SyncState = {
    created: { ...state.created },
    ids: { ...state.ids },
    staleWorkExpIds: [...state.staleWorkExpIds],
    uploadedProfileFile: state.uploadedProfileFile,
    uploadedCoverFile: state.uploadedCoverFile,
    uploadedProjFile: state.uploadedProjFile,
    sigs: { ...state.sigs },
  };

  const presence: SyncPresence = {
    profilePhoto: !!state.uploadedProfileFile,
    coverPhoto: !!state.uploadedCoverFile,
    project: s.created.project,
    workExp: s.created.workExp,
    pkg: s.created.pkg,
  };

  try {
    const { updateImportantDetails, updateProfilePicture, updateCoverPhoto, getProfileSummary } =
      await import('@/lib/APIs/photographers/update-profile/route');
    const { apiClient } = await import('@/lib/api/client');

    // ── Source of truth: current server snapshot (ids + presence) ──
    // Best-effort; if it fails we fall back to our sticky `created` flags so
    // we never duplicate. We only learn ids from here.
    try {
      const sum = await getProfileSummary();
      const p = sum.success ? sum.data?.data : undefined;
      if (p) {
        if (p.profilePicture) presence.profilePhoto = true;
        if (p.coverPicture) presence.coverPhoto = true;
        const proj = p.projects?.[0];
        if (proj?.id) { s.ids.projectId = proj.id; s.created.project = true; presence.project = true; }
        const exp = p.workExperiences?.[0];
        if (exp?.id) { s.ids.workExpId = exp.id; s.created.workExp = true; presence.workExp = true; }
        if ((p.packages?.length ?? 0) > 0) { s.created.pkg = true; presence.pkg = true; }
      }
    } catch { /* offline - use sticky state below */ }

    // ── 1. Important details (idempotent UPDATE; needs address+specialties) ──
    const addr = payload.address.trim();
    if (addr && payload.specialtyIds.length >= 1) {
      const sig = JSON.stringify([
        who.firstName, who.lastName, who.phone, payload.about, addr,
        [...payload.specialtyIds].sort(), payload.businessType,
        payload.companyName, payload.tin,
      ]);
      if (sig !== s.sigs.important) {
        const r = await updateImportantDetails({
          firstName: who.firstName,
          lastName: who.lastName,
          phone: who.phone,
          about: payload.about,
          address: addr,
          specialtyIds: payload.specialtyIds,
          businessType: payload.businessType,
          ...(payload.businessType === 'Registered Company'
            ? { organizationName: payload.companyName, taxId: payload.tin }
            : {}),
        });
        if (r.success) s.sigs.important = sig;
      }
    }

    // ── 2. Profile / cover photo (upload only when a NEW file was picked) ──
    if (payload.profileFile && payload.profileFile !== s.uploadedProfileFile) {
      const r = await updateProfilePicture(payload.profileFile);
      if (r.success) { s.uploadedProfileFile = payload.profileFile; presence.profilePhoto = true; }
    }
    if (payload.coverFile && payload.coverFile !== s.uploadedCoverFile) {
      const r = await updateCoverPhoto(payload.coverFile);
      if (r.success) { s.uploadedCoverFile = payload.coverFile; presence.coverPhoto = true; }
    }

    // ── 3. Project (add first, then update-by-id) ──
    const projTitle = payload.projTitle.trim();
    const projDesc = payload.projDescription.trim();
    if (projTitle && projDesc) {
      const newProjFile = payload.projFile && payload.projFile !== s.uploadedProjFile
        ? payload.projFile : null;
      const sig = JSON.stringify([projTitle, payload.projYear, projDesc, !!newProjFile]);
      if (sig !== s.sigs.project) {
        const buildFd = () => {
          const fd = new FormData();
          fd.append('requestDTO', new Blob([JSON.stringify({
            title: projTitle,
            description: projDesc,
            year: payload.projYear,
          })], { type: 'application/json' }));
          if (newProjFile) fd.append('projectImage', newProjFile);
          return fd;
        };
        if (s.created.project && s.ids.projectId) {
          const r = await apiClient.post(`${BASE}/update-add-project-portfolio/${s.ids.projectId}`, buildFd(), { retries: 1 });
          if (r.success) { s.sigs.project = sig; if (newProjFile) s.uploadedProjFile = newProjFile; }
        } else if (!s.created.project) {
          const r = await apiClient.post(`${BASE}/add-project-portfolio`, buildFd(), { retries: 1 });
          if (r.success) {
            s.created.project = true; presence.project = true; s.sigs.project = sig;
            if (newProjFile) s.uploadedProjFile = newProjFile;
          }
        }
        // created but id unknown (summary fetch failed): skip this tick,
        // update once the id is learned - never re-add.
      }
    }

    // ── 4. Work experience (add-only API: add first, replace = add-then-delete) ──
    // Retry any not-yet-confirmed deletes first so duplicates self-heal.
    if (s.staleWorkExpIds.length > 0) {
      const stillStale: string[] = [];
      for (const id of s.staleWorkExpIds) {
        const r = await apiClient.post(`${BASE}/delete-work-experience/${id}`, undefined, { retries: 1 });
        if (!r.success) stillStale.push(id);
      }
      s.staleWorkExpIds = stillStale;
    }
    const expPos = payload.expPosition.trim();
    const expCo = payload.expCompany.trim();
    const expDesc = payload.expDescription.trim();
    if (expPos && expCo && expDesc) {
      const sig = JSON.stringify([
        expPos, expCo, payload.expLocation, payload.expStartDate,
        payload.expEndDate, expDesc,
      ]);
      if (sig !== s.sigs.workExp) {
        const body = {
          position: expPos,
          company: expCo,
          location: payload.expLocation,
          startDate: payload.expStartDate,
          endDate: payload.expEndDate,
          description: expDesc,
        };
        if (!s.created.workExp) {
          const r = await apiClient.post(`${BASE}/add-work-experience`, body, { retries: 1 });
          if (r.success) { s.created.workExp = true; presence.workExp = true; s.sigs.workExp = sig; }
        } else if (s.ids.workExpId) {
          // Replace: add the new row FIRST; only retire the old one if that
          // succeeds (never leave the photographer with zero experience).
          const oldId = s.ids.workExpId;
          const r = await apiClient.post(`${BASE}/add-work-experience`, body, { retries: 1 });
          if (r.success) {
            s.sigs.workExp = sig;
            s.ids.workExpId = undefined; // re-learned from summary next tick
            const del = await apiClient.post(`${BASE}/delete-work-experience/${oldId}`, undefined, { retries: 1 });
            if (!del.success) s.staleWorkExpIds.push(oldId);
          }
        }
        // created but id unknown: skip; learn id next tick.
      }
    }

    // ── 5. Packages - all three tiers, each upserted by name ──
    // POST /packages is now an upsert (create-or-update by name) on the
    // backend, so there's no id tracking and no PUT race: just POST each
    // changed tier. A per-tier signature avoids needless calls.
    if (payload.pkgCurrencyId) {
      const sigs = s.sigs.pkgs || {};
      for (const pk of payload.packages) {
        if (!pk.price || pk.price <= 0) continue;
        const serviceType = pk.serviceType ?? 'OUTDOOR';
        // Sig key + body include serviceType so an outdoor Silver and a
        // studio Silver don't collide (the dedup map is keyed per tier,
        // so without the prefix the second one would never POST).
        const sigKey = `${serviceType}:${pk.tier}`;
        const sig = JSON.stringify([
          pk.tier, pk.price, payload.pkgCurrencyId, pk.duration,
          pk.photos, pk.videos, pk.delivery, pk.description, serviceType,
        ]);
        if (sig === sigs[sigKey]) continue;
        const r = await apiClient.post(`${BASE}/packages`, {
          packageName: pk.tier,
          price: pk.price,
          currencyId: payload.pkgCurrencyId,
          priceUnit: serviceType === 'STUDIO' ? 'per studio session' : 'per session',
          durationHours: pk.duration,
          description: pk.description || `${pk.tier} ${serviceType === 'STUDIO' ? 'studio session' : 'photography'} package`,
          isActive: true,
          hasLiveStream: serviceType === 'OUTDOOR' && pk.tier === 'Diamond',
          includedPhotos: pk.photos,
          includedVideos: pk.videos,
          extraPhotoPrice: 0,
          extraVideoPrice: 0,
          photobookPhotos: 0,
          deliveryDays: pk.delivery,
          serviceType,
          features: pk.features,
        }, { retries: 2 });
        if (r.success) { sigs[sigKey] = sig; s.created.pkg = true; presence.pkg = true; }
      }
      s.sigs.pkgs = sigs;
    }
  } catch {
    // Whole tick failed (offline / import error). Return the state unchanged
    // enough that the next tick safely retries - never throw.
  }

  return { state: s, presence };
}
