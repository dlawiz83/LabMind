"use client"

interface LitReference {
  title: string
  authors: string
  year: string
  doi?: string
}

interface SelectedStep {
  number: string
  title: string
  content: string
}

interface ProvenancePanelProps {
  selectedStep: SelectedStep | null
  references: LitReference[]
  isOpen: boolean
  onClose: () => void
}

function extractSources(text: string): string[] {
  const matches = text.match(/\[Source:[^\]]+\]/g) ?? []
  return matches.map((m) => m.replace(/^\[Source:\s*/, "").replace(/\]$/, ""))
}

function firstTwoSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? []
  const result = sentences.slice(0, 2).join(" ").trim()
  return result || text.slice(0, 300).trim()
}

export function ProvenancePanel({ selectedStep, references, isOpen, onClose }: ProvenancePanelProps) {
  if (isOpen && selectedStep) {
    const sources = extractSources(selectedStep.content)

    const cleanBody = selectedStep.content
      .replace(/\[Source:[^\]]+\]/g, "")
      .replace(/\[VERIFY\]/g, "")
      .replace(/\*\*/g, "")
      .split("\n")
      .filter((l) => l.trim() && !/^[-*]/.test(l.trim()))
      .join(" ")
      .trim()

    const fallbackBody = selectedStep.content
      .replace(/\[Source:[^\]]+\]/g, "")
      .replace(/\[VERIFY\]/g, "")
      .replace(/\*\*/g, "")
      .trim()

    const rationale = firstTwoSentences(cleanBody) || fallbackBody
    const paddedNumber = selectedStep.number.padStart(2, "0")
    const firstSource = sources[0] ?? null

    return (
      <aside className="py-8">
        <div className="mb-4">
          <span className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Provenance
          </span>
        </div>

        <div className="mb-6 pl-3 border-l-2 border-primary">
          <h2 className="font-sans text-base font-semibold text-foreground">
            Step {paddedNumber}
          </h2>
          <p className="font-sans text-sm text-muted-foreground mt-0.5">
            {selectedStep.title}
          </p>
        </div>

        {firstSource && (
          <div className="mb-6">
            <h3 className="font-mono text-xs text-gray-500 uppercase tracking-wide mb-2">
              Source
            </h3>
            <p className="font-mono text-xs text-primary leading-relaxed break-words">
              {firstSource}
            </p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-mono text-xs text-gray-500 uppercase tracking-wide mb-2">
            Rationale
          </h3>
          <p className="font-serif text-sm text-gray-600 leading-relaxed">{rationale}</p>
        </div>

        {sources.length > 0 && (
          <div className="mb-6">
            <h3 className="font-mono text-xs text-gray-500 uppercase tracking-wide mb-2">
              Referenced from
            </h3>
            <ul className="space-y-1">
              {sources.map((source, i) => (
                <li key={i} className="font-serif text-xs text-gray-500 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 shrink-0">—</span>
                  {source}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All sources
        </button>
      </aside>
    )
  }

  return (
    <aside className="py-8">
      <h2 className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
        Provenance
      </h2>

      {references.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-mono text-xs text-gray-500 uppercase tracking-wide">
            Literature
          </h3>
          <ul className="space-y-2">
            {references.map((ref, i) => (
              <li key={i} className="group">
                <div className="py-2 border-b border-border">
                  <p className="font-serif text-sm text-foreground leading-snug mb-1">
                    {ref.doi ? (
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {ref.title}
                      </a>
                    ) : (
                      ref.title
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {ref.authors}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="font-mono text-xs text-muted-foreground">{ref.year}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="font-serif text-xs text-muted-foreground">
          Click a protocol step to see why it was recommended.
        </p>
      )}
    </aside>
  )
}
