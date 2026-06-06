const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function generateDiagram(prompt) {
  const res = await fetch(`${BASE}/api/generate-diagram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Generation failed')
  return data.mermaidCode
}

export async function fetchLibrary() {
  const res = await fetch(`${BASE}/api/library`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not load library')
  return data.diagrams
}

export async function saveDiagram({ prompt, mermaidCode }) {
  const res = await fetch(`${BASE}/api/library`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mermaidCode }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not save')
  return data.diagram
}

export async function deleteDiagram(id) {
  const res = await fetch(`${BASE}/api/library/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Could not delete')
}