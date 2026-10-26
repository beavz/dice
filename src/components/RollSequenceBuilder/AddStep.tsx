"use client";

import MenuButton from "@/components/core/MenuButton";
import { initializeRoll } from "@/lib/roll";
import { type Step } from "@/lib/rollSequence";
import styles from "./AddStep.module.scss";

type AddStepProps = {
  onSelect: (step: Step) => void;
};

export function AddStep({ onSelect }: AddStepProps) {
  function addStep(type: Step["type"]) {
    const step: Step =
      type === "modify"
        ? { type: "modify", modifier: 1 }
        : type === "against"
          ? { type: "against", difficulty: 15 }
          : type === "then"
            ? {
                type: "then",
                after: {
                  success: {
                    combine: "sum",
                    roll: {
                      initialRoll: initializeRoll("basic"),
                      steps: [],
                    },
                  },
                  failure: {
                    combine: "sum",
                    roll: {
                      initialRoll: initializeRoll("basic"),
                      steps: [],
                    },
                  },
                },
              }
            : {
                type: "and",
                combine: "sum",
                roll: {
                  initialRoll: initializeRoll("basic"),
                  steps: [],
                },
              };

    onSelect(step);
  }

  return (
    <div className={styles.customStepActions}>
      <MenuButton<Step["type"]>
        label="+ Add step"
        items={[
          { id: "modify", label: "Modify" },
          { id: "against", label: "Evaluate" },
          { id: "and", label: "And" },
          { id: "then", label: "Then" },
        ]}
        onAction={addStep}
      />
    </div>
  );
}
