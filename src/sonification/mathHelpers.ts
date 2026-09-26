// Small numeric helpers shared by the sonification core.
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * clamp(t, 0, 1);
}

/** Maps `value` from [min, max] to a clamped [0, 1]. */
export function normalize(value: number, min: number, max: number): number {
  return clamp((value - min) / (max - min), 0, 1);
}
