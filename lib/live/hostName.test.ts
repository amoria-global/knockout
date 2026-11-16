import { describe, expect, it } from 'vitest';
import { HOST_FALLBACK, resolveHostAvatar, resolveHostName } from './hostName';

describe('livestream host name', () => {
  it('prefers the creator, then the organizer, then the photographer', () => {
    const all = {
      creator: { firstName: 'Micheal', lastName: 'Jackson' },
      eventOrganizer: 'Kigali Gala Team',
      photographerName: 'Flat Photographer',
      photographer: { firstName: 'Pho', lastName: 'Tographer' },
    };
    expect(resolveHostName(all)).toBe('Micheal Jackson');
    expect(resolveHostName({ ...all, creator: null })).toBe('Kigali Gala Team');
    expect(resolveHostName({ ...all, creator: null, eventOrganizer: ' ' })).toBe('Flat Photographer');
    expect(resolveHostName({ photographer: all.photographer })).toBe('Pho Tographer');
  });

  it('copes with a creator who has only one name', () => {
    expect(resolveHostName({ creator: { firstName: 'Aline', lastName: null } })).toBe('Aline');
    expect(resolveHostName({ creator: { firstName: '', lastName: '  ' }, eventOrganizer: 'Team' })).toBe('Team');
  });

  it('never returns the word Organizer', () => {
    expect(resolveHostName({})).toBe(HOST_FALLBACK);
    expect(resolveHostName(null)).toBe(HOST_FALLBACK);
    expect(resolveHostName(undefined)).not.toMatch(/organizer/i);
    expect(HOST_FALLBACK).not.toMatch(/organizer/i);
  });

  it('takes the avatar in the same order, and has none when nobody has a picture', () => {
    expect(resolveHostAvatar({ creator: { profilePicture: 'c.png' }, photographer: { profilePicture: 'p.png' } })).toBe('c.png');
    expect(resolveHostAvatar({ creator: { profilePicture: ' ' }, photographer: { profilePicture: 'p.png' } })).toBe('p.png');
    expect(resolveHostAvatar({ eventOrganizer: 'Team' })).toBeUndefined();
    expect(resolveHostAvatar(null)).toBeUndefined();
  });
});
