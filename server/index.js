const express = require('express')
const cors = require('cors')
const dotenv = require("dotenv");


const { OpenAI } = require('openai')
require("dotenv").config({ path: "../.env" });

// Load environment variables
dotenv.config()

console.log(' API Key loaded?', process.env.OPENAI_API_KEY ? 'Yes' : 'No')
console.log("Loaded OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const app = express()
const port = 5001

app.use(cors())
app.use(express.json())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

app.post('/api/model-answer', async (req, res) => {
  const { question } = req.body;

  const prompt = `You're an expert interviewer. What would be a strong, model answer to this question: "${question}"? Respond with just the answer.`;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    const modelAnswer = chat.choices[0].message.content.trim();
    res.json({ modelAnswer });
  } catch (err) {
    console.error("Error generating model answer:", err);
    res.status(500).json({ error: "Failed to get model answer." });
  }
});

app.post('/api/generate-question', async (req, res) => {
  console.log('Incoming request to /generate-question');
  const { category, difficulty } = req.body;

  console.log('Category:', category);
  console.log('Difficulty:', difficulty);

  const prompt = `
You're an expert interviewer. Based on the category "${category}" and difficulty "${difficulty}", 
generate a unique and relevant interview question. Avoid repeating common or previously used ones. 
Do not include answers or explanations. Only output the question.

Examples:
- "What is the difference between == and === in JavaScript?"
- "How does the virtual DOM work in React?"
- "What are closures in JavaScript?"

Now give one ${difficulty} ${category} interview question:
`;

  try {
      const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.9, // more creativity
      messages: [{ role: "user", content: prompt }],
    });

    const question = chat.choices?.[0]?.message?.content?.trim();

    if (!question) {
      return res.status(500).json({ error: 'No question received from GPT' });
    }

    res.json({ question });
  } catch (err) {
    console.error('Error generating question:\n', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    res.status(500).json({ error: 'Failed to generate question', details: err.message || 'No message' });
  }
});


// Route: evaluate answer
app.post('/api/evaluate-answer', async (req, res) => {
  console.log('Incoming request to /evaluate-answer')
  const { question, userAnswer } = req.body
  console.log(' Question:', question)
  console.log(' User Answer:', userAnswer)

  const prompt = `You're an interview coach. The question was: "${question}". The candidate answered: "${userAnswer}". 
  Give:
  1. A short evaluation starting with 'Evaluation:' 
  2. Then a score clearly formatted like 'Score: X/10' 
  3. Then follow up with feedback starting with 'Feedback:'`;
  
  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    })

    const feedback = chat.choices[0].message.content.trim()
    console.log('Feedback received:', feedback)
    res.json({ feedback })
  } catch (err) {
    console.error('Error evaluating answer:', err)
    res.status(500).json({ error: 'Failed to evaluate answer' })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})


  