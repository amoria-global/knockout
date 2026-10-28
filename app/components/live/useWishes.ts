'use client';

/**
 * Loads the public wishes feed for an event, page by page, and the host's moderation queue. Failures leave the last
 * good list in place and set `state` to 'error' only when there is nothing to show. Same behavior as the mobile hooks
 * (features/wishes/useWishFeed.ts).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { hideOwnWish, listHostWishes, listWishes, moderateWish, type Fetcher } from '@/lib/live/api';
import type { FeedState, Wish } from '@/lib/live/types';

const PAGE = 20;

export function useWishFeed(eventId: string | undefined, getFingerprint: () => Promise<string>) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [state, setState] = useState<FeedState>('loading');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [allowInvites, setAllowInvites] = useState<boolean | undefined>(undefined);
  const live = useRef(true);
  useEffect(() => {
    live.current = true; // set again on mount: a re-mounted effect (React strict mode) must not stay "gone"
    return () => void (live.current = false);
  }, []);

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      const p = await listWishes(eventId, await getFingerprint(), 0, PAGE);
      if (!live.current) return;
      setWishes(p.items);
      setTotal(p.total);
      setAllowInvites(p.allowWishInvites);
      setPage(p.page);
      setTotalPages(p.totalPages);
      setState('ready');
    } catch {
      if (live.current) setState((s) => (s === 'ready' ? s : 'error'));
    }
  }, [eventId, getFingerprint]);

  useEffect(() => {
    // Fetch on mount: the state is set after the await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!eventId) return;
    try {
      const p = await listWishes(eventId, await getFingerprint(), page + 1, PAGE);
      if (!live.current) return;
      setWishes((w) => [...w, ...p.items.filter((n) => !w.some((o) => o.id === n.id))]);
      setPage(p.page);
      setTotalPages(p.totalPages);
    } catch {
      /* keep what is shown; the button stays for another try */
    }
  }, [eventId, getFingerprint, page]);

  /** Removed from the list at once, and put back if the server refuses. */
  const hideOwn = useCallback(
    async (wish: Wish) => {
      if (!eventId) return;
      const before = wishes;
      setWishes((w) => w.filter((x) => x.id !== wish.id));
      setTotal((t) => Math.max(0, t - 1));
      try {
        await hideOwnWish(eventId, wish.id, await getFingerprint());
      } catch (e) {
        setWishes(before);
        setTotal((t) => t + 1);
        throw e;
      }
    },
    [eventId, getFingerprint, wishes],
  );

  return { wishes, state, total, allowInvites, hasMore: page + 1 < totalPages, reload: load, loadMore, hideOwn };
}

export function useHostWishes(eventId: string | undefined, fetcher: Fetcher) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [state, setState] = useState<FeedState>('loading');
  const [busyId, setBusyId] = useState<string | null>(null);
  const live = useRef(true);
  const f = useRef(fetcher);
  f.current = fetcher;
  useEffect(() => {
    live.current = true; // set again on mount: a re-mounted effect (React strict mode) must not stay "gone"
    return () => void (live.current = false);
  }, []);

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      const list = await listHostWishes(eventId, f.current);
      if (!live.current) return;
      setWishes(list);
      setState('ready');
    } catch {
      if (live.current) setState((s) => (s === 'ready' ? s : 'error'));
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = useCallback(
    async (wish: Wish, status: 'approved' | 'hidden') => {
      if (!eventId) return;
      setBusyId(wish.id);
      try {
        const next = await moderateWish(eventId, wish.id, status, f.current);
        if (live.current) setWishes((w) => w.map((x) => (x.id === wish.id ? next : x)));
      } finally {
        if (live.current) setBusyId(null);
      }
    },
    [eventId],
  );

  return { wishes, state, busyId, reload: load, approve: (w: Wish) => decide(w, 'approved'), hide: (w: Wish) => decide(w, 'hidden') };
}
