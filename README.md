# AI Diagram Generator

A local-first AI-powered tool that converts natural language prompts into accurate, structured Mermaid flowchart diagrams using a locally running LLM via Ollama.

---

## What This Project Does

You type a prompt like `"GSM network architecture"` and the app generates a fully structured, engineering-accurate Mermaid diagram with proper subgraphs, intra-subgraph arrows, inter-subgraph connections, and domain-correct component names — rendered live in the browser.

---

## Tech Stack

| Technology | Role | Why chosen |
|---|---|---|
| **Ollama** | Local LLM runtime | Runs models entirely on-device — no API keys, no cost, no data leaving the machine |
| **qwen2.5-coder:7b** | Default LLM model | Code-tuned model that follows structured output instructions reliably; small enough to run on consumer hardware |
| **Mermaid.js** | Diagram rendering | Industry-standard diagramming DSL that renders directly in browser from plain text syntax |
| **Next.js** | Frontend framework | Component-based UI; `DiagramCanvas` isolates Mermaid rendering lifecycle cleanly |
| **Node.js** | Runtime | Runs the backend service that proxies requests to Ollama |

---

## Architecture

```
User Prompt
    │
    ▼
detectDirection()        ← infers LR / TD from prompt keywords
cleanPrompt()            ← strips layout words before sending to model
    │
    ▼
buildStructuredPrompt()  ← wraps topic in engineering-specific instructions
    │
    ▼
Ollama API (/api/generate)
    │
    ▼
sanitizeMermaid()        ← cleans, validates, and repairs raw model output
    │
    ▼
Mermaid.render()         ← produces SVG in DiagramCanvas
```

---

## Every Factor Handled in This Project

### 1. Prompt Direction Detection
`detectDirection()` reads the user's prompt for spatial keywords (`vertical`, `top-down`, `horizontal`, `left-right`) and process-type keywords (`flow`, `login`, `auth`, `checkout`) to automatically select `TD` (top-down) or `LR` (left-right) layout. The user never has to specify this manually.

### 2. Prompt Cleaning
`cleanPrompt()` strips layout direction words from the prompt before passing the topic to the model so the model focuses on the domain, not the formatting instructions already handled by the code.

### 3. Structured Prompt Engineering
`buildStructuredPrompt()` wraps the user topic in a carefully engineered system prompt that enforces:
- **Subgraph structure** — minimum 3, maximum 6 subgraphs, each with 2–4 nodes
- **Intra-subgraph arrows** — nodes inside each subgraph must be connected in engineering signal-flow order
- **Inter-subgraph arrows** — written after all subgraph blocks, flowing strictly forward (A → B → C), never backward
- **NodeID consistency** — inter-subgraph arrows must reuse the exact NodeID declared inside the subgraph, preventing floating orphan nodes
- **No duplicate edges** — maximum one arrow between any two nodes
- **Domain-accurate naming** — components must use real 3GPP / IEEE / RFC / ISO entity names (MSC, VLR, HLR, SGSN, GGSN, BSC, BTS, RNC etc.), not invented or paraphrased names
- **Core Network domain split** — when the topic involves a core network, it must be split into Circuit Switched and Packet Switched subgraphs
- **Forbidden arrow syntax** — explicitly lists invalid Mermaid forms the model commonly hallucinates (`===>`, `--o--`, `--->`, `-->|label|`) to prevent parse errors

### 4. Mermaid Sanitizer (`sanitizeMermaid`)
The raw model output goes through a multi-stage cleaning pipeline before reaching Mermaid:

| Stage | What it does |
|---|---|
| Backtick stripping | Removes ` ```mermaid ` fences the model adds despite instructions |
| Header normalisation | Accepts both `graph LR` and `flowchart LR`, converts to `flowchart` |
| Prose truncation | Stops processing at lines starting with `Note:`, `Here `, `This `, `Explanation` |
| Subgraph normalisation | Handles all four subgraph title formats the model uses: quoted, bracket, bare, and well-formed |
| Arrow label stripping | Removes `-->|label|` forms, converts to bare `-->` |
| HTML bracket guard | Drops lines with raw `<>` that aren't arrow syntax, preventing XML injection into Mermaid |
| Curly brace conversion | Converts `{label}` node syntax to `[label]` |
| Label character sanitisation | Strips `'`, `"`, `&`, `(`, `)` from node labels that break Mermaid parsing |
| Node ID registry | Builds a map of all declared NodeIDs and their normalised labels |
| Arrow node resolution | Resolves arrow endpoints against the registry; falls back to original text rather than silently deleting unknown nodes |
| Auto inter-subgraph connection | If no cross-subgraph arrows were generated at all, automatically chains the last node of each subgraph to the first node of the next |

### 5. Arrow Handling (the hardest problem)
Mermaid's flowchart grammar is strict. The following issues were identified and fixed across multiple iterations:

- **Intra-subgraph arrows being dropped** — the `[<>]` filter was blocking `-->` inside subgraphs; fixed by adding `-->` to the filter exemption
- **Inter-subgraph arrows being silently deleted** — the node-resolution pass returned `''` for unresolved IDs; changed to fall back to the original arrow text
- **Floating orphan nodes** — model used short IDs (e.g. `TRAU`) in inter-subgraph arrows that didn't match the declared ID inside the subgraph; fixed in prompt with explicit WRONG/CORRECT examples
- **All arrows pointing back to one node** — model exploited a "feedback path" escape clause; removed the clause and made forward-only flow an absolute rule
- **Duplicate edges** — model drew multiple arrows from one node to several nodes in the same target subgraph; added a one-arrow-per-pair rule

### 6. Model Parameters
Ollama is called with carefully tuned inference parameters:

| Parameter | Value | Reason |
|---|---|---|
| `temperature` | `0.15` | Near-deterministic output; reduces hallucination of node names and arrow syntax |
| `top_p` | `0.85` | Slight nucleus sampling to avoid repetition without introducing randomness |
| `repeat_penalty` | `1.2` | Discourages the model from repeating the same node or connection pattern |
| `num_predict` | `1200` | Enough tokens for a full 12–18 node diagram without runaway generation |

### 7. Error Handling
- Ollama unavailable → throws `'Ollama is not running or model not found'`
- Empty model response → throws with the model name for easier debugging
- Mermaid render failure → caught in `DiagramCanvas`, sets `renderError` state with user-facing message
- All sanitizer stages are defensive — malformed input at any stage degrades gracefully rather than crashing

---

## Why Deployment Has Not Been Done

This project is intentionally **local-only** for the following reasons:

### 1. Ollama Cannot Be Hosted on Standard Cloud Platforms
Ollama requires a machine with sufficient RAM and optionally a GPU to run LLMs. Standard cloud deployment targets (Vercel, Netlify, Railway free tier, Render free tier) do not provide the hardware resources needed to run a 7B parameter model. A dedicated GPU instance (e.g. AWS `g4dn`, GCP `n1-standard` with T4) would be required.

### 2. Cost
Running a GPU instance 24/7 for a demo project is not economically justified. A `g4dn.xlarge` on AWS costs approximately $0.526/hour (~$380/month). Even spot pricing brings this to ~$150/month for always-on availability.

### 3. The Local-First Design Is Intentional
The entire point of using Ollama is that **no data leaves the user's machine**. Deploying to a cloud server would require routing user prompts through a remote endpoint, defeating the privacy-first architecture.

### 4. Model Weights Cannot Be Bundled
The `qwen2.5-coder:7b` model weights (~4.7GB) cannot be bundled into a container image for practical deployment without a purpose-built model serving infrastructure (e.g. Kubernetes with GPU node pools, Triton Inference Server).

### 5. How to Deploy If Needed
If deployment is required, the recommended path is:
- Provision a GPU VM (AWS g4dn, GCP with T4, or RunPod)
- Install Ollama and pull the model on the VM
- Set `OLLAMA_BASE_URL` environment variable to the VM's internal address
- Deploy the Next.js/Node frontend separately on Vercel or Railway
- Secure the Ollama endpoint behind an auth proxy

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL of the Ollama instance |
| `OLLAMA_MODEL` | `qwen2.5-coder:7b` | Model to use for diagram generation |

---

## Local Setup

```bash
# 1. Install Ollama
# https://ollama.com/download

# 2. Pull the model
ollama pull qwen2.5-coder:7b

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

Ollama starts automatically as a background service after installation. The app expects it at `http://localhost:11434` by default.

---

## Known Limitations

- Model may occasionally hallucinate component names despite prompt constraints — the quality check in the prompt catches most cases
- Diagrams with more than 18 nodes may exceed `num_predict: 1200` and get truncated mid-output; increase `num_predict` if needed for complex topics
- The sanitizer handles `-->` only; other Mermaid arrow types (`-.->`, `==>`) are excluded by design to match the sanitizer's node-resolution capability
