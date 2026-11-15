import { expect, it } from 'vitest';
import snapshot from '@/assets/lunar-reference-snapshot.json';
import type { LunarResult } from './lunar-data';
import { planningReport, readableReport, safeCsvText } from './planning-report';
it('retains historical provenance in exports', () => {
  const report = planningReport(snapshot as LunarResult, null, null);
  expect(report.retrievalMode).toBe('لقطة مرجعية تاريخية');
  expect(report.retrievedAt).toBe(snapshot.retrievedAt);
});
it('escapes untrusted scenario names in downloaded HTML', () => {
  const report = planningReport(
    {
      ...snapshot,
      scenario: { ...snapshot.scenario, name: '<script>alert(1)</script>' },
    } as LunarResult,
    null,
    null,
  );
  expect(readableReport(report)).not.toContain('<script>');
});
it('neutralizes spreadsheet formulas without changing authentic timestamps', () => {
  expect(safeCsvText('=HYPERLINK("x")')).toBe('\'=HYPERLINK("x")');
  expect(safeCsvText('2026-Nov-14 06:00')).toBe('2026-Nov-14 06:00');
});
