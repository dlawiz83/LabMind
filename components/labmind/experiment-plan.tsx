"use client"

import { useState } from "react"
import { saveCorrection } from "@/lib/corrections"

interface ParsedStep {
  number: string
  title: string
  body: string
}

function parseProtocolSteps(markdown: string): ParsedStep[] {
  const steps: ParsedStep[] = []
  const blocks = markdown.split(/\n(?=\d+[.)]\s)/)

  for (const block of blocks) {
    const lines = block.split("\n")
    const match = lines[0].match(/^(\d+)[.)]\s+(.*)/)
    if (!match) continue

    const number = match[1]
    const rawHead = match[2].replace(/\*\*/g, "").trim()

    // Split "Title: description" or keep whole thing as title
    const colonIdx = rawHead.indexOf(":")
    let title: string
    let bodyPrefix: string

    if (colonIdx > 0 && colonIdx < 60) {
      title = rawHead.slice(0, colonIdx).trim()
      bodyPrefix = rawHead.slice(colonIdx + 1).trim()
    } else {
      title = rawHead
      bodyPrefix = ""
    }

    const rest = lines.slice(1).join("\n").trim()
    const body = [bodyPrefix, rest].filter(Boolean).join("\n").trim()
    steps.push({ number, title, body })
  }

  return steps
}

// Renders inline tokens: **bold**, [Source:...], [VERIFY]
function tokenize(text: string): React.ReactNode[] {
  const TOKEN = /(\*\*[^*]+\*\*|\[Source:[^\]]+\]|\[VERIFY\])/g
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = TOKEN.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index))
    const token = match[1]
    if (token.startsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith("[Source:")) {
      parts.push(<span key={match.index} className="text-primary font-mono text-xs">{token}</span>)
    } else {
      parts.push(<span key={match.index} className="text-amber-600 font-mono text-xs font-medium">{token}</span>)
    }
    lastIdx = match.index + token.length
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts
}

function StepBody({ text }: { text: string }) {
  const listItems: string[] = []
  const paragraphs: string[] = []

  for (const line of text.split("\n")) {
    const t = line.trim()
    if (!t) continue
    if (/^[-*]\s+/.test(t)) {
      listItems.push(t.replace(/^[-*]\s+/, ""))
    } else {
      paragraphs.push(t)
    }
  }

  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => (
        <p key={i} className="font-serif text-sm text-gray-600 leading-relaxed">
          {tokenize(p)}
        </p>
      ))}
      {listItems.length > 0 && (
        <ul className="mt-1 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="font-serif text-xs text-gray-500 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5 shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ExperimentPlanProps {
  hypothesis: string
  markdownProtocol: string
  onStepClick: (step: { number: string; title: string; content: string }) => void
  selectedStepTitle: string | null
}

export function ExperimentPlan({
  hypothesis,
  markdownProtocol,
  onStepClick,
  selectedStepTitle,
}: ExperimentPlanProps) {
  const steps = parseProtocolSteps(markdownProtocol)
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [correctionText, setCorrectionText] = useState("")

  function openEdit(e: React.MouseEvent, stepNumber: string) {
    e.stopPropagation()
    setEditingStep(stepNumber)
    setCorrectionText("")
  }

  function handleSave(e: React.MouseEvent, stepTitle: string) {
    e.stopPropagation()
    if (correctionText.trim()) {
      saveCorrection(hypothesis, stepTitle, correctionText.trim())
    }
    setEditingStep(null)
    setCorrectionText("")
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation()
    setEditingStep(null)
    setCorrectionText("")
  }

  return (
    <article className="py-8">
      <header className="mb-8 pb-6 border-b border-border">
        <h1 className="font-sans text-2xl font-semibold text-foreground leading-tight mb-4 text-balance">
          Experiment Plan
        </h1>
        {hypothesis && (
          <div className="pl-4 border-l-2 border-primary">
            <p className="font-serif text-sm text-gray-600 leading-relaxed italic">
              {hypothesis}
            </p>
          </div>
        )}
      </header>

      {/* Loading skeleton while streaming hasn't produced steps yet */}
      {steps.length === 0 && markdownProtocol.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pl-4 border-l border-border animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-2 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Fallback: show raw text if parser finds no numbered steps */}
      {steps.length === 0 && markdownProtocol.length > 0 && (
        <div className="font-serif text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {markdownProtocol}
        </div>
      )}

      {steps.length > 0 && (
        <ol className="space-y-4">
          {steps.map((step) => {
            const isSelected = selectedStepTitle === step.title
            const isEditing = editingStep === step.number
            return (
              <li
                key={step.number}
                onClick={() => onStepClick({ number: step.number, title: step.title, content: step.body })}
                className={`pl-4 border-l cursor-pointer transition-colors group ${
                  isSelected ? "border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-primary font-medium shrink-0">
                    {step.number.padStart(2, "0")}
                  </span>
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-sans text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {step.title}
                      </h3>
                      <button
                        onClick={(e) => openEdit(e, step.number)}
                        className="font-mono text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-foreground"
                        title="Correct this step"
                      >
                        ✏ Correct this step
                      </button>
                    </div>
                    {step.body && <StepBody text={step.body} />}
                    {isEditing && (
                      <div
                        className="mt-3 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          autoFocus
                          value={correctionText}
                          onChange={(e) => setCorrectionText(e.target.value)}
                          placeholder="Describe the correction for this step…"
                          rows={3}
                          className="w-full font-serif text-xs text-gray-700 border border-border rounded p-2 bg-background resize-none focus:outline-none focus:border-primary/50"
                        />
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleSave(e, step.title)}
                            className="font-mono text-xs text-primary border border-primary/30 rounded px-3 py-1 hover:bg-primary/5 transition-colors"
                          >
                            Save correction
                          </button>
                          <button
                            onClick={handleCancel}
                            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </article>
  )
}
