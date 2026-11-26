import { settingsContent } from "./Settings.content";

export const Settings = () => {
  return (
    <section>
      <h1>{settingsContent.title}</h1>
      <p>{settingsContent.description}</p>
      <h2>{settingsContent.timerHeading}</h2>
      <ul>
        {settingsContent.durations.map((duration) => (
          <li key={duration}>
            {duration} {settingsContent.durationUnit}
            {duration === settingsContent.defaultDuration
              ? settingsContent.defaultLabel
              : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
