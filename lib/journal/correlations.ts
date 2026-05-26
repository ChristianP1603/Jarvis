/**
 * Journal Correlation Engine
 *
 * Analyzes patterns between journal factors and outcomes
 * (sleep quality, recovery score, training performance).
 *
 * Uses simple statistical correlation:
 * For each factor, compares outcome metrics on days WITH the factor
 * vs. days WITHOUT. Minimum sample size: 5 observations.
 */

import { FACTOR_MAP } from './factors'

interface DayData {
  date: string
  factors: string[]
  sleep_score: number | null
  recovery_score: number | null
  trimp: number | null
}

export interface FactorCorrelation {
  factor_id: string
  factor_label: string
  factor_icon: string
  // How many days this factor was logged
  occurrences: number
  // Impact on sleep (negative = bad for sleep)
  sleep_impact: number | null
  // Impact on recovery
  recovery_impact: number | null
  // Avg TRIMP on days with factor vs. without
  training_impact: number | null
  // Confidence: 'low' (5-10), 'medium' (11-20), 'high' (>20)
  confidence: 'low' | 'medium' | 'high'
}

export interface CorrelationInsight {
  type: 'positive' | 'negative' | 'neutral'
  message: string
  factor_id: string
  impact: number
}

export function calculateCorrelations(data: DayData[]): FactorCorrelation[] {
  if (data.length < 10) return []

  // Collect all unique factors
  const factorIds = new Set<string>()
  for (const d of data) {
    for (const f of d.factors) factorIds.add(f)
  }

  const results: FactorCorrelation[] = []

  for (const factorId of factorIds) {
    const withFactor = data.filter(d => d.factors.includes(factorId))
    const withoutFactor = data.filter(d => !d.factors.includes(factorId))

    if (withFactor.length < 5 || withoutFactor.length < 3) continue

    const factor = FACTOR_MAP[factorId]
    if (!factor) continue

    // Sleep impact: compare next-day sleep scores
    const sleepWith = avgNonNull(withFactor.map(d => d.sleep_score))
    const sleepWithout = avgNonNull(withoutFactor.map(d => d.sleep_score))
    const sleepImpact = sleepWith !== null && sleepWithout !== null
      ? Math.round((sleepWith - sleepWithout) * 10) / 10 : null

    // Recovery impact: compare next-day recovery scores
    const recoveryWith = avgNonNull(withFactor.map(d => d.recovery_score))
    const recoveryWithout = avgNonNull(withoutFactor.map(d => d.recovery_score))
    const recoveryImpact = recoveryWith !== null && recoveryWithout !== null
      ? Math.round((recoveryWith - recoveryWithout) * 10) / 10 : null

    // Training impact: compare TRIMP
    const trimpWith = avgNonNull(withFactor.map(d => d.trimp))
    const trimpWithout = avgNonNull(withoutFactor.map(d => d.trimp))
    const trainingImpact = trimpWith !== null && trimpWithout !== null
      ? Math.round((trimpWith - trimpWithout) * 10) / 10 : null

    const confidence: 'low' | 'medium' | 'high' =
      withFactor.length > 20 ? 'high' :
      withFactor.length > 10 ? 'medium' : 'low'

    results.push({
      factor_id: factorId,
      factor_label: factor.label,
      factor_icon: factor.icon,
      occurrences: withFactor.length,
      sleep_impact: sleepImpact,
      recovery_impact: recoveryImpact,
      training_impact: trainingImpact,
      confidence,
    })
  }

  // Sort by absolute recovery impact
  results.sort((a, b) => {
    const aImpact = Math.abs(a.recovery_impact || 0)
    const bImpact = Math.abs(b.recovery_impact || 0)
    return bImpact - aImpact
  })

  return results
}

export function generateInsights(correlations: FactorCorrelation[]): CorrelationInsight[] {
  const insights: CorrelationInsight[] = []

  for (const c of correlations) {
    if (c.confidence === 'low') continue

    // Recovery-impacting insights
    if (c.recovery_impact !== null) {
      if (c.recovery_impact < -5) {
        insights.push({
          type: 'negative',
          message: `${c.factor_icon} ${c.factor_label} senkt deine Recovery um ~${Math.abs(c.recovery_impact).toFixed(0)} Punkte`,
          factor_id: c.factor_id,
          impact: c.recovery_impact,
        })
      } else if (c.recovery_impact > 5) {
        insights.push({
          type: 'positive',
          message: `${c.factor_icon} ${c.factor_label} verbessert deine Recovery um ~${c.recovery_impact.toFixed(0)} Punkte`,
          factor_id: c.factor_id,
          impact: c.recovery_impact,
        })
      }
    }

    // Sleep insights
    if (c.sleep_impact !== null) {
      if (c.sleep_impact < -5) {
        insights.push({
          type: 'negative',
          message: `${c.factor_icon} ${c.factor_label} verschlechtert deinen Schlaf um ~${Math.abs(c.sleep_impact).toFixed(0)} Punkte`,
          factor_id: c.factor_id,
          impact: c.sleep_impact,
        })
      } else if (c.sleep_impact > 5) {
        insights.push({
          type: 'positive',
          message: `${c.factor_icon} ${c.factor_label} verbessert deinen Schlaf um ~${c.sleep_impact.toFixed(0)} Punkte`,
          factor_id: c.factor_id,
          impact: c.sleep_impact,
        })
      }
    }
  }

  // Sort: most impactful first
  insights.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  return insights.slice(0, 6)
}

function avgNonNull(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}
