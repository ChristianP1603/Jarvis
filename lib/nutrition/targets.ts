interface UserProfile {
  weight_kg: number
  height_cm: number
  age: number
}

type NutritionGoal = 'maintain' | 'slight_cut' | 'slight_bulk'

interface MacroSplit {
  carbs: number
  protein: number
  fat: number
}

export interface NutritionTargets {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  water_l: number
}

function getMacroSplit(workoutType?: string | null): MacroSplit {
  switch (workoutType) {
    case 'long_ride':
    case 'long_run':
    case 'long_session':
      return { carbs: 0.55, protein: 0.20, fat: 0.25 }
    case 'bike_intervals':
    case 'run_intervals':
    case 'intervals':
    case 'tempo_run':
      return { carbs: 0.50, protein: 0.25, fat: 0.25 }
    case 'strength':
    case 'upper_body':
    case 'lower_body':
    case 'full_body':
      return { carbs: 0.40, protein: 0.30, fat: 0.30 }
    case 'rest':
    case 'active_recovery':
      return { carbs: 0.35, protein: 0.30, fat: 0.35 }
    default:
      return { carbs: 0.45, protein: 0.25, fat: 0.30 }
  }
}

function estimateTrainingCalories(
  workoutType: string | null,
  durationMin: number | null,
  weightKg: number
): number {
  if (!workoutType || !durationMin) return 0

  // MET values (rough estimates)
  const metValues: Record<string, number> = {
    easy_run: 8, recovery_run: 6, tempo_run: 10, run_intervals: 11,
    long_run: 8.5, easy_bike: 6, long_ride: 7, bike_intervals: 10,
    sweet_spot_ride: 8, recovery_spin: 4, strength: 5, upper_body: 4,
    lower_body: 5.5, full_body: 5, swimming: 7, rowing: 7,
    rest: 0, active_recovery: 3,
  }

  const met = metValues[workoutType] || 6
  return Math.round((met * weightKg * durationMin) / 60)
}

export function calculateDailyTargets(
  user: UserProfile,
  goal: NutritionGoal,
  todayWorkoutType: string | null = null,
  todayWorkoutDuration: number | null = null
): NutritionTargets {
  // BMR (Mifflin-St Jeor for males)
  const bmr = 10 * user.weight_kg + 6.25 * user.height_cm - 5 * user.age + 5

  // NEAT
  const neat = 400

  // Training calories
  const trainingCal = estimateTrainingCalories(todayWorkoutType, todayWorkoutDuration, user.weight_kg)

  let totalCal = bmr + neat + trainingCal

  // Goal adjustment
  if (goal === 'slight_cut') totalCal -= 250
  if (goal === 'slight_bulk') totalCal += 200

  // Macro split based on workout type
  const split = getMacroSplit(todayWorkoutType)

  return {
    calories: Math.round(totalCal),
    protein_g: Math.round((totalCal * split.protein) / 4),
    carbs_g: Math.round((totalCal * split.carbs) / 4),
    fat_g: Math.round((totalCal * split.fat) / 9),
    water_l: Math.round((user.weight_kg * 0.035 + (trainingCal > 300 ? 0.5 : 0) + (trainingCal > 600 ? 0.5 : 0)) * 10) / 10,
  }
}
