"use client";

export default function LibraryView({ diagrams }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* Top bar */}
      <div style={{
        height: "48px", background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Editor", "Dashboard", "Community"].map((t) => (
            <span key={t} style={{ color: "#64748b", fontSize: "13px", cursor: "pointer" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input placeholder="Search diagrams..." style={{
            background: "#f1f5f9", border: "1px solid #e2e8f0",
            borderRadius: "6px", padding: "5px 12px",
            color: "#64748b", fontSize: "12px", outline: "none", width: "180px",
          }} />
          <button style={{
            background: "#0ea5e9", color: "#fff", border: "none",
            borderRadius: "6px", padding: "6px 14px",
            fontSize: "12px", fontWeight: "600", cursor: "pointer",
          }}>+ New Diagram</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", background: "#f8fafc", padding: "28px 32px" }}>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>Workspace / Library</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b" }}>Your Diagrams</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            {["⊞ Grid", "≡ List", "⧩ Filters"].map(btn => (
              <button key={btn} style={{
                background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: "6px", padding: "5px 12px",
                fontSize: "12px", color: "#64748b", cursor: "pointer",
              }}>{btn}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {/* Create New */}
          <div style={{
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

          {diagrams.map((d, i) => {
            const thumbColors = ["#dbeafe", "#d1fae5", "#ede9fe", "#fce7f3"];
            const thumbIcons = ["⬡", "◈", "⊞", "⬢"];
            return (
              <div key={d.id} style={{
                background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: "12px", overflow: "hidden", cursor: "pointer",
              }}
                onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                onMouseOut={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{
                  height: "110px", background: thumbColors[i % thumbColors.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "40px", color: "#94a3b8",
                }}>
                  {thumbIcons[i % thumbIcons.length]}
                </div>
                <div style={{ padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b" }}>{d.title}</div>
                    <span style={{ color: "#94a3b8", cursor: "pointer" }}>⋮</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>{d.desc}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>⏱ {d.date}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggested Templates */}
        <div style={{ marginTop: "36px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", marginBottom: "14px" }}>Suggested Templates</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
            {["UML Class Diagram", "Flowchart Pro", "Infrastructure", "Network Topology"].map(t => (
              <div key={t} style={{
                background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: "10px", padding: "16px", cursor: "pointer",
              }}>
                <div style={{ fontSize: "20px", marginBottom: "8px" }}>⬡</div>
                <div style={{ fontWeight: "500", fontSize: "12px", color: "#1e293b" }}>{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Workspace Info */}
        <div style={{ marginTop: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", maxWidth: "300px" }}>
          <div style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b", marginBottom: "10px" }}>Workspace Info</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
            <span>Storage</span><span>1.2 GB / 5 GB</span>
          </div>
          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px" }}>
            <div style={{ width: "24%", height: "100%", background: "#0ea5e9", borderRadius: "999px" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
            <span>Total Diagrams</span><span style={{ fontWeight: "600", color: "#1e293b" }}>{diagrams.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}