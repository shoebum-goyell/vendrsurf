"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RFQ_DATA, VENDORS, Vendor } from "@/lib/data";
import { StatusChip, FitBar } from "@/components/shell";
import { Icons } from "@/components/icons";

export function RfqDetail({ onBack, onOpenVendor }: { onBack: () => void; onOpenVendor: (id: string) => void }) {
  const rfq = RFQ_DATA;
  const [filter, setFilter] = useState("all");
  const [vendors, setVendors] = useState<Vendor[]>(VENDORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("vendors").select("*").eq("rfq_id", rfq.id).then(({ data }) => {
      if (data && data.length > 0) {
        const mapped = data.map((v: Record<string, unknown>) => ({
          id: v.id as string,
          name: v.name as string,
          location: v.location as string,
          employees: v.employees as string,
          contact: v.contact as Vendor["contact"],
          status: v.status as Vendor["status"],
          unitPrice: v.unit_price as number | null,
          leadTime: v.lead_time as number | null,
          moq: v.moq as number | null,
          nre: v.nre as number | null,
          certs: (v.certs as string[]) ?? [],
          capabilities: (v.capabilities as string[]) ?? [],
          risk: v.risk as string,
          fitScore: v.fit_score as number,
          lastUpdate: v.last_update as string,
          callDuration: v.call_duration as string,
          callOutcome: v.call_outcome as string,
          summary: v.summary as string,
        }));
        setVendors(mapped);
      }
      setLoading(false);
    });
  }, [rfq.id]);

  // Live tick for calling vendors
  useEffect(() => {
    const t = setInterval(() => {
      setVendors((vs) =>
        vs.map((v) => {
          if (v.status === "calling") {
            const [m, s] = v.callDuration.split(":").map(Number);
            const total = m * 60 + s + 1;
            return { ...v, callDuration: `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}` };
          }
          return v;
        })
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const counts = {
    all: vendors.length,
    calling: vendors.filter((v) => v.status === "calling").length,
    qualified: vendors.filter((v) => ["qualified", "emailing"].includes(v.status)).length,
    quoted: vendors.filter((v) => v.status === "quoted").length,
    voicemail: vendors.filter((v) => v.status === "voicemail").length,
    declined: vendors.filter((v) => v.status === "declined").length,
  };

  const filtered = vendors.filter((v) => {
    if (filter === "all") return true;
    if (filter === "qualified") return ["qualified", "emailing"].includes(v.status);
    return v.status === filter;
  });

  return (
    <div className="content fade-in" style={{ maxWidth: 1280 }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginLeft: -8 }}>
          <Icons.Chev size={12} style={{ transform: "rotate(180deg)" }} /> Dashboard
        </button>
      </div>

      <div className="row" style={{ marginBottom: 4, alignItems: "flex-start" }}>
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <span className="tiny mono" style={{ color: "var(--text-tertiary)" }}>{rfq.id}</span>
            <StatusChip status="active" />
          </div>
          <h1 className="h1">{rfq.title}</h1>
          <div className="muted" style={{ marginTop: 4, fontSize: 13.5 }}>
            {rfq.summary} · launched {rfq.created} · target ${rfq.targetUnit}/unit · walk-away ${rfq.walkAwayUnit}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn"><Icons.Download size={13} /> Export</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 20, marginBottom: 20 }}>
        <div className="card stat"><div className="stat-label">Reached out</div><div className="stat-value">{counts.all}</div></div>
        <div className="card stat">
          <div className="stat-label">Live calls</div>
          <div className="stat-value" style={{ color: "var(--warn)", display: "flex", alignItems: "center", gap: 8 }}>
            {counts.calling}{counts.calling > 0 && <span className="pulse-dot" />}
          </div>
        </div>
        <div className="card stat"><div className="stat-label">Qualified</div><div className="stat-value" style={{ color: "var(--info)" }}>{counts.qualified}</div></div>
        <div className="card stat"><div className="stat-label">Quoted</div><div className="stat-value" style={{ color: "var(--pos)" }}>{counts.quoted}</div></div>
        <div className="card stat"><div className="stat-label">Declined</div><div className="stat-value" style={{ color: "var(--text-tertiary)" }}>{counts.declined}</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(90deg, var(--accent-soft), transparent)" }}>
          <div className="pulse-dot" style={{ background: "var(--accent)" }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>Agent is live</div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            {counts.calling} calls active · {vendors.filter((v) => v.status === "emailing").length} email threads open · last action just now
          </div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div className="segmented">
          {(
            [
              ["all", `All · ${counts.all}`],
              ["calling", `Calling · ${counts.calling}`],
              ["qualified", `Qualified · ${counts.qualified}`],
              ["quoted", `Quoted · ${counts.quoted}`],
              ["voicemail", `Voicemail · ${counts.voicemail}`],
              ["declined", `Declined · ${counts.declined}`],
            ] as [string, string][]
          ).map(([v, l]) => (
            <button key={v} className={filter === v ? "active" : ""} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>Loading vendors…</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Vendor</th>
                <th style={{ width: 140 }}>Contact</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 110, textAlign: "right" }}>Unit price</th>
                <th style={{ width: 90, textAlign: "right" }}>Lead</th>
                <th style={{ width: 120 }}>Fit</th>
                <th style={{ minWidth: 240 }}>Last action</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="clickable" onClick={() => onOpenVendor(v.id)}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{v.name}</div>
                    <div className="tiny" style={{ marginTop: 2, color: "var(--text-secondary)" }}>{v.location} · {v.employees}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.contact.name}</div>
                    <div className="tiny" style={{ marginTop: 2 }}>{v.contact.role}</div>
                  </td>
                  <td><StatusChip status={v.status} /></td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {v.unitPrice != null ? (
                      <div>
                        <div style={{ fontWeight: 600, color: v.unitPrice <= rfq.targetUnit ? "var(--pos)" : "var(--text)" }}>
                          ${v.unitPrice.toFixed(2)}
                        </div>
                        <div className="tiny" style={{ color: v.unitPrice <= rfq.targetUnit ? "var(--pos)" : "var(--text-tertiary)" }}>
                          {v.unitPrice <= rfq.targetUnit
                            ? `−$${(rfq.targetUnit - v.unitPrice).toFixed(2)}`
                            : `+$${(v.unitPrice - rfq.targetUnit).toFixed(2)}`}
                        </div>
                      </div>
                    ) : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                    {v.leadTime != null ? `${v.leadTime}d` : "—"}
                  </td>
                  <td><FitBar score={v.fitScore} /></td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      {v.status === "calling" && <Icons.Phone size={13} style={{ color: "var(--warn)" }} />}
                      {["quoted", "emailing"].includes(v.status) && <Icons.Mail size={13} style={{ color: "var(--info)" }} />}
                      {v.status === "voicemail" && <Icons.Mic size={13} style={{ color: "var(--text-tertiary)" }} />}
                      {v.status === "declined" && <Icons.X size={13} style={{ color: "var(--text-tertiary)" }} />}
                      {v.status === "qualified" && <Icons.Check size={13} style={{ color: "var(--pos)" }} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {v.status === "calling" ? `Call in progress · ${v.callDuration}` : v.callOutcome}
                        </div>
                        <div className="tiny" style={{ whiteSpace: "nowrap" }}>{v.lastUpdate}</div>
                      </div>
                    </div>
                  </td>
                  <td><Icons.Chev size={13} style={{ color: "var(--text-tertiary)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
