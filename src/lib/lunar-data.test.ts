import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { parseHorizons, summarizeHorizon } from "./lunar-data";

describe("Authentic lunar data boundaries", () => {
  it("parses Horizons source values exactly", () => {
    const result = parseHorizons("$$SOE\n 2026-Nov-08 00:00, ,i, 286.180012, 70.580715,\n$$EOE");
    assert.deepEqual(result, [{ time: "2026-Nov-08 00:00", azimuth: 286.180012, elevation: 70.580715 }]);
  });
  it("rejects missing or invalid measurements without fabricating a replacement", () => {
    assert.deepEqual(parseHorizons("$$SOE\n2026-Nov-08 00:00, ,i, , ,\n2026-Nov-08 01:00, ,i, 300, 91,\n$$EOE"), []);
    assert.throws(() => parseHorizons("Service unavailable"));
  });
  it("converts authentic Horizons range from AU to kilometers", () => {
    const samples = parseHorizons("$$SOE\n2026-Nov-08 00:00, ,i, 286.180012, 70.580715, 0.00262125727050, 0.0373479,\n$$EOE");
    assert.equal(samples[0]?.rangeKm, 0.00262125727050 * 149597870.7);
  });
  it("reports a sampled setting bracket, not an exact predicted time", () => {
    const samples = [4, 2, -1].map((elevation) => ({ time: "source timestamp", azimuth: 100, elevation }));
    assert.equal(summarizeHorizon(samples, 0).setting, "1–2 h");
    assert.equal(summarizeHorizon(samples, 0).above, 2);
  });
});