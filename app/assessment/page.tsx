"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api/client";
import { loadLocalProfileId, loadLocalProfileSecret, useProfile } from "@/lib/client";
import { getConcept } from "@/lib/genome";
import TableAnswer, { type TableView } from "@/components/table-answer";

// ─────────────────────────────────────────────────────────────────────────────
// A LEARNER-FACING ASSESSMENT PAGE WITH NOTHING TO HIDE.
//
// The page shows the gate before it shows an item. All three real blueprints are
// unreviewed, so the server refuses them and this page says why rather than
// rendering an empty question. When the TEST FIXTURE is enabled (a scratch
// store, a non-production build, an explicit flag), it shows the item with a
// banner that says, in the interface, that this is not teacher approval.
//
// Marking is not re-implemented here. The server returns `gradeStructuredParts`'
// own criteria, and this page prints them. A prose item has no score at all: it
// returns a rubric and advisory observations, and the page labels both.
// ─────────────────────────────────────────────────────────────────────────────

interface BlueprintStatus {
  id: string;
  version: string;
  title: string;
  subject: string;
  level: string;
  reviewStatus: string;
  clearance: { pedagogical: string; rights: string; licensing: string; confidentiality: string };
  servable: boolean;
  reasons: string[];
  items: number;
  marks: number;
}

interface FixtureStatus {
  id: string;
  label: string;
  notTeacherApproval: true;
  itemIds: string[];
}

interface Catalog {
  approved: number;
  blueprints: BlueprintStatus[];
  fixture: FixtureStatus | null;
}

interface PublicPart {
  id: string;
  prompt: string;
  marks: number;
  unit?: string;
  methodPrompt?: string;
  methodMarks?: number;
  response?: "number" | "graph" | "plot" | "readoff" | "algebra" | "table" | "short";
  table?: TableView;
}

interface PublicItem {
  blueprintId: string;
  blueprintVersion: string;
  itemId: string;
  conceptId: string;
  title: string;
  curriculumContext: string;
  marks: number;
  reviewStatus: string;
  clearance: BlueprintStatus["clearance"];
  responseKind: "numeric" | "short-answer" | "table" | "extended-response";
  machineMarkable: boolean;
  parts: PublicPart[];
  rubricCount: number;
  fixture?: { id?: string; label: string; notTeacherApproval: true };
}

interface CriterionResult {
  id: string;
  kind?: string;
  marks: number;
  awarded: number;
  met: boolean;
  why: string;
  misconception?: { id: string; label: string; feedback: string };
}

interface GradeResult {
  awarded: number;
  total: number;
  // The marker's own part shape uses `partId` and carries no prompt: the
  // question is printed above the result. Reading `id` here produced both an
  // empty heading and a React list with no key.
  parts: { partId: string; prompt?: string; awarded: number; marks?: number; total?: number; criteria: CriterionResult[] }[];
}

interface RubricEntry {
  id: string;
  marks: number;
  credit: string;
  acceptable?: string[];
  nonCredit?: string;
  misconception?: { id: string; label: string; feedback: string };
}

interface AssessmentResult {
  itemId: string;
  blueprintId: string;
  responseKind: PublicItem["responseKind"];
  unscored: boolean;
  recorded: boolean;
  score: { awarded: number; total: number } | null;
  grade?: GradeResult;
  rubric?: RubricEntry[];
  advisory?: { id: string; label: string; whyWrong: string; feedback: string; advisory: true }[];
  modelAnswer?: string;
  mastery?: number | null;
  nextStep?: {
    kind: string; conceptId: string; reason: string; why: string; href: string;
    expectedOutcome: string; basis: string;
  } | null;
  notTeacherApproval: boolean;
  fixture: { id?: string; label: string; notTeacherApproval: true } | null;
  note?: string;
}

function FixtureBanner({ item }: { item: PublicItem | null }) {
  if (!item?.fixture) return null;
  return (
    <div className="card" style={{ borderColor: "#b45309", background: "rgba(180, 83, 9, 0.08)" }} role="note">
      <p className="eyebrow" style={{ marginTop: 0 }}>Test fixture — not teacher approval</p>
      <p className="small" style={{ marginBottom: 0 }}>
        This item exists to exercise the assessment path on a scratch store. No teacher has reviewed it,
        no learner trial supports it, and it is not approved to be served as a real assessment.
      </p>
    </div>
  );
}

export default function AssessmentPage() {
  const { state } = useProfile();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [item, setItem] = useState<PublicItem | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [responses, setResponses] = useState<string[]>([]);
  const [working, setWorking] = useState<string[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.assessmentCatalog()
      .then((data) => { if (alive) setCatalog(data as Catalog); })
      .catch(() => { if (alive) setCatalogError("The assessment status could not be read."); });
    return () => { alive = false; };
  }, []);

  const loadItem = useCallback(async (itemId: string, fixture: boolean) => {
    setItemError(null);
    setResult(null);
    setError(null);
    try {
      const data = await api.assessmentItem({
        itemId,
        fixture,
        blueprintId: catalog?.blueprints[0]?.id,
      }) as { item?: PublicItem; error?: string };
      if (!data.item) {
        setItem(null);
        setItemError(data.error ?? "This item is not servable.");
        return;
      }
      const next = data.item;
      setItem(next);
      setResponses(Array.from({ length: Math.max(1, next.parts.length) }, () => ""));
      setWorking(Array.from({ length: Math.max(1, next.parts.length) }, () => ""));
    } catch {
      setItem(null);
      setItemError("This item is not servable on this server.");
    }
  }, [catalog]);

  const setResponse = (index: number, value: string) => {
    setResponses((current) => {
      const copy = [...current];
      copy[index] = value;
      return copy;
    });
  };
  const setWorkingAt = (index: number, value: string) => {
    setWorking((current) => {
      const copy = [...current];
      copy[index] = value;
      return copy;
    });
  };

  const submit = async () => {
    if (!item || !state) return;
    const id = loadLocalProfileId();
    const secret = loadLocalProfileSecret();
    if (!id || !secret) {
      setError("Sign in to submit an assessment response.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await api.submitAssessment({
        id,
        secret,
        blueprintId: item.blueprintId,
        itemId: item.itemId,
        fixture: !!item.fixture,
        responses,
        working,
      });
      setResult(data as AssessmentResult);
    } catch {
      setError("This response could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  const fixtureItems = catalog?.fixture?.itemIds ?? [];
  const approved = catalog?.blueprints.filter((bp) => bp.servable) ?? [];
  const firstRefusal = useMemo(
    () => catalog?.blueprints.find((bp) => !bp.servable) ?? null,
    [catalog],
  );

  return (
    <div className="wrap">
      <p className="eyebrow">Assessment</p>
      <h1>A complete assessment journey, with the gate visible</h1>
      <p className="lede">
        One item, one authored marking scheme, the existing deterministic marker, and the learner&apos;s
        own evidence, mastery and next step. Nothing on this page is a second question engine.
      </p>

      {catalogError ? <p className="notice">{catalogError}</p> : null}

      {catalog ? (
        <div className="card" data-assessment-gate>
          <p className="eyebrow" style={{ marginTop: 0 }}>Serving status</p>
          <p className="small">
            Approved for real learners: <strong>{catalog.approved}</strong>.
            {approved.length === 0 ? " All authored blueprints are refused below." : ""}
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 620 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: "left", padding: 8 }}>Blueprint</th>
                  <th scope="col" style={{ textAlign: "left", padding: 8 }}>Review</th>
                  <th scope="col" style={{ textAlign: "left", padding: 8 }}>Rights</th>
                  <th scope="col" style={{ textAlign: "left", padding: 8 }}>Licensing</th>
                  <th scope="col" style={{ textAlign: "left", padding: 8 }}>Served</th>
                </tr>
              </thead>
              <tbody>
                {catalog.blueprints.map((bp) => (
                  <tr key={bp.id}>
                    <td style={{ padding: 8 }}>
                      <strong>{bp.title}</strong><br />
                      <span className="small">{bp.level} · {bp.items} items / {bp.marks} marks</span>
                    </td>
                    <td style={{ padding: 8 }}>{bp.clearance.pedagogical}</td>
                    <td style={{ padding: 8 }}>{bp.clearance.rights}</td>
                    <td style={{ padding: 8 }}>{bp.clearance.licensing}</td>
                    <td style={{ padding: 8 }}>{bp.servable ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {firstRefusal ? (
            <p className="small" style={{ marginBottom: 0 }}>
              A refused item is not a missing item. The current reason is: {firstRefusal.reasons[0]}
            </p>
          ) : null}
        </div>
      ) : null}

      {catalog?.fixture ? (
        <section style={{ marginTop: 20 }} data-assessment-fixture>
          <div className="card">
            <p className="eyebrow" style={{ marginTop: 0 }}>Test-only journey</p>
            <p className="small">
              The fixture is enabled on this server. It is test data, not an approved assessment.
            </p>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              {fixtureItems.map((id) => (
                <button key={id} className="btn ghost small" onClick={() => loadItem(id, true)} type="button">
                  Open fixture item {id}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <p className="small" style={{ marginTop: 16 }}>
          The test fixture is disabled. A scratch data directory, a non-production server and the
          explicit fixture flag are required to exercise the journey. That flag does not approve any
          blueprint.
        </p>
      )}

      {itemError ? <p className="notice">{itemError}</p> : null}

      {item ? (
        <section style={{ marginTop: 20 }} data-assessment-item>
          <FixtureBanner item={item} />
          <div className="card">
            <p className="eyebrow" style={{ marginTop: 0 }}>
              {item.title} · {item.itemId} · {item.marks} marks
            </p>
            <p className="small">{item.curriculumContext}</p>
            <p className="small">
              Review status: <strong>{item.reviewStatus}</strong>. Rights: {item.clearance.rights}.
              Licensing: {item.clearance.licensing}. Marks are awarded by the existing structured marker.
            </p>

            {item.responseKind === "extended-response" ? (
              <label className="field">
                <span>{item.parts[0]?.prompt ?? "Your explanation"}</span>
                <textarea
                  rows={6}
                  value={responses[0] ?? ""}
                  onChange={(event) => setResponse(0, event.target.value)}
                  placeholder="Explain the reasoning in your own words."
                />
              </label>
            ) : item.parts.map((part, index) => (
              <div key={part.id} style={{ marginTop: 14 }}>
                <p style={{ fontWeight: 600 }}>{part.prompt}</p>
                <p className="small">
                  {part.marks} mark{part.marks === 1 ? "" : "s"}
                  {part.unit ? ` · answer in ${part.unit}` : ""}
                </p>
                {part.response === "table" && part.table ? (
                  <TableAnswer
                    table={part.table}
                    value={responses[index] ?? ""}
                    onChange={(next) => setResponse(index, next)}
                    label={`${item.itemId} table`}
                  />
                ) : part.response === "short" ? (
                  <textarea
                    rows={3}
                    value={responses[index] ?? ""}
                    onChange={(event) => setResponse(index, event.target.value)}
                    aria-label={`${item.itemId} response ${index + 1}`}
                  />
                ) : (
                  <input
                    type="text"
                    value={responses[index] ?? ""}
                    onChange={(event) => setResponse(index, event.target.value)}
                    aria-label={`${item.itemId} response ${index + 1}`}
                    placeholder="Your answer"
                  />
                )}
                {part.methodPrompt ? (
                  <label className="field" style={{ marginTop: 8 }}>
                    <span>{part.methodPrompt} ({part.methodMarks} mark{part.methodMarks === 1 ? "" : "s"})</span>
                    <textarea
                      rows={3}
                      value={working[index] ?? ""}
                      onChange={(event) => setWorkingAt(index, event.target.value)}
                      placeholder="Show the calculation, not only the answer."
                    />
                  </label>
                ) : null}
              </div>
            ))}

            {error ? <p className="notice">{error}</p> : null}
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn" type="button" onClick={submit} disabled={busy || !state}>
                {busy ? "Submitting…" : "Submit for marking"}
              </button>
              {!state ? <span className="small">Sign in to record evidence.</span> : null}
            </div>
          </div>
        </section>
      ) : null}

      {result ? (
        <section style={{ marginTop: 20 }} data-assessment-result>
          <div className="card">
            <p className="eyebrow" style={{ marginTop: 0 }}>
              {result.unscored ? "Rubric returned — no machine score" : `Marked ${result.score?.awarded} / ${result.score?.total}`}
            </p>
            {result.unscored ? (
              <>
                <p className="small">
                  Prose is not scored by vocabulary. <strong>Recorded as answer evidence: no.</strong>{" "}
                  {result.note}
                </p>
                <h2>Marking rubric</h2>
                <ol>
                  {(result.rubric ?? []).map((criterion) => (
                    <li key={criterion.id} style={{ marginBottom: 8 }}>
                      <strong>{criterion.marks} mark{criterion.marks === 1 ? "" : "s"}:</strong> {criterion.credit}
                      {criterion.acceptable?.length ? (
                        <div className="small">Acceptable: {criterion.acceptable.join("; ")}</div>
                      ) : null}
                      {criterion.misconception ? (
                        <div className="small">Watch for: {criterion.misconception.label}</div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <>
                <p className="small">
                  Recorded as an <code>assessment</code> evidence event. Mastery:{" "}
                  {typeof result.mastery === "number" ? `${Math.round(result.mastery * 100)}%` : "not measured"}.
                </p>
                {(result.grade?.parts ?? []).map((part) => (
                  <div key={part.partId} style={{ marginTop: 12 }}>
                    <h2 style={{ marginBottom: 6 }}>{part.prompt ?? part.partId}</h2>
                    {part.criteria.map((criterion) => (
                      <div key={criterion.id} style={{ marginBottom: 8 }}>
                        <strong>
                          {criterion.awarded}/{criterion.marks} {criterion.met ? "awarded" : "not awarded"}:
                        </strong>{" "}
                        {criterion.why}
                        {criterion.misconception ? (
                          <div className="small">
                            This response matches a named slip: {criterion.misconception.label}.{" "}
                            {criterion.misconception.feedback}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}

            {result.advisory?.length ? (
              <div style={{ marginTop: 12 }} data-advisory>
                <h2>Advisory observations</h2>
                <p className="small">These explain a response. They are not marks.</p>
                {result.advisory.map((entry) => (
                  <p key={entry.id} className="small">
                    <strong>{entry.label}.</strong> {entry.feedback}
                  </p>
                ))}
              </div>
            ) : null}

            {result.modelAnswer ? (
              <div style={{ marginTop: 12 }}>
                <h2>Model answer</h2>
                <p>{result.modelAnswer}</p>
              </div>
            ) : null}

            {result.nextStep ? (
              <div style={{ marginTop: 12 }} data-assessment-next>
                <h2>Next step</h2>
                <p>
                  <strong>{result.nextStep.kind}</strong> · {getConcept(result.nextStep.conceptId)?.title ?? result.nextStep.conceptId}
                </p>
                <p className="small">{result.nextStep.reason} {result.nextStep.why}</p>
                <Link className="btn small" href={result.nextStep.href}>Continue</Link>
              </div>
            ) : null}

            {result.fixture ? <FixtureBanner item={{ ...item!, fixture: result.fixture }} /> : null}
          </div>
        </section>
      ) : null}

      <p className="small" style={{ marginTop: 20 }}>
        This page does not claim teacher review, learner testing, examination equivalence or a licence to
        republish source material. Those remain separate, incomplete requirements.
      </p>
    </div>
  );
}
