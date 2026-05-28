/**
 * Capacity vs cycle analytics (aligned with Li_knee_end_x4.py).
 * Knee: perpendicular distance from chord (first–last point).
 * 0.8 critical: cycle after last point with y >= threshold (on smoothed series).
 */

export type CycleCapacityAnalysis = {
  kneeCycle: number | null;
  capacityAtKnee: number | null;
  criticalCycleBelow: number | null;
  /** Capacity at the critical cycle (original series, not smoothed) */
  capacityAtCritical: number | null;
  threshold: number;
};

const MED_WIN = 5;

export function sanitizeSeries(cycles: number[], capacities: number[]): { n: number[]; y: number[] } {
  const map = new Map<number, { sum: number; count: number }>();
  for (let i = 0; i < cycles.length; i++) {
    const nc = cycles[i];
    const yv = capacities[i];
    if (!Number.isFinite(nc) || !Number.isFinite(yv)) continue;
    const prev = map.get(nc) ?? { sum: 0, count: 0 };
    prev.sum += yv;
    prev.count += 1;
    map.set(nc, prev);
  }
  const ns = [...map.keys()].sort((a, b) => a - b);
  const ys = ns.map((k) => {
    const p = map.get(k)!;
    return p.sum / p.count;
  });
  return { n: ns, y: ys };
}

function movingMedian(y: number[], window: number): number[] {
  if (y.length === 0) return [];
  let w = Math.max(3, Math.floor(window));
  if (w % 2 === 0) w += 1;
  const half = (w - 1) >> 1;
  const out: number[] = [];
  for (let i = 0; i < y.length; i++) {
    const slice: number[] = [];
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < y.length) slice.push(y[j]!);
    }
    slice.sort((a, b) => a - b);
    out.push(slice[Math.floor(slice.length / 2)]!);
  }
  return out;
}

export function findKneePointPerpendicularDist(
  n: number[],
  yUsed: number[],
  yOriginal: number[]
): { kneeCycle: number; capacityAtKnee: number } | null {
  if (n.length < 3 || yUsed.length !== n.length || yOriginal.length !== n.length) return null;
  const x = n.map(Number);
  const ys = yUsed;

  const x0 = x[0]!;
  const y0 = ys[0]!;
  const x1 = x[x.length - 1]!;
  const y1 = ys[ys.length - 1]!;
  let lineVec = [x1 - x0, y1 - y0];
  let norm = Math.hypot(lineVec[0]!, lineVec[1]!);
  if (norm < 1e-14) {
    const span = Math.max(x1 - x0, 1e-9);
    lineVec = [span, 0];
    norm = span;
  }
  const ux = lineVec[0]! / norm;
  const uy = lineVec[1]! / norm;

  let bestIdx = 0;
  let bestDist = -1;
  for (let i = 0; i < x.length; i++) {
    const vx = x[i]! - x0;
    const vy = ys[i]! - y0;
    const proj = vx * ux + vy * uy;
    const px = proj * ux;
    const py = proj * uy;
    const dist = Math.hypot(vx - px, vy - py);
    if (dist > bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return { kneeCycle: n[bestIdx]!, capacityAtKnee: yOriginal[bestIdx]! };
}

/** Li_knee_end_x4: cycle index after last smoothed point with y >= threshold */
export function discreteCriticalCycleLiKnee(
  n: number[],
  ySmooth: number[],
  yOriginal: number[],
  threshold = 0.8
): { cycle: number | null; capacity: number | null } {
  if (n.length < 2 || ySmooth.length !== n.length || yOriginal.length !== n.length) {
    return { cycle: null, capacity: null };
  }

  let lastAbove = -1;
  for (let i = 0; i < ySmooth.length; i++) {
    if (ySmooth[i]! >= threshold) lastAbove = i;
  }

  if (lastAbove < 0) {
    return { cycle: n[0] ?? null, capacity: yOriginal[0] ?? null };
  }

  if (lastAbove >= ySmooth.length - 1) {
    const li = n.length - 1;
    return { cycle: n[li] ?? null, capacity: yOriginal[li] ?? null };
  }

  const idx = lastAbove + 1;
  return { cycle: n[idx] ?? null, capacity: yOriginal[idx] ?? null };
}

export function analyzeCycleCapacityRobust(rawN: number[], rawY: number[], threshold = 0.8): CycleCapacityAnalysis | null {
  const { n, y } = sanitizeSeries(rawN, rawY);
  if (n.length < 3) return null;

  const ySmooth = movingMedian(y, MED_WIN);
  const knee = findKneePointPerpendicularDist(n, ySmooth, y);
  const crit = discreteCriticalCycleLiKnee(n, ySmooth, y, threshold);

  return {
    kneeCycle: knee?.kneeCycle ?? null,
    capacityAtKnee: knee?.capacityAtKnee ?? null,
    criticalCycleBelow: crit.cycle,
    capacityAtCritical: crit.capacity,
    threshold
  };
}

function fmtCycle(v: number) {
  return v >= 100 ? v.toFixed(0) : v.toFixed(1);
}

/**
 * 80% 临界列展示：
 * - 临界点容量仍 > 阈值 → `> {cycle}`
 * - 预测在 maxCycle 处仍 > 阈值 → `> {maxCycle}`（数字为 Max cycle 设定值）
 */
export function formatCriticalDisplay(
  analysis: CycleCapacityAnalysis | null,
  opts?: { maxCycle?: number | null; capacityAtMaxCycle?: number | null }
): string {
  if (!analysis || analysis.criticalCycleBelow == null) return "—";

  const th = analysis.threshold;
  const cyc = analysis.criticalCycleBelow;
  const capAtCrit = analysis.capacityAtCritical;

  const maxC = opts?.maxCycle;
  const capAtMax = opts?.capacityAtMaxCycle;

  if (maxC != null && Number.isFinite(maxC) && capAtMax != null && capAtMax > th + 1e-9) {
    return `> ${fmtCycle(maxC)}`;
  }

  if (capAtCrit != null && capAtCrit > th + 1e-9) {
    return `> ${fmtCycle(cyc)}`;
  }

  return `≤${th.toFixed(2)}：${fmtCycle(cyc)}`;
}
