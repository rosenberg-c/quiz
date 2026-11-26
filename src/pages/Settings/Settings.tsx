import { useState } from "react";
import {
  readTimerDuration,
  TIMER_DURATIONS,
  writeTimerDuration,
  type TimerDuration,
} from "../../features/timer/timer-preference";
import { settingsContent } from "./Settings.content";
import styles from "./Settings.module.css";

export const Settings = () => {
  const [duration, setDuration] = useState(readTimerDuration);

  const chooseDuration = (next: TimerDuration) => {
    setDuration(next);
    writeTimerDuration(next);
  };

  return (
    <section className={styles.settings}>
      <h1>{settingsContent.title}</h1>
      <p>{settingsContent.description}</p>
      <fieldset className={styles.group}>
        <legend>{settingsContent.timerHeading}</legend>
        <div className={styles.options}>
          {TIMER_DURATIONS.map((option) => (
            <label className={styles.option} key={option}>
              <input
                type="radio"
                name="timer-duration"
                value={option}
                checked={duration === option}
                onChange={() => chooseDuration(option)}
              />
              {option} {settingsContent.durationUnit}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
};
