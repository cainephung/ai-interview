import { useState } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState("Frontend");
  const [difficulty, setDifficulty] = useState("Medium");

  const getQuestion = async () => {
    setLoading(true);
    setFeedback("");
    setUserAnswer("");
    setError("");
    try {
      const res = await fetch("http://localhost:5001/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: role, difficulty }),
      });
      const data = await res.json();
      setQuestion(data.question);
    } catch (err) {
      setError("⚠️ Failed to fetch question. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    setFeedback("");
    try {
      const res = await fetch("http://localhost:5001/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, userAnswer }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
    } catch (err) {
      setError("⚠️ Failed to evaluate answer. Try again later.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-4">
      <h1 className="text-3xl font-bold text-center">AcePrep AI</h1>

      <div className="flex space-x-4 items-center">
        <label className="text-sm">
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

        <label className="text-sm">
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
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Loading..." : "Get Interview Question"}
      </button>

      {error && <p className="text-red-500">{error}</p>}

      {question && (
        <div className="bg-white border border-gray-300 p-4 rounded w-full max-w-xl shadow space-y-4">
          <div>
            <strong className="block text-gray-700 mb-1">Question:</strong>
            <p className="text-gray-800">{question}</p>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Your Answer:
            </label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 text-sm"
              rows={4}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
            />
          </div>

          <button
            onClick={evaluateAnswer}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={evaluating || !userAnswer.trim()}
          >
            {evaluating ? "Evaluating..." : "Submit Answer"}
          </button>

          {feedback && (
            <div className="bg-gray-100 border border-gray-300 p-3 rounded mt-4">
              <strong className="block text-gray-700 mb-1">Feedback:</strong>
              <p className="text-gray-800 whitespace-pre-line">{feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
