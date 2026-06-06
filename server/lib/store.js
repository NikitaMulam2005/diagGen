import { readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '../data/library.json')

export async function readLibrary() {
  try {
    const raw = await readFile(DB_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return [] 
  }
}

export async function writeLibrary(diagrams) {
  const { mkdir } = await import('fs/promises')
  await mkdir(join(__dirname, '../data'), { recursive: true })
  await writeFile(DB_PATH, JSON.stringify(diagrams, null, 2))
}