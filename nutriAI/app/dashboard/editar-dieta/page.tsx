"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Coffee,
  Apple,
  UtensilsCrossed,
  Cookie,
  Moon,
  Salad,
  Plus,
  Trash2,
  Save,
  Check,
  ArrowLeft
} from "lucide-react"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
}

interface FoodItem {
  id: string
  name: string
  quantity: string
  calories: number
}

interface Meal {
  id: string
  title: string
  time: string
  icon: React.ElementType
  foods: FoodItem[]
}

const initialMeals: Meal[] = [
  {
    id: "cafe",
    title: "Café da Manhã",
    time: "07:00",
    icon: Coffee,
    foods: [
      { id: "1", name: "Pão integral", quantity: "2 fatias (50g)", calories: 130 },
      { id: "2", name: "Ovos mexidos", quantity: "2 unidades", calories: 180 },
      { id: "3", name: "Queijo cottage", quantity: "2 colheres de sopa", calories: 50 },
      { id: "4", name: "Suco de laranja natural", quantity: "200ml", calories: 90 },
    ]
  },
  {
    id: "lanche-manha",
    title: "Lanche da Manhã",
    time: "10:00",
    icon: Apple,
    foods: [
      { id: "5", name: "Maçã", quantity: "1 unidade média", calories: 80 },
      { id: "6", name: "Castanhas", quantity: "30g (5-6 unidades)", calories: 120 },
    ]
  },
  {
    id: "almoco",
    title: "Almoço",
    time: "12:30",
    icon: UtensilsCrossed,
    foods: [
      { id: "7", name: "Arroz integral", quantity: "4 colheres de sopa", calories: 120 },
      { id: "8", name: "Frango grelhado", quantity: "120g", calories: 165 },
      { id: "9", name: "Feijão", quantity: "1 concha", calories: 80 },
      { id: "10", name: "Salada verde", quantity: "À vontade", calories: 30 },
      { id: "11", name: "Azeite de oliva", quantity: "1 colher de sopa", calories: 90 },
    ]
  },
  {
    id: "lanche-tarde",
    title: "Lanche da Tarde",
    time: "16:00",
    icon: Cookie,
    foods: [
      { id: "12", name: "Iogurte natural", quantity: "170g", calories: 100 },
      { id: "13", name: "Granola sem açúcar", quantity: "2 colheres de sopa", calories: 80 },
      { id: "14", name: "Banana", quantity: "1/2 unidade", calories: 45 },
    ]
  },
  {
    id: "jantar",
    title: "Jantar",
    time: "19:30",
    icon: Salad,
    foods: [
      { id: "15", name: "Filé de peixe", quantity: "150g", calories: 150 },
      { id: "16", name: "Batata doce", quantity: "100g", calories: 90 },
      { id: "17", name: "Legumes no vapor", quantity: "150g", calories: 50 },
    ]
  },
  {
    id: "ceia",
    title: "Ceia",
    time: "21:30",
    icon: Moon,
    foods: [
      { id: "18", name: "Chá de camomila", quantity: "200ml", calories: 0 },
    ]
  },
]

const foodSuggestions = [
  "Arroz branco", "Arroz integral", "Feijão preto", "Feijão carioca",
  "Frango grelhado", "Frango assado", "Carne bovina magra", "Peixe grelhado",
  "Ovo cozido", "Ovo mexido", "Omelete", "Pão integral", "Pão francês",
  "Batata doce", "Batata inglesa", "Mandioca", "Macarrão integral",
  "Salada verde", "Brócolis", "Cenoura", "Abobrinha", "Tomate",
  "Banana", "Maçã", "Laranja", "Mamão", "Morango",
  "Iogurte natural", "Leite desnatado", "Queijo cottage", "Queijo minas",
  "Castanhas", "Amêndoas", "Azeite de oliva", "Granola sem açúcar"
]

export default function EditarDietaPage() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get("paciente")
  const patientQuery = patientId ? `?paciente=${patientId}` : ""
  const [meals, setMeals] = useState<Meal[]>(initialMeals)
  const [selectedMeal, setSelectedMeal] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newFood, setNewFood] = useState({ name: "", quantity: "", calories: "" })

  const handleRemoveFood = (mealId: string, foodId: string) => {
    setMeals(meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          foods: meal.foods.filter(food => food.id !== foodId)
        }
      }
      return meal
    }))
  }

  const handleAddFood = () => {
    if (!selectedMeal || !newFood.name || !newFood.quantity || !newFood.calories) return

    setMeals(meals.map(meal => {
      if (meal.id === selectedMeal) {
        return {
          ...meal,
          foods: [
            ...meal.foods,
            {
              id: Date.now().toString(),
              name: newFood.name,
              quantity: newFood.quantity,
              calories: parseInt(newFood.calories)
            }
          ]
        }
      }
      return meal
    }))

    setNewFood({ name: "", quantity: "", calories: "" })
    setIsAddDialogOpen(false)
  }

  const handleQuantityChange = (mealId: string, foodId: string, newQuantity: string) => {
    setMeals(meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          foods: meal.foods.map(food => {
            if (food.id === foodId) {
              return { ...food, quantity: newQuantity }
            }
            return food
          })
        }
      }
      return meal
    }))
  }

  const handleCaloriesChange = (mealId: string, foodId: string, newCalories: string) => {
    setMeals(meals.map(meal => {
      if (meal.id === mealId) {
        return {
          ...meal,
          foods: meal.foods.map(food => {
            if (food.id === foodId) {
              return { ...food, calories: parseInt(newCalories) || 0 }
            }
            return food
          })
        }
      }
      return meal
    }))
  }

  const totalCalories = meals.reduce((acc, meal) =>
    acc + meal.foods.reduce((foodAcc, food) => foodAcc + food.calories, 0), 0
  )

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/dieta-gerada">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Editar Dieta</h1>
            <p className="text-muted-foreground">Ajuste o plano alimentar conforme necessário</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1">
            Total: {totalCalories} kcal
          </Badge>
        </div>
      </motion.div>

      {/* Add Food Dialog */}
      <motion.div variants={fadeInUp}>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Alimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Alimento</DialogTitle>
              <DialogDescription>
                Selecione a refeição e adicione um novo alimento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Refeição</Label>
                <Select value={selectedMeal} onValueChange={setSelectedMeal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a refeição" />
                  </SelectTrigger>
                  <SelectContent>
                    {meals.map(meal => (
                      <SelectItem key={meal.id} value={meal.id}>
                        {meal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alimento</Label>
                <Select value={newFood.name} onValueChange={(v) => setNewFood({ ...newFood, name: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou digite" />
                  </SelectTrigger>
                  <SelectContent>
                    {foodSuggestions.map(food => (
                      <SelectItem key={food} value={food}>
                        {food}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  placeholder="Ex: 100g, 1 unidade"
                  value={newFood.quantity}
                  onChange={(e) => setNewFood({ ...newFood, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Calorias</Label>
                <Input
                  type="number"
                  placeholder="Ex: 150"
                  value={newFood.calories}
                  onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddFood}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Meals Tables */}
      {meals.map((meal) => (
        <motion.div key={meal.id} variants={fadeInUp}>
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <meal.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{meal.title}</CardTitle>
                    <CardDescription>{meal.time}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">
                  {meal.foods.reduce((acc, food) => acc + food.calories, 0)} kcal
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alimento</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Calorias</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meal.foods.map((food) => (
                    <TableRow key={food.id}>
                      <TableCell className="font-medium">{food.name}</TableCell>
                      <TableCell>
                        <Input
                          value={food.quantity}
                          onChange={(e) => handleQuantityChange(meal.id, food.id, e.target.value)}
                          className="w-[150px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={food.calories}
                          onChange={(e) => handleCaloriesChange(meal.id, food.id, e.target.value)}
                          className="w-[80px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFood(meal.id, food.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Action Buttons */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
        <Link href={`/dashboard/dieta-gerada${patientQuery}`} className="flex-1">
          <Button variant="outline" size="lg" className="w-full h-12 gap-2">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </Link>
        <Link href={`/dashboard/gerar-pdf${patientQuery}`} className="flex-1">
          <Button size="lg" className="w-full h-12 gap-2">
            <Check className="w-4 h-4" />
            Aprovar e Gerar PDF
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  )
}
