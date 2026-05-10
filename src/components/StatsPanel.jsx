export default function StatsPanel({
  mode,
  topics,
  stats,
  weakestTopic,
  selectedTopic,
  topicGameLevel,
  topicGamePoints,
  topicGameLives,
  targetPoints,
  maxLevel,
}) {
  const getAccuracy = (topic) => {
    const correct = stats?.[topic]?.correct ?? 0;
    const wrong = stats?.[topic]?.wrong ?? 0;
    const total = correct + wrong;

    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const totalCorrect = topics.reduce(
    (sum, topic) => sum + (stats?.[topic]?.correct ?? 0),
    0
  );

  const totalWrong = topics.reduce(
    (sum, topic) => sum + (stats?.[topic]?.wrong ?? 0),
    0
  );

  const bestTopic = topics.reduce((best, topic) => {
    return getAccuracy(topic) > getAccuracy(best) ? topic : best;
  }, topics[0]);

  return (
    <div className="stats-panel-card">
      {mode === "topicGame" ? (
        <>
          <h3 className="stats-panel-title">Játék állapot</h3>

          <div className="stats-summary">
            <div className="stat-card">
              <div className="stat-label">Téma</div>
              <div className="stat-value">{selectedTopic}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Szint</div>
              <div className="stat-value">
                {topicGameLevel} / {maxLevel}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Pont</div>
              <div className="stat-value green">
                {topicGamePoints} / {targetPoints?.[topicGameLevel]}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Élet</div>
              <div className="stat-value red">{topicGameLives} / 3</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="stats-panel-title">Tanulási statisztika</h3>

          <div className="stats-summary">
            <div className="stat-card">
              <div className="stat-label">Összes helyes</div>
              <div className="stat-value green">{totalCorrect}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Összes hibás</div>
              <div className="stat-value red">{totalWrong}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Legjobb téma</div>
              <div className="stat-value">{bestTopic}</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Leggyengébb</div>
              <div className="stat-value yellow">{weakestTopic}</div>
            </div>
          </div>

          <div className="stats-panel-highlight">
            {weakestTopic ? (
              <>
                <strong>Leggyengébb téma:</strong> {weakestTopic}
              </>
            ) : (
              <em>Még nincs elég adat a leggyengébb téma meghatározásához.</em>
            )}
          </div>

          <ul className="stats-panel-list">
            {topics.map((topic) => (
              <li key={topic} className="stats-panel-list-item">
                <strong>{topic}:</strong> {stats?.[topic]?.correct ?? 0} jó /{" "}
                {stats?.[topic]?.wrong ?? 0} rossz —{" "}
                <strong>{getAccuracy(topic)}%</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}