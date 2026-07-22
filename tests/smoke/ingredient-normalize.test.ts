import { describe, it, expect } from "vitest";
import {
  normalizeIngredient,
  normalizeIngredients,
} from "@/lib/ingredient-normalize";

describe("normalizeIngredient smoke", () => {
  it("keeps plain strings", () => {
    expect(normalizeIngredient("2 cups flour")).toBe("2 cups flour");
  });

  it("joins object-shaped ingredients {name, quantity, unit}", () => {
    expect(
      normalizeIngredient({ name: "flour", quantity: "2", unit: "cups" }),
    ).toBe("2 cups flour");
  });

  it("accepts qty / amount aliases", () => {
    expect(normalizeIngredient({ name: "salt", qty: "1", unit: "tsp" })).toBe(
      "1 tsp salt",
    );
    expect(
      normalizeIngredient({ name: "olive oil", amount: "2", unit: "tbsp" }),
    ).toBe("2 tbsp olive oil");
  });

  it("never throws on garbage input", () => {
    for (const bad of [null, undefined, 42, true, {}, { name: null }, []]) {
      expect(() => normalizeIngredient(bad as unknown)).not.toThrow();
      expect(typeof normalizeIngredient(bad as unknown)).toBe("string");
    }
  });

  it("normalizeIngredients filters empties and returns only strings", () => {
    const out = normalizeIngredients([
      "1 egg",
      { name: "flour", quantity: "2", unit: "cups" },
      null,
      {},
      42,
    ] as unknown[]);
    expect(out).toEqual(["1 egg", "2 cups flour"]);
    for (const s of out) expect(typeof s).toBe("string");
  });

  it("returns [] for non-array input", () => {
    expect(normalizeIngredients(null)).toEqual([]);
    expect(normalizeIngredients("nope" as unknown)).toEqual([]);
  });
});