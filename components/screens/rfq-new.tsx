"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ParsedFields = {
  location: string;
  product_category: string;
  quantity: number | "";
  budget_min: number | "";
  budget_max: number | "";
  timeline_weeks: number | "";
};

const EMPTY: ParsedFields = {
  location: "",
  product_category: "",
  quantity: "",
  budget_min: "",
  budget_max: "",
  timeline_weeks: "",
};

const FIXTURE: ParsedFields = {
  location: "USA",
  product_category: "CNC-machined aluminum enclosures",
  quantity: 500,
  budget_min: 35,
  budget_max: 58,
  timeline_weeks: 6,
};

function genRfqId() {
  const yr = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RFQ-${yr}-${rand}`;
}

export function RfqNew({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedFields | null>(null);
  const [fields, setFields] = useState<ParsedFields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ParsedFields, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    setParseError(null);
    try {
      const res = await fetch(`${API_URL}/parse-rfq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`parse-rfq ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.message || json.error);
      const f = json.fields as Partial<ParsedFields>;
      const next: ParsedFields = {
        location: f.location ?? "",
        product_category: f.product_category ?? "",
        quantity: (f.quantity as number) ?? "",
        budget_min: (f.budget_min as number) ?? "",
        budget_max: (f.budget_max as number) ?? "",
        timeline_weeks: (f.timeline_weeks as number) ?? "",
      };
      setFields(next);
      setParsed(next);
    } catch {
      setParseError("Couldn't reach parser — loaded a best-guess draft you can edit.");
      setFields(FIXTURE);
      setParsed(FIXTURE);
    } finally {
      setParsing(false);
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof ParsedFields, string>> = {};
    if (!/^[A-Z]{3}$/.test(fields.location.trim())) e.location = "ISO3 country code (e.g. USA)";
    if (!fields.product_category.trim()) e.product_category = "Required";
    if (fields.quantity === "" || Number(fields.quantity) <= 0) e.quantity = "Must be > 0";
    if (fields.budget_min === "" || Number(fields.budget_min) < 0) e.budget_min = "Required";
    if (fields.budget_max === "" || Number(fields.budget_max) <= 0) e.budget_max = "Required";
    if (fields.budget_min !== "" && fields.budget_max !== "" && Number(fields.budget_min) > Number(fields.budget_max))
      e.budget_max = "Max must be ≥ min";
    if (fields.timeline_weeks === "" || Number(fields.timeline_weeks) <= 0) e.timeline_weeks = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const id = genRfqId();
    const row = {
      id,
      title: fields.product_category,
      status: "active",
      quantity: Number(fields.quantity),
      location: fields.location.toUpperCase(),
      product_category: fields.product_category,
      budget_min: Number(fields.budget_min),
      budget_max: Number(fields.budget_max),
      timeline_weeks: Number(fields.timeline_weeks),
      target_unit: Number(fields.budget_max),
    };
    const { error } = await supabase.from("rfqs").insert(row);
    if (error) {
      setSubmitting(false);
      setParseError(`Could not save RFQ: ${error.message}`);
      return;
    }
    fetch(`${API_URL}/discover-vendors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfq_id: id, location: row.location, product_category: row.product_category }),
    }).catch(() => {});
    onCreated(id);
  };

  const set = <K extends keyof ParsedFields>(k: K, v: ParsedFields[K]) => {
    setFields((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const numVal = (v: number | "") => (v === "" ? "" : String(v));
  const parseNum = (s: string): number | "" => (s === "" ? "" : Number(s));

  return (
    <div className="content fade-in" style={{ maxWidth: 860 }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginLeft: -8 }}>
          <Icons.Chev size={12} style={{ transform: "rotate(180deg)" }} /> Dashboard
        </button>
      </div>

      <h1 className="h1">New RFQ</h1>
      <div className="muted" style={{ marginTop: 4, fontSize: 13.5, marginBottom: 20 }}>
        Describe what you need to source. We&apos;ll extract the structured details — you can edit everything before submitting.
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <label className="tiny" style={{ display: "block", marginBottom: 8, color: "var(--text-secondary)", fontWeight: 600 }}>
          Procurement request
        </label>
        <textarea
          className="textarea"
          rows={6}
          placeholder="e.g. Need 500 CNC-machined aluminum enclosures, anodized, shipped to our Austin, TX facility. Target around $42/unit, walk-away at $58. Need them within 6 weeks."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row" style={{ marginTop: 12, justifyContent: "flex-end", gap: 8 }}>
          {parseError && <div className="tiny" style={{ color: "var(--warn)", marginRight: "auto" }}>{parseError}</div>}
          <button className="btn btn-primary" onClick={parse} disabled={parsing || !text.trim()}>
            {parsing ? "Parsing…" : parsed ? "Re-parse" : "Parse"}
          </button>
        </div>
      </div>

      {parsed && (
        <div className="card card-pad">
          <h2 className="h2" style={{ marginBottom: 4 }}>Structured details</h2>
          <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>
            Required fields are marked. Edit anything that doesn&apos;t look right.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Product / category *" error={errors.product_category} full>
              <input
                className="input"
                value={fields.product_category}
                onChange={(e) => set("product_category", e.target.value)}
                placeholder="CNC-machined aluminum enclosures"
              />
            </Field>
            <Field label="Location (ISO3) *" error={errors.location}>
              <input
                className="input mono"
                value={fields.location}
                maxLength={3}
                onChange={(e) => set("location", e.target.value.toUpperCase())}
                placeholder="USA"
              />
            </Field>
            <Field label="Quantity *" error={errors.quantity}>
              <input
                className="input"
                type="number"
                min={1}
                value={numVal(fields.quantity)}
                onChange={(e) => set("quantity", parseNum(e.target.value))}
                placeholder="500"
              />
            </Field>
            <Field label="Budget min (USD/unit) *" error={errors.budget_min}>
              <input
                className="input"
                type="number"
                min={0}
                step="0.01"
                value={numVal(fields.budget_min)}
                onChange={(e) => set("budget_min", parseNum(e.target.value))}
                placeholder="35"
              />
            </Field>
            <Field label="Budget max (USD/unit) *" error={errors.budget_max}>
              <input
                className="input"
                type="number"
                min={0}
                step="0.01"
                value={numVal(fields.budget_max)}
                onChange={(e) => set("budget_max", parseNum(e.target.value))}
                placeholder="58"
              />
            </Field>
            <Field label="Timeline (weeks) *" error={errors.timeline_weeks}>
              <input
                className="input"
                type="number"
                min={1}
                value={numVal(fields.timeline_weeks)}
                onChange={(e) => set("timeline_weeks", parseNum(e.target.value))}
                placeholder="6"
              />
            </Field>
          </div>

          <div className="row" style={{ marginTop: 20, justifyContent: "flex-end", gap: 8 }}>
            <button className="btn" onClick={onBack} disabled={submitting}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? "Creating…" : "Create RFQ & start outreach"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, children, error, full,
}: { label: string; children: React.ReactNode; error?: string; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label className="tiny" style={{ display: "block", marginBottom: 6, color: "var(--text-secondary)", fontWeight: 600 }}>
        {label}
      </label>
      {children}
      {error && <div className="tiny" style={{ marginTop: 4, color: "var(--warn)" }}>{error}</div>}
    </div>
  );
}
