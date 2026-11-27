import { describe, expect, it } from "vitest";
import { columnsFor, layoutColumns } from "./masonry";

describe("explore masonry", () => {
  it("uses 2, 3, 4, 5 and 6 columns at the agreed widths", () => {
    expect([360, 390, 639].map(columnsFor)).toEqual([2, 2, 2]);
    expect([640, 768, 1023].map(columnsFor)).toEqual([3, 3, 3]);
    expect([1024, 1279].map(columnsFor)).toEqual([4, 4]);
    expect(columnsFor(1280)).toBe(5);
    expect(columnsFor(1439)).toBe(5);
    expect(columnsFor(1440)).toBe(6);
  });

  it("never leaves a column empty when there are at least as many items as columns", () => {
    for (const cols of [2, 3, 4, 5, 6]) {
      for (let n = cols; n < cols + 25; n++) {
        const heights = Array.from({ length: n }, (_, i) => 120 + ((i * 53) % 260));
        const out = layoutColumns(heights, cols, 16);
        expect(out.every(c => c.length > 0)).toBe(true);
        expect(out.flat().sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
      }
    }
  });

  it("puts the next item in the shortest column so heights stay even", () => {
    const out = layoutColumns([300, 100, 100, 100, 100], 2, 0);
    // after 0 (300) the next three small ones all go to column 2 until it is as tall; the tie goes to the first column
    expect(out[0]).toEqual([0, 4]);
    expect(out[1]).toEqual([1, 2, 3]);
  });
});
