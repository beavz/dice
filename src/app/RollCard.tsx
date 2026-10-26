"use client";

import { useMemo } from "react";
import { DICE, type Dice } from "@/lib/dice";
import { type BasicRoll } from "@/lib/roll";
import { type RollSequence as RollSequenceType, getSequenceLabel } from "@/lib/rollSequence";
import { DistributionBuilder } from '@/lib/DistributionBuilder';
import Button from "@/components/core/Button";
import TextField from "@/components/core/TextField";
import CategoricalOutcomeDistributionChart from "@/components/dataVis/CategoricalOutcomeDistributionChart";
import OutcomeDistributionChart from "@/components/dataVis/OutcomeDistributionChart";
import CloseIcon from "@/components/icons/CloseIcon";
import DiceIcon from "@/components/icons/DiceIcon";
import SwordIcon from "@/components/icons/SwordIcon";
import WizardHatIcon from "@/components/icons/WizardHatIcon";
import RollSequence from "@/components/RollSequence";
import styles from "./page.module.scss";

function getDiceOf(initialRoll: BasicRoll): Dice {
  return initialRoll.args.dice ?? [initialRoll.args.die]
}

type RollCardProps = {
  index: number;
  roll: RollSequenceType;
  onChange: (roll: RollSequenceType) => void;
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
  const distribution = useMemo(() => DistributionBuilder.getResult(roll), [roll]);
  const label = getSequenceLabel(roll);
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
              {`Roll ${index + 1}`}
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
            value={roll.name ?? ""}
            onChange={(name) => onChange({ ...roll, name })}
          />

          <RollSequence rollSequence={roll} onChange={onChange} />
        </div>

        <div className={styles.rollCharts}>
          <OutcomeDistributionChart distribution={distribution} />
          <CategoricalOutcomeDistributionChart distribution={distribution} />
        </div>
      </div>
    </section>
  );
}
