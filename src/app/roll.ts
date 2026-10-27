export const CATEGORICAL_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

export function colorForIndex(index: number): string {
  return (
    CATEGORICAL_COLORS[index] ??
    CATEGORICAL_COLORS[CATEGORICAL_COLORS.length - 1]
  );
}

export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    if (a === b) return 0;
    if (a === "none") return -1;
    if (b === "none") return 1;
    return a.localeCompare(b);
  });
}
