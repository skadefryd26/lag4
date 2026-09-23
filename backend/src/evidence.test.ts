import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answerQuestion, findSquad, type Evidence, type Squad } from './evidence.js';

const squad = (id: string, name: string, aliases: string[] = []): Squad => ({
  id, name, aliases, tagline: '', mission: 'Handles fictional claims.', domain: 'Fictional claims',
  apps: [], systems: [], work: ['Review test applications'], leaders: [`${name} contact`],
  contacts: [], refs: ['guide'], conflicts: [],
});

// Synthetic data means contributors can run these tests without the ignored internal snapshot.
const evidence: Evidence = {
  asOf: '2026-09-23',
  sources: [
    { id: 'guide', kind: 'confluence', title: 'Fictional guide', url: 'https://example.com/guide', updated: '2026-09-23' },
    { id: 'reviewers', kind: 'github', title: 'Fictional reviewers', url: 'https://example.com/reviewers', updated: 'unknown' },
  ],
  squads: [squad('cash', 'Cash', ['Edo']), squad('communication', 'Claims Communication', ['Newton', 'CF']), squad('new', 'New')],
  ownership: [
    { term: 'claims-selector', squad: 'new', state: 'supported', explanation: 'Verified by the fictional guide.', refs: ['guide'] },
    { term: 'claim-overview', squad: null, state: 'unclear', explanation: 'Two possible reviewers; owner not confirmed.', refs: ['guide', 'reviewers'] },
  ],
};

test('squad aliases resolve to canonical names without confusing incidental words', () => {
  assert.equal(findSquad(evidence, 'Edo')?.name, 'Cash');
  assert.equal(answerQuestion(evidence, 'Who do I contact in Newton?').squadId, 'communication');
  assert.equal(answerQuestion(evidence, 'What is Edo working on?').squadId, 'cash');
  assert.equal(answerQuestion(evidence, 'What is CF working on?').squadId, 'communication');
  assert.equal(answerQuestion(evidence, 'Is this claim new?').state, 'unknown');
});

test('unclear and unsupported ownership never becomes a confident claim', () => {
  const ambiguous = answerQuestion(evidence, 'Who owns claim-overview?');
  assert.equal(ambiguous.state, 'unclear');
  assert.equal(ambiguous.squadId, null);
  assert.ok(ambiguous.sources.some((source) => source.id === 'reviewers'));
  assert.equal(answerQuestion(evidence, 'Who owns nonexistent-service?').state, 'unknown');
  assert.equal(answerQuestion(evidence, 'Who owns claims-selector?').squadId, 'new');
});
