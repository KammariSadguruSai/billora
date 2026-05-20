const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// POST /api/ai/chat
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'AI service not configured' });

    const systemPrompt = `You are an AI assistant for a Project Management & Invoice SaaS platform called Billora.
You help project managers, team members, and clients with:
- Project planning and task management
- Invoice and payment queries
- Time tracking and productivity tips
- Client communication best practices
Context: ${JSON.stringify(context || {})}
Be concise, professional, and helpful.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'AI request failed');
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    res.json({ reply });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI service error: ' + err.message });
  }
});

// POST /api/ai/generate-proposal
router.post('/generate-proposal', authenticate, async (req, res) => {
  try {
    const { projectName, clientName, requirements, budget, timeline } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const prompt = `Generate a professional project proposal for:
Project: ${projectName}
Client: ${clientName}
Requirements: ${requirements}
Budget: ${budget}
Timeline: ${timeline}

Include: Executive Summary, Project Scope, Deliverables, Timeline, Pricing, Terms.
Format as structured text with clear headings.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await response.json();
    const proposal = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ proposal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate proposal' });
  }
});

// POST /api/ai/task-suggestions
router.post('/task-suggestions', authenticate, async (req, res) => {
  try {
    const { projectDescription, existingTasks } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const prompt = `Given this project: "${projectDescription}"
Existing tasks: ${existingTasks?.join(', ') || 'none'}
Suggest 5 specific actionable tasks to complete this project.
Return as JSON array: [{"title": "...", "description": "...", "priority": "medium", "estimated_hours": 2}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(text);
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ suggestions: [], error: 'Failed to generate suggestions' });
  }
});

module.exports = router;
