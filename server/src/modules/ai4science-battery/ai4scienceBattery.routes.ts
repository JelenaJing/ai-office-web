import { Router } from 'express'
import {
  generateBatteryLifeMarkdownReport,
  type BatteryAnalysisInput,
} from './batteryLifeAnalysisService'
import {
  ai4scienceBatteryInputInfo,
  requestAi4scienceBattery,
} from './ai4scienceBatteryPythonService'

const router = Router()

function sendError(res: import('express').Response, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const input = ai4scienceBatteryInputInfo()
  const suffix = input.exists
    ? ''
    : `；当前未找到 cycle_life.xlsx（服务端查找路径：${input.inputPath}）。可通过 AI4SCIENCE_CYCLE_LIFE_XLSX 指定。`
  res.status(500).json({ success: false, error: `${message}${suffix}` })
}

router.get('/meta', async (_req, res) => {
  try {
    const result = await requestAi4scienceBattery('meta')
    res.json(result)
  } catch (error) {
    sendError(res, error)
  }
})

router.get('/life/raw', async (_req, res) => {
  try {
    const result = await requestAi4scienceBattery('life_raw')
    res.json(result)
  } catch (error) {
    sendError(res, error)
  }
})

router.post('/life/predict', async (req, res) => {
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {}
    const result = await requestAi4scienceBattery('predict', payload)
    res.json(result)
  } catch (error) {
    sendError(res, error)
  }
})

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

router.post('/analyze', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {}
    const formulation =
      body.formulation && typeof body.formulation === 'object'
        ? (body.formulation as Record<string, number>)
        : {}
    const experimentRows = Array.isArray(body.experimentRows)
      ? body.experimentRows.map((row) => {
          const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
          return {
            fileName: String(r.fileName ?? ''),
            tempC: numOrNull(r.tempC) ?? 25,
            kneeCycle: numOrNull(r.kneeCycle),
            capAtKnee: numOrNull(r.capAtKnee),
            criticalCycle: numOrNull(r.criticalCycle),
          }
        })
      : []

    const input: BatteryAnalysisInput = {
      n80_25: numOrNull(body.n80_25),
      n80_45: numOrNull(body.n80_45),
      knee25: numOrNull(body.knee25),
      knee45: numOrNull(body.knee45),
      capAtKnee25: numOrNull(body.capAtKnee25),
      capAtKnee45: numOrNull(body.capAtKnee45),
      critical25: numOrNull(body.critical25),
      critical45: numOrNull(body.critical45),
      maxCycle: numOrNull(body.maxCycle),
      capAtMax25: numOrNull(body.capAtMax25),
      capAtMax45: numOrNull(body.capAtMax45),
      formulation,
      extraAdditiveName: String(body.extraAdditiveName ?? 'None'),
      extraAdditiveAmount: numOrNull(body.extraAdditiveAmount) ?? 0,
      experimentRows,
      userEntryCount: Number(body.userEntryCount) || experimentRows.length,
    }

    const { markdown, configured } = await generateBatteryLifeMarkdownReport(input)
    res.json({ markdown, llmConfigured: configured })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: message })
  }
})

export default router

