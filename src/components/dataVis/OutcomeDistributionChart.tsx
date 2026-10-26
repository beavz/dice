"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { expectedValue as getExpectedValue, type CategorizedOutcomeDistribution
} from "@/lib/DistributionBuilder";
import type { TooltipContentProps } from "recharts";
import {
  colorForIndex,
  sortCategories,
} from "@/app/roll";
import styles from "./OutcomeDistributionChart.module.scss";

type ChartRow = { value: number } & Record<string, number | undefined>;

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter(
    (entry) => typeof entry.value === "number" && entry.value > 0,
  );
  if (rows.length === 0) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>Sum of {label}</div>
      {rows.map((entry) => (
        <div key={entry.dataKey as string} className={styles.tooltipRow}>
          {rows.length > 1 && (
            <span
              className={styles.tooltipSwatch}
              style={{ background: entry.color }}
              aria-hidden="true"
            />
          )}
          <span className={styles.tooltipValue}>
            {((entry.value as number) * 100).toFixed(2)}%
          </span>
          {rows.length > 1 && (
            <span className={styles.tooltipLabel}>{entry.name}</span>
          )}
        </div>
      ))}
    </div>
  );
}

type OutcomeDistributionChartProps = {
  distribution: CategorizedOutcomeDistribution
};

export default function OutcomeDistributionChart({
  distribution,
}: OutcomeDistributionChartProps) {

  const expectedValue = useMemo(() => {
    return getExpectedValue(distribution)
  }, [distribution]);

  const categories = useMemo(
    () => sortCategories([...new Set(distribution.map((d) => d.label))]),
    [distribution],
  );

  const data = useMemo(() => {
    const byValue = new Map<number, ChartRow>();
    for (const { value, label, p } of distribution) {
      const row = byValue.get(value) ?? { value };
      row[label] = (row[label] ?? 0) + p;
      byValue.set(value, row);
    }
    return Array.from(byValue.values()).sort((a, b) => a.value - b.value);
  }, [distribution]);

  return (
    <div className={styles.card}>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 24, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
            <XAxis
              dataKey="value"
              type="number"
              domain={[0, "dataMax"]}
              allowDecimals={false}
              ticks={data.map(({ value }) => value)}
              tickLine={false}
              axisLine={{ stroke: "var(--baseline)" }}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              width={40}
            />
            <Tooltip
              content={ChartTooltip}
              cursor={{ fill: "var(--text-primary)", opacity: 0.06 }}
            />
            {categories.length > 1 && (
              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              />
            )}
            <ReferenceLine
              x={expectedValue}
              stroke="var(--text-secondary)"
              strokeDasharray="4 4"
              label={{
                value: `Avg ${expectedValue.toFixed(1)}`,
                position: "top",
                fill: "var(--text-secondary)",
                fontSize: 11,
              }}
            />
            {categories.map((label, i) => (
              <Bar
                key={label}
                dataKey={label}
                name={label}
                stackId="probability"
                fill={colorForIndex(i)}
                stroke="var(--surface-1)"
                strokeWidth={2}
                radius={i === categories.length - 1 ? [4, 4, 0, 0] : undefined}
                maxBarSize={24}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className={styles.empty}>Select at least one die to see odds.</p>
      )}
    </div>
  );
}
