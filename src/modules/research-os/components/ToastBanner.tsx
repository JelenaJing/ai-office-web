import { useEffect } from 'react'
import { useProjectStore } from '../store/projectStore'

export function ToastBanner() {
  const message = useProjectStore(s => s.toastMessage)
  const clear = useProjectStore(s => s.clearToast)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => clear(), 3200)
    return () => clearTimeout(t)
  }, [message, clear])

  if (!message) return null

  return (
    <div
      role="status"
      className="fixed left-1/2 top-24 z-[220] -translate-x-1/2 rounded-2xl border-2 border-cyan-300 bg-white px-8 py-4 text-xl font-bold text-slate-950 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
    >
      <span className="mr-3 inline-flex h-3 w-3 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
      {message}
    </div>
  )
}
