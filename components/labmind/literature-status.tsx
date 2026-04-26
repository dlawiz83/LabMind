"use client"

type SignalType = "novel" | "similar" | "exact" | null

interface LitReference {
  title: string
  authors: string
  year: string
  doi?: string
}

interface LiteratureStatusProps {
  signal: SignalType
  references: LitReference[]
  isLoading?: boolean
}

export function LiteratureStatus({ signal, references, isLoading }: LiteratureStatusProps) {
  if (isLoading && !signal) {
    return (
      <div className="mx-6 my-4 pl-4 border-l-4 border-gray-200 bg-gray-50 rounded-r py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
          <span className="font-mono text-xs text-muted-foreground">
            Checking literature...
          </span>
        </div>
      </div>
    )
  }

  if (!signal) {
    return null
  }

  const statusConfig = {
    novel: {
      icon: "●",
      label: "Novel",
      badge: "bg-[#ECFDF5] text-[#00875A] border-[#6EE7B7]",
      border: "border-[#00875A]",
      bg: "bg-[#F0FDF9]",
      description: "No existing literature found matching this hypothesis",
    },
    similar: {
      icon: "◐",
      label: "Similar exists",
      badge: "bg-[#FFFBEB] text-[#D97706] border-[#FCD34D]",
      border: "border-[#D97706]",
      bg: "bg-[#FFFDF0]",
      description: "Related work found — review references before proceeding",
    },
    exact: {
      icon: "✕",
      label: "Exact match",
      badge: "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]",
      border: "border-[#DC2626]",
      bg: "bg-[#FFF8F8]",
      description: "This hypothesis has been previously published",
    },
  }

  const config = statusConfig[signal]

  return (
    <div className={`mx-6 my-4 pl-4 border-l-4 ${config.border} ${config.bg} rounded-r py-3.5 pr-4`}>
      <div className="flex items-center gap-3 mb-1.5">
        <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded border ${config.badge}`}>
          <span>{config.icon}</span>
          <span>Literature QC: {config.label}</span>
        </span>
      </div>

      <p className="font-serif text-xs text-gray-600 mb-2">{config.description}</p>

      {references.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {references.slice(0, 3).map((ref, index) => (
            <p key={index} className="font-serif text-xs text-gray-600 leading-snug">
              <span className="text-gray-400 font-mono">{ref.authors} ({ref.year}). </span>
              {ref.doi ? (
                <a
                  href={`https://doi.org/${ref.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-primary hover:underline transition-colors"
                >
                  {ref.title}
                </a>
              ) : (
                <span>{ref.title}</span>
              )}
              {ref.doi && (
                <a
                  href={`https://doi.org/${ref.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors"
                >
                  DOI ↗
                </a>
              )}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
