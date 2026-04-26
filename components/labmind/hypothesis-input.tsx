"use client"

import { useState } from "react"
import { FlaskConical, Dna, Stethoscope } from "lucide-react"

const EXAMPLES = [
  {
    label: "Gut Health",
    Icon: FlaskConical,
    text: "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  },
  {
    label: "Cell Biology",
    Icon: Dna,
    text: "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.",
  },
  {
    label: "Diagnostics",
    Icon: Stethoscope,
    text: "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  },
]

interface HypothesisInputProps {
  onSubmit: (hypothesis: string) => void
  value: string
  onChange: (value: string) => void
  isDisabled?: boolean
}

export function HypothesisInput({ onSubmit, value, onChange, isDisabled }: HypothesisInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      if (value.trim() && !isDisabled) {
        onSubmit(value)
      }
    }
  }

  return (
    <div className="w-full border-b border-border">
      <div className="relative">
        <div
          className={`absolute left-0 top-0 bottom-0 w-[2px] transition-colors ${
            isFocused ? "bg-primary" : "bg-border"
          }`}
        />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder="Enter your hypothesis..."
          className="w-full min-h-[120px] px-6 py-5 pl-8 font-mono text-sm leading-relaxed bg-transparent text-foreground placeholder:text-gray-400 focus:outline-none resize-none disabled:opacity-60"
          spellCheck={false}
        />
      </div>
      <div className="flex items-center justify-between px-6 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">
            ⌘ + Enter to analyze
          </span>
          {!isDisabled && EXAMPLES.map(({ label, Icon, text }) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange(text)}
              className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-xs border transition-colors"
              style={{ borderColor: "#00875A", color: "#00875A" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#00875A15"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
              }}
            >
              <Icon size={10} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => value.trim() && !isDisabled && onSubmit(value)}
          disabled={!value.trim() || isDisabled}
          className="px-4 py-1.5 font-mono text-xs border border-border text-foreground hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-w-[80px] flex items-center justify-center gap-1"
        >
          {isDisabled ? (
            <>
              <span>Analyzing</span>
              <span className="flex gap-px ml-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-[3px] h-[3px] rounded-full bg-current animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </span>
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </div>
    </div>
  )
}
