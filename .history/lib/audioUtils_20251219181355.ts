/**
 * Plays an existing HTMLAudioElement after a user gesture and reliably applies volume.
 *
 * Why the delay:
 * - On iOS Safari, the first audible frame often ignores `element.volume`
 *   if set before or exactly at playback start.
 * - Applying volume shortly AFTER playback begins (via setTimeout) makes
 *   the volume change stick for subsequent frames.
 *
 * Muted → unmuted pattern:
 * - Starting playback muted and then unmuting after setting the volume
 *   can improve consistency on iOS (avoids a loud first frame).
 *
 * Do not use autoplay: call inside a user gesture (click/tap).
 */
export async function playWithReliableVolume(
  audioEl: HTMLAudioElement,
  targetVolume: number = 0.4,
  delayMs: number = 50,
  useMuteHack: boolean = true
): Promise<void> {
  if (!audioEl) return;

  try {
    // Inline playback hint (harmless on other platforms)
    // @ts-ignore
    audioEl.playsInline = true;
  } catch {}

  // Optionally start muted to avoid a loud first frame on iOS
  if (useMuteHack) {
    audioEl.muted = true;
  }

  try {
    const playPromise = audioEl.play();
    if (playPromise && typeof (playPromise as Promise<void>).then === "function") {
      await playPromise;
    }

    // Apply volume shortly after playback begins
    setTimeout(() => {
      try {
        audioEl.volume = Math.max(0, Math.min(1, targetVolume));
      } catch {
        // Some platforms ignore element.volume; best-effort fallback
      }
      if (useMuteHack) {
        audioEl.muted = false;
      }
    }, delayMs);
  } catch (err) {
    console.error("Playback failed:", err);
  }
}
