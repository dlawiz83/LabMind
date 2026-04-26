export type Correction = { step: string; correction: string }

function djb2Hash(text: string): number {
  let hash = 5381
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function correctionStorageKey(hypothesis: string): string {
  return `lm_corrections_${djb2Hash(hypothesis)}`
}

export function loadCorrections(hypothesis: string): Correction[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(correctionStorageKey(hypothesis)) ?? "[]")
  } catch {
    return []
  }
}

export function saveCorrection(hypothesis: string, stepTitle: string, correction: string): void {
  const key = correctionStorageKey(hypothesis)
  const existing = loadCorrections(hypothesis)
  const filtered = existing.filter((c) => c.step !== stepTitle)
  filtered.push({ step: stepTitle, correction })
  localStorage.setItem(key, JSON.stringify(filtered))
}
