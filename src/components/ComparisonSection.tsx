"use client";

import { useMemo } from "react";
import { colorForIndex, sortCategories } from "@/app/roll";
import {
  getOutcomeDistribution,
  expectedValue,
} from "@/lib/outcomeDistribution";
import { type RollSequence, getSequenceLabel } from "@/lib/rollSequence";
import PageSection from "@/components/core/PageSection";
import ComparisonChart, {
  type ComparisonPoint,
} from "@/components/dataVis/ComparisonChart";
import CategoricalComparisonChart from "@/components/dataVis/CategoricalComparisonChart";

type OutcomeComparisonPoint = { label: string } & Record<
  string,
  number | string | undefined
>;

type ComparisonSectionProps = {
  rolls: RollSequence[];
};

export default function ComparisonSection({ rolls }: ComparisonSectionProps) {
  const { data, series, outcomeCategories, outcomeData } = useMemo(() => {
    const series = rolls.map((roll, index) => {
      const distribution = getOutcomeDistribution(roll);
      return {
        id: index,
        label: getSequenceLabel(roll),
        color: colorForIndex(index),
        distribution,
        expectedValue: expectedValue(distribution),
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
    <PageSection heading="Compare rolls">
      <ComparisonChart data={data} series={series} />

      {outcomeCategories.length > 1 && (
        <CategoricalComparisonChart series={series} data={outcomeData} />
      )}
    </PageSection>
  );
}
