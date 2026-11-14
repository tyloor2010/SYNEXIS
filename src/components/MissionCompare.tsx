import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, FileText, Trash2, Moon, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanningPage } from "./PlanningPage";
import { usePlanning } from "./PlanningProvider";
import { useLunarTerrain } from "@/hooks/use-lunar-terrain";
import { useSiteHorizon } from "./TerrainPanel";
import {
  powerFields,
  parsePowerInputs,
  powerBudget,
  sizeMission,
  visibilityWindow,
} from "@/lib/lunar-planning";
import { downloadReport, planningReport, readableReport, csvReport } from "@/lib/planning-report";
import type { LunarResult } from "@/lib/lunar-data";
import type { TerrainGrid } from "@/lib/lunar-terrain";
import { VehiclePrediction } from './VehiclePrediction';

function Scenario({
  result,
  grid,
  inputs,
  onRemove,
}: {
  result: LunarResult;
  grid: TerrainGrid | null;
  inputs: Record<string, string>;
  onRemove: () => void;
}) {
  const { horizon, calculating } = useSiteHorizon(
    grid,
    result.scenario.latitude,
    result.scenario.longitude,
    result.scenario.observerHeightM ?? 0,
  );
  const specs = parsePowerInputs(inputs),
    sun = visibilityWindow(result.sun, horizon),
    earth = visibilityWindow(result.earth, horizon);
  const budget = useMemo(() => {
    const valid = parsePowerInputs(inputs);
    return valid ? powerBudget(result, horizon, valid) : null;
  }, [inputs, result, horizon]);
  const sizing = useMemo(() => {
    const valid = parsePowerInputs(inputs);
    return valid ? sizeMission(result, horizon, valid) : null;
  }, [inputs, result, horizon]);
  const [printError, setPrintError] = useState("");
  const print = () => {
    const page = window.open("", "_blank");
    if (!page) {
      setPrintError("Allow the report window, or download Report and print it from your browser.");
      return;
    }
    page.opener = null;
    page.document.write(readableReport(report()));
    page.document.close();
    page.focus();
    page.print();
    setPrintError("");
  };
  const report = () => planningReport(result, horizon, specs);
  return (
    <article className="min-w-0 border border-border p-5">
      <VehiclePrediction result={result} horizon={horizon} />
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-soft text-xl font-bold">{result.scenario.name}</h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Remove ${result.scenario.name}`}
          title="Remove scenario"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {result.scenario.date} · {result.scenario.startHour ?? 0}:00 UTC
        <br />
        {result.scenario.latitude.toFixed(4)}°N, {result.scenario.longitude.toFixed(4)}°E
        <br />
        {result.sun.length - 1} h mission
      </p>
      <p role="status" className="mt-4 text-xs font-bold">
        {calculating
          ? "Calculating terrain…"
          : horizon
            ? "15 km LOLA horizon"
            : "Terrain unavailable · spherical only"}
      </p>
      <dl className="mt-5 grid gap-4">
        {[
          ["Sunlight duration", `${sun.hours.toFixed(1)} h`],
          ["Earth-visible duration", `${earth.hours.toFixed(1)} h`],
          [
            "Next sunset from landing",
            sun.nextSetting
              ? `${sun.nextSetting.earliestHours}–${sun.nextSetting.latestHours} h`
              : sun.currentlyVisible
                ? "No crossing in window"
                : "Below horizon at landing",
          ],
          [
            "Next Earth interruption",
            earth.nextSetting
              ? `${earth.nextSetting.earliestHours}–${earth.nextSetting.latestHours} h`
              : earth.currentlyVisible
                ? "No crossing in window"
                : "Below horizon at landing",
          ],
          ["Energy demand", budget ? `${budget.demandWh.toFixed(1)} Wh` : "Needs mission inputs"],
          ["Modeled generation", budget ? `${budget.generatedWh.toFixed(1)} Wh` : "—"],
          [
            "Required battery, array fixed",
            !specs || !horizon
              ? "Needs mission inputs and terrain"
              : sizing?.requiredBatteryWh !== null && sizing?.requiredBatteryWh !== undefined
                ? `${sizing.requiredBatteryWh.toFixed(0)} Wh`
                : "No bounded solution",
          ],
          [
            "Required array, battery fixed",
            !specs || !horizon
              ? "Needs mission inputs and terrain"
              : sizing?.requiredArrayM2 !== null && sizing?.requiredArrayM2 !== undefined
                ? `${sizing.requiredArrayM2.toFixed(2)} m²`
                : "No bounded solution",
          ],
          [
            "Minimum battery charge",
            budget && specs
              ? `${((budget.minChargeWh / specs.capacityWh) * 100).toFixed(1)}%`
              : "—",
          ],
          [
            "Energy shortfall at reserve",
            budget ? `${budget.deficitWh.toFixed(1)} Wh · battery-side` : "—",
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-soft text-lg font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-border pt-4 text-sm font-bold">
        Power screening: {budget?.status ?? "insufficient data"}
      </p>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        {!specs
          ? "All twelve mission inputs are required."
          : !horizon
            ? "Complete terrain coverage is required for screening."
            : budget && budget.deficitWh > 0
              ? "Modeled demand exceeds generation plus usable stored energy during this window."
              : "Battery remains at or above the requested reserve in this model."}{" "}
        Sizing varies one input at a time, holding all others fixed. Communications visibility is
        reported separately; no mission-safety verdict.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={calculating}
          onClick={() =>
            downloadReport("SYNEXIS-scenario-report.html", readableReport(report()), "text/html")
          }
        >
          <FileText />
          Report
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={calculating}
          onClick={() =>
            downloadReport(
              "SYNEXIS-scenario-data.json",
              JSON.stringify(report(), null, 2),
              "application/json",
            )
          }
        >
          <Download />
          Data
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={calculating}
          onClick={() =>
            downloadReport("SYNEXIS-scenario-samples.csv", csvReport(report()), "text/csv")
          }
        >
          <Download />
          CSV
        </Button>
        <Button size="sm" variant="outline" disabled={calculating} onClick={print}>
          <Printer />
          PDF
        </Button>
      </div>
      {printError && (
        <p role="alert" className="mt-3 text-xs text-muted-foreground">
          {printError}
        </p>
      )}
    </article>
  );
}
export function MissionCompare() {
  const { saved, current, save, remove } = usePlanning();
  const { grid, error } = useLunarTerrain(saved.some(s => s.scenario.latitude < -85 && s.scenario.latitude > -88.5));
  const [inputs, setInputs] = useState<Record<string, string>>({});
  return (
    <PlanningPage title="Compare the mission." eyebrow="03 / Scenarios & requirements">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {saved.length} / 4 scenarios · saved on this browser only
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!current || saved.length >= 4}
            onClick={() => {
              if (current) save(current);
            }}
          >
            <Plus />
            Add current scenario
          </Button>
          <Button asChild>
            <Link to="/explorer">
              <Moon />
              Navigator
            </Link>
          </Button>
        </div>
      </div>
      <details open className="mt-7 border-y border-border py-5">
        <summary className="cursor-pointer font-soft text-xl font-bold">
          Power & battery requirements
        </summary>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {powerFields.map(([key, label]) => (
            <label key={key} className="lunar-label">
              {label}
              <input
                aria-label={label}
                type="number"
                step="any"
                value={inputs[key] ?? ""}
                onChange={(event) => setInputs((v) => ({ ...v, [key]: event.target.value }))}
                className="lunar-input"
              />
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {parsePowerInputs(inputs)
            ? "Mission inputs valid. Applied equally to every scenario."
            : "Enter all mission specifications with valid units and percentages. No equipment assumptions are supplied."}
        </p>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          Constant load and fixed panel orientation; array output from supplied irradiance × area ×
          efficiency × incidence, with supplied losses. Hourly JPL positions, minute integration of
          interpolated power. No thermal, degradation, maximum charging rate or power-electronics
          model.
        </p>
      </details>
      {error && (
        <p role="alert" className="mt-4 text-xs">
          {error}
        </p>
      )}
      {saved.length ? (
        <div className="mt-7 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {saved.map((result, index) => (
            <Scenario
              key={`${result.scenario.date}-${index}`}
              result={result}
              grid={grid}
              inputs={inputs}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      ) : (
        <div className="border-b border-border py-12">
          <h2 className="font-soft text-2xl font-bold">No scenarios saved.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Evaluate a location and date in Navigator, then add its retrieved results.
          </p>
        </div>
      )}
      <p className="mt-6 text-[10px] text-muted-foreground">
        Report includes mission inputs, source hashes, retrieval time, interval estimates and
        limitations. Open the downloaded report and use your browser’s print dialog to save a PDF.
      </p>
    </PlanningPage>
  );
}
