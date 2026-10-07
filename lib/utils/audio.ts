/**
 * Official Connekyt Notification Audio & Ringtone Utility
 * Enables photographers and clients to receive audible alerts with the official ringtone.
 */

export type NotificationSoundType = 'ringtone' | 'chime';

export const SOUND_PATHS = {
  ringtone: '/sounds/connekyt_ringtone.mp3',
  ringtoneWav: '/sounds/connekyt_ringtone.wav',
  chime: '/sounds/connekyt_chime.mp3',
  chimeWav: '/sounds/connekyt_chime.wav',
} as const;

let currentAudio: HTMLAudioElement | null = null;

/**
 * Play official Connekyt notification sound or ringtone.
 * Returns a stop handler function to pause/cancel playback.
 */
export function playNotificationSound(
  type: NotificationSoundType = 'chime',
  volume: number = 0.8
): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const src = type === 'ringtone' ? SOUND_PATHS.ringtone : SOUND_PATHS.chime;
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    currentAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Suppress browser autoplay restrictions if user has not interacted yet
      });
    }

    return () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Ignore abort errors
      }
    };
  } catch {
    return () => {};
  }
}
