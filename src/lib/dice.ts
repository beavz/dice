export const DICE = [4, 6, 8, 10, 12, 20, 100] as const;
export type Die = (typeof DICE)[number];
export type Dice = Array<Die>;

export function diceToString(dice: Dice, modifier?: number): string {
  const expression = DICE.reduce((terms, die) => {
    const count = dice.filter((d) => d === die).length;
    return count > 0 ? [...terms, `${count}d${die}`] : terms;
  }, [] as Array<string>).join(" + ");

  if (!modifier) return expression;

  const sign = modifier > 0 ? "+" : "-";
  return `${expression} ${sign} ${Math.abs(modifier)}`;
}
