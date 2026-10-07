import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playNotificationSound, SOUND_PATHS } from './audio';

describe('Official Connekyt notification sound utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes official sound asset paths', () => {
    expect(SOUND_PATHS.ringtone).toBe('/sounds/connekyt_ringtone.mp3');
    expect(SOUND_PATHS.ringtoneWav).toBe('/sounds/connekyt_ringtone.wav');
    expect(SOUND_PATHS.chime).toBe('/sounds/connekyt_chime.mp3');
    expect(SOUND_PATHS.chimeWav).toBe('/sounds/connekyt_chime.wav');
  });

  it('returns a stop function without throwing when Audio is called', () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    const pauseMock = vi.fn();

    // Mock Audio in window
    (global as any).Audio = vi.fn().mockImplementation((src: string) => ({
      src,
      volume: 1,
      play: playMock,
      pause: pauseMock,
      currentTime: 0,
    }));

    const stopRingtone = playNotificationSound('ringtone', 0.9);
    expect(global.Audio).toHaveBeenCalledWith('/sounds/connekyt_ringtone.mp3');
    expect(playMock).toHaveBeenCalled();

    stopRingtone();
    expect(pauseMock).toHaveBeenCalled();
  });

  it('plays chime sound path for chime type', () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    (global as any).Audio = vi.fn().mockImplementation((src: string) => ({
      src,
      volume: 1,
      play: playMock,
      pause: vi.fn(),
      currentTime: 0,
    }));

    playNotificationSound('chime');
    expect(global.Audio).toHaveBeenCalledWith('/sounds/connekyt_chime.mp3');
  });
});
