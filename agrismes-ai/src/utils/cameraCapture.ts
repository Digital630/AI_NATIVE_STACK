type CaptureParams = {
  stream: MediaStream | null;
  video: HTMLVideoElement | null;
  canvas: HTMLCanvasElement | null;
  mimeType?: "image/jpeg" | "image/png";
  quality?: number; // jpeg quality 0..1
  maxWidth?: number;
  timeoutMs?: number;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function scaleToMaxWidth(w: number, h: number, maxWidth: number) {
  if (!maxWidth || w <= maxWidth) return { w, h };
  const ratio = maxWidth / w;
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

export async function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream) {
  if (video.srcObject !== stream) video.srcObject = stream;
  // If autoplay fails, we'll still rely on subsequent readiness checks.
  try {
    await video.play();
  } catch {
    // ignore (mobile autoplay quirks)
  }
}

export async function waitForVideoReady(
  video: HTMLVideoElement,
  timeoutMs = 7000
): Promise<{ width: number; height: number }> {
  const started = Date.now();

  // Wait until the video element actually has dimensions.
  // Some mobile browsers keep videoWidth/videoHeight at 0 until at least one frame is rendered.
  while (Date.now() - started < timeoutMs) {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w > 0 && h > 0 && video.readyState >= 2) return { width: w, height: h };
    await sleep(120);
  }

  throw new Error("VIDEO_NOT_READY");
}

async function captureWithImageCapture(params: CaptureParams): Promise<string | null> {
  const { stream, canvas, quality = 0.85, maxWidth = 1280 } = params;
  const ImageCaptureCtor = (globalThis as any).ImageCapture as
    | (new (track: MediaStreamTrack) => { takePhoto: () => Promise<Blob> })
    | undefined;

  if (!stream || !canvas || !ImageCaptureCtor) return null;

  const track = stream.getVideoTracks?.()[0];
  if (!track || track.readyState !== "live") return null;

  try {
    const imageCapture = new ImageCaptureCtor(track);
    const blob = await imageCapture.takePhoto();
    const bitmap = await createImageBitmap(blob);

    const { w, h } = scaleToMaxWidth(bitmap.width, bitmap.height, maxWidth);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);

    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
}

async function captureFromVideo(params: CaptureParams): Promise<string> {
  const {
    video,
    canvas,
    mimeType = "image/jpeg",
    quality = 0.85,
    maxWidth = 1280,
    timeoutMs = 8000,
  } = params;

  if (!video || !canvas) throw new Error("VIDEO_OR_CANVAS_MISSING");

  const { width, height } = await waitForVideoReady(video, timeoutMs);
  const { w, h } = scaleToMaxWidth(width, height, maxWidth);

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CTX_MISSING");

  ctx.drawImage(video, 0, 0, w, h);
  return mimeType === "image/png"
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", quality);
}

/**
 * Best-effort still capture:
 * - Prefer ImageCapture (more reliable than canvas on some Android devices)
 * - Fallback to drawing from the <video> element when ImageCapture isn't available (iOS Safari)
 */
export async function captureStillJpegDataUrl(params: CaptureParams): Promise<string> {
  const fromTrack = await captureWithImageCapture(params);
  if (fromTrack) return fromTrack;
  return captureFromVideo(params);
}
