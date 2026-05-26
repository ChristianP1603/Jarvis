# Coaching Engine — Spezifikation

## Philosophie

Der Coaching Engine denkt wie ein erfahrener Triathlon-/Ausdauercoach:

- **Aerobe Basis ist alles** — egal ob Lauf-, Kraft- oder Hybrid-Ziel
- **Polarisiertes Training** — 80% easy, 20% hard (kein Mittelzone-Junk)
- **Cross-Training ist schlau** — Rad für aerobe Base auch bei reinem Laufziel
- **Recovery bestimmt den Plan** — nie gegen den Körper trainieren
- **Periodisierung** — strukturierte Phasen mit Progression und Deloads

## Profile

### Running Performance
- Phasen: Base → Aerobic Development → Speed → Threshold → Peak → Taper
- Sessions: Long Run, Tempo, Intervals, Easy Run, Recovery Run, Bike Cross-Training
- Interferenz: Kein Tempo/VO2max nach Bein-Kraft (24h), kein Long Run nach High-Intensity (48h)

### Strength Hypertrophy
- Phasen: Anatomical Adaptation → Hypertrophy → Strength → Power
- Sessions: Upper Push, Upper Pull, Lower, Full Body, Cardio Easy
- Interferenz: Kein Ausdauer vor Kraft am selben Tag, 48h zwischen gleichen Muskelgruppen

### Hybrid Concurrent
- Phasen: Base → Concurrent Build → Strength Focus → Endurance Focus → Peak
- Sessions: Strength Upper, Strength Lower, Long Run, Tempo, Intervals, Easy Ride
- Interferenz: Kraft vor Ausdauer am selben Tag, 6h Minimum zwischen Sessions

### Ironman
- Phasen: Base → Build 1 → Build 2 → Race Specific → Peak → Taper
- Sessions: Long Ride, Long Run, Swim Technique, Brick, Tempo Run, Interval Ride
- Interferenz: Kein Brick nach Intensity (48h), Swim nicht nach hartem Upper Body (24h)

## Plan-Generierung (Algorithmus)

```
1. Bestimme ob Deload-Woche (3:1 Rhythmus ODER TSB < -20)
2. Setze Rest Day (User-Präferenz)
3. Platziere Kraft-Sessions (fixe Tage, User-Präferenz)
4. Platziere Long Session (fixe Tag, User-Präferenz)
5. Platziere Key Sessions der aktuellen Phase
6. Fülle restliche Tage mit Easy/Cross-Training
7. Prüfe Interferenz-Regeln, verschiebe bei Konflikten
8. Wende Recovery Overlay an:
   - Grün (>70): Plan wie geplant
   - Gelb (40-70): Reduziere Intensität, ersetze Hard → Easy
   - Rot (<40): Nur Recovery/Stretching/Rest
```

## Recovery Score (0-100)

| Komponente | Gewicht | Quelle |
|-----------|---------|--------|
| HRV-Baseline-Abweichung | 35% | Apple Health |
| RHR-Baseline-Abweichung | 20% | Apple Health |
| Sleep Score | 25% | Sleep Data |
| Journal (Stress, Alkohol etc.) | 20% | Manual Entry |

## Sleep Score (0-100)

| Komponente | Punkte | Optimal |
|-----------|--------|---------|
| Dauer | 30 | 7-9h |
| Effizienz | 20 | >90% |
| Deep Sleep | 20 | >20% der Zeit |
| REM Sleep | 15 | >20% der Zeit |
| Konsistenz | 15 | ±30min vom Schnitt |

## Fitness-Metriken

- **TRIMP**: Training Impulse = Dauer × HRR × Gewichtungsfaktor
- **CTL**: Chronic Training Load = 42-Tage EMA von TRIMP (Fitness)
- **ATL**: Acute Training Load = 7-Tage EMA von TRIMP (Fatigue)
- **TSB**: Training Stress Balance = CTL - ATL (Form)
  - TSB > 5: Fresh, bereit für Wettkampf
  - TSB -10 bis 5: Optimal für Training
  - TSB < -10: Müde, Deload erwägen
  - TSB < -20: Automatischer Deload

## Deload-Logik

1. **Rhythmus**: Standard 3:1 (3 Wochen Load, 1 Woche Deload)
2. **TSB-Override**: Wenn TSB < -20, sofortiger Deload unabhängig vom Rhythmus
3. **Deload-Woche**: 60% Volumen, keine Key Sessions, nur Easy/Recovery

## Cross-Training Matrix

| Ziel | Cross-Training | Warum |
|------|---------------|-------|
| Laufen | Radfahren (Z1-Z2) | Aerobe Base ohne Impact |
| Kraft | Leichtes Cardio | Aktive Recovery |
| Hybrid | Schwimmen | Low Impact, Recovery |
| Ironman | Alles | Sport-spezifisch |

## Journal-Korrelationen

Analysiert Muster über 90 Tage:
- Faktor geloggt → nächster Tag Sleep Score / Recovery Score vergleichen
- Minimum 5 Beobachtungen für Signifikanz
- Insights generieren: "Alkohol senkt Recovery um ~12 Punkte"
