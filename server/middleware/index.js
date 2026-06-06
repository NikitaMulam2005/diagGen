import cors from 'cors'
import express from 'express'

export function applyMiddleware(app) {
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' }))
  app.use(express.json({ limit: '2mb' }))
}