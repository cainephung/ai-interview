import { useState } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    text: string;
    score: string | null;
  }>({ text: "", score: null });
  const [modelAnswer, setModelAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [allQuestions, setAllQuestions] = useState<string[]>([]);
  const [revealWarning, setRevealWarning] = useState("");
  const [role, setRole] = useState("Frontend");
  const [difficulty, setDifficulty] = useState("Medium");

  const getQuestion = async () => {
    setLoading(true);
    setError("");
    setRevealWarning("");
    setUserAnswer("");
    setFeedback({ text: "", score: null });
    setModelAnswer("");

    try {
      const res = await fetch("http://localhost:5001/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: role, difficulty }),
      });

      const data = await res.json();

      // Only update the question after a successful fetch
      setQuestion(data.question);
      setAllQuestions((prev) => [...prev, data.question]);
    } catch (err) {
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

      // Remove any "Score: .../10" from the feedback text
      if (scoreMatch) {
        feedbackText = feedbackText.replace(scoreMatch[0], "").trim();
      }

      setFeedback({ text: feedbackText, score });
    } catch (err) {
      setError("Failed to evaluate answer.");
    } finally {
      setEvaluating(false);
    }
  };

  const getModelAnswer = async () => {
    if (!feedback.text) {
      setRevealWarning("Try answering the question first!");
      setTimeout(() => {
        setRevealWarning("");
      }, 3000); // hide after 3 seconds
      return;
    }

    setRevealWarning("");
    try {
      const res = await fetch("/api/model-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setModelAnswer(data.modelAnswer);
    } catch (err) {
      setError("Failed to load model answer.");
    }
  };

  const retryAnswer = () => {
    setUserAnswer("");
    setFeedback({ text: "", score: null });
    setModelAnswer("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-4">
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
        type="button"
        onClick={getQuestion}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Loading..." : question ? "New Question" : "Get Question"}
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {question && (
        <div className="bg-white border border-gray-300 p-4 rounded shadow max-w-xl w-full space-y-4">
          <div>
            <strong className="block text-gray-700">Question:</strong>
            <p>{question}</p>
          </div>

          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={4}
            placeholder="Type your answer here..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />

          <div className="flex flex-col space-y-1">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={evaluateAnswer}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                disabled={evaluating || !userAnswer.trim()}
              >
                {evaluating ? "Evaluating..." : "Submit Answer"}
              </button>

              <button
                type="button"
                onClick={retryAnswer}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                disabled={!feedback.text}
              >
                Retry Answer
              </button>

              <button
                type="button"
                onClick={getModelAnswer}
                className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
              >
                Reveal Answer
              </button>
            </div>

            {revealWarning && (
              <p className="text-xs text-red-500 mt-1 ml-1">
                Try answering the question first!
              </p>
            )}
          </div>

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
            </div>
          )}

          {modelAnswer && (
            <div className="bg-gray-100 border border-gray-300 p-3 rounded">
              <strong>Model Answer:</strong>
              <p>{modelAnswer}</p>
            </div>
          )}
        </div>
      )}

      {allQuestions.length > 1 && (
        <div className="max-w-xl w-full text-left text-sm text-gray-600 mt-6">
          <strong className="block mb-2">Previous Questions:</strong>
          <ul className="list-disc list-inside space-y-1">
            {allQuestions
              .slice(0, -1)
              .reverse()
              .map((q, i) => (
                <li key={i}>{q}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
