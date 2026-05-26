type EntryMode = 'bff' | 'fastapi-v1' | 'fastapi-v2'

function $(id: string): HTMLElement {
  const el = document.getElementById(id)
  if (!el) throw new Error(`#${id} not found`)
  return el
}

function log(data: unknown) {
  const pre = $('rawLog') as HTMLPreElement
  pre.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
}

function entryMode(): EntryMode {
  return ($('entryMode') as HTMLSelectElement).value as EntryMode
}

function authHeaders(): Record<string, string> {
  const token = ($('authToken') as HTMLInputElement).value.trim()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const mode = entryMode()
  let url = path
  if (mode === 'bff') {
    url = path.startsWith('/api') ? path : `/api/research${path}`
  } else {
    const base = '/paper-api'
    url = `${base}${path}`
  }
  return fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers as Record<string, string>) },
  })
}

function setupTabs() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.tabs button')
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'))
      $(`panel-${btn.dataset.tab}`).classList.add('active')
    })
  })
}

function renderIdeaCards(ideas: unknown) {
  const root = $('ideaCards')
  root.innerHTML = ''
  if (!Array.isArray(ideas)) return
  for (const idea of ideas) {
    const card = document.createElement('div')
    card.className = 'card'
    const o = idea as Record<string, unknown>
    card.innerHTML = `<h3>${String(o.title ?? '')}</h3>
      <p><strong>field:</strong> ${String(o.field ?? '')}</p>
      <p>${String(o.coreObservation ?? o.description ?? '')}</p>
      <p><strong>hypothesis:</strong> ${String(o.hypothesis ?? '')}</p>`
    root.appendChild(card)
  }
}

async function runIdea() {
  const projectId = ($('projectId') as HTMLInputElement).value.trim()
  const text = ($('ideaText') as HTMLTextAreaElement).value.trim()
  const field = ($('ideaField') as HTMLInputElement).value.trim()
  const fulltext = ($('ideaFulltext') as HTMLInputElement).checked
  const mode = entryMode()

  try {
    if (mode === 'bff') {
      const path = fulltext ? '/ideas/generate/fulltext' : '/ideas/generate'
      const body = fulltext
        ? { projectId, field, target_chars: 6000, overlap_chars: 300 }
        : { projectId: projectId || 'lab-local', selectedText: text, text, field, contract: 'v2' }
      const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      log(json)
      renderIdeaCards(json.ideas)
      return
    }

    if (fulltext) {
      const path =
        mode === 'fastapi-v2'
          ? '/api/v1/remake/idea/fulltext/v2'
          : '/api/v1/remake/idea/fulltext'
      const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          target_chars: 6000,
          overlap_chars: 300,
          ...(mode === 'fastapi-v2' ? { field } : {}),
        }),
      })
      const json = await res.json()
      log(json)
      renderIdeaCards(mode === 'fastapi-v2' ? json.ideas : json.ideas)
      return
    }

    const path =
      mode === 'fastapi-v2' ? '/api/v1/remake/idea/v2' : '/api/v1/remake/idea'
    const res = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId || 'lab-local',
        selected_text: text,
        context: null,
        ...(mode === 'fastapi-v2' ? { field } : {}),
      }),
    })
    const json = await res.json()
    log(json)
    renderIdeaCards(mode === 'fastapi-v2' ? json.ideas : json.ideas)
  } catch (e) {
    log(String(e))
  }
}

async function runPlot(recommendOnly: boolean, sample = false) {
  const mode = entryMode()
  const fileInput = $('plotFile') as HTMLInputElement
  const templateId = ($('templateId') as HTMLInputElement).value.trim()
  const useLlm = ($('useLlm') as HTMLInputElement).checked
  const projectId = ($('projectId') as HTMLInputElement).value.trim()

  let file: File | null = fileInput.files?.[0] ?? null
  if (sample) {
    const res = await fetch('/sample.csv')
    const blob = await res.blob()
    file = new File([blob], 'sample.csv', { type: 'text/csv' })
  }
  if (!file && !recommendOnly) {
    log('请选择文件或点击「用内置 sample.csv」')
    return
  }

  try {
    if (recommendOnly) {
      const body = {
        raw_text: file ? await file.text() : undefined,
        use_llm_type_detection: useLlm,
        template_id: templateId || undefined,
      }
      if (mode === 'bff') {
        const res = await apiFetch('/plots/recommend?contract=v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        log(await res.json())
        return
      }
      const path =
        mode === 'fastapi-v2'
          ? '/api/v1/data/plot/recommend/v2'
          : '/api/v1/data/plot/recommend'
      const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: body.raw_text,
          use_llm_type_detection: useLlm,
          template_id: templateId || undefined,
        }),
      })
      log(await res.json())
      return
    }

    const form = new FormData()
    if (file) form.append('file', file)
    if (projectId) form.append('project_id', projectId)
    if (templateId) form.append('template_id', templateId)
    form.append('use_llm_type_detection', String(useLlm))
    form.append('auto_recommend', 'true')

    let path = '/plots/generate'
    if (mode === 'fastapi-v1') path = '/api/v1/data/plot'
    if (mode === 'fastapi-v2') path = '/api/v1/data/plot/v2'
    if (mode === 'bff') path = '/plots/generate?contract=v2'

    const res = await apiFetch(path, { method: 'POST', body: form })
    const json = await res.json()
    log(json)
    const img = (json.image ?? json.plot_base64) as string | undefined
    const preview = $('plotPreview') as HTMLImageElement
    if (img) preview.src = img.startsWith('data:') ? img : `data:image/png;base64,${img}`
  } catch (e) {
    log(String(e))
  }
}

async function runParity() {
  try {
    const res = await apiFetch('/parity')
    log(await res.json())
  } catch (e) {
    log(String(e))
  }
}

async function runHealth() {
  try {
    const res = await fetch('/paper-api/health')
    log(await res.json())
  } catch (e) {
    log(String(e))
  }
}

setupTabs()
$('btnIdea').addEventListener('click', () => void runIdea())
$('btnPlot').addEventListener('click', () => void runPlot(false))
$('btnPlotRecommend').addEventListener('click', () => void runPlot(true))
$('btnPlotSample').addEventListener('click', () => void runPlot(false, true))
$('btnParity').addEventListener('click', () => void runParity())
$('btnHealth').addEventListener('click', () => void runHealth())

const saved = localStorage.getItem('aios_auth_token') || localStorage.getItem('aios_itoken')
if (saved) ($('authToken') as HTMLInputElement).value = saved
