import { Router } from 'express'
import { readLibrary, writeLibrary } from '../lib/store.js'

const router = Router()

// GET /api/library — LibraryView reads this to populate the diagrams grid
router.get('/library', async (req, res) => {
  try {
    const diagrams = await readLibrary()
    res.json({ diagrams })
  } catch {
    res.status(500).json({ error: 'Could not load library' })
  }
})

// POST /api/library — EditorView's onSave() calls this to persist a diagram
router.post('/library', async (req, res) => {
  const { title, prompt, mermaidCode } = req.body
  if (!mermaidCode) return res.status(400).json({ error: 'mermaidCode is required' })

  try {
    const diagrams = await readLibrary()
    const newDiagram = {
      id: Date.now().toString(),
      title: title || prompt?.slice(0, 40) || 'Untitled',
      desc: prompt || '',
      mermaidCode,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    diagrams.unshift(newDiagram)
    await writeLibrary(diagrams)
    res.status(201).json({ diagram: newDiagram })
  } catch {
    res.status(500).json({ error: 'Could not save diagram' })
  }
})

// DELETE /api/library/:id
router.delete('/library/:id', async (req, res) => {
  try {
    const diagrams = await readLibrary()
    const filtered = diagrams.filter(d => d.id !== req.params.id)
    await writeLibrary(filtered)
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Could not delete diagram' })
  }
})

export default router