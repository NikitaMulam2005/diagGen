"use client";

import { useState } from "react";
import EditorView from "../components/EditorView";
import LibraryView from "../components/LibraryView";

export default function Home() {
  const [activeView, setActiveView] = useState("editor");
  const [savedDiagrams, setSavedDiagrams] = useState([]);

  const handleSave = (prompt, mermaidCode) => {
    setSavedDiagrams(prev => [{
      id: Date.now(),
      title: prompt.replace(/generate a block diagram of /i, "").replace(/create a block diagram for /i, ""),
      desc: prompt,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      mermaidCode,
    }, ...prev]);
  };

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: "#f0f2f5", fontFamily: "'Segoe UI', sans-serif",
    }}>
   
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeView === "editor" && <EditorView onSave={handleSave} />}
        {activeView === "library" && <LibraryView diagrams={savedDiagrams} />}
        {activeView === "templates" && <PlaceholderView title="Templates" />}
        {activeView === "settings" && <PlaceholderView title="Settings" />}
      </div>
    </div>
  );
}

function PlaceholderView({ title }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
      <h2>{title} — coming soon</h2>
    </div>
  );
}