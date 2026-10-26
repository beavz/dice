"use client";

import { useState } from "react";
import Button from "@/components/Button";
import RollCard from "./RollCard";
import ComparisonChart from "./ComparisonChart";
import { createRoll, type Roll } from "./roll";
import styles from "./page.module.scss";

export default function Home() {
  const [rolls, setRolls] = useState<Roll[]>([createRoll()]);

  function updateRoll(index: number, updated: Roll) {
    setRolls((current) =>
      current.map((roll, i) => (i === index ? updated : roll)),
    );
  }

  function addRoll() {
    setRolls((current) => [...current, createRoll({})]);
  }

  function duplicateRoll(index: number) {
    setRolls((current) => [
      ...current.slice(0, index + 1),
      current[index],
      ...current.slice(index + 1),
    ]);
  }

  function removeRoll(index: number) {
    setRolls((current) => current.filter((_, i) => i !== index));
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Dice Probability</h1>
      <p className={styles.subtitle}>
        Compare the odds of different dice rolls side by side.
      </p>

      {rolls.map((roll, index) => (
        <RollCard
          key={index}
          index={index}
          roll={roll}
          onChange={(updated) => updateRoll(index, updated)}
          onDuplicate={() => duplicateRoll(index)}
          onRemove={() => removeRoll(index)}
          canRemove={rolls.length > 1}
        />
      ))}

      <Button onPress={addRoll}>Add roll</Button>

      {rolls.length > 1 && <ComparisonChart rolls={rolls} />}
    </main>
  );
}
