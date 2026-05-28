import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import fs from 'fs'
import path from 'path'

const SERVER_ROOT = path.resolve(__dirname, '../../..')
const PYTHON_DIR = path.join(SERVER_ROOT, 'python', 'ai4science_battery')
const SERVICE_SCRIPT = path.join(PYTHON_DIR, 'stdio_service.py')

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

let child: ChildProcessWithoutNullStreams | null = null
let stdoutBuffer = ''
let stderrTail = ''
let seq = 0
const pending = new Map<string, PendingRequest>()

function resolvePythonBin(): string {
  return (
    process.env.AI4SCIENCE_PYTHON?.trim() ||
    process.env.PYTHON_BIN?.trim() ||
    process.env.AI_OFFICE_PYTHON?.trim() ||
    'python3'
  )
}

function cycleLifeInputPath(): string {
  return (
    process.env.AI4SCIENCE_CYCLE_LIFE_XLSX?.trim() ||
    process.env.CYCLE_LIFE_XLSX?.trim() ||
    path.resolve(SERVER_ROOT, '../../ai4science/cycle_life.xlsx')
  )
}

function rejectAllPending(error: Error): void {
  for (const [, item] of pending) {
    clearTimeout(item.timer)
    item.reject(error)
  }
  pending.clear()
}

function startWorker(): ChildProcessWithoutNullStreams {
  if (child && !child.killed) return child
  if (!fs.existsSync(SERVICE_SCRIPT)) {
    throw new Error(`ai4science Python worker 不存在：${SERVICE_SCRIPT}`)
  }

  const inputPath = cycleLifeInputPath()
  child = spawn(resolvePythonBin(), [SERVICE_SCRIPT], {
    cwd: PYTHON_DIR,
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      CYCLE_LIFE_XLSX: inputPath,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  stdoutBuffer = ''
  stderrTail = ''

  child.stdout.on('data', (chunk) => {
    stdoutBuffer += String(chunk)
    const lines = stdoutBuffer.split(/\r?\n/)
    stdoutBuffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      let msg: { id?: string; ok?: boolean; result?: unknown; error?: string; trace?: string }
      try {
        msg = JSON.parse(trimmed)
      } catch {
        continue
      }
      const id = String(msg.id || '')
      const item = pending.get(id)
      if (!item) continue
      clearTimeout(item.timer)
      pending.delete(id)
      if (msg.ok) item.resolve(msg.result)
      else item.reject(new Error(msg.error || msg.trace || 'ai4science worker failed'))
    }
  })

  child.stderr.on('data', (chunk) => {
    stderrTail = `${stderrTail}${String(chunk)}`.slice(-4000)
  })

  child.on('error', (error) => {
    rejectAllPending(error)
    child = null
  })
  child.on('close', (code) => {
    rejectAllPending(new Error(stderrTail || `ai4science worker exited with code ${code}`))
    child = null
  })

  return child
}

export async function requestAi4scienceBattery<T>(
  action: 'meta' | 'life_raw' | 'predict',
  payload: Record<string, unknown> = {},
): Promise<T> {
  const proc = startWorker()
  const id = String(++seq)
  const timeoutMs = action === 'predict' ? 120_000 : 180_000

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`ai4science ${action} 请求超时`))
    }, timeoutMs)

    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject,
      timer,
    })

    proc.stdin.write(`${JSON.stringify({ id, action, payload })}\n`, 'utf-8', (error) => {
      if (!error) return
      clearTimeout(timer)
      pending.delete(id)
      reject(error)
    })
  })
}

export function ai4scienceBatteryInputInfo(): { inputPath: string; exists: boolean } {
  const inputPath = cycleLifeInputPath()
  return { inputPath, exists: fs.existsSync(inputPath) }
}

