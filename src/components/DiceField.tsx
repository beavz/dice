"use client";

import { useRef, useState } from "react";
import {
  EMPTY_COUNTS,
  formatExpression,
  MAX_COUNT_PER_DIE,
  MAX_MODIFIER,
  MIN_MODIFIER,
  type DieCounts,
} from "@/app/roll";
import { type Die, DICE } from "@/lib/dice";
import TextField from "./TextField";

const DICE_TERM = /^(\d*)d(\d+)$/i;
const MODIFIER_TERM = /^\d+$/;
const SUPPORTED_SIDES: ReadonlySet<number> = new Set(DICE);
const SUPPORTED_SIDES_LIST = DICE.map((sides) => `d${sides}`).join(", ");

export type ParseResult =
  | { ok: true; counts: DieCounts; modifier: number }
  | { ok: false; error: string };

export function parseRollExpression(input: string): ParseResult {
  const stripped = input.replace(/\s+/g, "");
  if (stripped === "") {
    return { ok: true, counts: { ...EMPTY_COUNTS }, modifier: 0 };
  }

  const signed = /^[+-]/.test(stripped) ? stripped : `+${stripped}`;
  const terms = signed.match(/[+-][^+-]+/g) ?? [];

  const counts: DieCounts = { ...EMPTY_COUNTS };
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
      if (!SUPPORTED_SIDES.has(sides)) {
        return {
          ok: false,
          error: `d${sides} isn't supported — use ${SUPPORTED_SIDES_LIST}.`,
        };
      }

      const count = diceMatch[1] === "" ? 1 : Number(diceMatch[1]);
      counts[sides as Die] += count;
      continue;
    }

    if (MODIFIER_TERM.test(body)) {
      modifier += sign * Number(body);
      continue;
    }

    return { ok: false, error: `Can't parse "${term}".` };
  }

  for (const sides of DICE) {
    counts[sides] = Math.min(MAX_COUNT_PER_DIE, counts[sides]);
  }
  modifier = Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, modifier));

  return { ok: true, counts, modifier };
}

export type DiceFieldProps = {
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  counts: DieCounts;
  modifier?: number;
  allowModifier?: boolean;
  onChange: (counts: DieCounts, modifier: number) => void;
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
    formatExpression(counts, modifier),
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commitRawInput() {
    const result = parseRollExpression(rawInput);
    if (!result.ok) {
      setParseError(result.error);
      return;
    }
    if (!allowModifier && result.modifier !== 0) {
      setParseError(
        "Modifiers aren't allowed here — add a Modify step instead.",
      );
      return;
    }

    onChange(result.counts, result.modifier);
    setRawInput(formatExpression(result.counts, result.modifier));
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
