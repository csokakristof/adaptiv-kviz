import { useState, useEffect } from "react";
import "./App.css";
import questionsData from "./questions.json";
import StatsPanel from "./components/StatsPanel";
import StatsCharts from "./components/StatsCharts";
import bg from "./hatterpalya.png";

function App() {
  const questions = questionsData;
  const topics = Array.from(new Set(questions.map((q) => q.topic)));

  const createEmptyStats = () =>
    Object.fromEntries(topics.map((topic) => [topic, { correct: 0, wrong: 0 }]));

  const createEmptyTopicLevels = () =>
    Object.fromEntries(topics.map((topic) => [topic, 1]));

  const TARGET_POINTS = { 1: 3, 2: 4, 3: 5 };
  const MAX_LEVEL = 3;
  const ADAPTIVE_QUESTION_LIMIT = 15;

  const XP_BY_DIFFICULTY = {
    1: 10,
    2: 20,
    3: 30,
  };

  const getNeededXpForLevel = (level) => 
    100 + (level - 1) * 50;


  const getLevelFromXp = (totalXp) => {
    let level = 1;
    let remainingXp = totalXp;

    while (remainingXp >= getNeededXpForLevel(level)) {
      remainingXp -= getNeededXpForLevel(level);
      level += 1;
    }

    return level;
  };

  const getXpProgress = (totalXp) => {
    let level = 1;
    let remainingXp = totalXp;

    while (remainingXp >= getNeededXpForLevel(level)) {
      remainingXp -= getNeededXpForLevel(level);
      level += 1;
    }

    return {
      level,
      currentXp: remainingXp,
      requiredXp: getNeededXpForLevel(level),
      percent: Math.round((remainingXp / getNeededXpForLevel(level)) * 100),
    };
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [answerMessage, setAnswerMessage] = useState("");
  const [stats, setStats] = useState(() => createEmptyStats());

  const [answeredCount, setAnsweredCount] = useState(0);
  const [usedQuestionIndexes, setUsedQuestionIndexes] = useState([]);
  const [screen, setScreen] = useState("menu");
  const [mode, setMode] = useState("adaptive");
  const [selectedTopic, setSelectedTopic] = useState(() => topics[0] ?? "");
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [recentQuestionIndexes, setRecentQuestionIndexes] = useState([]);

  const [fixedModeLevel, setFixedModeLevel] = useState(1);
  const [fixedModeLives, setFixedModeLives] = useState(3);
  const [fixedModePoints, setFixedModePoints] = useState(0);
  const [fixedModeStatus, setFixedModeStatus] = useState("");

  const [bestTopicLevels, setBestTopicLevels] = useState(() =>
    createEmptyTopicLevels()
  );

  const [adaptiveChoice, setAdaptiveChoice] = useState({
    topic: "",
    difficulty: 1,
  });

  const [xp, setXp] = useState(0);
  const [roundXp, setRoundXp] = useState(0);
  const [startLevelThisRound, setStartLevelThisRound] = useState(1);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({
    title: "",
    message: "",
    onConfirm: null,
  });

  // mentett adatok visszatöltése
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem("quizStats");
      if (savedStats) {
        setStats({ ...createEmptyStats(), ...JSON.parse(savedStats) });
      }
    } catch {}

    try {
      const savedTopicLevels = localStorage.getItem("topicProgress");
      if (savedTopicLevels) {
        setBestTopicLevels({
          ...createEmptyTopicLevels(),
          ...JSON.parse(savedTopicLevels),
        });
      }
    } catch {}

    try {
      const savedScore = localStorage.getItem("quizScore");
      if (savedScore) setScore(Number(savedScore));
    } catch {}

    try {
      const savedAnsweredCount = localStorage.getItem("quizAnswered");
      if (savedAnsweredCount) setAnsweredCount(Number(savedAnsweredCount));
    } catch {}

    try {
      const savedUsedQuestions = localStorage.getItem("quizUsedQuestions");
      if (savedUsedQuestions) {
        setUsedQuestionIndexes(JSON.parse(savedUsedQuestions));
      }
    } catch {}

    try {
      const savedXp = localStorage.getItem("quizXp");
      if (savedXp) setXp(Number(savedXp));
    } catch {}

    setIsStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem("quizStats", JSON.stringify(stats));
  }, [stats, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem("quizScore", score.toString());
  }, [score, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem("quizAnswered", answeredCount.toString());
  }, [answeredCount, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem(
      "quizUsedQuestions",
      JSON.stringify(usedQuestionIndexes)
    );
  }, [usedQuestionIndexes, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded) return;
    localStorage.setItem("quizXp", xp.toString());
  }, [xp, isStorageLoaded]);

  const currentQuestion = questions[currentQuestionIndex];

  const totalQuestionCount =
    mode === "topicGame"
      ? questions.filter((q) => q.topic === selectedTopic).length
      : ADAPTIVE_QUESTION_LIMIT;

  const getTopicAccuracy = (topic) => {
    const correct = stats[topic]?.correct ?? 0;
    const wrong = stats[topic]?.wrong ?? 0;
    const total = correct + wrong;

    if (total === 0) return 0.5;
    return correct / total;
  };

  const getTopicAttempts = (topic) => {
    const correct = stats[topic]?.correct ?? 0;
    const wrong = stats[topic]?.wrong ?? 0;
    return correct + wrong;
  };

  const isTopicMastered = (topic) =>
    getTopicAttempts(topic) >= 5 && getTopicAccuracy(topic) >= 0.8;

  const weakestTopic = topics.reduce((worstTopic, topic) => {
    const correct = stats[topic]?.correct ?? 0;
    const wrong = stats[topic]?.wrong ?? 0;
    const total = correct + wrong;

    const worstCorrect = stats[worstTopic]?.correct ?? 0;
    const worstWrong = stats[worstTopic]?.wrong ?? 0;
    const worstTotal = worstCorrect + worstWrong;

    if (total === 0) return worstTopic;
    if (worstTotal === 0) return topic;

    const currentAccuracy = correct / total;
    const worstAccuracy = worstCorrect / worstTotal;

    return currentAccuracy < worstAccuracy ? topic : worstTopic;
  }, topics[0]);

  const weakestTopicForUi = mode === "adaptive" ? weakestTopic : "";

  const adaptiveProgress =
    ADAPTIVE_QUESTION_LIMIT === 0
      ? 0
      : Math.round((answeredCount / ADAPTIVE_QUESTION_LIMIT) * 100);

  const xpProgress = getXpProgress(xp);
  const playerLevel = xpProgress.level;
  const didLevelUpThisRound = playerLevel > startLevelThisRound;

  function openConfirm(title, message, onConfirm) {
    setConfirmData({ title, message, onConfirm });
    setIsConfirmOpen(true);
  }

  function closeConfirm() {
    setIsConfirmOpen(false);
    setConfirmData({
      title: "",
      message: "",
      onConfirm: null,
    });
  }

  // válasz ellenőrzés
  function checkAnswer(index) {
    setSelectedAnswer(index);

    const isCorrect = index === currentQuestion.correct;
    const topic = currentQuestion.topic;

    if (mode === "topicGame") {
      if (isCorrect) {
        setAnswerMessage("Helyes válasz!");
        setFixedModePoints((prev) => prev + 1);

        const gainedXp = XP_BY_DIFFICULTY[currentQuestion.difficulty] ?? 10;
        setXp((prev) => prev + gainedXp);
        setRoundXp((prev) => prev + gainedXp);
      } else {
        setAnswerMessage("Hibás válasz!");
        setFixedModeLives((prev) => Math.max(0, prev - 1));
      }
      return;
    }

    if (isCorrect) {
      setAnswerMessage("Helyes válasz!");
      setScore((prev) => prev + 1);

      const gainedXp = XP_BY_DIFFICULTY[currentQuestion.difficulty] ?? 10;
      setXp((prev) => prev + gainedXp);
      setRoundXp((prev) => prev + gainedXp);

      setStats((prevStats) => ({
        ...prevStats,
        [topic]: {
          correct: (prevStats[topic]?.correct ?? 0) + 1,
          wrong: prevStats[topic]?.wrong ?? 0,
        },
      }));
    } else {
      setAnswerMessage("Hibás válasz!");

      setStats((prevStats) => ({
        ...prevStats,
        [topic]: {
          correct: prevStats[topic]?.correct ?? 0,
          wrong: (prevStats[topic]?.wrong ?? 0) + 1,
        },
      }));
    }

    setAnsweredCount((prev) => prev + 1);
  }

  // következő kérdés kiválasztása
  function nextQuestion() {
    setSelectedAnswer(null);
    setAnswerMessage("");

    if (mode === "topicGame") {
      if (fixedModeLives <= 0) {
        setFixedModeStatus("levelLost");
        setIsFinished(true);
        return;
      }

      if (fixedModePoints >= TARGET_POINTS[fixedModeLevel]) {
        if (fixedModeLevel >= MAX_LEVEL) {
          setFixedModeStatus("topicWon");
          setIsFinished(true);
          return;
        } else {
          setFixedModeStatus("levelWon");
          setIsFinished(true);
          return;
        }
      }

      let candidates = questions
        .map((q, index) => ({ ...q, index }))
        .filter(
          (q) =>
            q.topic === selectedTopic &&
            q.difficulty === fixedModeLevel &&
            !usedQuestionIndexes.includes(q.index) &&
            q.index !== currentQuestionIndex
        );

      if (candidates.length === 0) {
        if (fixedModeLevel >= MAX_LEVEL) {
          setFixedModeStatus("topicWon");
        } else {
          setFixedModeStatus("levelWon");
        }
        setIsFinished(true);
        return;
      }

      const randomQuestion =
        candidates[Math.floor(Math.random() * candidates.length)];

      setCurrentQuestionIndex(randomQuestion.index);
      setUsedQuestionIndexes((prev) => [...prev, randomQuestion.index]);
      return;
    }

    if (answeredCount >= ADAPTIVE_QUESTION_LIMIT) {
      setIsFinished(true);
      return;
    }

    const weightedTopics = topics.map((topic) => {
      const accuracy = getTopicAccuracy(topic);
      const mastered = isTopicMastered(topic);

      let weight = 0.2 + (1 - accuracy);
      if (mastered) weight *= 0.3;

      return { topic, weight };
    });

    const totalWeight = weightedTopics.reduce(
      (sum, item) => sum + item.weight,
      0
    );

    let randomValue = Math.random() * totalWeight;
    let chosenTopic = weightedTopics[0].topic;

    for (const item of weightedTopics) {
      randomValue -= item.weight;
      if (randomValue <= 0) {
        chosenTopic = item.topic;
        break;
      }
    }

    const topicAccuracy = getTopicAccuracy(chosenTopic);

    let chosenDifficulty = 1;
    if (topicAccuracy >= 0.75) chosenDifficulty = 3;
    else if (topicAccuracy >= 0.5) chosenDifficulty = 2;

    let candidates = questions
      .map((q, index) => ({ ...q, index }))
      .filter(
        (q) =>
          q.topic === chosenTopic &&
          q.difficulty === chosenDifficulty &&
          !usedQuestionIndexes.includes(q.index) &&
          !recentQuestionIndexes.includes(q.index)
      );

    // ha nincs megfelelő kérdés, lazább szűrés
    if (candidates.length === 0) {
      candidates = questions
        .map((q, index) => ({ ...q, index }))
        .filter(
          (q) => q.topic === chosenTopic && !usedQuestionIndexes.includes(q.index)
        );
    }

    if (candidates.length === 0) {
      candidates = questions
        .map((q, index) => ({ ...q, index }))
        .filter((q) => !usedQuestionIndexes.includes(q.index));
    }

    if (candidates.length === 0) {
      setIsFinished(true);
      return;
    }

    const randomQuestion =
      candidates[Math.floor(Math.random() * candidates.length)];

    setCurrentQuestionIndex(randomQuestion.index);
    setUsedQuestionIndexes((prev) => [...prev, randomQuestion.index]);
    setRecentQuestionIndexes((prev) => [...prev.slice(-2), randomQuestion.index]);

    setAdaptiveChoice({
      topic: randomQuestion.topic,
      difficulty: randomQuestion.difficulty,
    });
  }

  function nextLevel() {
    const newLevel = Math.min(MAX_LEVEL, fixedModeLevel + 1);

    setFixedModeLevel(newLevel);
    setFixedModeLives(3);
    setFixedModePoints(0);
    setFixedModeStatus("");
    setIsFinished(false);
    setSelectedAnswer(null);
    setAnswerMessage("");

    const candidates = questions
      .map((q, index) => ({ ...q, index }))
      .filter(
        (q) =>
          q.topic === selectedTopic &&
          q.difficulty === newLevel &&
          q.index !== currentQuestionIndex
      );

    if (candidates.length === 0) {
      setFixedModeStatus("topicWon");
      setIsFinished(true);
      return;
    }

    const randomQuestion =
      candidates[Math.floor(Math.random() * candidates.length)];

    setCurrentQuestionIndex(randomQuestion.index);
    setUsedQuestionIndexes([currentQuestionIndex, randomQuestion.index]);
  }

  function retryLevel() {
    setFixedModeLives(3);
    setFixedModePoints(0);
    setFixedModeStatus("");
    setIsFinished(false);
    setSelectedAnswer(null);
    setAnswerMessage("");
    setUsedQuestionIndexes([]);
  }

  function backToMenuFromGame() {
    if (isFinished) {
      setScreen("menu");
      return;
    }

    openConfirm(
      "Vissza a menübe",
      "Biztosan vissza szeretnél menni a menübe? Az aktuális játékmenet megszakad.",
      () => {
        setBestTopicLevels((prev) => {
          const best = prev[selectedTopic] ?? 1;
          const achieved = fixedModeLevel;
          const updated = {
            ...prev,
            [selectedTopic]: Math.max(best, achieved),
          };

          localStorage.setItem("topicProgress", JSON.stringify(updated));
          return updated;
        });

        setScreen("menu");
        setMode("adaptive");
        setScore(0);
        setAnsweredCount(0);
        setUsedQuestionIndexes([]);
        setRecentQuestionIndexes([]);
        setRoundXp(0);
        setSelectedAnswer(null);
        setAnswerMessage("");
        setIsFinished(false);

        localStorage.removeItem("quizScore");
        localStorage.removeItem("quizAnswered");
        localStorage.removeItem("quizUsedQuestions");

        closeConfirm();
      }
    );
  }

  function backToMenuFromAdaptive() {
    if (isFinished) {
      setScreen("menu");
      return;
    }

    openConfirm(
      "Vissza a menübe",
      "Biztosan vissza szeretnél menni? Az aktuális kör megszakad.",
      () => {
        setScreen("menu");
        closeConfirm();
      }
    );
  }

  function clearStatistics() {
    openConfirm(
      "Statisztika törlése",
      "Biztosan törölni szeretnéd a statisztikát és az összes XP-t? Ez a művelet nem vonható vissza.",
      () => {
        setStats(createEmptyStats());
        setScore(0);
        setAnsweredCount(0);
        setUsedQuestionIndexes([]);
        setRecentQuestionIndexes([]);
        setXp(0);
        setRoundXp(0);
        setStartLevelThisRound(1);

        localStorage.removeItem("quizStats");
        localStorage.removeItem("quizScore");
        localStorage.removeItem("quizAnswered");
        localStorage.removeItem("quizUsedQuestions");
        localStorage.removeItem("quizXp");

        closeConfirm();
      }
    );
  }

  function startAdaptiveGame() {
    setMode("adaptive");
    setScore(0);
    setUsedQuestionIndexes([]);
    setAnsweredCount(0);
    setIsFinished(false);
    setSelectedAnswer(null);
    setAnswerMessage("");
    setRecentQuestionIndexes([]);
    setRoundXp(0);
    setStartLevelThisRound(getLevelFromXp(xp));

    const startIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestionIndex(startIndex);
    setUsedQuestionIndexes([startIndex]);

    setAdaptiveChoice({
      topic: questions[startIndex].topic,
      difficulty: questions[startIndex].difficulty,
    });

    setScreen("quiz");
  }

  function startTopicGame(topic) {
    setSelectedTopic(topic);
    localStorage.removeItem("quizUsedQuestions");
    localStorage.removeItem("quizAnswered");
    setScore(0);
    localStorage.removeItem("quizScore");

    setFixedModeLevel(1);
    setFixedModeLives(3);
    setFixedModePoints(0);
    setFixedModeStatus("");

    setUsedQuestionIndexes([]);
    setAnsweredCount(0);
    setIsFinished(false);
    setSelectedAnswer(null);
    setAnswerMessage("");
    setRoundXp(0);
    setStartLevelThisRound(getLevelFromXp(xp));

    const topicIndexes = questions
      .map((q, index) => ({ q, index }))
      .filter(({ q }) => q.topic === topic)
      .map(({ index }) => index);

    const startIndex =
      topicIndexes[Math.floor(Math.random() * topicIndexes.length)];

    setCurrentQuestionIndex(startIndex);
    setUsedQuestionIndexes([startIndex]);

    setScreen("quiz");
    setMode("topicGame");
  }

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        backgroundImage: `
          radial-gradient(circle at top, rgba(22,163,74,0.25), transparent 60%),
          linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.75)),
          url(${bg})
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="background-glow background-glow-1"></div>
      <div className="background-glow background-glow-2"></div>

      <div className="app-container">
        <header className="hero">
          <h1>Foci Kvíz</h1>

          <div className="xp-box">
            <div className="xp-center">
              <div className="xp-level">{playerLevel}. szint</div>
              <div className="xp-sub">
                {xpProgress.currentXp} / {xpProgress.requiredXp} XP
              </div>
            </div>

            <div className="xp-progress-bar">
              <div
                className="xp-progress-fill"
                style={{ width: `${xpProgress.percent}%` }}
              ></div>
            </div>
          </div>
        </header>

        {screen === "menu" && (
          <section className="card">
            <h2 className="section-title">Válassz játékmódot</h2>

            <div className="menu-grid">
              <div className="mode-card">
                <h3>Adaptív játék</h3>
                <p>
                  A rendszer a válaszaid alapján figyeli a témánkénti
                  teljesítményt, és ennek megfelelő kérdéseket választ.
                </p>
                <button className="primary-btn" onClick={startAdaptiveGame}>
                  Adaptív mód indítása
                </button>
              </div>

              <div className="mode-card">
                <h3>Fix téma játék</h3>
                <p>
                  Válassz egy témát, teljesíts szinteket, gyűjts pontokat, és
                  próbáld meg elvesztett életek nélkül végigvinni.
                </p>
                <button
                  className="secondary-btn"
                  onClick={() => setScreen("topicSelect")}
                >
                  Téma választása
                </button>
              </div>

              <div className="mode-card">
                <h3>Statisztika</h3>
                <p>
                  Nézd meg a témánkénti eredményeket és az eddigi teljesítményed
                  statisztikáját.
                </p>
                <button
                  className="ghost-btn"
                  onClick={() => setScreen("stats")}
                >
                  Statisztikai nézet
                </button>
              </div>
            </div>
          </section>
        )}

        {screen === "topicSelect" && (
          <section className="card">
            <h2 className="section-title">Válassz témát</h2>
            <div className="topic-grid">
              {topics.map((topic) => (
                <button
                  key={topic}
                  className="topic-btn"
                  onClick={() => startTopicGame(topic)}
                >
                  <span>{topic}</span>
                </button>
              ))}
            </div>

            <div className="actions-row">
              <button className="ghost-btn" onClick={() => setScreen("menu")}>
                ← Vissza
              </button>
            </div>
          </section>
        )}

        {screen === "stats" && (
          <section className="card">
            <h2 className="section-title">Statisztika</h2>

            <div className="stats-summary">
              <div className="summary-card">
                <span className="summary-label">Jelenlegi szint</span>
                <strong>{playerLevel}. szint</strong>
              </div>

              <div className="summary-card">
                <span className="summary-label">Összes XP</span>
                <strong>{xp} XP</strong>
              </div>

              <div className="summary-card">
                <span className="summary-label">Következő szinthez kell</span>
                <strong>{xpProgress.requiredXp - xpProgress.currentXp} XP</strong>
              </div>
            </div>

            <div className="stats-section-header">
              <h3>Tanulási statisztika</h3>
              <p>Témánkénti teljesítmény és összesített eredmények.</p>
            </div>

            <div className="stats-list">
              {topics.map((topic) => {
                const correct = stats[topic]?.correct ?? 0;
                const wrong = stats[topic]?.wrong ?? 0;
                const total = correct + wrong;
                const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

                return (
                  <div className="stat-row" key={topic}>
                    <div>
                      <strong>{topic}</strong>
                      <div className="stat-subtext">
                        {correct} jó / {wrong} rossz
                      </div>
                    </div>
                    <div className="stat-pill">{percent}%</div>
                  </div>
                );
              })}
            </div>

            <StatsCharts topics={topics} stats={stats} />

            <div className="actions-row">
              <button className="danger-btn" onClick={clearStatistics}>
                Statisztika törlése
              </button>
            </div>

            <div className="actions-row">
              <button className="ghost-btn" onClick={() => setScreen("menu")}>
                ← Vissza
              </button>
            </div>
          </section>
        )}

        {screen === "quiz" && currentQuestion && (
          <section className="card quiz-card">
            {!isFinished ? (
              <>
                <div className="quiz-topbar">
                  <div className="info-chip">
                    {mode === "adaptive" ? "Adaptív mód" : "Fix téma mód"}
                  </div>

                  {mode === "adaptive" ? (
                    <div className="info-chip">
                      Kérdések: {answeredCount} / {ADAPTIVE_QUESTION_LIMIT}
                    </div>
                  ) : (
                    <div className="info-chip">{selectedTopic}</div>
                  )}
                </div>

                <div className="actions-row top-menu-back">
                  <button
                    className="ghost-btn"
                    onClick={
                      mode === "adaptive"
                        ? backToMenuFromAdaptive
                        : backToMenuFromGame
                    }
                  >
                    ← Vissza a menübe
                  </button>
                </div>

                {mode === "adaptive" && (
                  <div className="progress-wrap">
                    <div className="progress-label">
                      <span>Haladás</span>
                      <span>{adaptiveProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${adaptiveProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {mode === "topicGame" && (
                  <div className="topic-game-box">
                    <div>
                      <strong>Téma:</strong> {selectedTopic}
                    </div>
                    <div>
                      <strong>Szint:</strong> {fixedModeLevel} / {MAX_LEVEL}
                    </div>
                    <div>
                      <strong>Pont:</strong> {fixedModePoints} /{" "}
                      {TARGET_POINTS[fixedModeLevel]}
                    </div>
                    <div>
                      <strong>Élet:</strong> {fixedModeLives} / 3
                    </div>
                  </div>
                )}

                <div className="question-meta">
                  <span className="meta-badge xp-gain-badge">
                    +{XP_BY_DIFFICULTY[currentQuestion.difficulty] ?? 10} XP
                  </span>
                </div>

                {mode === "adaptive" && (
                  <div className="adaptive-box">
                    <strong>Adaptív választás</strong>

                    <div>
                      Kiválasztott téma: <strong>{adaptiveChoice.topic}</strong>
                    </div>

                    <div>
                      Kiválasztott nehézség:{" "}
                      <strong>
                        {adaptiveChoice.difficulty === 1
                          ? "Könnyű"
                          : adaptiveChoice.difficulty === 2
                          ? "Közepes"
                          : "Nehéz"}
                      </strong>
                    </div>

                    <div
                      style={{
                        marginTop: "0.4rem",
                        fontSize: "0.85rem",
                        opacity: 0.85,
                      }}
                    >
                      {adaptiveChoice.difficulty === 1
                        ? "Ez a kérdés könnyebb, hogy segítsen megerősíteni az alapokat."
                        : adaptiveChoice.difficulty === 2
                        ? "Ez egy közepes nehézségű kérdés, ami jól illeszkedik a jelenlegi szintedhez."
                        : "Ez egy nehezebb kérdés, hogy kihívást jelentsen és tesztelje a tudásodat."}
                    </div>
                  </div>
                )}

                <h2 className="question-title">{currentQuestion.text}</h2>

                <div className="answers-grid">
                  {currentQuestion.options.map((option, index) => {
                    let buttonClass = "answer-btn";

                    if (selectedAnswer !== null) {
                      if (index === currentQuestion.correct) {
                        buttonClass += " correct";
                      } else if (selectedAnswer === index) {
                        buttonClass += " wrong";
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => checkAnswer(index)}
                        disabled={selectedAnswer !== null}
                        className={buttonClass}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {answerMessage && <p className="feedback-text">{answerMessage}</p>}

                {selectedAnswer !== null && (
                  <div className="actions-row">
                    <button className="primary-btn" onClick={nextQuestion}>
                      Következő kérdés →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {mode === "topicGame" ? (
                  <>
                    {fixedModeStatus === "levelWon" && (
                      <div className="result-box">
                        <h2>Szint teljesítve!</h2>
                        <p>
                          Elérted a szükséges{" "}
                          <strong>{TARGET_POINTS[fixedModeLevel]}</strong> pontot.
                        </p>
                        <p className="xp-round-text">
                          Ebben a körben szerzett XP: <strong>+{roundXp}</strong>
                        </p>
                        {didLevelUpThisRound && (
                          <p className="level-up-text">
                            Szintet léptél! Új szinted: <strong>{playerLevel}</strong>
                          </p>
                        )}
                        <div className="actions-row">
                          <button className="ghost-btn" onClick={backToMenuFromGame}>
                            ← Menü
                          </button>
                          <button className="primary-btn" onClick={nextLevel}>
                            Következő szint →
                          </button>
                        </div>
                      </div>
                    )}

                    {fixedModeStatus === "levelLost" && (
                      <div className="result-box">
                        <h2>Elfogyott az élet!</h2>
                        <p>Próbáld újra ugyanazt a szintet.</p>
                        <p className="xp-round-text">
                          Ebben a körben szerzett XP: <strong>+{roundXp}</strong>
                        </p>
                        {didLevelUpThisRound && (
                          <p className="level-up-text">
                            Szintet léptél! Új szinted: <strong>{playerLevel}</strong>
                          </p>
                        )}
                        <div className="actions-row">
                          <button className="ghost-btn" onClick={backToMenuFromGame}>
                            ← Menü
                          </button>
                          <button className="primary-btn" onClick={retryLevel}>
                            Újrapróbálom
                          </button>
                        </div>
                      </div>
                    )}

                    {fixedModeStatus === "topicWon" && (
                      <div className="result-box">
                        <h2>Téma teljesítve!</h2>
                        <p>
                          Gratulálok, sikeresen teljesítetted ezt a témát:{" "}
                          <strong>{selectedTopic}</strong>
                        </p>
                        <p className="xp-round-text">
                          Ebben a körben szerzett XP: <strong>+{roundXp}</strong>
                        </p>
                        {didLevelUpThisRound && (
                          <p className="level-up-text">
                            Szintet léptél! Új szinted: <strong>{playerLevel}</strong>
                          </p>
                        )}
                        <div className="actions-row">
                          <button
                            className="primary-btn"
                            onClick={backToMenuFromGame}
                          >
                            Vissza a menübe →
                          </button>
                        </div>
                      </div>
                    )}

                    {fixedModeStatus === "" && (
                      <div className="result-box">
                        <h2>Játék vége</h2>
                        <p className="xp-round-text">
                          Ebben a körben szerzett XP: <strong>+{roundXp}</strong>
                        </p>
                        {didLevelUpThisRound && (
                          <p className="level-up-text">
                            Szintet léptél! Új szinted: <strong>{playerLevel}</strong>
                          </p>
                        )}
                        <div className="actions-row">
                          <button
                            className="ghost-btn"
                            onClick={backToMenuFromGame}
                          >
                            ← Menü
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="result-box">
                    <h2>Kvíz vége!</h2>
                    <p className="final-score">
                      Eredményed: <strong>{score}</strong> / {totalQuestionCount}
                    </p>
                    <p className="muted-text">
                      Leggyengébb témád jelenleg:{" "}
                      <strong>{weakestTopicForUi}</strong>
                    </p>
                    <p className="xp-round-text">
                      Ebben a körben szerzett XP: <strong>+{roundXp}</strong>
                    </p>
                    {didLevelUpThisRound && (
                      <p className="level-up-text">
                        Szintet léptél! Új szinted: <strong>{playerLevel}</strong>
                      </p>
                    )}

                    <div className="actions-row">
                      <button
                        className="ghost-btn"
                        onClick={backToMenuFromAdaptive}
                      >
                        ← Vissza
                      </button>
                    </div>
                  </div>
                )}

                {mode === "topicGame" && (
                  <StatsPanel
                    mode={mode}
                    topics={topics}
                    stats={stats}
                    weakestTopic={weakestTopicForUi}
                    selectedTopic={selectedTopic}
                    topicGameLevel={fixedModeLevel}
                    topicGamePoints={fixedModePoints}
                    topicGameLives={fixedModeLives}
                    targetPoints={TARGET_POINTS}
                    maxLevel={MAX_LEVEL}
                    topicProgress={bestTopicLevels}
                  />
                )}
              </>
            )}
          </section>
        )}

        {isConfirmOpen && (
          <div className="confirm-overlay">
            <div className="confirm-modal">
              <h3>{confirmData.title}</h3>
              <p>{confirmData.message}</p>

              <div className="confirm-actions">
                <button className="ghost-btn" onClick={closeConfirm}>
                  Mégse
                </button>

                <button
                  className="danger-btn"
                  onClick={() => {
                    if (confirmData.onConfirm) {
                      confirmData.onConfirm();
                    }
                  }}
                >
                  Igen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;