export function calculateTRIMP(
  durationMin: number,
  avgHR: number,
  restHR: number,
  maxHR: number
): number {
  const hrReserve = (avgHR - restHR) / (maxHR - restHR)
  const clamped = Math.max(0, Math.min(1, hrReserve))
  return durationMin * clamped * 0.64 * Math.exp(1.92 * clamped)
}

export function calculateEMA(values: number[], days: number): number {
  if (values.length === 0) return 0
  const k = 2 / (days + 1)
  let ema = values[values.length - 1] || 0
  for (let i = values.length - 2; i >= 0; i--) {
    ema = values[i] * k + ema * (1 - k)
  }
  return Math.round(ema * 10) / 10
}

export function getTrainingZone(hrPercent: number): string {
  if (hrPercent < 0.6) return 'Z1'
  if (hrPercent < 0.7) return 'Z2'
  if (hrPercent < 0.8) return 'Z3'
  if (hrPercent < 0.9) return 'Z4'
  return 'Z5'
}

export function hrPercentOfMax(hr: number, maxHR: number): number {
  return hr / maxHR
}
