"use client";

import { useMemo } from "react";
import { DICE, type Dice } from "@/lib/dice";
import { type BasicRoll } from "@/lib/roll";
import { type RollSequence, getSequenceLabel } from "@/lib/rollSequence";
import { getOutcomeDistribution } from "@/lib/outcomeDistribution";
import Button from "@/components/core/Button";
import PageSection from "@/components/core/PageSection";
import TextField from "@/components/core/TextField";
import CategoricalOutcomeDistributionChart from "@/components/dataVis/CategoricalOutcomeDistributionChart";
import OutcomeDistributionChart from "@/components/dataVis/OutcomeDistributionChart";
import CloseIcon from "@/components/icons/CloseIcon";
import DiceIcon from "@/components/icons/DiceIcon";
import SwordIcon from "@/components/icons/SwordIcon";
import WizardHatIcon from "@/components/icons/WizardHatIcon";
import { RollSequenceBuilder } from "@/components/RollSequenceBuilder";
import styles from "./RollSection.module.scss";

function getDiceOf(initialRoll: BasicRoll): Dice {
  return initialRoll.args.dice ?? [initialRoll.args.die];
}

type RollSectionProps = {
  index: number;
  roll: RollSequence;
  onChange: (roll: RollSequence) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function RollSection({
  index,
  roll,
  onChange,
  onDuplicate,
  onRemove,
  canRemove,
}: RollSectionProps) {
  const distribution = useMemo(() => getOutcomeDistribution(roll), [roll]);
  const label = getSequenceLabel(roll);
  const { initialRoll } = roll;
  const activeSides =
    initialRoll.type === "basic"
      ? DICE.filter((sides) => getDiceOf(initialRoll).includes(sides))
      : initialRoll.type === "check"
        ? ([20] as const)
        : ([12] as const);

  return (
    <PageSection
      heading={
        <>
          {`Roll ${index + 1}`}
          {label ? `: ${label}` : ""}
        </>
      }
      icons={
        roll.initialRoll.type === "attack" ? (
          <SwordIcon className={styles.rollIcon} />
        ) : roll.initialRoll.type === "spellWithSave" ? (
          <WizardHatIcon className={styles.rollIcon} />
        ) : (
          activeSides.map((sides) => (
            <DiceIcon key={sides} sides={sides} className={styles.rollIcon} />
          ))
        )
      }
      actions={
        <>
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
        </>
      }
    >
      <div className={styles.rollLayout}>
        <div className={styles.rollConfig}>
          <TextField
            label="Name"
            placeholder={`Roll ${index + 1}`}
            value={roll.name ?? ""}
            onChange={(name) => onChange({ ...roll, name })}
          />

          <RollSequenceBuilder rollSequence={roll} onChange={onChange} />
        </div>

        <div className={styles.rollCharts}>
          <OutcomeDistributionChart distribution={distribution} />
          <CategoricalOutcomeDistributionChart distribution={distribution} />
        </div>
      </div>
    </PageSection>
  );
}
