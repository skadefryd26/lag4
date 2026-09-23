import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { answerQuestion, loadEvidence } from './evidence.js';

config({ path: fileURLToPath(new URL('../../.env.local', import.meta.url)) });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));
app.use('/api', (_request, response, next) => {
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  next();
});

// This demo binds to loopback only. An authenticated multi-user deployment must replace this
// gate with delegated OAuth source access and filter evidence BEFORE building any answer.
app.use('/api', (_request, response, next) => {
  if (process.env.LOCAL_RESEARCH_DEMO !== 'true') {
    response.status(403).json({ error: 'Internal source data is disabled. Enable the explicitly local, single-user research demo or configure per-user delegated access.' });
    return;
  }
  next();
});

app.get('/api/tribe', async (_request, response) => {
  try {
    const data = await loadEvidence();
    response.json({ ...data, demonstration: true, slack: { connected: false, channel: null, trigger: null, action: null } });
  } catch {
    response.status(503).json({ error: 'Verified local evidence snapshot is unavailable.' });
  }
});

app.post('/api/ask', async (request, response) => {
  const question: unknown = request.body?.question;
  if (typeof question !== 'string' || !question.trim() || question.length > 500) {
    response.status(400).json({ error: 'Enter a question of 1–500 characters.' });
    return;
  }
  try {
    const data = await loadEvidence();
    // Deterministic answer first: never let a model manufacture ownership or citations.
    response.json(answerQuestion(data, question));
  } catch {
    response.status(503).json({ error: 'Verified local evidence snapshot is unavailable.' });
  }
});

app.post('/api/brief', async (request, response) => {
  const squadId: unknown = request.body?.squadId;
  if (typeof squadId !== 'string' || !/^[a-z]{2,30}$/.test(squadId)) {
    response.status(400).json({ error: 'Select a squad.' });
    return;
  }
  const data = await loadEvidence();
  const squad = data.squads.find((entry) => entry.id === squadId);
  if (!squad) { response.status(404).json({ error: 'Squad not found.' }); return; }
  if (process.env.LOCAL_RESEARCH_DEMO !== 'true') { response.status(403).json({ error: 'Local research demonstration is disabled.' }); return; }
  const token = process.env.AI_GATEWAY_TOKEN;
  if (!token) { response.status(503).json({ error: 'AI gateway token unavailable; verified source details remain accessible.' }); return; }
  const sources = data.sources.filter((source) => squad.refs.includes(source.id));
  try {
    const gateway = await fetch('https://genai.gjensidige.io/openai/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.6-luna',
        instructions: 'You are Bjarne, a dry-witted but genuinely helpful Claims Tribe onboarding guide. Write at most 80 words in English. Base every claim only on the provided evidence. Acknowledge unknowns and conflicting information. Never invent names, ownership, or activity. One gentle joke about your own coffee dependency is fine; never joke about employees or customers.',
        input: `Summarize this squad for a new employee. Evidence: ${JSON.stringify({ squad, sources })}`,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!gateway.ok) { response.status(502).json({ error: `AI gateway unavailable (${gateway.status}); use the verified details instead.` }); return; }
    const result = await gateway.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const text = result.output_text ?? result.output?.flatMap((item) => item.content ?? []).map((part) => part.text ?? '').join(' ').trim();
    if (!text) { response.status(502).json({ error: 'AI gateway returned no text.' }); return; }
    response.json({ text, sources, mode: 'ai-summary', warning: 'AI-generated overview; verify each claim against the linked sources.' });
  } catch {
    response.status(502).json({ error: 'AI gateway did not respond; use the verified details instead.' });
  }
});

app.listen(3300, '127.0.0.1', () => console.log('Claims evidence API listening on http://127.0.0.1:3300'));
