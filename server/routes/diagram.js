import { Router } from 'express'
import { generateWithOllama } from '../lib/ollama.js'

const router = Router()

router.post('/generate-diagram', async (req, res) => {
  const { prompt } = req.body

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  try {
    const mermaidCode = await generateWithOllama(prompt)
    res.json({ mermaidCode })
  } catch (err) {
    console.error('Generate error:', err.message)
    res.status(500).json({ error: err.message || 'Generation failed' })
  }
})

export default router