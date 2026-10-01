"use client";

import {
  Checkbox,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import Button from "@/components/Button";
import SelectField, { type SelectFieldOption } from "@/components/SelectField";
import {
  createAndStep,
  createThenBranch,
  withInitialRollKind,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  MAX_MODIFIER,
  MIN_MODIFIER,
  type CombineAction,
  type AndStep,
  type AttackInitialRoll,
  type CheckInitialRoll,
  type DaggerheartCheckInitialRoll,
  type CustomStep,
  type InitialRoll,
  type RegularInitialRoll,
  type Roll,
  type RollBlock,
  type SpellSaveInitialRoll,
  type ThenBranch,
  type ThenBranchKind,
  type ThenStep,
} from "@/app/roll";
import { getCombiner, listCombiners, type Combiner } from "@/lib/outcome";
import { DICE } from "@/lib/dice";
import CloseIcon from "@/components/CloseIcon";
import DiceField from "@/components/DiceField";
import NumberField from "@/components/NumberField";
import RadioGroupField from "@/components/RadioGroupField";
import styles from "./RollSequence.module.scss";


type CombineActionFieldProps = {
  value: CombineAction;
  onChange: (action: CombineAction) => void;
};

export const COMBINERS = listCombiners();

function CombineActionField({ value, onChange }: CombineActionFieldProps) {
  return (
    <SelectField
      label="Combine using"
      value={value}
      onChange={onChange}
      options={COMBINERS}
    />
  );
}

type CombineRollFieldsProps = {
  value: ThenBranch;
  onChange: (value: ThenBranch) => void;
};

function CombineRollFields({ value, onChange }: CombineRollFieldsProps) {
  return (
    <>
      <CombineActionField
        value={value.action}
        onChange={(action) => onChange({ ...value, action })}
      />
      <RollBlockFields
        block={value}
        onChange={(block) => onChange({ ...value, ...block })}
      />
    </>
  );
}

type AndStepProps = {
  step: AndStep;
  onChange: (step: AndStep) => void;
  onRemove?: () => void;
};

function AndStep({ step, onChange, onRemove }: AndStepProps) {
  return (
    <>
      <div className={styles.andBranch}>
        <RollBlockFields
          label="And roll..."
          block={step}
          onChange={(block) => onChange({ ...step, ...block })}
          onRemove={onRemove}
        />
      </div>
      <div className={styles.andMerge}>
        <CombineActionField
          value={step.action}
          onChange={(action) => onChange({ ...step, action })}
        />
      </div>
    </>
  );
}

const THEN_BRANCH_KINDS = [
  "success",
  "failure",
  "criticalSuccess",
  "criticalFailure",
] as const;

const THEN_BRANCH_LABEL: Record<ThenBranchKind, string> = {
  success: "On success",
  failure: "On failure",
  criticalSuccess: "On critical success",
  criticalFailure: "On critical failure",
};

const ROLL_KIND_OPTIONS: SelectFieldOption<InitialRoll["kind"]>[] = [
  { value: "regular", label: "Regular" },
  { value: "check", label: "Check" },
  { value: "dhCheck", label: "Daggerheart" },
  { value: "attack", label: "Attack" },
  { value: "spellSave", label: "Spell Save" },
];

type RollOptionsValue = {
  criticalSuccess?: number;
  criticalFailure?: number;
  with?: "hope" | "fear";
};

type RollOptionsFieldsProps<T extends RollOptionsValue> = {
  value: T;
  onChange: (value: T) => void;
};

function RollOptionsFields<T extends RollOptionsValue>({
  value,
  onChange,
}: RollOptionsFieldsProps<T>) {
  return (
    <>
      <RadioGroupField
        label="Tag as"
        value={value.with ?? "none"}
        options={[
          { value: "hope", label: "Hope" },
          { value: "fear", label: "Fear" },
          { value: "none", label: "None" },
        ]}
        onChange={(next) =>
          onChange({
            ...value,
            with: next === "hope" || next === "fear" ? next : undefined,
          })
        }
      />

      <div className={styles.critOptionsRow}>
        <Checkbox
          isSelected={value.criticalSuccess !== undefined}
          onChange={(isSelected) =>
            onChange({
              ...value,
              criticalSuccess: isSelected ? 20 : undefined,
            })
          }
          className={styles.checkbox}
        >
          <div className={styles.checkboxBox} aria-hidden="true" />
          Critical success on
        </Checkbox>
        <NumberField
          ariaLabel="Critical success value"
          value={value.criticalSuccess ?? 20}
          isDisabled={value.criticalSuccess === undefined}
          minValue={1}
          maxValue={100}
          onChange={(criticalSuccess) =>
            onChange({ ...value, criticalSuccess })
          }
        />
      </div>

      <div className={styles.critOptionsRow}>
        <Checkbox
          isSelected={value.criticalFailure !== undefined}
          onChange={(isSelected) =>
            onChange({
              ...value,
              criticalFailure: isSelected ? 1 : undefined,
            })
          }
          className={styles.checkbox}
        >
          <div className={styles.checkboxBox} aria-hidden="true" />
          Critical failure on
        </Checkbox>
        <NumberField
          ariaLabel="Critical failure value"
          value={value.criticalFailure ?? 1}
          isDisabled={value.criticalFailure === undefined}
          minValue={1}
          maxValue={100}
          onChange={(criticalFailure) =>
            onChange({ ...value, criticalFailure })
          }
        />
      </div>
    </>
  );
}

type StepListProps = {
  steps: CustomStep[];
  onChange: (steps: CustomStep[]) => void;
};

function StepList({ steps, onChange }: StepListProps) {
  function addStep(type: CustomStep["type"]) {
    const step: CustomStep =
      type === "modify"
        ? { id: crypto.randomUUID(), type: "modify", amount: 1 }
        : type === "evaluate"
          ? { id: crypto.randomUUID(), type: "evaluate", difficulty: 15 }
          : type === "and"
            ? createAndStep()
            : { id: crypto.randomUUID(), type: "then", branches: {} };
    onChange([...steps, step]);
  }

  function removeStep(id: string) {
    onChange(steps.filter((step) => step.id !== id));
  }

  function updateStep(id: string, updated: CustomStep) {
    onChange(steps.map((step) => (step.id === id ? updated : step)));
  }

  return (
    <>
      {steps.map((step) => (
        <StepNode
          key={step.id}
          step={step}
          onChange={(updated) => updateStep(step.id, updated)}
          onRemove={() => removeStep(step.id)}
        />
      ))}

      <div className={styles.customStepActions}>
        <MenuTrigger>
          <Button>+ Add step</Button>
          <Popover className={styles.kindSelectPopover}>
            <Menu
              onAction={(key) => addStep(key as CustomStep["type"])}
              className={styles.kindSelectList}
            >
              <MenuItem id="modify" className={styles.kindSelectItem}>
                Modify
              </MenuItem>
              <MenuItem id="evaluate" className={styles.kindSelectItem}>
                Evaluate
              </MenuItem>
              <MenuItem id="and" className={styles.kindSelectItem}>
                And
              </MenuItem>
              <MenuItem id="then" className={styles.kindSelectItem}>
                Then
              </MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      </div>
    </>
  );
}

type RollBlockFieldsProps = {
  block: RollBlock;
  onChange: (block: RollBlock) => void;
  label?: string;
  onRemove?: () => void;
};

function RollBlockFields({ block, onChange, onRemove, label = "Roll" }: RollBlockFieldsProps) {
  const rollDiceCount = DICE.reduce(
    (total, sides) => total + block.counts[sides],
    0,
  );

  return (
    <>
      <Node label={label} onRemove={onRemove}>
        <DiceField
          ariaLabel="Dice to roll"
          placeholder="e.g. 2d8"
          counts={block.counts}
          allowModifier={false}
          onChange={(counts) => onChange({ ...block, counts })}
        />

        {rollDiceCount > 1 && (
          <CombineActionField
            value={block.combine}
            onChange={(combine) => onChange({ ...block, combine })}
          />
        )}

        <RollOptionsFields value={block} onChange={onChange} />
      </Node>

      <StepList
        steps={block.steps}
        onChange={(steps) => onChange({ ...block, steps })}
      />
    </>
  );
}

type NodeProps = {
  label: string;
  onRemove?: () => void;
  children: React.ReactNode;
}

function Node({ label, onRemove, children }: NodeProps) {
  return (
    <fieldset className={styles.stepContent}>
      <legend className={styles.stepLabel}>{ label }</legend>
      { onRemove && <div className={styles.stepContentHeader}>
        <Button
          variant="ghost-icon"
          onPress={onRemove}
          aria-label="Remove step"
        >
          <CloseIcon />
        </Button>
      </div>
      }
      { children }
    </fieldset>
  );
}

type StepNodeProps = {
  step: CustomStep;
  onChange: (step: CustomStep) => void;
  onRemove: () => void;
};

function StepNode({ step, onChange, onRemove }: StepNodeProps) {
  if (step.type === 'and') {
    return <AndStep step={step} onChange={onChange} onRemove={onRemove} />
  }
  return (
    <Node
      label={step.type === "modify" ? "Modify" : step.type === "evaluate" ? "Evaluate (DC)" : "Then"}
      onRemove={onRemove}
    >
      {step.type === "modify" ? (
        <NumberField
          ariaLabel="Amount"
          value={step.amount}
          minValue={MIN_MODIFIER}
          maxValue={MAX_MODIFIER}
          onChange={(amount) => onChange({ ...step, amount })}
        />
      ) : step.type === "evaluate" ? (
        <NumberField
          ariaLabel="Difficulty (DC)"
          value={step.difficulty}
          minValue={MIN_DIFFICULTY}
          maxValue={MAX_DIFFICULTY}
          onChange={(difficulty) => onChange({ ...step, difficulty })}
        />
      ) : (
        <ThenStepFields step={step} onChange={onChange} />
      )}
    </Node>
  );
}

type ThenStepFieldsProps = {
  step: ThenStep;
  onChange: (step: ThenStep) => void;
};

function ThenStepFields({ step, onChange }: ThenStepFieldsProps) {
  function setBranchEnabled(kind: ThenBranchKind, enabled: boolean) {
    const branches = { ...step.branches };
    if (enabled) {
      branches[kind] = createThenBranch();
    } else {
      delete branches[kind];
    }
    onChange({ ...step, branches });
  }

  function updateBranch(kind: ThenBranchKind, branch: ThenBranch) {
    onChange({ ...step, branches: { ...step.branches, [kind]: branch } });
  }

  return (
    <div className={styles.thenFields}>
      <div className={styles.thenBranchToggles}>
        {THEN_BRANCH_KINDS.map((kind) => (
          <Checkbox
            key={kind}
            isSelected={step.branches[kind] !== undefined}
            onChange={(enabled) => setBranchEnabled(kind, enabled)}
            className={styles.checkbox}
          >
            <div className={styles.checkboxBox} aria-hidden="true" />
            {THEN_BRANCH_LABEL[kind]}
          </Checkbox>
        ))}
      </div>

      <div className={styles.thenBranches}>
        {THEN_BRANCH_KINDS.filter((kind) => step.branches[kind]).map(
          (kind) => {
            const branch = step.branches[kind] as ThenBranch;
            return (
              <div key={kind} className={styles.branchColumn}>
                <span className={styles.branchLabel}>
                  {THEN_BRANCH_LABEL[kind]}
                </span>
                <CombineRollFields
                  value={branch}
                  onChange={(updated) => updateBranch(kind, updated)}
                />
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

type DifficultyFieldsProps = {
  label?: string;
  modifierLabel?: string;
  difficulty: number;
  modifier: number;
  advantage: boolean;
  disadvantage: boolean;
  onDifficultyChange: (difficulty: number) => void;
  onModifierChange: (modifier: number) => void;
  onRollTypeChange: (advantage: boolean, disadvantage: boolean) => void;
};

function DifficultyFields({
  label = "Difficulty (DC)",
  modifierLabel = "Modifier",
  difficulty,
  modifier,
  advantage,
  disadvantage,
  onDifficultyChange,
  onModifierChange,
  onRollTypeChange,
}: DifficultyFieldsProps) {
  const rollType = advantage
    ? "advantage"
    : disadvantage
      ? "disadvantage"
      : "normal";

  return (
    <>
      <NumberField
        label={label}
        value={difficulty}
        minValue={MIN_DIFFICULTY}
        maxValue={MAX_DIFFICULTY}
        onChange={onDifficultyChange}
      />

      <NumberField
        label={modifierLabel}
        value={modifier}
        minValue={MIN_MODIFIER}
        maxValue={MAX_MODIFIER}
        onChange={onModifierChange}
      />

      <RadioGroupField
        label="Has"
        value={rollType}
        options={[
          { value: "advantage", label: "Advantage" },
          { value: "disadvantage", label: "Disadvantage" },
          { value: "normal", label: "Neither" },
        ]}
        onChange={(value) =>
          onRollTypeChange(value === "advantage", value === "disadvantage")
        }
      />
    </>
  );
}

type RegularInitialRollFieldsProps = {
  roll: RegularInitialRoll;
  onChange: (roll: RegularInitialRoll) => void;
};

function RegularInitialRollFields({
  roll,
  onChange,
}: RegularInitialRollFieldsProps) {
  const diceCount = DICE.reduce(
    (total, sides) => total + roll.counts[sides],
    0,
  );

  return (
    <>
      <DiceField
        label="Type a roll"
        counts={roll.counts}
        modifier={roll.modifier}
        onChange={(counts, modifier) => onChange({ ...roll, counts, modifier })}
      />

      {diceCount > 1 && (
        <CombineActionField
          value={roll.combine}
          onChange={(combine) => onChange({ ...roll, combine })}
        />
      )}

      <RollOptionsFields value={roll} onChange={onChange} />
    </>
  );
}

type CheckInitialRollFieldsProps = {
  roll: CheckInitialRoll;
  onChange: (roll: CheckInitialRoll) => void;
};

function CheckInitialRollFields({
  roll,
  onChange,
}: CheckInitialRollFieldsProps) {
  return (
    <div className={styles.checkFields}>
      <DifficultyFields
        difficulty={roll.difficulty}
        modifier={roll.modifier}
        advantage={roll.advantage}
        disadvantage={roll.disadvantage}
        onDifficultyChange={(difficulty) => onChange({ ...roll, difficulty })}
        onModifierChange={(modifier) => onChange({ ...roll, modifier })}
        onRollTypeChange={(advantage, disadvantage) =>
          onChange({ ...roll, advantage, disadvantage })
        }
      />

      <Checkbox
        isSelected={roll.nat1s}
        onChange={(nat1s) => onChange({ ...roll, nat1s })}
        className={styles.checkbox}
      >
        <div className={styles.checkboxBox} aria-hidden="true" />
        Natural 1 is a critical failure
      </Checkbox>
    </div>
  );
}

type DaggerheartCheckInitialRollFieldsProps = {
  roll: DaggerheartCheckInitialRoll;
  onChange: (roll: DaggerheartCheckInitialRoll) => void;
};

function DaggerheartCheckInitialRollFields({
  roll,
  onChange,
}: DaggerheartCheckInitialRollFieldsProps) {
  return (
    <div className={styles.checkFields}>
      <DifficultyFields
        difficulty={roll.difficulty}
        modifier={roll.modifier}
        advantage={roll.advantage}
        disadvantage={roll.disadvantage}
        onDifficultyChange={(difficulty) => onChange({ ...roll, difficulty })}
        onModifierChange={(modifier) => onChange({ ...roll, modifier })}
        onRollTypeChange={(advantage, disadvantage) =>
          onChange({ ...roll, advantage, disadvantage })
        }
      />
    </div>
  );
}

type AttackInitialRollFieldsProps = {
  roll: AttackInitialRoll;
  onChange: (roll: AttackInitialRoll) => void;
};

function AttackInitialRollFields({
  roll,
  onChange,
}: AttackInitialRollFieldsProps) {
  return (
    <div className={styles.checkFields}>
      <DifficultyFields
        label="Armor Class (AC)"
        difficulty={roll.armor}
        modifier={roll.modifier}
        advantage={roll.advantage}
        disadvantage={roll.disadvantage}
        onDifficultyChange={(armor) => onChange({ ...roll, armor })}
        onModifierChange={(modifier) => onChange({ ...roll, modifier })}
        onRollTypeChange={(advantage, disadvantage) =>
          onChange({ ...roll, advantage, disadvantage })
        }
      />

      <DiceField
        label="Damage"
        placeholder="e.g. 2d6 + 3"
        counts={roll.damageCounts}
        modifier={roll.damageModifier}
        onChange={(damageCounts, damageModifier) =>
          onChange({ ...roll, damageCounts, damageModifier })
        }
      />

      <Checkbox
        isSelected={roll.nat1s}
        onChange={(nat1s) => onChange({ ...roll, nat1s })}
        className={styles.checkbox}
      >
        <div className={styles.checkboxBox} aria-hidden="true" />
        Natural 1 is a critical failure
      </Checkbox>
    </div>
  );
}

type SpellSaveInitialRollFieldsProps = {
  roll: SpellSaveInitialRoll;
  onChange: (roll: SpellSaveInitialRoll) => void;
};

function SpellSaveInitialRollFields({
  roll,
  onChange,
}: SpellSaveInitialRollFieldsProps) {
  return (
    <div className={styles.checkFields}>
      <DifficultyFields
        label="Spell DC"
        modifierLabel="Target's save modifier"
        difficulty={roll.dc}
        modifier={roll.saveModifier}
        advantage={roll.advantage}
        disadvantage={roll.disadvantage}
        onDifficultyChange={(dc) => onChange({ ...roll, dc })}
        onModifierChange={(saveModifier) => onChange({ ...roll, saveModifier })}
        onRollTypeChange={(advantage, disadvantage) =>
          onChange({ ...roll, advantage, disadvantage })
        }
      />

      <DiceField
        label="Damage"
        placeholder="e.g. 8d6"
        counts={roll.damageCounts}
        modifier={roll.damageModifier}
        onChange={(damageCounts, damageModifier) =>
          onChange({ ...roll, damageCounts, damageModifier })
        }
      />

      <Checkbox
        isSelected={roll.saveTakesHalf}
        onChange={(saveTakesHalf) => onChange({ ...roll, saveTakesHalf })}
        className={styles.checkbox}
      >
        <div className={styles.checkboxBox} aria-hidden="true" />
        Successful save takes half damage
      </Checkbox>

      <Checkbox
        isSelected={roll.nat1s}
        onChange={(nat1s) => onChange({ ...roll, nat1s })}
        className={styles.checkbox}
      >
        <div className={styles.checkboxBox} aria-hidden="true" />
        Natural 1 is a critical failure
      </Checkbox>
    </div>
  );
}

type InitialRollFieldsProps = {
  initialRoll: InitialRoll;
  onChange: (initialRoll: InitialRoll) => void;
};

function InitialRollFields({ initialRoll, onChange }: InitialRollFieldsProps) {
  switch (initialRoll.kind) {
    case "regular":
      return <RegularInitialRollFields roll={initialRoll} onChange={onChange} />;
    case "check":
      return <CheckInitialRollFields roll={initialRoll} onChange={onChange} />;
    case "dhCheck":
      return (
        <DaggerheartCheckInitialRollFields
          roll={initialRoll}
          onChange={onChange}
        />
      );
    case "attack":
      return <AttackInitialRollFields roll={initialRoll} onChange={onChange} />;
    case "spellSave":
      return (
        <SpellSaveInitialRollFields roll={initialRoll} onChange={onChange} />
      );
  }
}

type RollProps = {
  roll: Roll,
  label: string,
  onRemove?: () => void,
  onChange: (roll: Roll) => void;
}

function Roll({ roll, label, onRemove, onChange }: RollProps) {
  return (
    <>
      <Node label="Roll">
        <SelectField
          label="Roll type"
          value={roll.initialRoll.kind}
          onChange={(kind) => onChange(withInitialRollKind(roll, kind))}
          options={ROLL_KIND_OPTIONS}
        />

        <InitialRollFields
          initialRoll={roll.initialRoll}
          onChange={(initialRoll) => onChange({ ...roll, initialRoll })}
        />
      </Node>

      <StepList
        steps={roll.steps}
        onChange={(steps) => onChange({ ...roll, steps })}
      />
    </>
  );
}

export type RollSequenceProps = {
  roll: Roll;
  onChange: (roll: Roll) => void;
};

export default function RollSequence({ roll, onChange }: RollSequenceProps) {
  return (
    <div className={styles.stepFlow}>
      <Roll label="Roll" onChange={onChange} roll={roll}/>
    </div>
  );
}


