import { describe, it, expect } from "vitest";
import { interpolateColor } from "./index.cjs";

describe("interpolate colors", () => {
  it("give good results - 1", () => {
    // Given
    const c1 = { r: 10, g: 0, b: 0 };
    const c2 = { r: 0, g: 10, b: 0 };
    const ratio = 0.5;
    // When
    const c = interpolateColor(c1, c2, ratio);
    // Expect
    expect(c).toEqual({ r: 6, g: 4, b: 0 });
  });
  it("give good results - 2", () => {
    // Given
    const c1 = { r: 300, g: 220, b: 220 };
    const c2 = { r: 220, g: 300, b: 220 };
    const ratio = 0.5;
    // When
    const c = interpolateColor(c1, c2, ratio);
    // Expect
    expect(c).toEqual({ r: 255, g: 255, b: 255 });
  });
  it("give good results - 3", () => {
    // BUG: il y'a une erreur ici
    // Given
    const c1 = { r: 300, g: 200, b: 200 };
    const c2 = { r: 200, g: 300, b: 200 };
    const ratio = 0.5;
    // When
    const c = interpolateColor(c1, c2, ratio);
    // Expect
    expect(c).toEqual({ r: 6, g: 4, b: 0 });
  });
});
