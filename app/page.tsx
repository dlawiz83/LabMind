"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { TopBar } from "@/components/labmind/top-bar"
import { HypothesisInput } from "@/components/labmind/hypothesis-input"
import { LiteratureStatus } from "@/components/labmind/literature-status"
import { ExperimentPlan } from "@/components/labmind/experiment-plan"
import { ProvenancePanel } from "@/components/labmind/provenance-panel"
import { TabBar, type TabId } from "@/components/labmind/tab-bar"
import { TabContent } from "@/components/labmind/tab-content"
import { loadCorrections } from "@/lib/corrections"

interface LitQCReference {
  title: string
  authors: string
  year: string
  doi?: string
}

interface LitQC {
  signal: "novel" | "similar" | "exact"
  references: LitQCReference[]
}

interface SelectedStep {
  number: string
  title: string
  content: string
}

function extractLitQCFromBuffer(
  buffer: string
): { litQC: LitQC; rest: string } | null {
  const start = buffer.indexOf('{"litQC"')
  if (start === -1) return null

  let depth = 0
  let end = -1
  for (let i = start; i < buffer.length; i++) {
    if (buffer[i] === "{") depth++
    else if (buffer[i] === "}") {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }

  if (end === -1) return null

  try {
    const data = JSON.parse(buffer.slice(start, end))
    if (!data.litQC) return null
    return {
      litQC: data.litQC as LitQC,
      rest: buffer.slice(end).replace(/^[\s\n]*/, ""),
    }
  } catch {
    return null
  }
}

function parseSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const parts = markdown.split(/^## /m)
  for (const part of parts) {
    if (!part.trim()) continue
    const nl = part.indexOf("\n")
    if (nl === -1) continue
    const heading = part.slice(0, nl).trim().toLowerCase()
    sections[heading] = part.slice(nl + 1).trim()
  }
  return sections
}

const ALL_TABS: TabId[] = ["protocol", "materials", "budget", "timeline", "validation", "biosafety"]
const TAB_LABELS: Record<string, string> = {
  protocol: "Protocol",
  materials: "Materials",
  budget: "Budget",
  timeline: "Timeline",
  validation: "Validation",
  biosafety: "Biosafety",
}

export default function LabMindPage() {
  const [hypothesis, setHypothesis] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("protocol")
  const [litQC, setLitQC] = useState<LitQC | null>(null)
  const [sections, setSections] = useState<Record<string, string>>({})
  const [selectedStep, setSelectedStep] = useState<SelectedStep | null>(null)
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false)

  const handleStepClick = (step: SelectedStep) => {
    setSelectedStep(step)
    setIsProvenanceOpen(true)
  }

  const handleExportPdf = () => {
    window.print()
  }

  const handleSubmit = async (value: string) => {
    setIsAnalyzing(true)
    setHasResult(false)
    setLitQC(null)
    setSections({})
    setSelectedStep(null)
    setIsProvenanceOpen(false)
    setActiveTab("protocol")

    try {
      const corrections = loadCorrections(value)

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis: value, corrections }),
      })

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let rawBuffer = ""
      let litQCDone = false
      let markdownContent = ""

      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break

        rawBuffer += decoder.decode(chunk, { stream: true })

        if (!litQCDone) {
          const result = extractLitQCFromBuffer(rawBuffer)
          if (result) {
            litQCDone = true
            setLitQC(result.litQC)
            markdownContent = result.rest
            rawBuffer = ""
            setSections(parseSections(markdownContent))
            setHasResult(true)
          } else if (rawBuffer.includes("## ")) {
            litQCDone = true
            markdownContent = rawBuffer
            rawBuffer = ""
            setSections(parseSections(markdownContent))
            setHasResult(true)
          }
        } else {
          markdownContent += rawBuffer
          rawBuffer = ""
          setSections(parseSections(markdownContent))
        }
      }

      const tail = decoder.decode()
      if (tail) {
        markdownContent += tail
        setSections(parseSections(markdownContent))
      }
    } catch (err) {
      console.error("Analysis failed:", err)
    } finally {
      setIsAnalyzing(false)
      setHasResult(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hidden in print */}
      <div className="print:hidden">
        <TopBar onExportPdf={hasResult ? handleExportPdf : undefined} />
      </div>

      <main className="flex-1 flex flex-col">
        <div className="print:hidden">
          <HypothesisInput
            value={hypothesis}
            onChange={setHypothesis}
            onSubmit={handleSubmit}
            isDisabled={isAnalyzing}
          />
        </div>

        {/* Literature QC banner — prominent between input and plan, hidden in print (print layout has its own) */}
        <div className="print:hidden">
          <LiteratureStatus
            signal={litQC?.signal ?? null}
            references={litQC?.references ?? []}
            isLoading={isAnalyzing}
          />
        </div>

        {hasResult && (
          <>
            {/* Interactive UI — hidden during print */}
            <div className="flex-1 flex print:hidden">
              <div className="w-[65%] px-8 border-r border-border overflow-auto">
                {activeTab === "protocol" ? (
                  <ExperimentPlan
                    hypothesis={hypothesis}
                    markdownProtocol={sections.protocol ?? ""}
                    onStepClick={handleStepClick}
                    selectedStepTitle={isProvenanceOpen ? (selectedStep?.title ?? null) : null}
                  />
                ) : (
                  <TabContent activeTab={activeTab} sections={sections} />
                )}
              </div>

              <div className="w-[35%] px-6 overflow-auto">
                <ProvenancePanel
                  selectedStep={selectedStep}
                  references={litQC?.references ?? []}
                  isOpen={isProvenanceOpen}
                  onClose={() => setIsProvenanceOpen(false)}
                />
              </div>
            </div>

            <div className="print:hidden">
              <TabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onExportPdf={handleExportPdf}
              />
            </div>

            {/* Print-only: all sections rendered at once */}
            <div className="hidden print:block px-12 py-8 space-y-8">
              <div>
                <h1 className="font-sans text-2xl font-semibold text-foreground mb-2">
                  LabMind — Experiment Plan
                </h1>
                {hypothesis && (
                  <div className="pl-4 border-l-2 border-primary mt-3">
                    <p className="font-serif text-sm text-gray-600 italic leading-relaxed">
                      {hypothesis}
                    </p>
                  </div>
                )}
                {litQC && (
                  <p className="font-mono text-xs text-muted-foreground mt-3">
                    Literature QC: <strong>{litQC.signal.toUpperCase()}</strong>
                    {litQC.references.length > 0 && (
                      <span>
                        {" — "}
                        {litQC.references
                          .slice(0, 3)
                          .map((r) => `${r.authors} (${r.year}). ${r.title}`)
                          .join("; ")}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {ALL_TABS.map((tab) => {
                const content = sections[tab]
                if (!content) return null
                return (
                  <div key={tab} className="border-t border-border pt-6">
                    <h2 className="font-sans text-base font-semibold text-foreground mb-3">
                      {TAB_LABELS[tab]}
                    </h2>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="font-serif text-xs text-gray-600 leading-relaxed"
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {isAnalyzing && !hasResult && (
          <div className="flex-1 flex print:hidden">
            <div className="w-[65%] px-8 border-r border-border overflow-auto py-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="font-mono text-xs text-muted-foreground">Analyzing</span>
                <span className="flex gap-1">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span
                      key={i}
                      className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </span>
              </div>
              <div className="space-y-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-2/5" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-[88%]" />
                  <div className="h-3 bg-gray-100 rounded w-[76%]" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-[92%]" />
                  <div className="h-3 bg-gray-100 rounded w-[70%]" />
                  <div className="h-3 bg-gray-100 rounded w-[82%]" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-2/5" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-[85%]" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-1/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-[78%]" />
                  <div className="h-3 bg-gray-100 rounded w-[90%]" />
                </div>
              </div>
            </div>
            <div className="w-[35%]" />
          </div>
        )}

        {!hasResult && !isAnalyzing && (
          <div className="flex-1 flex items-center justify-center print:hidden">
            <div className="text-center max-w-md">
              <p className="font-sans text-sm text-muted-foreground mb-2">
                Enter a scientific hypothesis to begin
              </p>
              <p className="font-serif text-xs text-gray-400">
                LabMind will analyze novelty, generate an experiment plan, and provide literature provenance.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
