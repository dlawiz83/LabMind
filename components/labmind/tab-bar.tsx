"use client"

type TabId = "protocol" | "materials" | "budget" | "timeline" | "validation" | "biosafety"

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onExportPdf?: () => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: "protocol", label: "Protocol" },
  { id: "materials", label: "Materials" },
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline" },
  { id: "validation", label: "Validation" },
  { id: "biosafety", label: "Biosafety" },
]

export function TabBar({ activeTab, onTabChange, onExportPdf }: TabBarProps) {
  return (
    <nav className="border-t border-border">
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-4 py-3 font-mono text-xs transition-colors ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </div>

        {onExportPdf && (
          <button
            onClick={onExportPdf}
            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors py-3 pl-4"
          >
            Export PDF
          </button>
        )}
      </div>
    </nav>
  )
}

export type { TabId }
