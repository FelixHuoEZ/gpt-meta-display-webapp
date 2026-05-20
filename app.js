const samples = [
  {
    text: "总之，北京融合了历史、文化与现代，有许多值得慢慢探索的景点。",
    caption: "Route B sample"
  },
  {
    text: "Web App 只替换显示载体，不自动解决 ChatGPT 内容来源。",
    caption: "Route D note"
  },
  {
    text: "下一步是把当前句通过轻量供给层实时推到眼镜。",
    caption: "Bridge target"
  }
]

const params = new URLSearchParams(window.location.search)
const state = {
  index: 0,
  demoTimer: null,
  source: "boot",
  ws: null,
  wsUrl: params.get("ws") || "",
  showDiag: false
}

const els = {
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  caption: document.getElementById("caption"),
  sourceChip: document.getElementById("source-chip"),
  connChip: document.getElementById("conn-chip"),
  diag: document.getElementById("diag-panel"),
  diagSource: document.getElementById("diag-source"),
  diagWs: document.getElementById("diag-ws"),
  diagUpdated: document.getElementById("diag-updated"),
  diagQuery: document.getElementById("diag-query")
}

const focusables = Array.from(document.querySelectorAll(".focusable"))
let focusedIndex = 0

function stamp() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false })
}

function renderDiagnostics() {
  els.diagSource.textContent = state.source
  els.diagWs.textContent = state.wsUrl ? (state.ws ? "connected" : "connecting/off") : "off"
  els.diagUpdated.textContent = stamp()
  els.diagQuery.textContent = window.location.search || "-"
}

function setSubtitle(text, options = {}) {
  const nextText = (text || "").trim() || "等待字幕输入"
  const nextCaption = options.caption || "等待实时输入"
  state.source = options.source || "manual"
  els.subtitle.textContent = nextText
  els.caption.textContent = nextCaption
  els.sourceChip.textContent = state.source.toUpperCase()
  renderDiagnostics()
}

function setConnection(label) {
  els.connChip.textContent = label
  renderDiagnostics()
}

function activateFocus(index) {
  focusables.forEach((node, idx) => {
    node.classList.toggle("is-focused", idx === index)
  })
  focusedIndex = index
  focusables[focusedIndex]?.focus()
}

function applySample(index, source = "demo") {
  state.index = (index + samples.length) % samples.length
  const item = samples[state.index]
  setSubtitle(item.text, { caption: item.caption, source })
}

function toggleDemo() {
  if (state.demoTimer) {
    clearInterval(state.demoTimer)
    state.demoTimer = null
    setConnection(state.wsUrl ? "WS" : "LOCAL")
    return
  }
  setConnection("DEMO")
  applySample(state.index, "demo")
  state.demoTimer = window.setInterval(() => {
    applySample(state.index + 1, "demo")
  }, 3200)
}

function toggleDiag() {
  state.showDiag = !state.showDiag
  els.diag.classList.toggle("hidden", !state.showDiag)
  renderDiagnostics()
}

function handleAction(action) {
  switch (action) {
    case "prev":
      applySample(state.index - 1, "manual")
      break
    case "next":
      applySample(state.index + 1, "manual")
      break
    case "demo":
      toggleDemo()
      break
    case "diag":
      toggleDiag()
      break
    default:
      break
  }
}

function parseIncoming(payload, fallbackSource) {
  if (typeof payload === "string") {
    return { text: payload, caption: fallbackSource, source: fallbackSource }
  }
  if (payload && typeof payload === "object") {
    if (payload.type === "subtitle" || payload.text) {
      return {
        text: payload.text || "",
        caption: payload.caption || fallbackSource,
        source: payload.source || fallbackSource
      }
    }
  }
  return null
}

function connectBroadcastChannel() {
  if (!("BroadcastChannel" in window)) return
  const channel = new BroadcastChannel("meta-display-subtitle")
  channel.onmessage = (event) => {
    const data = parseIncoming(event.data, "broadcast")
    if (data) setSubtitle(data.text, data)
  }
}

function connectWebSocket() {
  if (!state.wsUrl) return
  try {
    state.ws = new WebSocket(state.wsUrl)
    setConnection("WS")
    state.ws.onopen = () => {
      setConnection("WS-ON")
      renderDiagnostics()
    }
    state.ws.onclose = () => {
      setConnection("WS-OFF")
      state.ws = null
      renderDiagnostics()
    }
    state.ws.onerror = () => {
      setConnection("WS-ERR")
      renderDiagnostics()
    }
    state.ws.onmessage = (event) => {
      let payload = event.data
      try {
        payload = JSON.parse(event.data)
      } catch (_) {
        // Keep plain text.
      }
      const data = parseIncoming(payload, "ws")
      if (data) setSubtitle(data.text, data)
    }
  } catch (_) {
    setConnection("WS-ERR")
  }
}

function bindInputs() {
  focusables.forEach((node) => {
    node.addEventListener("click", () => handleAction(node.dataset.action))
  })

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      event.preventDefault()
      activateFocus((focusedIndex - 1 + focusables.length) % focusables.length)
      return
    }
    if (["ArrowRight", "ArrowDown"].includes(event.key)) {
      event.preventDefault()
      activateFocus((focusedIndex + 1) % focusables.length)
      return
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleAction(focusables[focusedIndex]?.dataset.action)
      return
    }
    if (event.key.toLowerCase() === "d") {
      event.preventDefault()
      toggleDiag()
    }
  })
}

function bootstrapFromQuery() {
  els.title.textContent = params.get("title") || "GPT Meta"
  const text = params.get("text")
  const caption = params.get("caption") || "Route D / Display Web App PoC"
  if (text) {
    setSubtitle(text, { caption, source: "query" })
  } else {
    applySample(0, "boot")
  }
  if (params.get("demo") === "1") {
    toggleDemo()
  }
}

window.metaDisplayPoc = {
  setSubtitle: (text, caption = "manual", source = "devtools") =>
    setSubtitle(text, { caption, source }),
  setConnection
}

bindInputs()
connectBroadcastChannel()
connectWebSocket()
bootstrapFromQuery()
activateFocus(0)
renderDiagnostics()
