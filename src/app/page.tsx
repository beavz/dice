"use client";

import { useState } from "react";
import Button from "@/components/Button";
import RollCard from "./RollCard";
import ComparisonChart from "./ComparisonChart";
import { createRoll, type Roll } from "./roll";
import styles from "./page.module.scss";

export default function Home() {
  const [rolls, setRolls] = useState<Roll[]>([createRoll()]);

  function updateRoll(updated: Roll) {
    setRolls((current) =>
      current.map((roll) => (roll.id === updated.id ? updated : roll)),
    );
  }

  function addRoll() {
    setRolls((current) => [...current, createRoll({})]);
  }

  function duplicateRoll(id: string) {
    setRolls((current) => {
      const index = current.findIndex((roll) => roll.id === id);
      if (index === -1) return current;

      const duplicate = { ...current[index], id: crypto.randomUUID() };
      return [
        ...current.slice(0, index + 1),
        duplicate,
        ...current.slice(index + 1),
      ];
    });
  }

  function removeRoll(id: string) {
    setRolls((current) => current.filter((roll) => roll.id !== id));
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Dice Probability</h1>
      <p className={styles.subtitle}>
        Compare the odds of different dice rolls side by side.
      </p>

      {rolls.map((roll, index) => (
        <RollCard
          key={roll.id}
          index={index}
          roll={roll}
          onChange={updateRoll}
          onDuplicate={() => duplicateRoll(roll.id)}
          onRemove={() => removeRoll(roll.id)}
          canRemove={rolls.length > 1}
        />
      ))}

      <Button onPress={addRoll}>Add roll</Button>

      {rolls.length > 1 && <ComparisonChart rolls={rolls} />}
    </main>
  );
}
