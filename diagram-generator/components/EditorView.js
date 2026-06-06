"use client";

import { useState, useEffect } from "react";
import DiagramCanvas from "./DiagramCanvas";
import { generateDiagram, saveDiagram, fetchLibrary, deleteDiagram } from "../lib/api";

const CHIPS = ["Add Redis Cache", "Add Auth Layer"];
const THUMB_COLORS = ["#dbeafe", "#d1fae5", "#ede9fe", "#fce7f3", "#fef3c7"];
const THUMB_ICONS  = ["⬡", "◈", "⊞", "⬢", "◇"];

export default function EditorView({ onSave }) {
  const [activeTab, setActiveTab]     = useState("Editor");
  const [prompt, setPrompt]           = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [title, setTitle]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [diagrams, setDiagrams]       = useState([]);
  const [libLoading, setLibLoading]   = useState(false);

  useEffect(() => {
    if (activeTab !== "Library") return;
    setLibLoading(true);
    fetchLibrary()
      .then(setDiagrams)
      .catch(console.error)
      .finally(() => setLibLoading(false));
  }, [activeTab]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(null); setMermaidCode(""); setSaved(false);
    try {
      const code = await generateDiagram(prompt);
      setMermaidCode(code);
      onSave?.(prompt, code);
    } catch (err) {
      setError(err.message || "Network error. Is Ollama running?");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mermaidCode) return;
    setSaving(true); setSaved(false);
    try {
      await saveDiagram({ title: title.trim() || prompt, prompt, mermaidCode });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDiagram(id);
      setDiagrams(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDiagram = (d) => {
    setPrompt(d.desc || "");
    setMermaidCode(d.mermaidCode);
    setTitle(d.title);
    setActiveTab("Editor");
  };

  const handleDownloadSVG = () => {
    const svg = document.querySelector(".mermaid-container svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "diagram.svg"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const svg = document.querySelector(".mermaid-container svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const a = document.createElement("a"); a.download = "diagram.png"; a.href = canvas.toDataURL(); a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidCode);
    alert("Mermaid code copied!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* ── Top bar ── */}
      <div style={{
        height: "48px", background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Editor", "Library"].map((t) => (
            <span key={t} onClick={() => setActiveTab(t)} style={{
              color: activeTab === t ? "#0ea5e9" : "#64748b",
              fontSize: "13px", fontWeight: activeTab === t ? "600" : "400",
              cursor: "pointer",
              borderBottom: activeTab === t ? "2px solid #0ea5e9" : "2px solid transparent",
              paddingBottom: "2px", transition: "all 0.15s",
            }}>{t}</span>
          ))}
        </div>
        <button
          onClick={() => { setPrompt(""); setMermaidCode(""); setTitle(""); setError(null); setActiveTab("Editor"); }}
          style={{
            background: "#0ea5e9", color: "#fff", border: "none",
            borderRadius: "6px", padding: "6px 14px",
            fontSize: "12px", fontWeight: "600", cursor: "pointer",
          }}>+ New Diagram</button>
      </div>

      {/* ── LIBRARY TAB ── */}
      {activeTab === "Library" && (
        <div style={{ flex: 1, overflow: "auto", background: "#f8fafc", padding: "28px 32px" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>Workspace / Library</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Your Diagrams</h1>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{diagrams.length} saved</span>
          </div>

          {libLoading ? (
            <div style={{ textAlign: "center", color: "#94a3b8", paddingTop: "60px" }}>Loading...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>

              {/* Create new card */}
              <div onClick={() => setActiveTab("Editor")} style={{
                background: "#ffffff", border: "2px dashed #cbd5e1",
                borderRadius: "12px", padding: "24px",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                minHeight: "180px", cursor: "pointer",
              }}>
                <div style={{
                  width: "40px", height: "40px", background: "#f1f5f9",
                  borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "20px", marginBottom: "10px", color: "#64748b",
                }}>+</div>
                <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "13px" }}>Create New</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Start from blank canvas</div>
              </div>

              {diagrams.map((d, i) => (
                <div key={d.id} style={{
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: "12px", overflow: "hidden", cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
                  onMouseOver={e  => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                  onMouseOut={e   => e.currentTarget.style.boxShadow = "none"}
                >
                  {/* Thumbnail */}
                  <div style={{
                    height: "110px",
                    background: THUMB_COLORS[i % THUMB_COLORS.length],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "40px", color: "#94a3b8",
                  }}>
                    {THUMB_ICONS[i % THUMB_ICONS.length]}
                  </div>

                  <div style={{ padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b", flex: 1, marginRight: "6px" }}>{d.title}</div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(d.id); }}
                        title="Delete"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#cbd5e1", fontSize: "14px", padding: "0",
                          lineHeight: 1, flexShrink: 0,
                        }}
                        onMouseOver={e => e.currentTarget.style.color = "#ef4444"}
                        onMouseOut={e  => e.currentTarget.style.color = "#cbd5e1"}
                      >✕</button>
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {d.desc || "No description"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>⏱ {d.date}</div>
                    <button
                      onClick={() => handleOpenDiagram(d)}
                      style={{
                        marginTop: "10px", width: "100%",
                        background: "#f1f5f9", border: "1px solid #e2e8f0",
                        borderRadius: "6px", padding: "5px",
                        fontSize: "11px", color: "#0ea5e9",
                        cursor: "pointer", fontWeight: "600",
                      }}>Open in Editor</button>
                  </div>
                </div>
              ))}

              {diagrams.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#94a3b8", paddingTop: "40px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>⊞</div>
                  <p>No saved diagrams yet. Generate one and save it!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── EDITOR TAB ── */}
      {activeTab === "Editor" && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Canvas */}
          <div style={{
            flex: 1, background: "#e8ecf0",
            position: "relative", overflow: "auto",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle, #b0bec5 1px, transparent 1px)",
              backgroundSize: "24px 24px", opacity: 0.6,
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {loading ? (
                <div style={{ textAlign: "center", color: "#64748b" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>⟳</div>
                  <p>Generating with Ollama...</p>
                </div>
              ) : (
                <DiagramCanvas mermaidCode={mermaidCode} error={error} light />
              )}
            </div>

            {/* Revision history */}
            <div style={{
              position: "absolute", bottom: "16px", left: "16px",
              background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: "8px", padding: "8px 12px", fontSize: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ color: "#1e293b" }}>Revision History</strong>
                <span style={{ background: "#0ea5e9", color: "#fff", borderRadius: "4px", padding: "1px 6px", fontSize: "10px" }}>v2.4</span>
              </div>
              <div style={{ marginTop: "4px", color: "#94a3b8", fontSize: "11px" }}>
                ⏱ Initial Draft · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{
            width: "260px", minWidth: "260px",
            background: "#f8fafc",
            borderLeft: "1px solid #e2e8f0",
            display: "flex", flexDirection: "column",
            overflow: "auto",
          }}>

            {/* Prompt */}
            <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b", marginBottom: "10px" }}>Prompt Engineer</div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Enter diagram requirements..."
                rows={4}
                style={{
                  width: "100%", background: "#ffffff",
                  border: "1px solid #e2e8f0", borderRadius: "8px",
                  padding: "10px", fontSize: "12px", color: "#374151",
                  resize: "none", outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {CHIPS.map(chip => (
                  <button key={chip}
                    onClick={() => setPrompt(p => p + (p ? ", " : "") + chip)}
                    style={{
                      fontSize: "11px", background: "#f1f5f9",
                      border: "1px solid #e2e8f0", borderRadius: "999px",
                      padding: "3px 10px", color: "#64748b", cursor: "pointer",
                    }}>{chip}</button>
                ))}
              </div>
              <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
                style={{
                  width: "100%", marginTop: "10px",
                  background: loading || !prompt.trim() ? "#e2e8f0" : "#0ea5e9",
                  color: loading || !prompt.trim() ? "#94a3b8" : "#fff",
                  border: "none", borderRadius: "8px", padding: "9px",
                  fontSize: "13px", fontWeight: "600",
                  cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                }}>
                {loading ? "Generating..." : "✦ Generate"}
              </button>
              {error && (
                <div style={{
                  marginTop: "10px", padding: "8px 10px",
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "6px", fontSize: "11px", color: "#dc2626",
                }}>{error}</div>
              )}
            </div>

            {/* Save */}
            <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b", marginBottom: "10px" }}>Save Diagram</div>
    
              <button onClick={handleSave} disabled={!mermaidCode || saving}
                style={{
                  width: "100%",
                  background: saved ? "#10b981" : !mermaidCode || saving ? "#e2e8f0" : "#6366f1",
                  color: !mermaidCode || saving ? "#94a3b8" : "#fff",
                  border: "none", borderRadius: "8px", padding: "9px",
                  fontSize: "13px", fontWeight: "600",
                  cursor: !mermaidCode || saving ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}>
                {saving ? "Saving..." : saved ? "✓ Saved to Library!" : "Save to Library"}
              </button>
            </div>

    

            {/* Export */}
            <div style={{ padding: "16px" }}>
              <div style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b", marginBottom: "10px" }}>Export Assets</div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <button onClick={handleDownloadPNG} disabled={!mermaidCode} style={{
                  flex: 1, background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: "8px", padding: "8px", fontSize: "12px",
                  cursor: mermaidCode ? "pointer" : "not-allowed",
                  color: mermaidCode ? "#374151" : "#94a3b8",
                }}>🖼 PNG</button>
                <button onClick={handleDownloadSVG} disabled={!mermaidCode} style={{
                  flex: 1, background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: "8px", padding: "8px", fontSize: "12px",
                  cursor: mermaidCode ? "pointer" : "not-allowed",
                  color: mermaidCode ? "#374151" : "#94a3b8",
                }}>◈ SVG</button>
              </div>
              <button onClick={handleCopyMermaid} disabled={!mermaidCode} style={{
                width: "100%", background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: "8px", padding: "8px", fontSize: "12px",
                cursor: mermaidCode ? "pointer" : "not-allowed",
                color: mermaidCode ? "#374151" : "#94a3b8",
              }}>&lt;/&gt; Copy Mermaid Code</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}