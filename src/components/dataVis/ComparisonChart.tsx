"use client";

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
import Card from "@/components/core/Card";
import styles from "./ComparisonChart.module.scss";

export type ComparisonPoint = { value: number } & Record<
  string,
  number | undefined
>;

export type ComparisonSeries = {
  id: number;
  label: string;
  color: string;
  expectedValue: number;
};

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
  data: ComparisonPoint[];
  series: ComparisonSeries[];
};

export default function ComparisonChart({
  data,
  series,
}: ComparisonChartProps) {
  return (
    <Card>
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
    </Card>
  );
}
