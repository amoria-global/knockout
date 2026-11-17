import { describe, expect, it } from 'vitest';
import { normalizeChatList } from './route';

const m = (id: string, message: string) => ({ id, sender: 'Aline', message, createdAt: '2026-11-17T20:00:00' });

describe('normalizeChatList (the signed-in viewer chat list)', () => {
  it('rebuilds the messages from the object the shared client produces when it merges page, size and total into the array', () => {
    // This is exactly what apiClient hands back for { data: [a, b], page: 0, size: 500, total: 2 }.
    const merged = { 0: m('1', 'Beautiful sound'), 1: m('2', 'Greetings'), page: 0, size: 500, total: 2 };
    const out = normalizeChatList(merged);
    expect(Array.isArray(out.data)).toBe(true);
    expect(out.data.map((x) => x.message)).toEqual(['Beautiful sound', 'Greetings']);
    expect(out).toMatchObject({ page: 0, size: 500, total: 2 });
  });

  it('keeps the order of the keys when there are more than ten messages', () => {
    const merged: Record<string, unknown> = { total: 12 };
    for (let i = 0; i < 12; i++) merged[String(i)] = m(String(i), `msg ${i}`);
    expect(normalizeChatList(merged).data.map((x) => x.message)).toEqual(Array.from({ length: 12 }, (_, i) => `msg ${i}`));
  });

  it('passes a plain array and a { data: [...] } object through', () => {
    expect(normalizeChatList([m('1', 'a')]).data).toHaveLength(1);
    expect(normalizeChatList({ data: [m('1', 'a'), m('2', 'b')], total: 2 }).data).toHaveLength(2);
  });

  it('returns an empty list for nothing or for an unexpected value', () => {
    expect(normalizeChatList(undefined).data).toEqual([]);
    expect(normalizeChatList(null).data).toEqual([]);
    expect(normalizeChatList('nope').data).toEqual([]);
    expect(normalizeChatList({ page: 0, size: 500, total: 0 }).data).toEqual([]);
  });
});
