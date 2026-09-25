import { useState } from "react";
import styles from "./Tenzies.module.css";

// Adapted from https://github.com/NMasters52/react_tenzies.
type Die = { value: number; isHeld: boolean };
const newDice = (): Die[] => Array.from({ length: 10 }, () => ({
  value: Math.floor(Math.random() * 6) + 1,
  isHeld: false,
}));

export default function Tenzies() {
  // A fixed first deal is playable immediately and matches the server HTML.
  const [dice, setDice] = useState<Die[]>(() => Array.from({ length: 10 }, (_, i) => ({ value: i % 6 + 1, isHeld: false })));
  const [count, setCount] = useState(0);
  const won = dice.length === 10 && dice.every(die => die.isHeld && die.value === dice[0].value);

  function start() {
    setDice(newDice());
    setCount(0);
  }

  function roll() {
    setDice(current => current.map(die => die.isHeld ? die : {
      value: Math.floor(Math.random() * 6) + 1, isHeld: false,
    }));
    setCount(current => current + 1);
  }

  return <div className={styles.island}>
    <div className={styles.board}>
      {won && <div className={styles.confetti} aria-hidden="true">{Array.from({ length: 24 }, (_, i) =>
        <i key={i} style={{ left: `${(i * 17) % 100}%`, animationDelay: `${i * .045}s`, background: ["#59e391", "#5035ff", "#e9b949"][i % 3] }} />
      )}</div>}
      <h2 id="tenzies-heading" className={styles.title}>Tenzies</h2>
      <p className={styles.instructions} id="tenzies-instructions">Roll until all ten dice match. Held dice stay put between rolls.</p>
      <p className={styles.hint} id="tenzies-hint">Click a die to hold it</p>
      <div className={styles.dice} role="group" aria-label="Ten dice" aria-describedby="tenzies-instructions tenzies-hint">
        {dice.map((die, index) =>
          <button type="button" key={index} className={styles.die} aria-label={`Die ${index + 1}, value ${die.value}`} aria-pressed={die.isHeld}
            disabled={won} onClick={() => setDice(current => current.map((item, i) => i === index ? { ...item, isHeld: !item.isHeld } : item))}>
            {die.value}
          </button>
        )}
      </div>
      <p className={styles.status} role="status">{won ? `Tenzies! It took you ${count} ${count === 1 ? "roll" : "rolls"}!` : `${count} ${count === 1 ? "roll" : "rolls"} · ${dice.filter(die => die.isHeld).length} of 10 held`}</p>
      <button type="button" className={styles.roll} onClick={won ? start : roll}>{won ? "New Game" : "Roll dice"}</button>
    </div>
  </div>;
}
