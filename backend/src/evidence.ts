import { readFile } from 'node:fs/promises';

export interface Source {
  id: string;
  title: string;
  kind: 'confluence' | 'jira' | 'github';
  url: string;
  updated: string;
}
export interface Squad {
  id: string;
  name: string;
  aliases?: string[];
  tagline: string;
  mission: string;
  domain: string;
  apps: string[];
  systems: string[];
  work: string[];
  leaders: string[];
  members?: string[];
  contacts: string[];
  refs: string[];
  conflicts: string[];
}
export interface Ownership {
  term: string;
  squad: string | null;
  state: 'supported' | 'provisional' | 'unclear';
  explanation: string;
  refs: string[];
}
export interface Evidence {
  asOf: string;
  sources: Source[];
  squads: Squad[];
  ownership: Ownership[];
}

// Intentionally outside the web bundle and git. This curated snapshot is for a single-user,
// loopback-only research demonstration, never a substitute for per-user source authorization.
const evidenceUrl = new URL('../private/evidence.json', import.meta.url);

export async function loadEvidence(): Promise<Evidence> {
  const data = JSON.parse(await readFile(evidenceUrl, 'utf8')) as Evidence;
  if (!data.asOf || data.squads.length !== 9) throw new Error('A verified nine-squad snapshot is required.');
  return data;
}

export const normalize = (value: string) => value.toLocaleLowerCase('en').replace(/[^a-z0-9æøå]+/g, ' ').trim();

export function findSquad(data: Evidence, query: string): Squad | undefined {
  const normalized = normalize(query);
  return data.squads.find((squad) => [squad.name, squad.id, ...(squad.aliases ?? [])].some((name) =>
    normalize(name) === normalized,
  ));
}

export function answerQuestion(data: Evidence, question: string) {
  const query = normalize(question);
  const ownership = data.ownership.find((entry) => query.includes(normalize(entry.term)));
  if (ownership) {
    const squad = ownership.squad ? data.squads.find((entry) => entry.id === ownership.squad) : undefined;
    return {
      answer: `${squad ? `${squad.name} is ${ownership.state === 'provisional' ? 'provisionally identified as' : 'identified as'} the owner of ${ownership.term}.` : `A sole owner for ${ownership.term} is not confirmed.`} ${ownership.explanation}`,
      state: ownership.state,
      squadId: squad?.id ?? null,
      sources: data.sources.filter((source) => ownership.refs.includes(source.id)),
      mode: 'evidence' as const,
    };
  }
  const candidates = data.squads.flatMap((squad) => [squad.name, ...(squad.aliases ?? [])].map((name) => ({ name, squad })));
  const hit = candidates.sort((a, b) => b.name.length - a.name.length).find(({ name }) => {
    const label = normalize(name);
    // "new" is also a common adjective; require a clear squad reference.
    if (label === 'new' && !/(?:squad|team) new\b|\bnew (?:squad|team)\b|(?:what|who|where) (?:is |does )?new\b/.test(query)) return false;
    return (` ${query} `).includes(` ${label} `);
  });
  if (hit) {
    const squad = hit.squad;
    const contactQuestion = /who|contact|lead|owner|person|reach/.test(query);
    const workQuestion = /work|doing|current|backlog/.test(query);
    return {
      answer: contactQuestion
        ? `${squad.name}: ${[...squad.leaders, ...squad.contacts].join('; ') || 'No verified contact found.'}${squad.conflicts.length ? ` Caution: ${squad.conflicts.join(' ')}` : ''}`
        : workQuestion
          ? `${squad.name}: ${squad.work.join('; ') || 'No verified current work in this snapshot.'}`
          : `${squad.name}: ${squad.mission} Domain: ${squad.domain}.${squad.conflicts.length ? ` Caution: ${squad.conflicts.join(' ')}` : ''}`,
      state: squad.conflicts.length ? 'unclear' as const : 'supported' as const,
      squadId: squad.id,
      sources: data.sources.filter((source) => squad.refs.includes(source.id)),
      mode: 'evidence' as const,
    };
  }
  return { answer: 'I cannot confirm that from the available evidence. Try an application name or a squad name; an authorized source or owner may need to be added.', state: 'unknown' as const, squadId: null, sources: [], mode: 'evidence' as const };
}
