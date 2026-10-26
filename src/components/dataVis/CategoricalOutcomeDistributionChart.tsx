"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { colorForIndex } from "@/app/roll";
import styles from "./CategoricalOutcomeDistributionChart.module.scss";

function OutcomeTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const [entry] = payload;
  if (typeof entry.value !== "number") return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipValue}>
          {(entry.value * 100).toFixed(2)}%
        </span>
        <span className={styles.tooltipLabel}>
          {(entry.payload as { label: string }).label}
        </span>
      </div>
    </div>
  );
}

type CategoricalOutcomeDistributionChartProps = {
  data: Array<{ label: string; p: number }>;
};

export default function CategoricalOutcomeDistributionChart({
  data,
}: CategoricalOutcomeDistributionChartProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.sectionLabel}>Outcome likelihood</h3>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 44)}>
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
          <Tooltip
            content={OutcomeTooltip}
            cursor={{ fill: "var(--text-primary)", opacity: 0.06 }}
          />
          <Bar dataKey="p" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell key={entry.label} fill={colorForIndex(i)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
