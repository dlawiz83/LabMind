"use client"

import type { TabId } from "./tab-bar"

// Inline text renderer: handles **bold**, [Source:...], [VERIFY]
function InlineText({ text }: { text: string }) {
  const TOKEN = /(\*\*[^*]+\*\*|\[Source:[^\]]+\]|\[VERIFY\])/g
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = TOKEN.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index))
    const token = match[1]
    if (token.startsWith("**")) {
      parts.push(<strong key={match.index} className="font-medium text-foreground">{token.slice(2, -2)}</strong>)
    } else if (token.startsWith("[Source:")) {
      parts.push(<span key={match.index} className="text-primary font-mono text-xs">{token}</span>)
    } else {
      // [VERIFY] — build a search query from the text preceding this tag
      const query = text.slice(0, match.index).replace(/\*\*/g, "").replace(/\[Source:[^\]]+\]/g, "").trim()
      const href = `https://www.google.com/search?q=${encodeURIComponent(query || "laboratory supplier")}`
      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 font-mono text-xs font-medium hover:text-amber-700 hover:underline cursor-pointer"
        >
          {token}
        </a>
      )
    }
    lastIdx = match.index + token.length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return <>{parts}</>
}

function parseTableRows(text: string): { headers: string[]; rows: string[][] } | null {
  const tableLines = text.split("\n").filter(l => l.trim().startsWith("|"))
  if (!tableLines.length) return null
  const parsed = tableLines
    .filter(l => !/^[\|:\-\s]+$/.test(l.trim()))
    .map(l => l.trim().split("|").filter(Boolean).map(c => c.trim()))
  if (parsed.length < 1) return null
  return { headers: parsed[0], rows: parsed.slice(1) }
}

function exportMaterialsCSV(text: string) {
  const table = parseTableRows(text)
  if (!table) return
  const escape = (s: string) => `"${s.replace(/"/g, '""').replace(/\[VERIFY\]/g, "").replace(/\*\*/g, "").trim()}"`
  const lines = [
    table.headers.map(escape).join(","),
    ...table.rows.map(r => r.map(escape).join(",")),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "labmind-materials.csv"
  a.click()
  URL.revokeObjectURL(url)
}

function MarkdownSection({ text }: { text: string }) {
  if (!text) {
    return (
      <p className="font-serif text-sm text-muted-foreground italic">Generating…</p>
    )
  }

  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let tableRows: string[][] = []
  let listItems: string[] = []
  let listType: "ul" | "ol" | null = null
  let key = 0

  const flushTable = () => {
    if (!tableRows.length) return
    const [header, ...rows] = tableRows
    elements.push(
      <div key={key++} className="overflow-x-auto my-3">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th key={i} className="text-left pb-2 border-b border-border text-muted-foreground font-mono font-medium pr-6">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border">
                {row.map((cell, j) => (
                  <td key={j} className="py-2 pr-6 font-serif text-xs text-gray-600 align-top">
                    <InlineText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableRows = []
  }

  const flushList = () => {
    if (!listItems.length) return
    if (listType === "ul") {
      elements.push(
        <ul key={key++} className="space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="font-serif text-sm text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 shrink-0 mt-0.5">—</span>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      )
    } else {
      elements.push(
        <ol key={key++} className="space-y-1 my-2 pl-4">
          {listItems.map((item, i) => (
            <li key={i} className="font-serif text-sm text-gray-600 flex items-start gap-2">
              <span className="font-mono text-xs text-primary shrink-0 mt-0.5">{i + 1}.</span>
              <InlineText text={item} />
            </li>
          ))}
        </ol>
      )
    }
    listItems = []
    listType = null
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushTable()
      flushList()
      continue
    }

    if (trimmed.startsWith("|")) {
      flushList()
      if (/^[\|:\-\s]+$/.test(trimmed)) continue // separator row
      const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim())
      tableRows.push(cells)
      continue
    }

    if (/^#{3,4}\s/.test(trimmed)) {
      flushTable()
      flushList()
      elements.push(
        <h4 key={key++} className="font-sans text-sm font-semibold text-foreground mt-4 mb-2">
          <InlineText text={trimmed.replace(/^#{3,4}\s+/, "")} />
        </h4>
      )
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushTable()
      if (listType === "ol") flushList()
      listType = "ul"
      listItems.push(trimmed.replace(/^[-*]\s+/, ""))
      continue
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      flushTable()
      if (listType === "ul") flushList()
      listType = "ol"
      listItems.push(trimmed.replace(/^\d+[.)]\s+/, ""))
      continue
    }

    flushTable()
    flushList()
    elements.push(
      <p key={key++} className="font-serif text-sm text-gray-600 leading-relaxed my-1">
        <InlineText text={trimmed} />
      </p>
    )
  }

  flushTable()
  flushList()

  return <div className="space-y-0.5">{elements}</div>
}

interface TabContentProps {
  activeTab: TabId
  sections: Record<string, string>
}

const tabLabels: Record<string, string> = {
  materials: "Required Materials",
  budget: "Budget Estimate",
  timeline: "Project Timeline",
  validation: "Validation Criteria",
  biosafety: "Biosafety Assessment",
}

export function TabContent({ activeTab, sections }: TabContentProps) {
  if (activeTab === "protocol") return null

  const sectionKey = activeTab
  const content = sections[sectionKey] ?? ""
  const label = tabLabels[sectionKey] ?? activeTab
  const showExport = activeTab === "materials" && !!content && !!parseTableRows(content)

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-sans text-sm font-medium text-foreground">{label}</h3>
        {showExport && (
          <button
            onClick={() => exportMaterialsCSV(content)}
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2.5 py-1 hover:bg-accent transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M6 1v7M3 5.5l3 3 3-3M1.5 10h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export CSV
          </button>
        )}
      </div>
      <MarkdownSection text={content} />
    </div>
  )
}
