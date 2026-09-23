import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { composeGroundedAnswer } from './grounded-answer.js';

const MCP_URL = 'https://mcp.atlassian.com/v2/mcp';
const DEFAULT_SITE = 'https://gjensidige.atlassian.net';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
export type LiveSource = { kind: 'jira' | 'confluence'; title: string; url: string };
export type LiveAnswer = {
  answer: string;
  sources: LiveSource[];
  state: 'sources' | 'unknown';
  mode: 'live-atlassian';
};
export type SearchHit = { source: LiveSource; title: string; snippet: string };
export type SearchMatches = { hits: SearchHit[]; hasMore: boolean; partial: boolean };

export class AtlassianMcpError extends Error {
  constructor(message: string, readonly statusCode: 502 | 503 = 503) {
    super(message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function payloads(result: unknown): unknown[] {
  if (!isRecord(result)) throw new AtlassianMcpError('Atlassian returned an invalid response.', 502);
  if (result.isError === true) throw new AtlassianMcpError('Atlassian refused the read request. Check your access and try again.', 502);

  const values: unknown[] = [];
  if (result.structuredContent != null) values.push(result.structuredContent);
  if (Array.isArray(result.content)) {
    for (const block of result.content) {
      if (!isRecord(block) || block.type !== 'text' || typeof block.text !== 'string') continue;
      const text = block.text.trim();
      if (!text) continue;
      try {
        values.push(JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) as unknown);
      } catch {
        values.push(text);
      }
    }
  }
  if (!values.length) throw new AtlassianMcpError('Atlassian returned no readable response.', 502);
  return values;
}

export function cloudIdForSite(result: unknown, site: string): string {
  const origin = new URL(site).origin;
  const visit = (value: unknown, depth: number): string | undefined => {
    if (depth > 5) return undefined;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item, depth + 1);
        if (found) return found;
      }
    } else if (isRecord(value)) {
      const id = typeof value.cloudId === 'string' ? value.cloudId : value.id;
      if (typeof id === 'string' && typeof value.url === 'string') {
        try {
          if (new URL(value.url).origin === origin) return id;
        } catch {
          // Ignore a malformed resource, not the rest of the authorized sites.
        }
      }
      for (const nested of Object.values(value)) {
        const found = visit(nested, depth + 1);
        if (found) return found;
      }
    }
    return undefined;
  };
  for (const value of payloads(result)) {
    const id = visit(value, 0);
    if (id) return id;
  }
  throw new AtlassianMcpError(`Your Atlassian account has no authorized access to ${origin}.`);
}

function sourceFromUrl(raw: string, site: string): LiveSource | undefined {
  const origin = new URL(site).origin;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.origin !== origin) return undefined;
  const issue = /^\/browse\/([A-Za-z][A-Za-z0-9_]*-\d+)(?:\/|$)/.exec(url.pathname);
  const page = /^\/wiki\/(?:spaces\/[^/]+\/pages\/(\d+)|x\/[A-Za-z0-9_-]+)/.exec(url.pathname);
  if (!issue && !page) return undefined;
  if (issue) url.pathname = `/browse/${issue[1]}`;
  else if (page) url.pathname = page[0];
  url.search = '';
  url.hash = '';
  return {
    kind: issue ? 'jira' : 'confluence',
    title: issue ? `Jira ${issue[1]}` : `Confluence page${page?.[1] ? ` ${page[1]}` : ''}`,
    url: url.href,
  };
}

export function matchesFromSearch(result: unknown, site: string): SearchMatches {
  const response = payloads(result).find((value): value is Record<string, unknown> =>
    isRecord(value) && Array.isArray(value.results),
  );
  if (!response || !Array.isArray(response.results)) {
    throw new AtlassianMcpError('Atlassian returned search data without usable Jira or Confluence links.', 502);
  }
  const hits: SearchHit[] = [];
  const seen = new Set<string>();
  for (const item of response.results) {
    if (!isRecord(item) || typeof item.url !== 'string') continue;
    const source = sourceFromUrl(item.url, site);
    if (!source || seen.has(source.url)) continue;
    seen.add(source.url);
    hits.push({
      source,
      title: typeof item.title === 'string' ? item.title : '',
      snippet: typeof item.snippet === 'string' ? item.snippet : '',
    });
    if (hits.length === 10) break;
  }
  if (response.results.length > 0 && hits.length === 0 && !response.results.some((item) => isRecord(item) && typeof item.url === 'string')) {
    throw new AtlassianMcpError('Atlassian returned search data without usable Jira or Confluence links.', 502);
  }
  return {
    hits,
    hasMore: typeof response.totalCount === 'number' && response.totalCount > hits.length,
    partial: Array.isArray(response.warnings) && response.warnings.length > 0,
  };
}

export function sourcesFromSearch(result: unknown, site: string): LiveSource[] {
  return matchesFromSearch(result, site).hits.map((hit) => hit.source);
}

export class AtlassianMcp {
  private readonly site: string;
  private client?: Client;
  private connectingClient?: Client;
  private cloudId?: string;
  private inFlight?: Promise<void>;
  private state: ConnectionState = 'disconnected';
  private error?: string;

  constructor(site = process.env.ATLASSIAN_SITE_URL || DEFAULT_SITE) {
    const url = new URL(site);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.atlassian.net') || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('ATLASSIAN_SITE_URL must be an Atlassian Cloud site origin.');
    }
    this.site = url.origin;
  }

  status() {
    return { state: this.state, site: this.site, ...(this.error ? { error: this.error } : {}) };
  }

  async connect() {
    if (this.client && this.cloudId) return this.status();
    if (!this.inFlight) {
      this.state = 'connecting';
      this.error = undefined;
      this.inFlight = this.open().finally(() => { this.inFlight = undefined; });
    }
    await this.inFlight;
    return this.status();
  }

  private async open(): Promise<void> {
    const proxy = fileURLToPath(import.meta.resolve('mcp-remote/dist/proxy.js'));
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [proxy, MCP_URL, '--transport', 'http-only', '--protocol', 'auto', '--auth-timeout', '300', '--silent'],
      stderr: 'ignore',
    });
    const client = new Client({ name: 'claims-tribe-local-guide', version: '0.1.0' });
    this.connectingClient = client;
    try {
      await client.connect(transport);
      const { tools } = await client.listTools(undefined, { timeout: 20_000 });
      if (!tools.some((tool) => tool.name === 'search') || !tools.some((tool) => tool.name === 'getAccessibleAtlassianResources')) {
        throw new AtlassianMcpError('Your Atlassian connection does not expose the required read-only search tools.');
      }
      const resources = await client.callTool({ name: 'getAccessibleAtlassianResources', arguments: {} }, undefined, { timeout: 20_000 });
      const cloudId = cloudIdForSite(resources, this.site);
      if (this.connectingClient !== client) throw new AtlassianMcpError('Atlassian connection was stopped before authorization completed.');
      this.connectingClient = undefined;
      this.client = client;
      this.cloudId = cloudId;
      this.state = 'connected';
      client.onclose = () => {
        if (this.client !== client) return;
        this.client = undefined;
        this.cloudId = undefined;
        this.state = 'error';
        this.error = 'Atlassian disconnected. Reconnect to continue.';
      };
    } catch (error) {
      const message = error instanceof AtlassianMcpError
        ? error.message
        : 'Atlassian authorization did not complete. Approve the browser prompt or check whether your organization allows this local client.';
      this.state = 'error';
      this.error = message;
      if (this.connectingClient === client) {
        this.connectingClient = undefined;
        try {
          await client.close();
        } catch {
          throw new AtlassianMcpError('Atlassian connection could not close cleanly. Restart the app.');
        }
      }
      throw new AtlassianMcpError(message);
    }
  }

  async search(question: string): Promise<LiveAnswer> {
    if (!this.client || !this.cloudId) throw new AtlassianMcpError('Connect your Atlassian account before searching.');
    let result: unknown;
    try {
      result = await this.client.callTool({
        name: 'search',
        arguments: { cloudId: this.cloudId, query: question },
      }, undefined, { timeout: 30_000 });
    } catch {
      throw new AtlassianMcpError('Atlassian search failed. Check your connection and try again.', 502);
    }
    return composeGroundedAnswer(question, matchesFromSearch(result, this.site));
  }

  async close(): Promise<void> {
    const client = this.client ?? this.connectingClient;
    this.client = undefined;
    this.connectingClient = undefined;
    this.cloudId = undefined;
    this.state = 'disconnected';
    this.error = undefined;
    if (client) await client.close();
  }
}
