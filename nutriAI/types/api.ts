// Espelha UserResponse do Pydantic (app/schemas/user.py)
export interface User {
  id: number
  name: string
  email: string
  age: number | null
  weight: number | null
  height: number | null
  daily_calorie_goal: number | null
  daily_water_goal_ml: number | null
}

// Espelha PatientResponse do Pydantic (app/schemas/patient.py)
export interface Patient {
  id: number
  name: string
  email: string
  age: number
  weight: number
  height: number
  goal: string
  gender: string | null
  created_at: string | null
  notes: string | null
}

// Espelha FoodItem do Pydantic (app/schemas/diet.py)
export interface FoodItem {
  id: number
  meal_id: number
  name: string
  quantity: string
  calories: number
}

// Espelha Meal do Pydantic (app/schemas/diet.py)
export interface Meal {
  id: number
  diet_id: number
  title: string
  time: string
  total_calories: number
  foods: FoodItem[]
}

// Espelha Diet do Pydantic (app/schemas/diet.py)
export interface Diet {
  id: number
  patient_id: number
  total_calories: number
  created_at: string
  meals: Meal[]
}

// Espelha NutritionFood do Pydantic (app/schemas/nutrition.py)
export interface NutritionFood {
  id: number
  name: string
  group: string
  portion: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  meal_tags: string
  goal_tags: string
  restriction_tags: string
  notes: string | null
  active: boolean
}

// Espelha MacroBreakdown do Pydantic (app/schemas/ai.py)
export interface MacroBreakdown {
  proteina_g: number
  carboidrato_g: number
  gordura_g: number
  proteina_kcal: number
  carboidrato_kcal: number
  gordura_kcal: number
  fibra_g: number
}

// Espelha AIDietResponse do Pydantic (app/schemas/ai.py)
export interface AIDietResponse {
  diet: Diet
  target_calories: number
  estimated_calories: number
  strategy: string
  macros: MacroBreakdown
  warnings: string[]
  clinical_insights?: string[]
}

// Espelha PatientCheckinResponse do Pydantic (app/schemas/patient.py)
export interface PatientCheckin {
  id: number
  patient_id: number
  weight: number
  notes: string | null
  created_at: string
}
