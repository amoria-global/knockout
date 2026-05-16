/**
 * Single source of truth for "what makes a photographer profile 100%".
 *
 * The backend completion formula weights:
 *   Basic info 25% (phone + working city + profile photo, ⅓ each)
 *   Specialties 25% (>= min count)
 *   Portfolio 30% (>= 1 project)
 *   Work experience 20% (>= 1 entry + >= 1 with a long description)
 *
 * Used by BOTH the signup wizard and the post-login / post-OTP completion
 * wizard so they can never disagree. Assumes the auth token is ALREADY set
 * (signup + login + verify-otp all mint/return one, incl. pre-OTP).
 *
 * Completion-driving saves throw on failure so the wizard surfaces a real
 * error instead of leaving a sub-100% profile. Profile photo counts toward
 * completion (⅓ of basic info), so when a file is supplied its upload is
 * NOT best-effort — a silent failure here is exactly why fresh signups were
 * stuck around 92%.
 *
 * Idempotent for returning photographers: important-details / photo uploads
 * are server-side UPDATEs (safe to repeat), but project / work-experience /
 * package are ADD-ONLY endpoints. `payload.existing` (set by the completion
 * wizard from GET /profile-summary) tells us which of those the photographer
 * already has so we SKIP re-adding them instead of creating duplicate rows.
 * Undefined on fresh signup → nothing exists yet → add everything.
 */

import type { OnboardingPayload } from '@/app/components/PhotographerOnboarding';

export async function persistPhotographerProfile(
  payload: OnboardingPayload,
  who: { firstName: string; lastName: string; phone: string }
): Promise<void> {
  const { updateImportantDetails, updateProfilePicture, updateCoverPhoto, submitProfile } =
    await import('@/lib/APIs/photographers/update-profile/route');
  const { apiClient } = await import('@/lib/api/client');

  const r1 = await updateImportantDetails({
    firstName: who.firstName,
    lastName: who.lastName,
    phone: who.phone,
    about: payload.about,
    address: payload.address,
    specialtyIds: payload.specialtyIds,
    businessType: payload.businessType,
    ...(payload.businessType === 'Registered Company'
      ? { organizationName: payload.companyName, taxId: payload.tin }
      : {}),
  });
  if (!r1.success) throw new Error(r1.error || 'Could not save your basic details & specialties.');

  // Profile photo is completion-critical (⅓ of the basic-info 25%). If a
  // file was supplied and the upload fails, surface it — do NOT swallow.
  if (payload.profileFile) {
    const rPic = await updateProfilePicture(payload.profileFile);
    if (!rPic.success) {
      throw new Error(rPic.error || 'Could not upload your profile photo. Please retry.');
    }
  }
  // Cover photo is genuinely optional — stays best-effort.
  if (payload.coverFile) await updateCoverPhoto(payload.coverFile).catch(() => {});

  // add-project-portfolio is ADD-ONLY — skip if the photographer already
  // has a project (the completion wizard pre-filled it from the server).
  if (!payload.existing?.project) {
    // year is a primitive `int` on the backend DTO — Jackson rejects
    // null/empty/NaN with a 400. Coerce to a valid integer, default to the
    // current year if the wizard left it blank.
    const projYearNum = Number(payload.projYear);
    const safeYear = Number.isFinite(projYearNum) && projYearNum > 0
      ? Math.trunc(projYearNum)
      : new Date().getFullYear();
    const fd = new FormData();
    fd.append('requestDTO', new Blob([JSON.stringify({
      title: payload.projTitle,
      description: payload.projDescription,
      year: safeYear,
    })], { type: 'application/json' }));
    if (payload.projFile) fd.append('projectImage', payload.projFile);
    const rPortfolio = await apiClient.post('/api/remote/photographer/add-project-portfolio', fd, { retries: 1 });
    if (!rPortfolio.success) throw new Error(rPortfolio.error || 'Could not save your portfolio project.');
  }

  // add-work-experience is ADD-ONLY (no update endpoint) — skip if one exists.
  if (!payload.existing?.workExp) {
    const rExp = await apiClient.post('/api/remote/photographer/add-work-experience', {
      position: payload.expPosition,
      company: payload.expCompany,
      location: payload.expLocation,
      startDate: payload.expStartDate,
      endDate: payload.expEndDate,
      description: payload.expDescription,
    }, { retries: 1 });
    if (!rExp.success) throw new Error(rExp.error || 'Could not save your work experience.');
  }

  // All three tiers are pushed every time. POST /packages now upserts by
  // name on the backend (create-or-update), so this is idempotent — no
  // duplicates, and re-finalising just refreshes them. Not gated by
  // `existing` for that reason.
  for (const pkg of payload.packages) {
    const rPkg = await apiClient.post('/api/remote/photographer/packages', {
      packageName: pkg.tier,
      price: pkg.price,
      currencyId: payload.pkgCurrencyId,
      priceUnit: 'per session',
      durationHours: pkg.duration,
      description: pkg.description || `${pkg.tier} photography package`,
      isActive: true,
      hasLiveStream: pkg.tier === 'Diamond',
      includedPhotos: pkg.photos,
      includedVideos: pkg.videos,
      extraPhotoPrice: 0,
      extraVideoPrice: 0,
      photobookPhotos: 0,
      deliveryDays: pkg.delivery,
      features: pkg.features,
    }, { retries: 2 });
    if (!rPkg.success) throw new Error(rPkg.error || `Could not save your ${pkg.tier} package.`);
  }

  // Marks the profile submitted / ready for admin review.
  await submitProfile().catch(() => {});
}
