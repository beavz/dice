"use client";

import { useRef, useState } from "react";
import { type Die, DICE } from "@/lib/dice";
import TextField from "./TextField";

export type Counts = Partial<Record<Die, number>>;

export function totalDice(counts: Counts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}
export function getDice(counts: Counts): Die[] {
  return DICE.flatMap((die) => Array(counts[die] ?? 0).fill(die));
}
export function countsFromDice(dice: Die[]): Counts {
  const counts: Counts = {};
  for (const die of dice) counts[die] = (counts[die] ?? 0) + 1;
  return counts;
}

const DICE_SET: ReadonlySet<number> = new Set(DICE);
function isDie(number: number): number is Die {
  return DICE_SET.has(number);
}

const DICE_TERM = /^(\d*)d(\d+)$/i;
const MODIFIER_TERM = /^\d+$/;
const MAX_COUNT_PER_DIE = 20;
const MIN_MODIFIER = -20;
const MAX_MODIFIER = 20;

export type ParseResult =
  | { ok: true; counts: Counts; modifier: number }
  | { ok: false; error: string };

export function parseRollExpression(input: string, allowModifier: boolean = true): ParseResult {
  const stripped = input.replace(/\s+/g, "");
  if (stripped === "") {
    return { ok: true, counts: { }, modifier: 0 };
  }

  const signed = /^[+-]/.test(stripped) ? stripped : `+${stripped}`;
  const terms = signed.match(/[+-][^+-]+/g) ?? [];

  const counts: Counts = { };
  let modifier = 0;

  for (const term of terms) {
    const sign = term[0] === "-" ? -1 : 1;
    const body = term.slice(1);

    const diceMatch = DICE_TERM.exec(body);
    if (diceMatch) {
      if (sign < 0) {
        return {
          ok: false,
          error: `Can't subtract dice ("${term}") — only whole die terms and modifiers, e.g. "-4".`,
        };
      }

      const sides = Number(diceMatch[2]);
      if (!isDie(sides)) {
        return {
          ok: false,
          error: `d${sides} isn't supported — use ${DICE.map(d => `d${d}`).join(', ')}.`,
        };
      }

      const count = diceMatch[1] === "" ? 1 : Number(diceMatch[1]);
      counts[sides] = Math.min(MAX_COUNT_PER_DIE, count + (counts[sides] ?? 0));
      continue;
    }

    if (MODIFIER_TERM.test(body)) {
      if (!allowModifier) {
        return {
          ok: false,
          error: "Modifiers aren't allowed here — add a Modify step instead.",
        }
      }
      modifier += sign * Number(body);
      continue;
    }

    return { ok: false, error: `Can't parse "${term}".` };
  }

  modifier = Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, modifier));

  return { ok: true, counts, modifier };
}

export function formatRollExpression(counts: Counts, modifier: number): string {
  const terms = DICE.filter((sides) => (counts[sides] ?? 0) > 0).map(
    (sides) => `${counts[sides]}d${sides}`,
  );
  if (terms.length === 0) return "";

  const expression = terms.join(" + ");
  if (modifier === 0) return expression;

  const sign = modifier > 0 ? "+" : "-";
  return `${expression} ${sign} ${Math.abs(modifier)}`;
}


export type DiceFieldProps = {
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  counts: Counts;
  modifier?: number;
  allowModifier?: boolean;
  onChange: (counts: Counts, modifier: number) => void;
};

export default function DiceField({
  label,
  ariaLabel,
  placeholder,
  counts,
  modifier = 0,
  allowModifier = true,
  onChange,
}: DiceFieldProps) {
  const [rawInput, setRawInput] = useState(() =>
    formatRollExpression(counts, modifier),
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commitRawInput() {
    const result = parseRollExpression(rawInput, allowModifier);
    if (!result.ok) {
      setParseError(result.error);
      return;
    }

    onChange(result.counts, result.modifier);
    setRawInput(formatRollExpression(result.counts, result.modifier));
    setParseError(null);
  }

  return (
    <TextField
      ref={inputRef}
      label={label}
      ariaLabel={ariaLabel}
      placeholder={
        placeholder ?? (allowModifier ? "e.g. 2d8 + 1d6 + 4" : "e.g. 2d8")
      }
      value={rawInput}
      error={parseError}
      onChange={(value) => {
        setRawInput(value);
        setParseError(null);
      }}
      onBlur={commitRawInput}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          inputRef.current?.blur();
        }
      }}
    />
  );
}
