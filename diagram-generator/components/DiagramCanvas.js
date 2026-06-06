"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export default function DiagramCanvas({ mermaidCode, error, light }) {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [renderError, setRenderError] = useState(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mermaidCode || !containerRef.current) return;
    const render = async () => {
      try {
        setRenderError(null);
        setScale(1);
        setOffset({ x: 0, y: 0 });
        lastOffset.current = { x: 0, y: 0 };

        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#f8faff",
            primaryTextColor: "#1e293b",
            primaryBorderColor: "#6366f1",
            lineColor: "#6366f1",
            secondaryColor: "#f1f5f9",
            tertiaryColor: "#ede9fe",
            fontSize: "15px",
            fontFamily: "Inter, system-ui, sans-serif",
            edgeLabelBackground: "#ffffff",
            clusterBkg: "#f8fafc",
            clusterBorder: "#c7d2fe",
            titleColor: "#1e293b",
            nodeTextColor: "#1e293b",
            attributeBackgroundColorEven: "#f8faff",
            attributeBackgroundColorOdd: "#ede9fe",
          },
          flowchart: {
            curve: "basis",
            padding: 24,
            nodeSpacing: 70,
            rankSpacing: 90,
            useMaxWidth: false,
          },
        });

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          // Make SVG fill the container nicely
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.width = "100%";
            svgEl.style.height = "100%";
            svgEl.style.maxWidth = "none";
            svgEl.style.filter =
              "drop-shadow(0 4px 24px rgba(99,102,241,0.10))";
          }
        }
      } catch(err) {
          console.error('Mermaid render error:', err.message || err)
        setRenderError("Failed to render. Try rephrasing your prompt.");
      }
    };
    render();
  }, [mermaidCode, light]);

  // Zoom handlers
  const zoomIn  = useCallback(() => setScale(s => Math.min(s + 0.15, 3)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(s - 0.15, 0.3)), []);
  const zoomFit = useCallback(() => { setScale(1); setOffset({ x: 0, y: 0 }); lastOffset.current = { x: 0, y: 0 }; }, []);

  // Pan handlers
  const onMouseDown = useCallback((e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - lastOffset.current.x, y: e.clientY - lastOffset.current.y });
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const newOffset = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
    lastOffset.current = newOffset;
    setOffset(newOffset);
  }, [isDragging, dragStart]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  // Scroll to zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale(s => Math.min(Math.max(s + delta, 0.3), 3));
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  if (error) return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "32px" }}>⚠️</div>
      <p style={{ color: "#ef4444", fontFamily: "monospace", fontSize: "13px", marginTop: "8px" }}>{error}</p>
    </div>
  );

  if (!mermaidCode) return (
    <div style={{ textAlign: "center", color: "#94a3b8" }}>
      <div style={{
        width: "80px", height: "80px", margin: "0 auto 16px",
        border: "2px dashed #cbd5e1", borderRadius: "16px",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
      }}>⊞</div>
      <p style={{ fontSize: "16px", fontWeight: "500", color: "#475569" }}>Your diagram will appear here</p>
      <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "6px", maxWidth: "280px", lineHeight: "1.6" }}>
        Enter a natural language description above, or click one of the quick-start chips to generate a diagram instantly.
      </p>
    </div>
  );

  if (renderError) return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "32px" }}>⚠️</div>
      <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "8px" }}>{renderError}</p>
    </div>
  );

  return (
    <div
      ref={wrapperRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        width: "100%", height: "100%",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Zoom controls — wired up */}
      <div style={{
        position: "absolute", bottom: "20px", right: "20px", zIndex: 10,
        display: "flex", flexDirection: "column", gap: "4px",
      }}>
        {[
          { icon: "+", action: zoomIn,  title: "Zoom in"  },
          { icon: "−", action: zoomOut, title: "Zoom out" },
          { icon: "⤢", action: zoomFit, title: "Fit"      },
        ].map(({ icon, action, title }) => (
          <button key={icon} onClick={action} title={title} style={{
            width: "32px", height: "32px", background: "#ffffff",
            border: "1px solid #e2e8f0", borderRadius: "6px",
            cursor: "pointer", fontSize: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#6366f1", fontWeight: "600",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            transition: "background 0.15s",
          }}
            onMouseOver={e => e.currentTarget.style.background = "#f0f0ff"}
            onMouseOut={e  => e.currentTarget.style.background = "#ffffff"}
          >{icon}</button>
        ))}
      </div>

      {/* Scale indicator */}
      <div style={{
        position: "absolute", bottom: "20px", left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.85)",
        border: "1px solid #e2e8f0",
        borderRadius: "6px", padding: "3px 10px",
        fontSize: "11px", color: "#64748b",
        backdropFilter: "blur(4px)", zIndex: 10,
      }}>
        {Math.round(scale * 100)}%
      </div>

      {/* Pannable + zoomable diagram */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.15s ease",
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "32px",
          boxSizing: "border-box",
        }}
      >
        <div
          ref={containerRef}
          className="mermaid-container"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}