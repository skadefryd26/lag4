import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { AtlassianMcp, AtlassianMcpError } from './atlassian.js';
import { formatWorkAnswer, parseWorkQuestion, safeFactsForGateway } from './current-work.js';
import { answerQuestion, loadEvidence } from './evidence.js';

config({ path: fileURLToPath(new URL('../../.env.local', import.meta.url)) });

const app = express();
const atlassian = new AtlassianMcp();

class GatewayError extends Error {
  constructor(message: string, readonly statusCode: 502 | 503 = 502) {
    super(message);
  }
}

async function gatewayText(instructions: string, input: string, timeout: number): Promise<string> {
  const token = process.env.AI_GATEWAY_TOKEN;
  if (!token) throw new GatewayError('AI gateway token unavailable. Configure local backend access before asking Bjarne.', 503);
  let gateway: Response;
  try {
    gateway = await fetch('https://genai.gjensidige.io/openai/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-5.6-luna', instructions, input }),
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new GatewayError('AI gateway did not respond. Try again.');
  }
  if (gateway.status === 401) throw new GatewayError('AI gateway token expired. Refresh the local token.', 503);
  if (gateway.status === 403) throw new GatewayError('AI gateway rejected the token. Check the production Azure subscription.');
  if (!gateway.ok) throw new GatewayError(`AI gateway unavailable (${gateway.status}).`);
  let result: unknown;
  try {
    result = await gateway.json() as unknown;
  } catch {
    throw new GatewayError('AI gateway returned an invalid response.');
  }
  if (typeof result !== 'object' || result === null || Array.isArray(result)) throw new GatewayError('AI gateway returned an invalid response.');
  const body = result as Record<string, unknown>;
  const outputItems: unknown[] = Array.isArray(body.output) ? body.output : [];
  const fromOutput = outputItems.flatMap((item) => {
    if (typeof item !== 'object' || item === null || !('content' in item) || !Array.isArray(item.content)) return [];
    const parts: unknown[] = item.content;
    return parts.flatMap((part) =>
      typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string' ? [part.text] : []);
  }).join(' ').trim();
  const text = typeof body.output_text === 'string' ? body.output_text : fromOutput;
  if (!text) throw new GatewayError('AI gateway returned no text.');
  return text;
}

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
    const cleanQuestion = question.trim();
    if (parseWorkQuestion(cleanQuestion)) {
      if (!process.env.AI_GATEWAY_TOKEN) throw new GatewayError('AI gateway token unavailable. Configure local backend access before asking Bjarne.', 503);
      const evidence = await atlassian.currentWork(cleanQuestion);
      if (!evidence) throw new AtlassianMcpError('Could not interpret the work question.', 502);
      if (!evidence.facts.length) {
        response.json({
          answer: `I checked ${evidence.projectKey}'s Jira work, but could not find a clear, non-personal topic to summarize. ${evidence.sources.length ? 'Open the linked items for context.' : 'There are no matching work items to cite.'}`,
          sources: evidence.sources, state: 'unknown', mode: 'live-atlassian',
        });
        return;
      }
      const instructions = [
        'You are Bjarne, a dry-witted but genuinely helpful Claims onboarding guide. Write clear, human English, not a list of raw search excerpts.',
        'The input contains ONLY preclassified, non-personal Jira work themes and local citation numbers. Never invent issues, goals, names, dates, ownership or specifics not present in those facts.',
        'Return ONLY JSON: {\"active\":\"one short sentence with citations\",\"planned\":\"one short sentence with citations\"}. Use empty string for a phase with no facts.',
        'The active sentence may mention ONLY active themes. The planned sentence may mention ONLY planned themes, clearly as planned rather than underway.',
        'Cite each factual clause with individual markers such as [1] [2], using only references listed in the corresponding phase. Do not write URLs, issue keys or personal details.',
        'Keep the whole answer under 100 words. Be conversational, accurate and concise; one mild joke about your own coffee dependency is allowed.',
      ].join(' ');
      let answer;
      try {
        answer = formatWorkAnswer(await gatewayText(instructions, JSON.stringify(safeFactsForGateway(evidence)), 60_000), evidence);
      } catch (error) {
        if (error instanceof GatewayError) throw error;
        throw new GatewayError('AI gateway could not produce a source-grounded answer. Try again.');
      }
      response.json(answer);
      return;
    }
    response.json(await atlassian.search(cleanQuestion));
  } catch (error) {
    const known = error instanceof AtlassianMcpError || error instanceof GatewayError ? error : new AtlassianMcpError('Atlassian search failed.', 502);
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
    const text = await gatewayText(
      'You are Bjarne, a dry-witted but genuinely helpful Claims Tribe onboarding guide. Write at most 80 words in English. Base every claim only on the provided evidence. Acknowledge unknowns and conflicting information. Never invent names, ownership, or activity. One gentle joke about your own coffee dependency is fine; never joke about employees or customers.',
      `Summarize this squad for a new employee. Evidence: ${JSON.stringify({ squad, sources })}`,
      20_000,
    );
    response.json({ text, sources, mode: 'ai-summary', warning: 'AI-generated overview; verify each claim against the linked sources.' });
  } catch (error) {
    if (error instanceof GatewayError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    response.status(502).json({ error: 'AI gateway did not respond; use the verified details instead.' });
  }
});

const siteRoot = fileURLToPath(new URL('../../', import.meta.url));
const publicFiles = new Set([
  'index.html', 'blueprint.html', 'systems.html', 'experience.html', 'bolleforsikring.html', 'bjarne.html',
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
