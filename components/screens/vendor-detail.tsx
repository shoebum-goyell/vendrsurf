"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { VENDORS, RFQ_DATA, THREAD_EVENTS } from "@/lib/data";
import { StatusChip } from "@/components/shell";
import { Icons } from "@/components/icons";

type ThreadEvent = (typeof THREAD_EVENTS)[number];

function ThreadEventCard({ ev }: { ev: ThreadEvent }) {
  if (ev.kind === "call") {
    return (
      <div className="card">
        <div className="card-header" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--warn-soft)", color: "var(--warn)", display: "grid", placeItems: "center" }}>
              <Icons.Phone size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Voice call — Round 1 qualification</div>
              <div className="tiny">{ev.when} · {ev.duration} · outcome: <strong style={{ color: "var(--pos)" }}>{ev.outcome}</strong></div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm"><Icons.Download size={12} /> Transcript</button>
        </div>
        <div className="card-body" style={{ padding: "16px 20px" }}>
          <div className="transcript">
            {ev.transcript?.map((l, i) => (
              <div key={i} className="trs-line">
                <div className="trs-time">{l.t}</div>
                <div className={`trs-who ${l.side === "agent" ? "agent" : ""}`}>{l.who}</div>
                <div style={{ color: l.side === "agent" ? "var(--text)" : "var(--text-secondary)" }}>{l.line}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (ev.kind === "email") {
    const isOut = ev.direction === "out";
    return (
      <div className="msg">
        <div className="msg-avatar" style={{ background: isOut ? "var(--accent)" : "#E8E8E4", color: isOut ? "white" : "var(--text)" }}>
          {isOut ? <Icons.Sparkle size={14} /> : ev.who.split(" ")[0][0]}
        </div>
        <div className="msg-body">
          <div className="msg-head">
            <span className="msg-who">{ev.who}</span>
            {isOut && <span className="chip chip-accent">agent</span>}
            <span className="msg-time">{ev.when}</span>
          </div>
          <div className="msg-bubble" style={isOut ? { background: "var(--accent-soft)", borderColor: "#D2E2E1" } : {}}>
            <div className="msg-subject">{ev.subject}</div>
            <div style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{ev.body}</div>
            {ev.attachments && ev.attachments.length > 0 && (
              <div className="msg-meta">
                <Icons.Paperclip size={11} />
                {ev.attachments.map((a, i) => (
                  <span key={i} className="link" style={{ fontSize: 11.5 }}>
                    {a}{i < ev.attachments!.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (ev.kind === "agent-note") {
    return (
      <div style={{ display: "flex", gap: 10, padding: "0 12px", alignItems: "center" }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icons.Sparkle size={11} />
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", fontStyle: "italic" }}>
          <strong style={{ color: "var(--accent)", fontStyle: "normal" }}>Agent note</strong> · <span>{ev.when}</span> — {ev.body}
        </div>
      </div>
    );
  }

  return null;
}

export function VendorDetail({ vendorId, onBack }: { vendorId: string; onBack: () => void }) {
  const vendor = VENDORS.find((v) => v.id === vendorId) ?? VENDORS[0];
  const rfq = RFQ_DATA;
  const [events, setEvents] = useState<ThreadEvent[]>(THREAD_EVENTS);
  const [tab, setTab] = useState("thread");
  const [draftSubject, setDraftSubject] = useState("Re: RFQ: 500 units CNC aluminum enclosures — final request");
  const [draftBody, setDraftBody] = useState(
`Diane,

Thanks again for the quick turnaround on quoting.

We're ready to move forward with Precision Machine Works as primary for this 500-unit run. A few final items before PO goes out:

1. Confirm $42.00/unit flat at qty 500 (per your 4:12 PM email).
2. Confirm 28-day lead time starts the day PO lands — Friday EOD this week at the latest.
3. Confirm payment terms 2% / net 15.
4. First article inspection report with your standard PPAP — Level 3 if you can support it.

Please reply confirming all four and I'll have purchasing send the PO over this afternoon.

Best,
Mia — VendrSurf Agent
on behalf of Blackbird Robotics`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase
      .from("thread_events")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setEvents(data as unknown as ThreadEvent[]);
        }
      });
  }, [vendorId]);

  const send = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1400);
  };

  const initials = vendor.contact.name.split(" ").map((s) => s[0]).join("");

  return (
    <div className="content fade-in" style={{ maxWidth: 1280 }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginLeft: -8 }}>
          <Icons.Chev size={12} style={{ transform: "rotate(180deg)" }} /> Back to RFQ
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <h1 className="h1">{vendor.name}</h1>
            <StatusChip status={vendor.status} />
          </div>
          <div className="row muted" style={{ fontSize: 13.5, gap: 14, flexWrap: "wrap" }}>
            <span>{vendor.location}</span>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span>{vendor.employees} employees</span>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span>Fit {vendor.fitScore}</span>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span className="row" style={{ gap: 4 }}><Icons.Link size={12} />{vendor.contact.linkedin}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        <div>
          <div className="tabs" style={{ marginBottom: 18 }}>
            {(
              [["thread", "Activity"], ["transcript", "Transcript"], ["draft", "Draft"]] as [string, string][]
            ).map(([v, l]) => (
              <div key={v} className={`tab ${tab === v ? "active" : ""}`} onClick={() => setTab(v)}>
                {l}
                {v === "draft" && <span className="chip chip-accent" style={{ marginLeft: 8, fontSize: 10 }}>1</span>}
              </div>
            ))}
          </div>

          {tab === "thread" && (
            <div className="col" style={{ gap: 16 }}>
              {events.map((ev, i) => <ThreadEventCard key={i} ev={ev} />)}
            </div>
          )}

          {tab === "transcript" && (() => {
            const callEv = events.find((e) => e.kind === "call");
            if (!callEv || callEv.kind !== "call") return null;
            return (
              <div className="card">
                <div className="card-header" style={{ justifyContent: "space-between" }}>
                  <div className="row">
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--warn-soft)", color: "var(--warn)", display: "grid", placeItems: "center" }}>
                      <Icons.Phone size={14} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>Round 1 qualification call</div>
                      <div className="tiny">{callEv.when} · {callEv.duration} · <strong style={{ color: "var(--pos)" }}>Qualified</strong></div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm"><Icons.Download size={12} /> Download</button>
                </div>
                <div className="card-body" style={{ padding: "16px 20px" }}>
                  <div className="transcript">
                    {callEv.transcript?.map((l, i) => (
                      <div key={i} className="trs-line">
                        <div className="trs-time">{l.t}</div>
                        <div className={`trs-who ${l.side === "agent" ? "agent" : ""}`}>{l.who}</div>
                        <div style={{ color: l.side === "agent" ? "var(--text)" : "var(--text-secondary)" }}>{l.line}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {tab === "draft" && (
            <div className="card">
              <div className="card-header">
                <Icons.Sparkle size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>Agent-drafted reply</div>
                  <div className="tiny">Edit and send — final request</div>
                </div>
                <div className="spacer" />
                {sent && <span className="chip chip-pos chip-dot">Sent</span>}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  {[
                    ["From", "Mia · VendrSurf Agent <agent@vendrsurf.com>"],
                    ["To", `${vendor.contact.name} <${vendor.contact.email}>`],
                    ["CC", "sam@blackbird-robotics.com"],
                  ].map(([label, val]) => (
                    <div key={label} className="row" style={{ gap: 10, fontSize: 12.5, marginBottom: 6 }}>
                      <span className="muted" style={{ width: 48 }}>{label}</span>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  <input
                    className="input"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    style={{ border: "none", padding: 0, fontSize: 14, fontWeight: 600, background: "transparent" }}
                    disabled={sent}
                  />
                </div>
                <div style={{ padding: "6px 18px" }}>
                  <textarea
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    disabled={sent}
                    style={{
                      width: "100%", border: "none", outline: "none", resize: "vertical",
                      minHeight: 340, padding: "10px 0", fontSize: 13.5, lineHeight: 1.6,
                      fontFamily: "inherit", background: "transparent", color: "var(--text)",
                    }}
                  />
                </div>
                <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", background: "var(--bg-sunken)" }}>
                  <div className="row">
                    <div className="spacer" />
                    {!sent ? (
                      <>
                        <button className="btn btn-sm" disabled={sending}>Save draft</button>
                        <button className="btn btn-primary btn-sm" onClick={send} disabled={sending}>
                          {sending ? <><span className="pulse-dot" style={{ background: "white" }} /> Sending…</> : <>Send final request <Icons.Chev size={12} /></>}
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-sm" onClick={() => setSent(false)}><Icons.Refresh size={12} /> Undo send</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col" style={{ gap: 14 }}>
          <div className="card" style={{ borderColor: "var(--pos)", background: "linear-gradient(180deg, var(--pos-soft), var(--bg-elev) 60%)" }}>
            <div className="card-body" style={{ padding: 16 }}>
              <div className="row" style={{ marginBottom: 14 }}>
                <Icons.Quotes size={14} style={{ color: "var(--pos)" }} />
                <span className="h3" style={{ color: "var(--pos)" }}>Final quote</span>
                <div className="spacer" />
                {vendor.unitPrice && (
                  <span className="chip chip-pos">{vendor.unitPrice <= rfq.targetUnit ? "Below target" : "Above target"}</span>
                )}
              </div>
              {vendor.unitPrice ? (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div className="tiny" style={{ marginBottom: 2 }}>Unit price</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 22, color: "var(--pos)", fontVariantNumeric: "tabular-nums" }}>
                        ${vendor.unitPrice.toFixed(2)}
                      </span>
                      <span className="tiny">/ unit × 500</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                    <div><div className="tiny" style={{ marginBottom: 2 }}>Lead time</div><div style={{ fontWeight: 600 }}>{vendor.leadTime} days ARO</div></div>
                    <div><div className="tiny" style={{ marginBottom: 2 }}>MOQ</div><div style={{ fontWeight: 600 }}>{vendor.moq} units</div></div>
                    <div><div className="tiny" style={{ marginBottom: 2 }}>NRE / tooling</div><div style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${vendor.nre?.toLocaleString()}</div></div>
                    <div><div className="tiny" style={{ marginBottom: 2 }}>Payment</div><div style={{ fontWeight: 600 }}>2% / net 15</div></div>
                  </div>
                  <hr className="hr" style={{ margin: "14px 0 10px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="muted" style={{ fontSize: 12.5 }}>Total contract value</span>
                    <span style={{ fontWeight: 700, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>
                      ${((vendor.unitPrice * 500) + (vendor.nre ?? 0)).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="muted" style={{ fontSize: 13 }}>No formal quote yet — {vendor.callOutcome.toLowerCase()}.</div>
              )}
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="section-title">Contact</h3>
            <div className="row" style={{ gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #14161A, #5B6067)", color: "white", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{vendor.contact.name}</div>
                <div className="tiny">{vendor.contact.role}</div>
              </div>
            </div>
            <div className="col" style={{ gap: 6, fontSize: 12.5 }}>
              <div className="row"><Icons.Phone size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} /><span>{vendor.contact.phone}</span></div>
              <div className="row"><Icons.Mail size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} /><span style={{ wordBreak: "break-all" }}>{vendor.contact.email}</span></div>
              <div className="row"><Icons.Link size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} /><span className="link">{vendor.contact.linkedin}</span></div>
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="section-title">Capabilities & certs</h3>
            <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {vendor.capabilities.map((c, i) => <span key={i} className="chip chip-neutral">{c}</span>)}
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {vendor.certs.map((c, i) => <span key={i} className="chip chip-accent">{c}</span>)}
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="section-title">Agent summary</h3>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{vendor.summary}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
