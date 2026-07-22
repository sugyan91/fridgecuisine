import { describe, it, expect } from "vitest";
import { scaleIngredient, scaleIngredients, parseIngredient } from "@/lib/units";

describe("scaleIngredient smoke — unlocked recipe rendering", () => {
  it("scales a plain string ingredient", () => {
    const out = scaleIngredient("2 cups flour", 2);
    expect(out.toLowerCase()).toContain("flour");
    expect(out).toMatch(/^4/);
  });

  it("accepts object-shaped ingredients (legacy paid_recipes rows)", () => {
    const obj = { name: "flour", quantity: "2", unit: "cups" };
    const out = scaleIngredient(obj as unknown, 2);
    expect(typeof out).toBe("string");
    expect(out.toLowerCase()).toContain("flour");
  });

  it("returns '' rather than throwing on garbage", () => {
    for (const bad of [null, undefined, 42, {}, { name: null }]) {
      expect(() => scaleIngredient(bad as unknown, 1)).not.toThrow();
      expect(typeof scaleIngredient(bad as unknown, 1)).toBe("string");
    }
  });

  it("passes non-parseable strings through with ~ marker on scale", () => {
    const out = scaleIngredient("a pinch of salt", 2);
    expect(out).toContain("pinch");
    expect(out.startsWith("~")).toBe(true);
  });

  it("converts US to metric when requested", () => {
    const out = scaleIngredient("1 cup milk", 1, "metric");
    expect(out.toLowerCase()).toContain("ml");
  });

  it("mixed list (strings + objects) — the exact shape UnlockedView receives", () => {
    const mixed: unknown[] = [
      "1 egg",
      { name: "flour", quantity: "2", unit: "cups" },
      { name: "salt", qty: "1", unit: "tsp" },
      "a pinch of pepper",
    ];
    const out = scaleIngredients(mixed, 2);
    expect(out.length).toBe(4);
    for (const line of out) expect(typeof line).toBe("string");
    expect(out.some((l) => l.toLowerCase().includes("flour"))).toBe(true);
  });

  it("parseIngredient handles unicode fractions", () => {
    const p = parseIngredient("½ cup sugar");
    expect(p.qty).toBeCloseTo(0.5, 5);
    expect(p.unit).toBe("cup");
  });
});