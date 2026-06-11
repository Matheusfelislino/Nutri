"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Scale,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ArrowRight,
  User
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function ResultadoNutricionalPage() {
  const [isLoading, setIsLoading] = useState(true)

  const [patientData, setPatientData] = useState({
    name: "Carregando...",
    age: 0,
    sex: "Feminino",
    height: 0,
    weight: 0,
    goal: "Manutenção"
  })

  useEffect(() => {
    async function fetchPatientData() {
      try {
        const patientId = 1
        const response = await apiFetch(`/patients/${patientId}`)

        if (response.ok) {
          const data = await response.json()
          setPatientData({
            name: data.name,
            age: data.age || 30,
            sex: "Feminino",
            height: data.height || 160,
            weight: data.weight || 60,
            goal: data.goal || "Manutenção"
          })
        }
      } catch (error) {
        console.error("Erro ao buscar dados do paciente:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientData()
  }, [])

  const nutritionLogic = useMemo(() => {
    if (patientData.height === 0) return null

    // 1. Cálculo de IMC
    const heightInMeters = patientData.height > 3 ? patientData.height / 100 : patientData.height
    const imc = patientData.weight / (heightInMeters * heightInMeters)

    let imcClassification = "Normal"
    if (imc < 18.5) imcClassification = "Baixo peso"
    else if (imc >= 25 && imc < 30) imcClassification = "Sobrepeso"
    else if (imc >= 30) imcClassification = "Obesidade"

    // 2. Taxa Metabólica Basal (Mifflin-St Jeor)
    let tmb = (10 * patientData.weight) + (6.25 * patientData.height) - (5 * patientData.age)
    tmb = patientData.sex === "Masculino" ? tmb + 5 : tmb - 161

    // 3. Fator de Atividade
    let tdee = tmb * 1.375

    // 4. Ajuste pelo Objetivo
    let dailyCalories = tdee
    let macrosPct = { protein: 25, carbs: 50, fat: 25 }

    if (patientData.goal.includes("Emagrecimento")) {
      dailyCalories -= 500
      macrosPct = { protein: 35, carbs: 35, fat: 30 }
    } else if (patientData.goal.includes("Hipertrofia") || patientData.goal.includes("Massa")) {
      dailyCalories += 300
      macrosPct = { protein: 30, carbs: 50, fat: 20 }
    }

    dailyCalories = Math.round(dailyCalories)

    const proteinGrams = Math.round((dailyCalories * (macrosPct.protein / 100)) / 4)
    const carbsGrams = Math.round((dailyCalories * (macrosPct.carbs / 100)) / 4)
    const fatGrams = Math.round((dailyCalories * (macrosPct.fat / 100)) / 9)

    return {
      imc: imc.toFixed(2),
      imcClassification,
      dailyCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      macrosPct,
      macrosData: [
        { name: "Proteínas", value: macrosPct.protein, calories: proteinGrams * 4, color: "hsl(var(--chart-1))" },
        { name: "Carboidratos", value: macrosPct.carbs, calories: carbsGrams * 4, color: "hsl(var(--chart-2))" },
        { name: "Gorduras", value: macrosPct.fat, calories: fatGrams * 9, color: "hsl(var(--chart-3))" },
      ]
    }
  }, [patientData])

  if (isLoading || !nutritionLogic) {
    return <div className="py-20 text-center text-muted-foreground">Calculando necessidades nutricionais...</div>
  }

  const nutritionCards = [
    { title: "IMC", value: nutritionLogic.imc, subtitle: nutritionLogic.imcClassification, icon: Scale, color: "text-amber-500", bgColor: "bg-amber-500/10" },
    { title: "Calorias Diárias", value: nutritionLogic.dailyCalories, subtitle: "kcal/dia", icon: Flame, color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { title: "Proteínas", value: `${nutritionLogic.proteinGrams}g`, subtitle: `${nutritionLogic.macrosPct.protein}% das calorias`, icon: Beef, color: "text-red-500", bgColor: "bg-red-500/10" },
    { title: "Carboidratos", value: `${nutritionLogic.carbsGrams}g`, subtitle: `${nutritionLogic.macrosPct.carbs}% das calorias`, icon: Wheat, color: "text-amber-600", bgColor: "bg-amber-600/10" },
    { title: "Gorduras", value: `${nutritionLogic.fatGrams}g`, subtitle: `${nutritionLogic.macrosPct.fat}% das calorias`, icon: Droplet, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  ]

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Resultado Nutricional</h1>
          <p className="text-muted-foreground">Análise calculada em tempo real com base nos dados do banco</p>
        </div>
      </motion.div>

      {/* Patient Info */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{patientData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {patientData.age} anos • {patientData.sex} • {patientData.height}cm • {patientData.weight}kg
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Objetivo</span>
                <p className="font-medium text-primary">{patientData.goal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Nutrition Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {nutritionCards.map((card, index) => (
          <Card key={index} className="bg-card">
            <CardContent className="p-4 text-center">
              <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center mx-auto mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Macros Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle>Distribuição de Macronutrientes</CardTitle>
              <CardDescription>Proporção ideal calculada para: {patientData.goal}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nutritionLogic.macrosData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {nutritionLogic.macrosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle>Detalhes dos Macros</CardTitle>
              <CardDescription>Valores calculados em gramas e calorias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {nutritionLogic.macrosData.map((macro, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: macro.color }}
                    />
                    <span className="font-medium text-foreground">{macro.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{macro.value}%</p>
                    <p className="text-xs text-muted-foreground">{macro.calories} kcal</p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Total Calculado (TDEE)</span>
                  <span className="font-bold text-lg text-primary">{nutritionLogic.dailyCalories} kcal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Button */}
      <motion.div variants={fadeInUp}>
        <Link href="/dashboard/dieta-gerada">
          <Button size="lg" className="w-full h-12 gap-2">
            Ver Dieta Gerada pela IA
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  )
}
