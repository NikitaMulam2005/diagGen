import express from 'express'
import dotenv from 'dotenv'
import { applyMiddleware } from './middleware/index.js'
import diagramRoutes from './routes/diagram.js'
import libraryRoutes from './routes/library.js'

dotenv.config()

const app = express()
applyMiddleware(app)

app.use('/api', diagramRoutes)
app.use('/api', libraryRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))