"use client";

export default function DiagramControls({ mermaidCode, onClear }) {
  const handleDownloadSVG = () => {
    const svg = document.querySelector(".mermaid-container svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySVG = () => {
    const svg = document.querySelector(".mermaid-container svg");
    if (!svg) return;
    navigator.clipboard.writeText(svg.outerHTML);
    alert("SVG copied!");
  };

  const btnStyle = {
    fontSize: "12px",
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: "6px",
    padding: "4px 10px",
    color: "#c9d1d9",
    cursor: "pointer",
    display: "flex", alignItems: "center", gap: "4px",
  };

  if (!mermaidCode) return null;

  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <button onClick={handleDownloadSVG} style={btnStyle}>↓ Export SVG</button>
      <button onClick={handleCopySVG} style={btnStyle}>⎘ Copy SVG</button>
      <button onClick={onClear} style={{ ...btnStyle, color: "#f85149" }}>✕</button>
    </div>
  );
}