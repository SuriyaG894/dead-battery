import { describe, expect, it } from 'vitest';
import { EVIDENCE } from '../src/content/evidence';
import { TRIGGERS } from '../src/content/triggers';
import { CALLS } from '../src/content/calls';
import { HINTS } from '../src/content/hints';
import { MAP_PINS, MEMOS, NOTES, PHOTOS, SEARCHES } from '../src/content/media';
import { buildInitialThreads } from '../src/content/threads';
import type { Action, Condition } from '../src/types';

/** Every place a piece of evidence can be pinned from. */
function evidenceSources(): string[] {
  const out: string[] = ['ev_sam_signature']; // contract zoom panel
  for (const p of PHOTOS) if (p.evidence) out.push(p.evidence);
  for (const p of MAP_PINS) if (p.evidence) out.push(p.evidence);
  for (const n of NOTES) if (n.evidence) out.push(n.evidence);
  for (const m of MEMOS) if (m.evidence) out.push(m.evidence);
  for (const s of SEARCHES) if (s.evidence) out.push(s.evidence);
  for (const msgs of Object.values(buildInitialThreads(0))) for (const m of msgs) if (m.evidence) out.push(m.evidence);
  return out;
}

function conditionKeys(c: Condition, out: string[] = []): string[] {
  if ('all' in c) c.all.forEach((x) => conditionKeys(x, out));
  else if ('any' in c) c.any.forEach((x) => conditionKeys(x, out));
  else if ('not' in c) conditionKeys(c.not, out);
  else if ('viewed' in c) out.push(c.viewed);
  return out;
}

function actionsOf(list: Action[], out: Action[] = []): Action[] {
  for (const a of list) {
    out.push(a);
    if (a.type === 'replies') a.choices.forEach((c) => actionsOf(c.then, out));
  }
  return out;
}

describe('content integrity', () => {
  it('every evidence item can be found somewhere', () => {
    const sources = new Set(evidenceSources());
    for (const id of Object.keys(EVIDENCE)) expect(sources, id).toContain(id);
  });

  it('every referenced evidence id exists', () => {
    for (const id of evidenceSources()) expect(EVIDENCE[id], id).toBeDefined();
  });

  it('each correct board answer has at least 2 independent sources', () => {
    const sources = evidenceSources();
    for (const [cat, value] of [
      ['who', 'sam'],
      ['where', 'lighthouse'],
      ['why', 'data'],
    ]) {
      const n = sources.filter((id) => EVIDENCE[id].category === cat && EVIDENCE[id].value === value).length;
      expect(n, `${cat}=${value}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('trigger ids are unique', () => {
    const ids = TRIGGERS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('photo views referenced by triggers exist', () => {
    const photoIds = new Set(PHOTOS.map((p) => p.id));
    for (const t of TRIGGERS)
      for (const key of conditionKeys(t.when))
        if (key.startsWith('photo:')) expect(photoIds, key).toContain(key.slice(6));
  });

  it('every call used by a trigger is defined', () => {
    for (const t of TRIGGERS)
      for (const a of actionsOf(t.do)) if (a.type === 'call') expect(CALLS[a.callId], a.callId).toBeDefined();
  });

  it('every puzzle has 3 hint tiers', () => {
    for (const h of Object.values(HINTS)) expect(h.tiers).toHaveLength(3);
  });

  it('story progress never waits on idle time (active players reset it forever)', () => {
    const byId = new Map(TRIGGERS.map((t) => [t.id, t]));
    const progresses = (t: (typeof TRIGGERS)[number]) =>
      actionsOf(t.do).some(
        (a) =>
          a.type === 'call' ||
          a.type === 'advanceChapter' ||
          (a.type === 'setFlag' && ['finalUnlocked', 'mayaRevealed'].includes(a.key)),
      );
    const firedRefs = (c: Condition, out: string[] = []): string[] => {
      if ('all' in c) c.all.forEach((x) => firedRefs(x, out));
      else if ('any' in c) c.any.forEach((x) => firedRefs(x, out));
      else if ('not' in c) firedRefs(c.not, out);
      else if ('fired' in c) out.push(c.fired);
      return out;
    };
    const usesIdle = (c: Condition): boolean =>
      'all' in c ? c.all.some(usesIdle) : 'any' in c ? c.any.some(usesIdle) : 'not' in c ? usesIdle(c.not) : 'idleSec' in c;

    // Progression triggers plus every trigger they depend on.
    const queue = TRIGGERS.filter(progresses).map((t) => t.id);
    const critical = new Set<string>();
    while (queue.length) {
      const id = queue.pop()!;
      if (critical.has(id)) continue;
      critical.add(id);
      const t = byId.get(id);
      if (t) queue.push(...firedRefs(t.when));
    }
    expect(critical.size).toBeGreaterThan(3);
    for (const id of critical) expect(usesIdle(byId.get(id)!.when), id).toBe(false);
  });
});
