const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b'

function detectDirection(userPrompt) {
  if (/vertical|top.?down|portrait/i.test(userPrompt)) return 'TD'
  if (/horizontal|left.?right|landscape/i.test(userPrompt)) return 'LR'
  if (/flow|process|login|signup|auth|checkout|workflow|sequence/i.test(userPrompt)) return 'TD'
  return 'LR'
}

function cleanPrompt(userPrompt) {
  return userPrompt
    .replace(/vertically|horizontally|vertical|horizontal|top.?down|left.?right|portrait|landscape/gi, '')
    .trim()
}

function sanitizeMermaid(raw) {
  let sgCounter = 0
  let insideSubgraph = false

  const lines = raw
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .split('\n')
    .map(l => l.trimEnd())

  const cleaned = []
  let foundHeader = false

  for (let line of lines) {
    if (!foundHeader && line.trim() === '') continue

    if (!foundHeader && /^(graph|flowchart)\s+(LR|TD|RL|BT)/i.test(line.trim())) {
      foundHeader = true
      cleaned.push(line.trim().replace(/^graph\s+/i, 'flowchart '))
      continue
    }

    if (!foundHeader) continue

    if (/^(Note:|Here |This |The above|Explanation)/i.test(line.trim())) break

    const isSubgraph = /^\s*subgraph\b/i.test(line)
    const isEnd = /^\s*end\s*$/.test(line.trim())

    if (isSubgraph) {
      insideSubgraph = true
      if (/^\s*subgraph\s+\w+\s*\["/.test(line)) {
        cleaned.push('  ' + line.trim()); continue
      }
      const quotedOnly = line.match(/^\s*subgraph\s+"([^"]+)"\s*$/)
      if (quotedOnly) {
        sgCounter++
        cleaned.push(`  subgraph SG${sgCounter}["${quotedOnly[1]}"]`); continue
      }
      const bracketForm = line.match(/^\s*subgraph\s+(\w+)\s*\[([^\]]+)\]/)
      if (bracketForm) {
        cleaned.push(`  subgraph ${bracketForm[1]}["${bracketForm[2]}"]`); continue
      }
      const bareTitle = line.match(/^\s*subgraph\s+(.+)$/)
      if (bareTitle) {
        sgCounter++
        cleaned.push(`  subgraph SG${sgCounter}["${bareTitle[1].trim()}"]`); continue
      }
      continue
    }

    if (isEnd) {
      insideSubgraph = false
      cleaned.push('  end')
      continue
    }

    line = line.replace(/-->\|[^|]*\|/g, '-->')
    line = line.replace(/--[^-\n][^>\n]*-->/g, '-->')
    line = line.replace(/\{([^}]+)\}/g, (_, l) => `[${l}]`)

    if (/^\s*(style|classDef|class|click)\s/i.test(line)) continue
    if (/[<>]/.test(line) && !/subgraph|end|-->/.test(line)) continue

    line = line.replace(/\[([^\]]+)\]/g, (_, label) =>
  `[${label.replace(/['"&()]/g, '').replace(/\s+/g, ' ').trim()}]`
)
    line = line.replace(/;$/, '')

    if (line.trim() === '') continue
    cleaned.push(insideSubgraph ? '    ' + line.trim() : '  ' + line.trim())
  }


  const nodeMap = {}
  const declaredIds = new Set()
  for (const line of cleaned) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\[([^\]]+)\]/)
    if (m) {
      declaredIds.add(m[1])
      nodeMap[m[2].toLowerCase().replace(/\s+/g, '')] = m[1]
    }
  }

  const fixed = cleaned.map(line => {
    if (!line.includes('-->')) return line
   return line.replace(/\b([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)\b/g, (_, from, to) => {
      const f = declaredIds.has(from) ? from : (nodeMap[from.toLowerCase().replace(/[\s\-]/g, '')] || from)
      const t = declaredIds.has(to) ? to : (nodeMap[to.toLowerCase().replace(/[\s\-]/g, '')] || to)
      if (!declaredIds.has(f) || !declaredIds.has(t)) return `${from} --> ${to}`
      return `${f} --> ${t}`
    })
  })

  const subgraphNodes = []
  let currentNodes = []
  let inSub = false

  for (const line of fixed) {
    if (/^\s*subgraph\s/i.test(line)) { inSub = true; currentNodes = []; continue }
    if (/^\s*end\s*$/.test(line.trim())) {
      if (inSub && currentNodes.length) subgraphNodes.push([...currentNodes])
      inSub = false; continue
    }
    if (inSub) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\[/)
      if (m) currentNodes.push(m[1])
    }
  }

  const hasInterArrows = fixed.some(line => {
    if (!line.includes('-->')) return false
    const m = line.match(/([A-Za-z0-9_]+)\s*-->\s*([A-Za-z0-9_]+)/)
    if (!m) return false
    const fromSub = subgraphNodes.findIndex(g => g.includes(m[1]))
    const toSub = subgraphNodes.findIndex(g => g.includes(m[2]))
    return fromSub !== -1 && toSub !== -1 && fromSub !== toSub
  })

  const result = [...fixed]
  if (!hasInterArrows && subgraphNodes.length >= 2) {
    for (let i = 0; i < subgraphNodes.length - 1; i++) {
      const fromNode = subgraphNodes[i][subgraphNodes[i].length - 1]
      const toNode = subgraphNodes[i + 1][0]
      if (fromNode && toNode) result.push(`  ${fromNode} --> ${toNode}`)
    }
  }

  return result.filter(l => l.trim() !== '').join('\n').trim()
}

function buildStructuredPrompt(userPrompt) {
  const direction = detectDirection(userPrompt)
  const topic = cleanPrompt(userPrompt)

  return `You are a senior software architect and engineering diagram expert.

TASK: Generate a complete, accurate, detailed Mermaid diagram for: "${topic}"

THINKING PROCESS — before writing code, mentally answer these:
1. What are the main subsystems of this topic?
2. What components exist inside each subsystem?
3. What is the correct data/control flow between subsystems?
4. What are the real technical names used by engineers for these components?

OUTPUT RULES — follow every single one:
- Output ONLY raw Mermaid syntax. Zero explanation, zero backticks, zero markdown.
- First line MUST be: flowchart ${direction}
- YOU MUST USE SUBGRAPHS. A flat list of nodes is WRONG. Group every 2-4 related nodes into a named subgraph.
- Minimum 3 subgraphs, maximum 6 subgraphs.
- Each subgraph MUST have 2 to 4 internal nodes. A subgraph with only 1 node is WRONG.
- NEVER put labels on arrows. Arrows must be bare: A --> B not A -->|label| B
- Nodes use real engineering terminology — no generic words like "Module", "Process".
- Use only exact standard entity names from the relevant specification (3GPP / IEEE / RFC / ISO). Do not invent or paraphrase component names. Examples of correct names: MSC, VLR, HLR, SGSN, GGSN, IWF, MGW, BSC, BTS, RNC, NodeB, PCRF, SGW, PGW.
- All nodes use rectangular brackets: NodeID[Label Text]
- Maximum one arrow between any two nodes across the entire diagram. No duplicate edges.
- No bidirectional arrows.
- Total node count: 12 to 18 nodes.
- Connect subgraphs by drawing arrows between nodes that belong to different subgraphs.
- flowchart direction is ${direction} — do not change this.
- If the topic involves a Core Network, it MUST be split into separate subgraphs for Circuit Switched domain and Packet Switched domain.

- CRITICAL: Every subgraph MUST have nodes declared on separate lines AND arrows connecting them inside the block.
- An empty subgraph or a subgraph with nodes but no internal arrows is WRONG.
- Inside each subgraph, connect nodes in the exact order data flows through them in engineering practice.
- WRONG — nodes declared but not connected inside the subgraph:
    subgraph A["Subsystem A"]
      A1[Component 1]
      A2[Component 2]
    end
- CORRECT — nodes declared AND connected with --> inside the subgraph:
    subgraph A["Subsystem A"]
      A1[Component 1]
      A2[Component 2]
      A1 --> A2
    end

- CRITICAL: After defining all subgraphs, you MUST add inter-subgraph arrows connecting them in logical flow order.
- Every subgraph must have at least one arrow coming IN and one arrow going OUT (except the first and last).
- Inter-subgraph arrows MUST use the EXACT SAME NodeID that was declared inside the subgraph.
- Every NodeID used in ANY arrow must be declared inside a subgraph block. No node may exist outside a subgraph.
- If you need a component like GMSC, HLR, or PGW in an arrow, it MUST first be declared inside a subgraph:
    subgraph C["Core Network CS Domain"]
      GMSC[Gateway MSC GMSC]
      HLR[Home Location Register HLR]
      GMSC --> HLR
    end
    then use GMSC or HLR in inter-subgraph arrows.
- Inter-subgraph arrows flow FORWARD only. No exceptions.
- If subgraph A is defined before subgraph B, the only valid direction is A --> B, never B --> A.
- DO NOT create arrows that point back to nodes in earlier subgraphs. No exceptions.
- Maximum one inter-subgraph arrow between any two nodes. Do not draw multiple arrows from one node to different nodes in the same target subgraph.
- WRONG — one node connecting to multiple nodes in the same target subgraph:
    BSC --> MSC
    BSC --> VLR
    BSC --> SGSN
- CORRECT — one node connects to one entry point of the next subgraph:
    BSC --> MSC
- WRONG — later subgraphs pointing back to a node in the first subgraph:
    A2 --> B1
    A2 --> C1
    A2 --> D1
- WRONG — using a NodeID that was not declared inside any subgraph:
    subgraph A["Subsystem A"]
      A1[Component 1]
      A2[Component 2]
      A1 --> A2
    end
    TRAU --> B1
- CORRECT — each subgraph connects only to the next one in sequence using exact declared NodeIDs:
    A2 --> B1
    B2 --> C1
    C2 --> D1

CORRECT full pattern:
flowchart LR
  subgraph A["Subsystem A"]
    A1[Component 1]
    A2[Component 2]
    A1 --> A2
  end
  subgraph B["Subsystem B"]
    B1[Component 3]
    B2[Component 4]
    B1 --> B2
  end
  subgraph C["Subsystem C"]
    C1[Component 5]
    C2[Component 6]
    C1 --> C2
  end
  A2 --> B1
  B2 --> C1

WRONG — subgraphs with no connections between them:
flowchart LR
  subgraph A["Subsystem A"]
    A1[Component 1] --> A2[Component 2]
  end
  subgraph B["Subsystem B"]
    B1[Component 3] --> B2[Component 4]
  end

QUALITY CHECK — before finalizing, verify:
- Does the diagram reflect how this system actually works in practice?
- Are all component names real entities from 3GPP / IEEE / RFC / ISO specifications? Do not invent or paraphrase names.
- Is the flow logical from input to output?
- Are subgraphs properly connected to each other?
- Does each subgraph contain at least 2 nodes with arrows between them?
- Do all inter-subgraph arrows use NodeIDs that were explicitly declared inside a subgraph?
- Do inter-subgraph arrows flow strictly forward — A to B to C — with zero backward arrows?
- Is there a maximum of one arrow between any two nodes in the entire diagram?
- Are there any NodeIDs used in arrows that were not declared inside a subgraph block? If yes, fix it.
- If the topic involves Core Network, is it split into Circuit Switched and Packet Switched subgraphs?`
}

export async function generateWithOllama(prompt) {
  const structuredPrompt = buildStructuredPrompt(prompt)

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: structuredPrompt,
      stream: false,
      options: {
        temperature: 0.15,
        top_p: 0.85,
        repeat_penalty: 1.2,
        num_predict: 1200,
      },
    }),
  })

  if (!res.ok) throw new Error('Ollama is not running or model not found')
  const data = await res.json()
  if (!data.response) throw new Error(`Model "${MODEL}" returned empty response`)

  const sanitized = sanitizeMermaid(data.response)
  console.log('SANITIZED:', sanitized)
  return sanitized
}