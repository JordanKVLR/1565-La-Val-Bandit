import { useVideoConfig } from "remotion";

/** Frame geometry shared by every scene. Wide = 16:9, tall = 9:16 (same scenes, own framing). */
export function useLayout() {
  const { width: w, height: h } = useVideoConfig();
  const tall = h > w;
  const horizon = h * (tall ? 0.55 : 0.6);
  return {
    w, h, tall, horizon,
    cx: w / 2,
    /** base sun radius (before heat scaling) */
    sunR: tall ? w * 0.26 : h * 0.19,
    /** where the foreground bastion top edge sits */
    wallTop: h * (tall ? 0.77 : 0.8),
    safeX: w * 0.06,
    safeY: h * 0.06,
    /** layer width used for parallax strips */
    stripW: w * (tall ? 3.2 : 2.4),
    captionSize: tall ? w * 0.05 : h * 0.036,
  };
}
export type Layout = ReturnType<typeof useLayout>;
