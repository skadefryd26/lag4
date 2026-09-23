import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { AtlassianMcp, AtlassianMcpError } from './atlassian.js';
import { answerQuestion, loadEvidence } from './evidence.js';

config({ path: fileURLToPath(new URL('../../.env.local', import.meta.url)) });

const app = express();
const atlassian = new AtlassianMcp();
app.disable('x-powered-by');
app.use(express.json({ limit: '8kb' }));
app.use('/api', (request, response, next) => {
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  next();
});
app.use((request, response, next) => {
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(request.headers.host ?? '')) {
    response.status(403).json({ error: 'This API is available only on this machine.' });
    return;
  }
  next();
});

app.use(['/api/tribe', '/api/snapshot/ask', '/api/brief'], (_request, response, next) => {
  if (process.env.LOCAL_RESEARCH_DEMO !== 'true') {
    response.status(403).json({ error: 'Internal source data is disabled. Enable the explicitly local, single-user research demo or configure per-user delegated access.' });
    return;
  }
  next();
});

app.get('/api/atlassian/status', (_request, response) => response.json(atlassian.status()));

app.post('/api/atlassian/connect', async (_request, response) => {
  try {
    response.json(await atlassian.connect());
  } catch (error) {
    const known = error instanceof AtlassianMcpError ? error : new AtlassianMcpError('Atlassian connection failed.');
    response.status(known.statusCode).json({ error: known.message });
  }
});

app.post('/api/ask', async (request, response) => {
  const question: unknown = request.body?.question;
  if (typeof question !== 'string' || !question.trim() || question.length > 500) {
    response.status(400).json({ error: 'Enter a question of 1–500 characters.' });
    return;
  }
  try {
    response.json(await atlassian.search(question.trim()));
  } catch (error) {
    const known = error instanceof AtlassianMcpError ? error : new AtlassianMcpError('Atlassian search failed.', 502);
    response.status(known.statusCode).json({ error: known.message });
  }
});

app.get('/api/tribe', async (_request, response) => {
  try {
    const data = await loadEvidence();
    response.json({ ...data, demonstration: true, slack: { connected: false, channel: null, trigger: null, action: null } });
  } catch {
    response.status(503).json({ error: 'Verified local evidence snapshot is unavailable.' });
  }
});

app.post('/api/snapshot/ask', async (request, response) => {
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

const siteRoot = fileURLToPath(new URL('../../', import.meta.url));
const publicFiles = new Set([
  'index.html', 'mental-model.html', 'blueprint.html', 'systems.html', 'experience.html', 'bolleforsikring.html', 'bjarne.html',
  'styles.css', 'script.js', 'bolleforsikring.js', 'bjarne.css', 'bjarne.js',
]);
app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  next();
});
app.use('/assets', express.static(fileURLToPath(new URL('../../assets/', import.meta.url)), { dotfiles: 'deny', index: false }));
app.get('/', (_request, response) => response.sendFile('index.html', { root: siteRoot }));
app.get('/:file', (request, response) => {
  const file = request.params.file;
  if (typeof file !== 'string' || !publicFiles.has(file)) {
    response.sendStatus(404);
    return;
  }
  response.sendFile(file, { root: siteRoot });
});

const server = app.listen(3300, '127.0.0.1', () => console.log('Claims onboarding site listening on http://127.0.0.1:3300'));
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close();
    void atlassian.close().catch(() => {
      console.error('Atlassian MCP client did not close cleanly.');
      process.exitCode = 1;
    });
  });
}
