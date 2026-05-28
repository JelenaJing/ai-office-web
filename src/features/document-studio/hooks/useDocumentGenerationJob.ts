import { useCallback, useEffect, useRef, useState } from 'react'
import { createDocumentJob, fetchJob } from '../services/documentStudioApi'

export function useDocumentGenerationJob() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [progressStage, setProgressStage] = useState<string>('')
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fallback, setFallback] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [jobSource, setJobSource] = useState<string | undefined>(undefined)
  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => () => clearTimer(), [])

  const poll = useCallback((id: string) => {
    clearTimer()
    timerRef.current = window.setInterval(async () => {
      try {
        const job = await fetchJob(id)
        setStatus(job.status)
        setProgressStage(job.progressStage || '')
        setFallback(Boolean(job.fallback))
        setFallbackReason(typeof job.fallbackReason === 'string' ? job.fallbackReason : null)
        if (typeof (job as { source?: string }).source === 'string') {
          setJobSource((job as { source?: string }).source)
        }
        if (job.status === 'succeeded' && job.documentId) {
          setDocumentId(job.documentId)
          clearTimer()
        }
        if (job.status === 'failed' || job.status === 'pending') {
          setError(job.error || '生成未完成')
          clearTimer()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        clearTimer()
      }
    }, 1500)
  }, [])

  const start = useCallback(
    async (input: {
      documentType: string
      capabilityId: string
      fields: Record<string, unknown>
      language?: string
      tone?: string
    }) => {
      setError(null)
      setDocumentId(null)
      setStatus('queued')
      const res = await createDocumentJob(input)
      setJobId(res.jobId)
      setStatus(res.status)
      setProgressStage(res.progressStage || '正在分析文稿类型')
      poll(res.jobId)
    },
    [poll],
  )

  const reset = useCallback(() => {
    clearTimer()
    setJobId(null)
    setStatus('idle')
    setProgressStage('')
    setDocumentId(null)
    setError(null)
    setFallback(false)
    setFallbackReason(null)
    setJobSource(undefined)
  }, [])

  return {
    jobId,
    status,
    progressStage,
    documentId,
    error,
    fallback,
    fallbackReason,
    jobSource,
    start,
    reset,
  }
}
