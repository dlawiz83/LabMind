"use client"

interface TopBarProps {
  onExportPdf?: () => void
}

export function TopBar({ onExportPdf }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <h1 className="font-mono text-base font-medium tracking-tight text-foreground">
        LabMind
      </h1>
      <div className="flex items-center gap-4">
        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded px-2.5 py-1 hover:border-foreground/30"
          >
            Export PDF
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono text-xs text-muted-foreground">
            Ready
          </span>
        </div>
      </div>
    </header>
  )
}
