"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
  getDiceOf,
  getRollDisplayName,
  getDistributionBuilder,
  sortCategories,
  type Roll,
} from "./roll";
import { DICE } from '@/lib/dice';
import Button from "@/components/Button";
import CloseIcon from "@/components/CloseIcon";
import DiceIcon from "@/components/DiceIcon";
import RollSequence from "@/components/RollSequence";
import SwordIcon from "@/components/SwordIcon";
import TextField from "@/components/TextField";
import WizardHatIcon from "@/components/WizardHatIcon";
import styles from "./page.module.scss";

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

type RollCardProps = {
  index: number;
  roll: Roll;
  onChange: (roll: Roll) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function RollCard({
  index,
  roll,
  onChange,
  onDuplicate,
  onRemove,
  canRemove,
}: RollCardProps) {
  const { distribution, expectedValue } = useMemo(() => {
    const builder = getDistributionBuilder(roll);
    return {
      distribution: builder.result(),
      expectedValue: builder.expectedValue(),
    }
  }, [roll]);

  const categories = useMemo(
    () => sortCategories([...new Set(distribution.map((d) => d.label))]),
    [distribution],
  );

  const outcomeSummary = useMemo(
    () =>
      categories.map((label) => ({
        label,
        p: distribution
          .filter((d) => d.label === label)
          .reduce((total, d) => total + d.p, 0),
      })),
    [categories, distribution],
  );

  const chartData = useMemo(() => {
    const byValue = new Map<number, ChartRow>();
    for (const { value, label, p } of distribution) {
      const row = byValue.get(value) ?? { value };
      row[label] = (row[label] ?? 0) + p;
      byValue.set(value, row);
    }
    return Array.from(byValue.values()).sort((a, b) => a.value - b.value);
  }, [distribution]);

  const label = formatRollLabel(roll);
  const { initialRoll } = roll;
  const activeSides =
    initialRoll.type === "basic"
      ? DICE.filter((sides) => getDiceOf(initialRoll).includes(sides))
      : initialRoll.type === "check"
        ? ([20] as const)
        : ([12] as const);

  return (
    <section className={styles.rollCard}>
      <div className={styles.rollLayout}>
        <div className={styles.rollConfig}>
          <div className={styles.rollHeader}>
            <h2 className={styles.rollTitle}>
              {roll.initialRoll.type === "attack" ? (
                <SwordIcon className={styles.rollIcon} />
              ) : roll.initialRoll.type === "spellWithSave" ? (
                <WizardHatIcon className={styles.rollIcon} />
              ) : (
                activeSides.map((sides) => (
                  <DiceIcon
                    key={sides}
                    sides={sides}
                    className={styles.rollIcon}
                  />
                ))
              )}
              {getRollDisplayName(roll, index)}
              {label ? `: ${label}` : ""}
            </h2>
            <div className={styles.rollHeaderActions}>
              <Button
                variant="outline"
                onPress={onDuplicate}
                aria-label={`Duplicate roll ${index + 1}`}
              >
                Duplicate
              </Button>
              {canRemove && (
                <Button
                  variant="icon"
                  onPress={onRemove}
                  aria-label={`Remove roll ${index + 1}`}
                >
                  <CloseIcon />
                </Button>
              )}
            </div>
          </div>

          <TextField
            label="Name"
            placeholder={`Roll ${index + 1}`}
            value={roll.name}
            onChange={(name) => onChange({ ...roll, name })}
          />

          <RollSequence rollSequence={roll} onChange={onChange} />
        </div>

        <div className={styles.rollCharts}>
          <div className={styles.card}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={chartData}
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
                    ticks={chartData.map(({ value }) => value)}
                    tickLine={false}
                    axisLine={{ stroke: "var(--baseline)" }}
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(value: number) =>
                      `${Math.round(value * 100)}%`
                    }
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
                      radius={
                        i === categories.length - 1 ? [4, 4, 0, 0] : undefined
                      }
                      maxBarSize={24}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.empty}>
                Select at least one die to see odds.
              </p>
            )}
          </div>

          {categories.length > 1 && (
            <div className={`${styles.card} ${styles.secondaryCard}`}>
              <h3 className={styles.sectionLabel}>Outcome likelihood</h3>
              <ResponsiveContainer
                width="100%"
                height={Math.max(120, outcomeSummary.length * 44)}
              >
                <BarChart
                  data={outcomeSummary}
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
                    tickFormatter={(value: number) =>
                      `${Math.round(value * 100)}%`
                    }
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
                    {outcomeSummary.map((entry, i) => (
                      <Cell key={entry.label} fill={colorForIndex(i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
