import { useEffect, useRef, useState } from "react";

function App() {
  const questionCardRef = useRef<HTMLDivElement | null>(null);

  const [question, setQuestion] = useState(
    () => localStorage.getItem("question") || ""
  );
  const [userAnswer, setUserAnswer] = useState(
    () => localStorage.getItem("userAnswer") || ""
  );
  const [feedback, setFeedback] = useState(() => {
    const saved = localStorage.getItem("feedback");
    return saved ? JSON.parse(saved) : { text: "", score: null };
  });
  const [modelAnswer, setModelAnswer] = useState(
    () => localStorage.getItem("modelAnswer") || ""
  );
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [revealWarning, setRevealWarning] = useState("");
  const [error, setError] = useState("");
  const [highlightQuestion, setHighlightQuestion] = useState(false);

  const [answerHistory, setAnswerHistory] = useState(() => {
    const saved = localStorage.getItem("answerHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [tags, setTags] = useState(() => {
    const saved = localStorage.getItem("tags");
    return saved ? JSON.parse(saved) : {};
  });
  const [filterTag, setFilterTag] = useState("All");

  const [role, setRole] = useState(
    () => localStorage.getItem("role") || "Frontend"
  );
  const [difficulty, setDifficulty] = useState(
    () => localStorage.getItem("difficulty") || "Medium"
  );

  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem("question", question);
    localStorage.setItem("userAnswer", userAnswer);
    localStorage.setItem("feedback", JSON.stringify(feedback));
    localStorage.setItem("modelAnswer", modelAnswer);
    localStorage.setItem("answerHistory", JSON.stringify(answerHistory));
    localStorage.setItem("tags", JSON.stringify(tags));
    localStorage.setItem("role", role);
    localStorage.setItem("difficulty", difficulty);
  }, [
    question,
    userAnswer,
    feedback,
    modelAnswer,
    answerHistory,
    tags,
    role,
    difficulty,
  ]);

  const suggestions: Record<string, string[]> = {
    "CSS specificity": ["inheritance", "inline styles", "!important"],
    "JavaScript async": ["Promises", "await", "event loop"],
    "React hooks": ["useEffect", "dependency array", "cleanup"],
  };

  const getQuestion = async () => {
    setLoading(true);
    setRevealWarning("");
    setUserAnswer("");
    setFeedback({ text: "", score: null });
    setModelAnswer("");
    setRelatedTopics([]);
    setError("");

    try {
      const res = await fetch("http://localhost:5001/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: role, difficulty }),
      });
      const data = await res.json();
      setQuestion(data.question);
      setHighlightQuestion(true);
      setTimeout(() => setHighlightQuestion(false), 1000);
      setTimeout(() => {
        questionCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch {
      setError("Failed to fetch question.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    setFeedback({ text: "", score: null });
    setModelAnswer("");
    setError("");

    try {
      const res = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, userAnswer }),
      });
      const data = await res.json();
      let feedbackText = data.feedback;
      const scoreMatch = feedbackText.match(
        /(?:score[:\s]*)?(\d+)\s*(?:\/|out of)?\s*10/i
      );
      const score = scoreMatch ? `${scoreMatch[1]}/10` : null;
      if (scoreMatch)
        feedbackText = feedbackText.replace(scoreMatch[0], "").trim();
      setFeedback({ text: feedbackText, score });

      const now = new Date().toLocaleTimeString();
      setAnswerHistory(
        (
          prev: {
            question: string;
            answer: string;
            score: string | null;
            time: string;
          }[]
        ) => [...prev, { question, answer: userAnswer, score, time: now }]
      );

      const key = Object.keys(suggestions).find((k) =>
        question.toLowerCase().includes(k.toLowerCase())
      );
      setRelatedTopics(key ? suggestions[key] : []);
    } catch {
      setError("Failed to evaluate answer.");
    } finally {
      setEvaluating(false);
    }
  };

  const getModelAnswer = async () => {
    if (!feedback.text) {
      setRevealWarning("Try answering the question first!");
      setTimeout(() => setRevealWarning(""), 3000);
      return;
    }
    try {
      const res = await fetch("/api/model-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setModelAnswer(data.modelAnswer);
    } catch {
      setError("Failed to load model answer.");
    }
  };

  type HistoryItem = {
    question: string;
    answer: string;
    score: string | null;
    time: string;
  };

  const filteredHistory =
    filterTag === "All"
      ? answerHistory
      : answerHistory.filter(
          (item: HistoryItem) => tags[item.question] === filterTag
        );

  const exportTagged = () => {
    const taggedQuestions = answerHistory.filter(
      (item: HistoryItem) => tags[item.question]
    );
    const text = taggedQuestions
      .map(
        (q: HistoryItem) =>
          `Tag: ${tags[q.question]}\nQ: ${q.question}\nA: ${q.answer}\nScore: ${
            q.score
          }`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
      <h1 className="text-3xl font-bold">AcePrep AI</h1>

      <div className="flex space-x-4">
        <label>
          Role:
          <select
            className="ml-2 border rounded px-2 py-1"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>Frontend</option>
            <option>Backend</option>
            <option>Data</option>
            <option>PM</option>
          </select>
        </label>
        <label>
          Difficulty:
          <select
            className="ml-2 border rounded px-2 py-1"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </label>
      </div>

      <button
        onClick={getQuestion}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Loading..." : question ? "New Question" : "Get Question"}
      </button>

      {(loading || question) && (
        <div
          ref={questionCardRef}
          className="bg-white border border-gray-300 p-4 rounded shadow max-w-xl w-full space-y-4 min-h-[200px] flex flex-col justify-center items-stretch"
        >
          {loading ? (
            <p className="text-center text-gray-500 animate-pulse">
              Loading question...
            </p>
          ) : (
            <>
              <div>
                <strong className="block text-gray-700">Question:</strong>
                <p
                  className={`transition-colors duration-700 ${
                    highlightQuestion ? "bg-yellow-200" : ""
                  }`}
                >
                  {question}
                </p>
              </div>

              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={4}
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={evaluateAnswer}
                  disabled={evaluating || !userAnswer.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  {evaluating ? "Evaluating..." : "Submit Answer"}
                </button>
                <button
                  onClick={getModelAnswer}
                  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
                >
                  Reveal Answer
                </button>
              </div>

              {revealWarning && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {revealWarning}
                </p>
              )}

              <div className="flex space-x-2 mt-2">
                {["Good", "Tricky", "Needs Review"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setTags((prev) => {
                        const updated = { ...prev, [question]: tag };
                        localStorage.setItem("tags", JSON.stringify(updated));
                        return updated;
                      })
                    }
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {tags[question] && (
                <p className="text-xs text-gray-500">Tag: {tags[question]}</p>
              )}

              {feedback.text && (
                <div className="bg-blue-50 border border-blue-300 p-3 rounded space-y-2">
                  {feedback.score && (
                    <p className="font-semibold text-blue-700">
                      Score: {feedback.score}
                    </p>
                  )}
                  <div>
                    <strong>Feedback:</strong>
                    <p>{feedback.text}</p>
                  </div>
                  {relatedTopics.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <strong>Suggested Topics:</strong>{" "}
                      {relatedTopics.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {modelAnswer && (
                <div className="bg-gray-100 border border-gray-300 p-3 rounded">
                  <strong>Model Answer:</strong>
                  <p>{modelAnswer}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {answerHistory.length > 0 && (
        <div className="max-w-xl w-full mt-6 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between items-center">
            <strong>Answer History:</strong>
            <div className="flex space-x-2 items-center">
              <label className="text-xs">
                Filter:
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="ml-1 border rounded px-1 py-0.5 text-xs"
                >
                  <option>All</option>
                  <option>Good</option>
                  <option>Tricky</option>
                  <option>Needs Review</option>
                </select>
              </label>
              <button
                onClick={exportTagged}
                className="text-blue-500 text-xs underline"
              >
                Export Tagged
              </button>
            </div>
          </div>
          <ul className="space-y-2">
            {filteredHistory.map(
              (
                item: {
                  question: string;
                  answer: string;
                  score: string | null;
                  time: string;
                },
                idx: number
              ) => (
                <li key={idx} className="border rounded p-2 bg-white shadow-sm">
                  <p className="text-xs text-gray-500">{item.time}</p>
                  <p className="font-medium">{item.question}</p>
                  {tags[item.question] && (
                    <p className="text-xs text-purple-600">
                      Tag: {tags[item.question]}
                    </p>
                  )}
                  <p className="text-blue-700">Score: {item.score ?? "N/A"}</p>
                  <p className="text-gray-800">{item.answer}</p>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
