import type { LiveAnswer, SearchHit, SearchMatches } from './atlassian.js';

const stopWords = new Set([
  'about', 'and', 'are', 'can', 'does', 'for', 'from', 'how', 'into', 'its', 'our',
  'owner', 'owns', 'responsible', 'squad', 'team', 'the', 'their', 'this', 'what',
  'when', 'where', 'which', 'who', 'with', 'hvem', 'hva', 'hvilken', 'eier', 'ansvarlig',
]);
const ownerQuestion = /\b(?:who owns|owner(?:ship)?|responsible for|eier|eies av|ansvarlig)\b/i;
const ownerCue = /\b(?:owns|owned by|owner|responsible for|maintained by|eier|eies av|ansvarlig)\b/i;
const uncertainOwner = /\b(?:unknown|unconfirmed|unclear|unassigned|tbd|not|no longer|ukjent|uavklart)\b/i;

type Candidate = { hit: SearchHit; excerpt: string; score: number; owner?: string; uncertain: boolean; order: number };

function fold(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function cleanSnippet(value: string): string {
  return value.slice(0, 2_000)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(value: string): { text: string; truncated: boolean } {
  if (value.length <= 380) return { text: value, truncated: false };
  const end = value.lastIndexOf(' ', 380);
  return { text: `${value.slice(0, end > 80 ? end : 380).trimEnd()}…`, truncated: true };
}

function ownerNamedIn(value: string): string | undefined {
  if (uncertainOwner.test(value)) return undefined;
  const after = /\b(?:owned by|maintained by|owner\s*[:=-]|responsible (?:team|squad)\s*[:=-]|eies av)\s+([^.;!?\n]{2,60})/i.exec(value);
  const before = /\b((?:squad|team)\s+[A-ZÆØÅ][\p{L}\p{N} -]{1,40}?)\s+(?:owns|maintains|eier)\b/iu.exec(value);
  const name = (after?.[1] ?? before?.[1])?.trim().replace(/\s+(?:for|in|on)\s+.*$/i, '');
  return name && !/\b(?:and|og)\b|&/i.test(name) ? name : undefined;
}

function candidates(question: string, hits: SearchHit[]): Candidate[] {
  const terms = [...new Set(fold(question).split(' ').filter((word) => word.length >= 3 && !stopWords.has(word)))];
  const seekingOwner = ownerQuestion.test(question);
  return hits.flatMap((hit, order) => {
    const cleaned = cleanSnippet(hit.snippet);
    if (!cleaned) return [];
    const titleWords = new Set(fold(hit.title).split(' '));
    const titleMatches = terms.some((term) => titleWords.has(term));
    const fragments = cleaned.split(/(?<=[.!?])\s+(?=[A-ZÆØÅ0-9])|;\s+/u).filter((part) => part.length >= 12);
    const ranked = (fragments.length ? fragments : [cleaned]).map((part) => {
      const words = new Set(fold(part).split(' '));
      const overlap = terms.filter((term) => words.has(term)).length;
      const ownership = seekingOwner && ownerCue.test(part) && (overlap > 0 || titleMatches);
      return { text: part, score: overlap * 2 + (ownership ? 4 : 0), ownership };
    }).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (!best || best.score === 0) return [];
    const selected = excerpt(best.text);
    return [{
      hit,
      excerpt: selected.text,
      score: best.score,
      owner: best.ownership && !selected.truncated ? ownerNamedIn(best.text) : undefined,
      uncertain: best.ownership && uncertainOwner.test(best.text),
      order,
    }];
  }).sort((a, b) => b.score - a.score || a.order - b.order);
}

function caveats(matches: SearchMatches): string[] {
  return [
    matches.hasMore ? 'More search results exist; this covers only the first page.' : '',
    matches.partial ? 'Atlassian reported an incomplete search.' : '',
  ].filter(Boolean);
}

export function composeGroundedAnswer(question: string, matches: SearchMatches): LiveAnswer {
  const base = { mode: 'live-atlassian' as const };
  if (!matches.hits.length) {
    return {
      ...base, state: 'unknown', sources: [],
      answer: ['I found no Jira or Confluence sources matching that question. Try a system or squad name.', ...caveats(matches)].join('\n'),
    };
  }

  const ranked = candidates(question, matches.hits);
  if (!ranked.length) {
    return {
      ...base, state: 'unknown', sources: matches.hits.map((hit) => hit.source),
      answer: ['I found sources, but their search excerpts do not provide enough relevant text to answer. Open the links to check the full context.', ...caveats(matches)].join('\n'),
    };
  }

  const seekingOwner = ownerQuestion.test(question);
  const owned = ranked.filter((candidate): candidate is Candidate & { owner: string } =>
    typeof candidate.owner === 'string' && candidate.owner.length > 0,
  );
  const distinctOwners = new Map<string, Candidate>();
  for (const candidate of owned) {
    const key = fold(candidate.owner).replace(/^(team|squad) /, '');
    if (!distinctOwners.has(key)) distinctOwners.set(key, candidate);
  }
  const conflict = distinctOwners.size > 1;
  const uncertain = ranked.some((candidate) => candidate.uncertain);
  const selected: Candidate[] = [];
  const leading = seekingOwner
    ? [...(conflict ? distinctOwners.values() : owned), ...ranked.filter((candidate) => candidate.uncertain)]
    : [];
  for (const candidate of [...leading, ...ranked]) {
    if (!selected.includes(candidate)) selected.push(candidate);
    if (selected.length === 3) break;
  }
  const sources = selected.map((candidate) => candidate.hit.source);
  const ownerReference = owned.length ? selected.indexOf(owned[0]) + 1 : 0;
  const introduction = seekingOwner
    ? conflict
      ? 'The search excerpts disagree about ownership; I cannot name a confirmed owner.'
      : uncertain
        ? 'The search excerpts leave ownership uncertain. Here is what they actually say:'
        : owned.length
          ? `Sigh. The available excerpt names ${owned[0].owner} as an owner [${ownerReference}]. Check its context:`
          : 'I cannot confirm an owner from these search excerpts. The closest evidence says:'
    : 'Sigh. Here is what the matching sources actually say:';
  const findings = selected.map((candidate, index) => `“${candidate.excerpt}” [${index + 1}]`);
  return {
    ...base,
    answer: [introduction, ...findings, ...caveats(matches)].join('\n'),
    sources,
    state: seekingOwner && (conflict || uncertain || !owned.length) ? 'unknown' : 'sources',
  };
}
