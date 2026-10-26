"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import {
  colorForIndex,
  formatRollLabel,
  getRollDisplayName,
  getDistributionBuilder,
  sortCategories,
} from "@/app/roll";
import { type RollSequence } from "@/lib/rollSequence";
import CategoricalComparisonChart from "./CategoricalComparisonChart";
import styles from "./ComparisonChart.module.scss";

type ComparisonPoint = { value: number } & Record<string, number | undefined>;
type OutcomeComparisonPoint = { label: string } & Record<
  string,
  number | string | undefined
>;

function ComparisonTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>Sum of {label}</div>
      {payload
        .filter((entry) => entry.value !== undefined)
        .map((entry) => (
          <div key={entry.dataKey as string} className={styles.tooltipRow}>
            <span
              className={styles.tooltipSwatch}
              style={{ background: entry.color }}
              aria-hidden="true"
            />
            <span className={styles.tooltipValue}>
              {((entry.value as number) * 100).toFixed(2)}%
            </span>
            <span className={styles.tooltipLabel}>{entry.name}</span>
          </div>
        ))}
    </div>
  );
}

type ComparisonChartProps = {
  rolls: RollSequence[];
};

export default function ComparisonChart({ rolls }: ComparisonChartProps) {
  const { data, series, outcomeCategories, outcomeData } = useMemo(() => {
    const series = rolls.map((roll, index) => {
      const builder = getDistributionBuilder(roll);
      return {
        id: index,
        label: roll.name?.trim()
          ? getRollDisplayName(roll, index)
          : formatRollLabel(roll) || getRollDisplayName(roll, index),
        color: colorForIndex(index),
        distribution: builder.result(),
        expectedValue: builder.expectedValue(),
      };
    });

    const values = new Set<number>();
    for (const { distribution } of series) {
      for (const { value } of distribution) values.add(value);
    }

    const data: ComparisonPoint[] = Array.from(values)
      .sort((a, b) => a - b)
      .map((value) => {
        const point: ComparisonPoint = { value };
        for (const { id, distribution } of series) {
          const matches = distribution.filter((entry) => entry.value === value);
          point[id] =
            matches.length > 0
              ? matches.reduce((sum, entry) => sum + entry.p, 0)
              : undefined;
        }
        return point;
      });

    const labels = new Set<string>();
    for (const { distribution } of series) {
      for (const { label } of distribution) labels.add(label);
    }
    const outcomeCategories = sortCategories([...labels]);

    const outcomeData: OutcomeComparisonPoint[] = outcomeCategories.map(
      (label) => {
        const point: OutcomeComparisonPoint = { label };
        for (const { id, distribution } of series) {
          point[id] = distribution
            .filter((entry) => entry.label === label)
            .reduce((total, entry) => total + entry.p, 0);
        }
        return point;
      },
    );

    return { data, series, outcomeCategories, outcomeData };
  }, [rolls]);

  if (data.length === 0) return null;

  return (
    <section className={styles.rollCard}>
      <h2 className={styles.rollTitle}>Compare rolls</h2>

      <div className={styles.card}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
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
            <Tooltip content={ComparisonTooltip} />
            <Legend
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
            />
            {series.map(({ id, color, expectedValue }) => (
              <ReferenceLine
                key={`${id}-avg`}
                x={expectedValue}
                stroke={color}
                strokeDasharray="4 4"
              />
            ))}
            {series.map(({ id, label, color }) => (
              <Line
                key={id}
                dataKey={id}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {outcomeCategories.length > 1 && (
        <CategoricalComparisonChart series={series} data={outcomeData} />
      )}
    </section>
  );
}
