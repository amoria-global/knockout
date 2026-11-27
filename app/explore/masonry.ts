/** 2 columns under 640, then 3, 4, 5 and 6 at 640, 1024, 1280 and 1440. */
export function columnsFor(width: number): number {
  if (width >= 1440) return 6;
  if (width >= 1280) return 5;
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

/** Shortest-column layout: each entry goes to the column that is currently shortest, so columns fill evenly and none stays empty. */
export function layoutColumns(heights: number[], cols: number, gap: number): number[][] {
  const out: number[][] = Array.from({ length: cols }, () => []);
  const sums = new Array(cols).fill(0);
  heights.forEach((h, i) => {
    let best = 0;
    for (let c = 1; c < cols; c++) if (sums[c] < sums[best]) best = c;
    out[best].push(i);
    sums[best] += h + gap;
  });
  return out;
}

