import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildSystemWorkEvidence, buildWorkEvidence, formatWorkAnswer, parseJiraWorkItems, parseWorkQuestion,
  safeFactsForGateway, selectJiraProject, type WorkItem,
} from './current-work.js';

const date = '2026-09-20T12:00:00.000Z';
const now = Date.parse('2026-09-23T12:00:00.000Z');
const active = (key: string, summary: string, issueType = 'Story'): WorkItem => ({
  key, summary, issueType, phase: 'active', updatedAt: now,
});
const planned = (key: string, summary: string): WorkItem => ({
  key, summary, issueType: 'Epic', phase: 'planned', updatedAt: now,
});

test('resolves work questions without treating ownership questions as current-work queries', () => {
  assert.deepEqual(parseWorkQuestion('What Alarm working on?'), { subject: 'Alarm' });
  assert.deepEqual(parseWorkQuestion('What is squad Alarm doing about expenses?'), { subject: 'Alarm', focus: 'expenses' });
  assert.deepEqual(parseWorkQuestion('Squad Alarm is working on a new program to replace GoTrex'), { subject: 'Alarm', system: 'GoTrex' });
  assert.deepEqual(parseWorkQuestion('Swuad alarm is working on a replacement for gotrex'), { subject: 'alarm', system: 'GoTrex' });
  assert.equal(parseWorkQuestion('Who owns claims-selector?'), undefined);
  assert.equal(parseWorkQuestion('What is Kari@example.invalid working on?'), undefined);
});

test('only selects an exact accessible Jira project and rejects guessed names', () => {
  const projects = [
    { key: 'ALARMTEST', name: 'Alarm Sandbox' },
    { key: 'ALARM', name: 'Alarm' },
  ];
  assert.deepEqual(selectJiraProject(projects, 'Alarm'), { key: 'ALARM', name: 'Alarm' });
  assert.equal(selectJiraProject(projects, 'Alar'), undefined);
  assert.equal(selectJiraProject(projects, 'Unknown Squad'), undefined);
});

test('accepts only work items in the selected project and requested status phase', () => {
  const issues = [
    { key: 'ALARM-1', fields: { summary: 'Simplify fictional expense reports', updated: date, status: { statusCategory: { key: 'indeterminate' } }, issuetype: { name: 'Epic' } } },
    { key: 'ALARM-2', fields: { summary: 'Planned fictional expense reports', updated: date, status: { statusCategory: { key: 'new' } }, issuetype: { name: 'Story' } } },
  ];
  assert.deepEqual(parseJiraWorkItems(issues, 'ALARM', 'active').items.map((item) => item.key), ['ALARM-1']);
  assert.deepEqual(parseJiraWorkItems(issues, 'ALARM', 'planned').items.map((item) => item.key), ['ALARM-2']);
  const namedCategory = { ...issues[0], fields: { ...issues[0].fields, status: { statusCategory: { name: 'In Progress' } } } };
  assert.deepEqual(parseJiraWorkItems([namedCategory], 'ALARM', 'active').items.map((item) => item.key), ['ALARM-1']);
  assert.equal(parseJiraWorkItems([{ key: 'ALARM-3', fields: {} }], 'ALARM', 'active').incomplete, true);
  assert.throws(() => parseJiraWorkItems([{ key: 'OTHER-1', fields: issues[0].fields }], 'ALARM', 'active'), /outside the selected project/);
});

test('abstracts raw summaries to safe topics and separates active from planned expenses', () => {
  const evidence = buildWorkEvidence('ALARM',
    [active('ALARM-1', 'Build assistance case workflows for Kari Example kari@example.invalid', 'Epic')],
    [planned('ALARM-2', 'Make expense reporting easier for Kari Example')],
    'https://example.atlassian.net', undefined, false, now,
  );
  const input = JSON.stringify(safeFactsForGateway(evidence));
  assert.equal(evidence.sources.length, 2);
  assert.match(input, /assistance coordination/);
  assert.match(input, /making expense handling easier/);
  assert.doesNotMatch(input, /Kari|example\.invalid|ALARM-1|ALARM-2|https:\/\//);
  assert.equal(evidence.facts.find((fact) => fact.topic === 'expense handling')?.phase, 'planned');
});

test('renders a concise cited answer but rejects unsupported and misphased claims', () => {
  const evidence = buildWorkEvidence('ALARM',
    [active('ALARM-1', 'Build assistance case workflows', 'Epic')],
    [planned('ALARM-2', 'Make expense reporting easier')],
    'https://example.atlassian.net', undefined, false, now,
  );
  const answer = formatWorkAnswer(JSON.stringify({
    active: 'Alarm is currently building assistance workflows [1].',
    planned: 'Making expense handling easier is planned [2].',
  }), evidence);
  assert.equal(answer.mode, 'ai-work-summary');
  assert.equal(answer.state, 'sources');
  assert.match(answer.answer, /currently building assistance workflows \[1\]/);
  assert.match(answer.answer, /expense handling easier is planned \[2\]/);
  assert.equal(answer.sources.length, 2);

  assert.throws(() => formatWorkAnswer(JSON.stringify({
    active: 'Alarm is currently improving expenses [1].', planned: 'Assistance is planned [2].',
  }), evidence), /planned work to active work/);
  assert.throws(() => formatWorkAnswer(JSON.stringify({
    active: 'Alarm is working on assistance [2].', planned: 'Expense work is planned [1].',
  }), evidence), /ungrounded source references/);
  assert.throws(() => formatWorkAnswer(JSON.stringify({
    active: 'Reach Kari@example.invalid about assistance [1].', planned: 'Expenses are planned [2].',
  }), evidence), /personal or source details/);
});

test('planned-only evidence cannot be described as active work', () => {
  const evidence = buildWorkEvidence('ALARM', [], [planned('ALARM-3', 'Make expense reporting easier')],
    'https://example.atlassian.net', 'expenses', false, now);
  const answer = formatWorkAnswer(JSON.stringify({
    active: '', planned: 'Expense handling improvements are planned [1].',
  }), evidence);
  assert.match(answer.answer, /could not confirm active expense handling/);
  assert.throws(() => formatWorkAnswer(JSON.stringify({
    active: 'Alarm is currently building expense features.', planned: 'Expense handling is planned [1].',
  }), evidence), /boundaries/);
});

test('keeps direct Jira links available when no safe topic can be inferred', () => {
  const evidence = buildWorkEvidence('ALARM', [active('ALARM-9', 'A fictional item with no recognized topic')], [],
    'https://example.atlassian.net', undefined, false, now);
  assert.equal(evidence.facts.length, 0);
  assert.deepEqual(evidence.sources.map((item) => item.url), ['https://example.atlassian.net/browse/ALARM-9']);
  assert.deepEqual(safeFactsForGateway(evidence).active, []);
});

test('adds source-backed GoTrex replacement details without forwarding raw descriptions', () => {
  const evidence = buildSystemWorkEvidence('ALARM',
    [{ ...active('ALARM-7', 'Build a technical assistance workflow'),
      description: 'Replace GoTrex with a new service. Contact Kari Example kari@example.invalid for fictional details.' }],
    [{ ...planned('ALARM-8', 'Review the fictional integration'), description: 'GoTrex is referenced, but no replacement commitment.' }],
    'https://example.atlassian.net', 'GoTrex', now,
  );
  const safe = JSON.stringify(safeFactsForGateway(evidence));
  assert.match(safe, /replacing GoTrex/);
  assert.doesNotMatch(safe, /Kari|example\.invalid|ALARM-7|https:\/\//);
  assert.equal(evidence.facts[0].phase, 'active');
  assert.equal(evidence.facts[1].topic, 'GoTrex-related work');
  assert.deepEqual(evidence.sources.map((item) => item.title), ['Jira ALARM-7', 'Jira ALARM-8']);
});
