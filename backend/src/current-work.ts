import type { LiveAnswer, LiveSource } from './atlassian.js';

export type WorkPhase = 'active' | 'planned';
export type WorkQuestion = { subject: string; focus?: string; system?: 'GoTrex' | 'GoTreks' };
export type JiraProject = { key: string; name: string };
export type WorkItem = { key: string; summary: string; description?: string; updatedAt: number; issueType: string; phase: WorkPhase };
export type ParsedWorkItems = { items: WorkItem[]; incomplete: boolean };
export type SafeWorkFact = { phase: WorkPhase; topic: string; objective: string; refs: number[] };
export type WorkEvidence = {
  projectKey: string;
  focus?: string;
  facts: SafeWorkFact[];
  sources: LiveSource[];
  activeCount: number;
  plannedCount: number;
  limited: boolean;
};

const topicRules = [
  { id: 'expenses', topic: 'expense handling', pattern: /expens|utlegg|kostnad|refusjon|reimburse|refund/i },
  { id: 'assistance', topic: 'assistance coordination', pattern: /assist|travel|reise|medical|health|helse|provider|partner/i },
  { id: 'communication', topic: 'customer communication', pattern: /communicat|kommunika|message|chat|email|contact|sms|brev|notification|vars|mail/i },
  { id: 'documents', topic: 'document handling', pattern: /document|dokumen|file|upload|image|bilde|ocr/i },
  { id: 'integration', topic: 'system integrations', pattern: /integrat|\bapi\b|webhook|platform|migrat/i },
  { id: 'automation', topic: 'workflow automation', pattern: /automat|rule|regel|decision|vurder|\bai\b|model|rout|triage/i },
  { id: 'payment', topic: 'payments and settlements', pattern: /payment|oppgjør|betaling|settlement/i },
  { id: 'reporting', topic: 'reporting and dashboards', pattern: /report|rapport|dashboard|analytics|insight/i },
  { id: 'experience', topic: 'forms and user experience', pattern: /design|\bux\b|\bui\b|form|skjema|self.service|selvbetj|usabil/i },
  { id: 'workflow', topic: 'claims-handling workflows', pattern: /workflow|process|case|sak|status|task|saks|behandl/i },
] as const;

function normalized(value: string): string {
  return value.toLocaleLowerCase('en').normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function parseWorkQuestion(question: string): WorkQuestion | undefined {
  const pattern = /^(?:what\s+)?(?:(?:is|are)\s+)?(?:the\s+)?(?:(?:squad|swuad|team)\s+)?([\p{L}][\p{L}\p{N}\s-]{1,48}?)\s+(?:(?:is|are)\s+)?(?:(?:currently|right now)\s+)?(?:working on|doing|building|focused on|planning)\b/iu;
  const priorities = /^what\s+(?:are|is)\s+(?:the\s+)?(?:current\s+)?(?:priorities|work)\s+(?:for|of)\s+(?:(?:squad|team)\s+)?([\p{L}][\p{L}\p{N}\s-]{1,48})/iu;
  const subject = (pattern.exec(question.trim()) ?? priorities.exec(question.trim()))?.[1]?.trim().replace(/\s+(?:is|are)$/i, '');
  if (!subject) return undefined;
  const focus = topicRules.find((rule) => rule.pattern.test(question) && !rule.pattern.test(subject))?.id;
  const system = /\bgo[\s-]?trex\b/i.test(question) ? 'GoTrex'
    : /\bgo[\s-]?treks\b/i.test(question) ? 'GoTreks' : undefined;
  return { subject, ...(focus ? { focus } : {}), ...(system ? { system } : {}) };
}

export function selectJiraProject(values: unknown, subject: string): JiraProject | undefined {
  if (!Array.isArray(values)) throw new Error('Jira did not return a project list.');
  const projects = values.filter((value): value is JiraProject =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
    && 'key' in value && typeof value.key === 'string'
    && 'name' in value && typeof value.name === 'string',
  );
  const target = normalized(subject);
  const byKey = projects.filter((project) => normalized(project.key) === target);
  const byName = projects.filter((project) => normalized(project.name) === target);
  const matches = byKey.length ? byKey : byName;
  if (matches.length !== 1) return undefined;
  const project = matches[0];
  if (!/^[A-Z][A-Z0-9_]{1,15}$/.test(project.key)) {
    throw new Error('Jira returned an invalid project key.');
  }
  return { key: project.key, name: project.name };
}

export function parseJiraWorkItems(values: unknown, projectKey: string, phase: WorkPhase): ParsedWorkItems {
  if (!Array.isArray(values)) throw new Error('Jira did not return work items.');
  const items: WorkItem[] = [];
  let incomplete = false;
  for (const value of values) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      incomplete = true;
      continue;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.key !== 'string' || !record.key.startsWith(`${projectKey}-`) || !/^[A-Z][A-Z0-9_]{1,15}-[1-9][0-9]*$/.test(record.key)) {
      throw new Error('Jira returned a work item outside the selected project.');
    }
    const fields = record.fields;
    if (typeof fields !== 'object' || fields === null || Array.isArray(fields)) {
      incomplete = true;
      continue;
    }
    const entry = fields as Record<string, unknown>;
    const status = entry.status;
    const category = typeof status === 'object' && status !== null && !Array.isArray(status)
      ? (status as Record<string, unknown>).statusCategory : undefined;
    const categoryValue = typeof category === 'object' && category !== null && !Array.isArray(category)
      ? ((category as Record<string, unknown>).key ?? (category as Record<string, unknown>).name) : undefined;
    const categoryName = typeof categoryValue === 'string' ? normalized(categoryValue) : '';
    const validPhase = phase === 'active'
      ? categoryName === 'indeterminate' || categoryName === 'in progress'
      : categoryName === 'new' || categoryName === 'to do';
    if (!validPhase || typeof entry.summary !== 'string' || !entry.summary.trim() || typeof entry.updated !== 'string') {
      incomplete = true;
      continue;
    }
    const updatedAt = Date.parse(entry.updated);
    if (!Number.isFinite(updatedAt)) {
      incomplete = true;
      continue;
    }
    const type = entry.issuetype;
    const issueType = typeof type === 'object' && type !== null && !Array.isArray(type)
      ? (type as Record<string, unknown>).name : undefined;
    items.push({
      key: record.key,
      summary: entry.summary,
      ...(typeof entry.description === 'string' ? { description: entry.description } : {}),
      updatedAt,
      issueType: typeof issueType === 'string' ? issueType : '',
      phase,
    });
  }
  return { items, incomplete };
}

type TopicRule = (typeof topicRules)[number];
type Group = { rule: TopicRule; phase: WorkPhase; items: WorkItem[] };

function intent(summary: string): 'simplify' | 'build' | 'fix' | 'improve' | 'work' {
  if (/simplif|easier|enklere|forenkl|lettare/i.test(summary)) return 'simplify';
  if (/\b(?:build|implement|add|create|develop|bygge|lage|utvikl|opprett)\b/i.test(summary)) return 'build';
  if (/\b(?:fix|bug|feil|rette|repair)\b/i.test(summary)) return 'fix';
  if (/improv|enhanc|streamlin|bedre|forbedr/i.test(summary)) return 'improve';
  return 'work';
}

function objective(rule: TopicRule, action: ReturnType<typeof intent>): string {
  if (rule.id === 'expenses' && action === 'simplify') return 'making expense handling easier';
  if (action === 'simplify') return `simplifying ${rule.topic}`;
  if (action === 'build') return `building ${rule.topic} features`;
  if (action === 'fix') return `fixing issues in ${rule.topic}`;
  if (action === 'improve') return `improving ${rule.topic}`;
  return `work on ${rule.topic}`;
}

function groups(items: WorkItem[], phase: WorkPhase, focus?: string): Group[] {
  const byTopic = new Map<string, Group>();
  for (const item of items) {
    for (const rule of topicRules.filter((candidate) => candidate.pattern.test(item.summary) && (!focus || candidate.id === focus)).slice(0, 2)) {
      const group = byTopic.get(rule.id) ?? { rule, phase, items: [] };
      group.items.push(item);
      byTopic.set(rule.id, group);
    }
  }
  return [...byTopic.values()].sort((left, right) =>
    right.items.length - left.items.length
    || Math.max(...right.items.map((item) => item.updatedAt)) - Math.max(...left.items.map((item) => item.updatedAt)),
  );
}

export function buildWorkEvidence(projectKey: string, active: WorkItem[], planned: WorkItem[], site: string, focus?: string, limited = false, now = Date.now()): WorkEvidence {
  if (!/^[A-Z][A-Z0-9_]{1,15}$/.test(projectKey)) throw new Error('Invalid Jira project key.');
  const activeGroups = groups(active, 'active', focus).slice(0, 3);
  const plannedGroups = groups(planned.filter((item) => item.updatedAt >= now - 90 * 86_400_000), 'planned', focus)
    .filter((group) => focus || !activeGroups.some((activeGroup) => activeGroup.rule.id === group.rule.id))
    .slice(0, focus || !activeGroups.length ? 2 : 1);
  const sources: LiveSource[] = [];
  const indexes = new Map<string, number>();
  const facts = [...activeGroups, ...plannedGroups].map((group): SafeWorkFact => {
    const ranked = [...group.items].sort((left, right) => {
      const intentDifference = Number(intent(right.summary) !== 'work') - Number(intent(left.summary) !== 'work');
      return intentDifference
        || Number(/epic/i.test(right.issueType)) - Number(/epic/i.test(left.issueType))
        || right.updatedAt - left.updatedAt;
    });
    const representative = ranked[0];
    const goal = objective(group.rule, intent(representative.summary));
    const matchingGoal = ranked.filter((item) => objective(group.rule, intent(item.summary)) === goal).slice(0, 1);
    const refs = matchingGoal.map((item) => {
      let index = indexes.get(item.key);
      if (!index) {
        index = sources.length + 1;
        sources.push({ kind: 'jira', title: `Jira ${item.key}`, url: `${new URL(site).origin}/browse/${item.key}` });
        indexes.set(item.key, index);
      }
      return index;
    });
    return { phase: group.phase, topic: group.rule.topic, objective: goal, refs };
  });
  if (!facts.length) {
    for (const item of [...active, ...planned].slice(0, 3)) {
      sources.push({ kind: 'jira', title: `Jira ${item.key}`, url: `${new URL(site).origin}/browse/${item.key}` });
    }
  }
  return { projectKey, ...(focus ? { focus } : {}), facts, sources, activeCount: active.length, plannedCount: planned.length, limited };
}

export function buildSystemWorkEvidence(projectKey: string, active: WorkItem[], planned: WorkItem[], site: string, system: 'GoTrex' | 'GoTreks', now = Date.now()): WorkEvidence {
  const mentioned = /\bgo[\s-]?tre(?:x|ks)\b/i;
  const replace = /(?:replac|erstat|migrat|utfase|phase out)[^.!?\n]{0,180}\bgo[\s-]?tre(?:x|ks)\b|\bgo[\s-]?tre(?:x|ks)\b[^.!?\n]{0,180}(?:replac|erstat|migrat|utfase|phase out)/i;
  const relevant = (items: WorkItem[], limit: number) => items
    .filter((item) => mentioned.test(`${item.summary} ${item.description ?? ''}`))
    .sort((left, right) => Number(replace.test(`${right.summary} ${right.description ?? ''}`)) - Number(replace.test(`${left.summary} ${left.description ?? ''}`)) || right.updatedAt - left.updatedAt)
    .slice(0, limit);
  const selected = [...relevant(active, 3), ...relevant(planned.filter((item) => item.updatedAt >= now - 90 * 86_400_000), 2)];
  const sources: LiveSource[] = [];
  const facts = selected.map((item): SafeWorkFact => {
    const text = `${item.summary} ${item.description ?? ''}`;
    const replacement = replace.test(text) && !/\b(?:no|not|without|ikke|ingen)\s+(?:planned\s+)?(?:replac|erstat|migrat|utfase)/i.test(text);
    const rule = topicRules.find((topic) => topic.pattern.test(item.summary));
    const detail = replacement ? `replacing ${system}` : rule ? `${objective(rule, intent(item.summary))} related to ${system}` : `technical work involving ${system}`;
    sources.push({ kind: 'jira', title: `Jira ${item.key}`, url: `${new URL(site).origin}/browse/${item.key}` });
    return { phase: item.phase, topic: replacement ? `${system} replacement` : `${system}-related work`, objective: detail, refs: [sources.length] };
  });
  return { projectKey, facts, sources, activeCount: active.length, plannedCount: planned.length, limited: false };
}

export function safeFactsForGateway(evidence: WorkEvidence) {
  return {
    project: evidence.projectKey,
    intent: 'current-work',
    active: evidence.facts.filter((fact) => fact.phase === 'active').map(({ topic, objective: goal, refs }) => ({ topic, goal, refs })),
    planned: evidence.facts.filter((fact) => fact.phase === 'planned').map(({ topic, objective: goal, refs }) => ({ topic, goal, refs })),
  };
}

export function formatWorkAnswer(raw: string, evidence: WorkEvidence): LiveAnswer {
  let data: unknown;
  try {
    data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) as unknown;
  } catch {
    throw new Error('AI gateway did not return a structured answer.');
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error('AI gateway returned an invalid answer.');
  const output = data as Record<string, unknown>;
  const active = output.active;
  const planned = output.planned;
  if (typeof active !== 'string' || typeof planned !== 'string' || active.length > 450 || planned.length > 320) {
    throw new Error('AI gateway returned an invalid answer shape.');
  }
  const factsByPhase = (phase: WorkPhase) => evidence.facts.filter((fact) => fact.phase === phase);
  if ((factsByPhase('active').length === 0 && active.trim()) || (factsByPhase('active').length > 0 && !active.trim())
    || (factsByPhase('planned').length === 0 && planned.trim()) || (factsByPhase('planned').length > 0 && !planned.trim())) {
    throw new Error('AI gateway did not respect active and planned work boundaries.');
  }
  const validate = (text: string, phase: WorkPhase) => {
    if (/https?:\/\/|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b\d{8,}\b/.test(text)) throw new Error('AI gateway returned unsupported personal or source details.');
    const refs = [...text.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]));
    const allowed = new Set(factsByPhase(phase).flatMap((fact) => fact.refs));
    if (refs.some((ref) => !allowed.has(ref)) || (allowed.size > 0 && refs.length === 0)) {
      throw new Error('AI gateway returned ungrounded source references.');
    }
    if (phase === 'active' && !allowed.size && /\b(?:currently working|is building|is developing)\b/i.test(text)) {
      throw new Error('AI gateway called planned work active.');
    }
    if (phase === 'active') {
      const activeTopics = new Set(factsByPhase('active').map((fact) => fact.topic));
      for (const fact of factsByPhase('planned')) {
        const pattern = topicRules.find((rule) => rule.topic === fact.topic)?.pattern;
        const systemReplacement = fact.topic.includes(' replacement') && /replac|erstat|migrat|utfase/i.test(text) && /\bgo[\s-]?tre(?:x|ks)\b/i.test(text);
        if (!activeTopics.has(fact.topic) && (pattern?.test(text) || systemReplacement)) {
          throw new Error('AI gateway attributed planned work to active work.');
        }
      }
    }
  };
  validate(active, 'active');
  validate(planned, 'planned');
  const noActive = evidence.focus
    ? `I could not confirm active ${topicRules.find((rule) => rule.id === evidence.focus)?.topic ?? 'matching'} work for ${evidence.projectKey}.`
    : `I could not confirm active work for ${evidence.projectKey} from the available Jira items.`;
  const answer = [active.trim() || noActive, planned.trim(), evidence.limited ? 'This covers recently updated work; more items may exist.' : ''].filter(Boolean).join(' ');
  if (!answer || answer.length > 900) throw new Error('AI gateway did not return a usable summary.');
  return { answer, sources: evidence.sources, state: 'sources', mode: 'ai-work-summary' };
}
