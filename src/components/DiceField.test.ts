import { type Die, DICE } from '@/lib/dice';
import { parseRollExpression } from "./DiceField";

const EMPTY_COUNTS = {};
function counts(
  overrides: Partial<Record<Die, number>>,
) {
  return { ...overrides };
}

describe("parseRollExpression", () => {
  test("blank input parses to no dice and no modifier", () => {
    expect(parseRollExpression("")).toEqual({
      ok: true,
      counts: EMPTY_COUNTS,
      modifier: 0,
    });
  });

  test("whitespace-only input parses the same as blank", () => {
    expect(parseRollExpression("   \t  ")).toEqual({
      ok: true,
      counts: EMPTY_COUNTS,
      modifier: 0,
    });
  });

  test("parses a basic dice-and-modifier expression", () => {
    expect(parseRollExpression("2d8+1d6+4")).toEqual({
      ok: true,
      counts: counts({ 8: 2, 6: 1 }),
      modifier: 4,
    });
  });

  test("ignores whitespace anywhere in the expression", () => {
    expect(parseRollExpression("  2d8 + 1d6 +   4  ")).toEqual({
      ok: true,
      counts: counts({ 8: 2, 6: 1 }),
      modifier: 4,
    });
  });

  test("doesn't care what order dice types are specified in", () => {
    expect(parseRollExpression("1d6+2d8+4")).toEqual(
      parseRollExpression("2d8+1d6+4"),
    );
  });

  test("modifier can come before the dice terms", () => {
    expect(parseRollExpression("4+2d8+1d6")).toEqual({
      ok: true,
      counts: counts({ 8: 2, 6: 1 }),
      modifier: 4,
    });
  });

  test("a die term with no count defaults to 1", () => {
    expect(parseRollExpression("d6")).toEqual({
      ok: true,
      counts: counts({ 6: 1 }),
      modifier: 0,
    });
  });

  test("repeated terms for the same die type accumulate", () => {
    expect(parseRollExpression("2d8+2d8")).toEqual({
      ok: true,
      counts: counts({ 8: 4 }),
      modifier: 0,
    });
  });

  test("the die letter is case-insensitive", () => {
    expect(parseRollExpression("2D8+1D6")).toEqual(
      parseRollExpression("2d8+1d6"),
    );
  });

  test("multiple modifier terms are summed", () => {
    expect(parseRollExpression("5-2")).toEqual({
      ok: true,
      counts: EMPTY_COUNTS,
      modifier: 3,
    });
  });

  test("a lone negative modifier is valid", () => {
    expect(parseRollExpression("-4")).toEqual({
      ok: true,
      counts: EMPTY_COUNTS,
      modifier: -4,
    });
  });

  test("clamps a die count above the per-die maximum", () => {
    const result = parseRollExpression("10d6");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.counts[6]).toBe(6);
    }
  });

  test("clamps a modifier above the maximum", () => {
    const result = parseRollExpression("500");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.modifier).toBe(99);
    }
  });

  test("clamps a modifier below the minimum", () => {
    const result = parseRollExpression("-500");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.modifier).toBe(-99);
    }
  });

  test("rejects an unsupported die type", () => {
    const result = parseRollExpression("2d7+4");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/d7/);
    }
  });

  test("rejects subtracting dice, since that isn't a supported roll", () => {
    const result = parseRollExpression("-1d6+4");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/subtract dice/i);
    }
  });

  test("rejects an unparseable term", () => {
    const result = parseRollExpression("2d8+abc");
    expect(result.ok).toBe(false);
  });
});
