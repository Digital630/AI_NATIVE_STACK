type ResultSummary = {
  commodity: string;
  grade?: string;
  quality?: string;
  moistureStatus?: string;
  confidenceLevel?: string;
};

function base64FromBytes(bytes: Uint8Array): string {
  // Avoid stack overflow by chunking.
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function toBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return base64FromBytes(bytes);
}

export function generateMoodBadge(summary: ResultSummary): { svg: string; caption: string } {
  const isGood =
    summary.quality?.toLowerCase().includes("good") ||
    summary.quality?.toLowerCase().includes("premium") ||
    summary.moistureStatus === "optimal" ||
    summary.confidenceLevel === "High";

  const isExcellent =
    summary.grade?.includes("AA") ||
    summary.grade?.includes("W180") ||
    summary.grade?.includes("Premium");

  let emoji = "🌟";
  let title = "Quality Champion";
  let color = "#22c55e";

  if (isExcellent) {
    emoji = "🏆";
    title = "Trade Star!";
    color = "#eab308";
  } else if (isGood) {
    emoji = "⭐";
    title = "Looking Good!";
    color = "#22c55e";
  } else {
    emoji = "💪";
    title = "Keep Growing!";
    color = "#3b82f6";
  }

  const svg = `
    <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="55" fill="url(#badgeGrad)" stroke="${color}" stroke-width="3"/>
      <circle cx="60" cy="60" r="45" fill="white" opacity="0.2"/>
      <text x="60" y="50" text-anchor="middle" font-size="32">${emoji}</text>
      <text x="60" y="75" text-anchor="middle" font-size="10" fill="white" font-weight="bold">${title}</text>
      <text x="60" y="90" text-anchor="middle" font-size="8" fill="white" opacity="0.9">${summary.commodity}</text>
    </svg>
  `;

  const svgBase64 = toBase64Utf8(svg);

  return {
    svg: `data:image/svg+xml;base64,${svgBase64}`,
    caption: `${emoji} ${title} - Your ${summary.commodity} earned this badge!`,
  };
}

let sharedAudioContext: AudioContext | null = null;

export async function playJingleSound(summary: ResultSummary): Promise<void> {
  const isGood =
    summary.quality?.toLowerCase().includes("good") ||
    summary.moistureStatus === "optimal";

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new AudioCtx();
    }

    // Safari/iOS frequently starts suspended until resumed after a user gesture.
    if (sharedAudioContext.state === "suspended") {
      await sharedAudioContext.resume();
    }

    const audioContext = sharedAudioContext;

    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime + 0.02;

    if (isGood) {
      // Happy ascending melody
      playTone(523.25, now, 0.15); // C5
      playTone(659.25, now + 0.15, 0.15); // E5
      playTone(783.99, now + 0.3, 0.15); // G5
      playTone(1046.5, now + 0.45, 0.3); // C6
    } else {
      // Encouraging two-note sound
      playTone(392.0, now, 0.2); // G4
      playTone(523.25, now + 0.25, 0.3); // C5
    }
  } catch {
    // Intentionally silent: audio is optional.
  }
}

export function getJingleCaption(summary: Pick<ResultSummary, "commodity" | "quality">): string {
  const isGood = summary.quality?.toLowerCase().includes("good");
  return isGood
    ? `🎵 Celebration time for your ${summary.commodity}!`
    : `🎵 Keep going with your ${summary.commodity}!`;
}
