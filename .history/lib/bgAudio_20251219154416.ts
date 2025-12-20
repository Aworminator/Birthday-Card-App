export type BgAudioHandle = {
  resume: () => Promise<void> | void;
  destroy: () => void;
  setGain: (v: number) => void;
};

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function setupBgAudio(audioEl: HTMLMediaElement, initialGain = 0.4): BgAudioHandle {
  const isIOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const Ctx: typeof AudioContext | undefined = (typeof window !== "undefined" &&
    ((window as any).AudioContext || (window as any).webkitAudioContext)) as any;

  // Non-iOS or no Web Audio support: fall back to element volume
  if (!isIOS || !Ctx) {
    try {
      (audioEl as HTMLAudioElement).muted = false;
      (audioEl as HTMLAudioElement).volume = clamp01(initialGain);
      // @ts-ignore playsInline exists on iOS
      (audioEl as HTMLAudioElement).playsInline = true;
    } catch {}
    return {
      resume: () => {},
      destroy: () => {},
      setGain: (v: number) => {
        try {
          (audioEl as HTMLAudioElement).volume = clamp01(v);
        } catch {}
      },
    };
  }

  // iOS path: route via Web Audio
  const ctx = new Ctx();
  const source = ctx.createMediaElementSource(audioEl as HTMLAudioElement);
  const gain = ctx.createGain();
  gain.gain.value = clamp01(initialGain);
  source.connect(gain).connect(ctx.destination);

  try {
    (audioEl as HTMLAudioElement).volume = 1.0;
    (audioEl as HTMLAudioElement).muted = false;
    // @ts-ignore
    (audioEl as HTMLAudioElement).playsInline = true;
  } catch {}

  return {
    resume: () => {
      if (ctx.state === "suspended") return ctx.resume();
    },
    destroy: () => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch {}
      try {
        if (ctx.state !== "closed") ctx.close();
      } catch {}
    },
    setGain: (v: number) => {
      try {
        gain.gain.value = clamp01(v);
      } catch {}
    },
  };
}
