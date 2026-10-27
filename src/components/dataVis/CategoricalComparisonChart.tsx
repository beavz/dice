"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import Card from "@/components/core/Card";
import styles from "./CategoricalComparisonChart.module.scss";

type OutcomeComparisonPoint = { label: string } & Record<
  string,
  number | string | undefined
>;

type ComparisonSeries = { id: number; label: string; color: string };

function OutcomeCompareTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
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

type CategoricalComparisonChartProps = {
  series: ComparisonSeries[];
  data: OutcomeComparisonPoint[];
};

export default function CategoricalComparisonChart({
  series,
  data,
}: CategoricalComparisonChartProps) {
  return (
    <Card title="Outcome likelihood" className={styles.spacing}>
      <ResponsiveContainer
        width="100%"
        height={Math.max(160, data.length * 44)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
          <XAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={110}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          />
          <Tooltip content={OutcomeCompareTooltip} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
          {series.map(({ id, label, color }) => (
            <Bar
              key={id}
              dataKey={id}
              name={label}
              fill={color}
              maxBarSize={16}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
