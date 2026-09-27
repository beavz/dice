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
  Button,
  Checkbox,
  Group,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuTrigger,
  NumberField,
  Popover,
  Radio,
  RadioGroup,
  Select,
  SelectValue,
} from "react-aria-components";
import {
  createAndStep,
  createThenBranch,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  MAX_MODIFIER,
  MIN_MODIFIER,
  colorForIndex,
  COMBINE_ACTION_OPTIONS,
  formatRollLabel,
  getRollDisplayName,
  getScenario,
  sortCategories,
  withKind,
  type CombineAction,
  type AttackRoll,
  type CheckRoll,
  type DaggerheartCheckRoll,
  type CustomRoll,
  type CustomStep,
  type RegularRoll,
  type Roll,
  type RollBlock,
  type SpellSaveRoll,
  type ThenBranch,
  type ThenBranchKind,
  type ThenStep,
  type TossLowestRoll,
} from "./roll";
import { DICE } from '@/lib/dice';
import CloseIcon from "@/components/CloseIcon";
import DiceField from "@/components/DiceField";
import DiceIcon from "@/components/DiceIcon";
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

type CombineActionFieldProps = {
  value: CombineAction;
  onChange: (action: CombineAction) => void;
};

function CombineActionField({ value, onChange }: CombineActionFieldProps) {
  return (
    <Select
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as CombineAction)}
      className={styles.kindSelect}
    >
      <Label className={styles.exprLabel}>Combine using</Label>
      <Button className={styles.kindSelectButton}>
        <SelectValue />
        <span aria-hidden="true">▾</span>
      </Button>
      <Popover className={styles.kindSelectPopover}>
        <ListBox className={styles.kindSelectList}>
          {COMBINE_ACTION_OPTIONS.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className={styles.kindSelectItem}
            >
              <span className={styles.combineOptionLabel}>
                {option.label}
              </span>
              <span className={styles.combineOptionDescription}>
                {option.description}
              </span>
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
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

type RegularRollFieldsProps = {
  roll: RegularRoll;
  onChange: (roll: RegularRoll) => void;
};

function RegularRollFields({ roll, onChange }: RegularRollFieldsProps) {
  return (
    <DiceField
      label="Type a roll"
      counts={roll.counts}
      modifier={roll.modifier}
      onChange={(counts, modifier) => onChange({ ...roll, counts, modifier })}
    />
  );
}

type TossLowestRollFieldsProps = {
  roll: TossLowestRoll;
  onChange: (roll: TossLowestRoll) => void;
};

function TossLowestRollFields({ roll, onChange }: TossLowestRollFieldsProps) {
  return (
    <DiceField
      label="Dice to roll (lowest is dropped)"
      placeholder="e.g. 4d6"
      counts={roll.counts}
      modifier={roll.modifier}
      onChange={(counts, modifier) => onChange({ ...roll, counts, modifier })}
    />
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

type RollBlockFieldsProps = {
  block: RollBlock;
  onChange: (block: RollBlock) => void;
};

function RollBlockFields({ block, onChange }: RollBlockFieldsProps) {
  function addStep(type: CustomStep["type"]) {
    const step: CustomStep =
      type === "modify"
        ? { id: crypto.randomUUID(), type: "modify", amount: 1 }
        : type === "evaluate"
          ? { id: crypto.randomUUID(), type: "evaluate", difficulty: 15 }
          : type === "and"
            ? createAndStep()
            : { id: crypto.randomUUID(), type: "then", branches: {} };
    onChange({ ...block, steps: [...block.steps, step] });
  }

  function removeStep(id: string) {
    onChange({
      ...block,
      steps: block.steps.filter((step) => step.id !== id),
    });
  }

  function updateStep(id: string, updated: CustomStep) {
    onChange({
      ...block,
      steps: block.steps.map((step) => (step.id === id ? updated : step)),
    });
  }

  const rollDiceCount = DICE.reduce(
    (total, sides) => total + block.counts[sides],
    0,
  );

  return (
    <div className={styles.stepFlow}>
      <div className={styles.stepNode}>
        <div className={styles.stepMarker} aria-hidden="true" />
        <fieldset className={styles.stepContent}>
          <legend className={styles.stepLabel}>Roll</legend>
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

          <div className={styles.critOptionsRow}>
            <Checkbox
              isSelected={block.criticalSuccess !== undefined}
              onChange={(isSelected) =>
                onChange({
                  ...block,
                  criticalSuccess: isSelected ? 20 : undefined,
                })
              }
              className={styles.checkbox}
            >
              <div className={styles.checkboxBox} aria-hidden="true" />
              Critical success on
            </Checkbox>
            {block.criticalSuccess !== undefined && (
              <NumberField
                aria-label="Critical success value"
                value={block.criticalSuccess}
                minValue={1}
                maxValue={100}
                onChange={(criticalSuccess) =>
                  onChange({ ...block, criticalSuccess })
                }
                className={styles.numberField}
              >
                <Group className={styles.numberFieldGroup}>
                  <Button
                    className={styles.numberFieldButton}
                    slot="decrement"
                  >
                    −
                  </Button>
                  <Input className={styles.numberFieldInput} />
                  <Button
                    className={styles.numberFieldButton}
                    slot="increment"
                  >
                    +
                  </Button>
                </Group>
              </NumberField>
            )}
          </div>

          <div className={styles.critOptionsRow}>
            <Checkbox
              isSelected={block.criticalFailure !== undefined}
              onChange={(isSelected) =>
                onChange({
                  ...block,
                  criticalFailure: isSelected ? 1 : undefined,
                })
              }
              className={styles.checkbox}
            >
              <div className={styles.checkboxBox} aria-hidden="true" />
              Critical failure on
            </Checkbox>
            {block.criticalFailure !== undefined && (
              <NumberField
                aria-label="Critical failure value"
                value={block.criticalFailure}
                minValue={1}
                maxValue={100}
                onChange={(criticalFailure) =>
                  onChange({ ...block, criticalFailure })
                }
                className={styles.numberField}
              >
                <Group className={styles.numberFieldGroup}>
                  <Button
                    className={styles.numberFieldButton}
                    slot="decrement"
                  >
                    −
                  </Button>
                  <Input className={styles.numberFieldInput} />
                  <Button
                    className={styles.numberFieldButton}
                    slot="increment"
                  >
                    +
                  </Button>
                </Group>
              </NumberField>
            )}
          </div>

          <RadioGroup
            value={block.with ?? "none"}
            onChange={(value) =>
              onChange({
                ...block,
                with:
                  value === "none" ? undefined : (value as "hope" | "fear"),
              })
            }
            orientation="horizontal"
            className={styles.radioGroup}
          >
            <Label className={styles.exprLabel}>Tag as</Label>
            <div className={styles.radioRow}>
              <Radio value="none" className={styles.radio}>
                None
              </Radio>
              <Radio value="hope" className={styles.radio}>
                Hope
              </Radio>
              <Radio value="fear" className={styles.radio}>
                Fear
              </Radio>
            </div>
          </RadioGroup>
        </fieldset>
      </div>

      {block.steps.map((step) => (
        <StepNode
          key={step.id}
          step={step}
          onChange={(updated) => updateStep(step.id, updated)}
          onRemove={() => removeStep(step.id)}
        />
      ))}

      <div className={styles.customStepActions}>
        <MenuTrigger>
          <Button className={styles.addRoll}>+ Add step</Button>
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
    </div>
  );
}

type StepNodeProps = {
  step: CustomStep;
  onChange: (step: CustomStep) => void;
  onRemove: () => void;
};

function StepNode({ step, onChange, onRemove }: StepNodeProps) {
  return (
    <div className={styles.stepNode}>
      <div className={styles.stepMarker} aria-hidden="true" />
      <fieldset className={styles.stepContent}>
        <legend className={styles.stepLabel}>
          {step.type === "modify"
            ? "Modify"
            : step.type === "evaluate"
              ? "Evaluate (DC)"
              : step.type === "and"
                ? "And"
                : "Then"}
        </legend>

        <div className={styles.stepContentHeader}>
          <Button
            className={styles.removeStepButton}
            onPress={onRemove}
            aria-label="Remove step"
          >
            <CloseIcon />
          </Button>
        </div>

        {step.type === "modify" ? (
          <NumberField
            aria-label="Amount"
            value={step.amount}
            minValue={MIN_MODIFIER}
            maxValue={MAX_MODIFIER}
            onChange={(amount) => onChange({ ...step, amount })}
            className={styles.numberField}
          >
            <Group className={styles.numberFieldGroup}>
              <Button className={styles.numberFieldButton} slot="decrement">
                −
              </Button>
              <Input className={styles.numberFieldInput} />
              <Button className={styles.numberFieldButton} slot="increment">
                +
              </Button>
            </Group>
          </NumberField>
        ) : step.type === "evaluate" ? (
          <NumberField
            aria-label="Difficulty (DC)"
            value={step.difficulty}
            minValue={MIN_DIFFICULTY}
            maxValue={MAX_DIFFICULTY}
            onChange={(difficulty) => onChange({ ...step, difficulty })}
            className={styles.numberField}
          >
            <Group className={styles.numberFieldGroup}>
              <Button className={styles.numberFieldButton} slot="decrement">
                −
              </Button>
              <Input className={styles.numberFieldInput} />
              <Button className={styles.numberFieldButton} slot="increment">
                +
              </Button>
            </Group>
          </NumberField>
        ) : step.type === "and" ? (
          <CombineRollFields
            value={step}
            onChange={(updated) => onChange({ ...step, ...updated })}
          />
        ) : (
          <ThenStepFields step={step} onChange={onChange} />
        )}
      </fieldset>
    </div>
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

type CustomRollFieldsProps = {
  roll: CustomRoll;
  onChange: (roll: CustomRoll) => void;
};

function CustomRollFields({ roll, onChange }: CustomRollFieldsProps) {
  return (
    <RollBlockFields
      block={roll}
      onChange={(block) => onChange({ ...roll, ...block })}
    />
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
        value={difficulty}
        minValue={MIN_DIFFICULTY}
        maxValue={MAX_DIFFICULTY}
        onChange={onDifficultyChange}
        className={styles.numberField}
      >
        <Label className={styles.exprLabel}>{label}</Label>
        <Group className={styles.numberFieldGroup}>
          <Button className={styles.numberFieldButton} slot="decrement">
            −
          </Button>
          <Input className={styles.numberFieldInput} />
          <Button className={styles.numberFieldButton} slot="increment">
            +
          </Button>
        </Group>
      </NumberField>

      <NumberField
        value={modifier}
        minValue={MIN_MODIFIER}
        maxValue={MAX_MODIFIER}
        onChange={onModifierChange}
        className={styles.numberField}
      >
        <Label className={styles.exprLabel}>{modifierLabel}</Label>
        <Group className={styles.numberFieldGroup}>
          <Button className={styles.numberFieldButton} slot="decrement">
            −
          </Button>
          <Input className={styles.numberFieldInput} />
          <Button className={styles.numberFieldButton} slot="increment">
            +
          </Button>
        </Group>
      </NumberField>

      <RadioGroup
        value={rollType}
        onChange={(value) =>
          onRollTypeChange(value === "advantage", value === "disadvantage")
        }
        orientation="horizontal"
        className={styles.radioGroup}
      >
        <Label className={styles.exprLabel}>Roll type</Label>
        <div className={styles.radioRow}>
          <Radio value="normal" className={styles.radio}>
            Normal
          </Radio>
          <Radio value="advantage" className={styles.radio}>
            Advantage
          </Radio>
          <Radio value="disadvantage" className={styles.radio}>
            Disadvantage
          </Radio>
        </div>
      </RadioGroup>
    </>
  );
}

type CheckRollFieldsProps = {
  roll: CheckRoll;
  onChange: (roll: CheckRoll) => void;
};

function CheckRollFields({ roll, onChange }: CheckRollFieldsProps) {
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

type DaggerheartCheckFieldsProps = {
  roll: DaggerheartCheckRoll;
  onChange: (roll: DaggerheartCheckRoll) => void;
};

function DaggerheartCheckFields({
  roll,
  onChange,
}: DaggerheartCheckFieldsProps) {
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

type AttackRollFieldsProps = {
  roll: AttackRoll;
  onChange: (roll: AttackRoll) => void;
};

function AttackRollFields({ roll, onChange }: AttackRollFieldsProps) {
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

type SpellSaveRollFieldsProps = {
  roll: SpellSaveRoll;
  onChange: (roll: SpellSaveRoll) => void;
};

function SpellSaveRollFields({ roll, onChange }: SpellSaveRollFieldsProps) {
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
    const scenario = getScenario(roll);
    return {
      distribution: scenario.result(),
      expectedValue: scenario.expectedValue(),
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
  const activeSides =
    roll.kind === "regular" ||
    roll.kind === "tossLowest" ||
    roll.kind === "custom"
      ? DICE.filter((sides) => roll.counts[sides] > 0)
      : roll.kind === "check"
        ? ([20] as const)
        : ([12] as const);

  return (
    <section className={styles.rollCard}>
      <div className={styles.rollLayout}>
        <div className={styles.rollConfig}>
          <div className={styles.rollHeader}>
            <h2 className={styles.rollTitle}>
              {roll.kind === "attack" ? (
                <SwordIcon className={styles.rollIcon} />
              ) : roll.kind === "spellSave" ? (
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
                className={styles.duplicateRoll}
                onPress={onDuplicate}
                aria-label={`Duplicate roll ${index + 1}`}
              >
                Duplicate
              </Button>
              {canRemove && (
                <Button
                  className={styles.removeRoll}
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

          <Select
            selectedKey={roll.kind}
            onSelectionChange={(key) =>
              onChange(withKind(roll, key as Roll["kind"]))
            }
            className={styles.kindSelect}
          >
            <Label className={styles.exprLabel}>Roll type</Label>
            <Button className={styles.kindSelectButton}>
              <SelectValue />
              <span aria-hidden="true">▾</span>
            </Button>
            <Popover className={styles.kindSelectPopover}>
              <ListBox className={styles.kindSelectList}>
                <ListBoxItem id="regular" className={styles.kindSelectItem}>
                  Regular
                </ListBoxItem>
                <ListBoxItem
                  id="tossLowest"
                  className={styles.kindSelectItem}
                >
                  Toss Lowest
                </ListBoxItem>
                <ListBoxItem id="check" className={styles.kindSelectItem}>
                  Check
                </ListBoxItem>
                <ListBoxItem id="dhCheck" className={styles.kindSelectItem}>
                  Daggerheart
                </ListBoxItem>
                <ListBoxItem id="attack" className={styles.kindSelectItem}>
                  Attack
                </ListBoxItem>
                <ListBoxItem id="spellSave" className={styles.kindSelectItem}>
                  Spell Save
                </ListBoxItem>
                <ListBoxItem id="custom" className={styles.kindSelectItem}>
                  Custom
                </ListBoxItem>
              </ListBox>
            </Popover>
          </Select>

          {roll.kind === "regular" && (
            <RegularRollFields roll={roll} onChange={onChange} />
          )}
          {roll.kind === "tossLowest" && (
            <TossLowestRollFields roll={roll} onChange={onChange} />
          )}
          {roll.kind === "check" && (
            <CheckRollFields roll={roll} onChange={onChange} />
          )}
          {roll.kind === "dhCheck" && (
            <DaggerheartCheckFields roll={roll} onChange={onChange} />
          )}
          {roll.kind === "attack" && (
            <AttackRollFields roll={roll} onChange={onChange} />
          )}
          {roll.kind === "spellSave" && (
            <SpellSaveRollFields roll={roll} onChange={onChange} />
          )}
          {roll.kind === "custom" && (
            <CustomRollFields roll={roll} onChange={onChange} />
          )}
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
