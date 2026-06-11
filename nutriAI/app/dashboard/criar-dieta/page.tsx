"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, User, Activity, AlertCircle, Loader2, UtensilsCrossed } from "lucide-react"
import { apiFetch } from "@/lib/api"
import type { Patient } from "@/types/api"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

// Separamos o formulário em um componente para poder usar o useSearchParams com Suspense (exigência do Next.js)
function DietForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pacienteIdDaUrl = searchParams.get("paciente")

  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>(pacienteIdDaUrl || "")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)

  // Estados dos formulários de dieta
  const [activityLevel, setActivityLevel] = useState("")
  const [mealsPerDay, setMealsPerDay] = useState<number>(5)
  const [restrictions, setRestrictions] = useState({
    lactose: false,
    gluten: false,
    amendoim: false,
    vegetariano: false,
    vegano: false,
  })
  const [otherRestrictions, setOtherRestrictions] = useState("")

  // Busca os pacientes no banco
  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await apiFetch("/patients/")
        if (response.ok) {
          const data = await response.json()
          setPatients(data)
        }
      } catch (error) {
        console.error("Erro ao carregar pacientes:", error)
      } finally {
        setIsLoadingPatients(false)
      }
    }
    fetchPatients()
  }, [])

  // Encontra os dados do paciente selecionado para mostrar o resumo
  const selectedPatient = patients.find(p => p.id.toString() === selectedPatientId)

  const handleCheckboxChange = (restriction: keyof typeof restrictions) => {
    setRestrictions(prev => ({ ...prev, [restriction]: !prev[restriction] }))
  }

  const handleGenerateDiet = async () => {
    if (!selectedPatientId) {
      alert("Por favor, selecione um paciente primeiro.")
      return
    }

    if (!activityLevel) {
      alert("Por favor, selecione o nível de atividade do paciente.")
      return
    }

    setIsGenerating(true)

    try {
      const response = await apiFetch("/ai/generate-diet", {
        method: "POST",
        body: JSON.stringify({
          patient_id: Number(selectedPatientId),
          activity_level: activityLevel,
          restrictions,
          other_restrictions: otherRestrictions,
          meals_per_day: mealsPerDay,
          professional_notes: otherRestrictions,
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || "Erro ao gerar dieta com IA")
      }

      const result = await response.json()
      localStorage.setItem("latest_ai_diet", JSON.stringify(result))
      router.push(`/dashboard/dieta-gerada?paciente=${selectedPatientId}`)
    } catch (error) {
      console.error("Erro ao gerar dieta:", error)
      alert(error instanceof Error ? error.message : "Erro ao gerar dieta com IA")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Configurar Dieta</h1>
        <p className="text-muted-foreground">Selecione o paciente e defina os parâmetros para a Inteligência Artificial gerar o cardápio.</p>
      </motion.div>

      {/* 1. Seleção de Paciente */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Paciente
            </CardTitle>
            <CardDescription>Escolha para quem a dieta será gerada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPatients ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando lista de pacientes...
              </div>
            ) : (
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente cadastrado..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.length > 0 ? (
                    patients.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Nenhum paciente cadastrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}

            {/* Resumo do Paciente Selecionado */}
            {selectedPatient && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedPatient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPatient.age} anos • {selectedPatient.weight}kg • {selectedPatient.height}cm
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Objetivo Atual</p>
                  <p className="text-sm font-medium text-primary">{selectedPatient.goal || "Não definido"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Parâmetros Físicos */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Nível de Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível de atividade diária..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentario">Sedentário (Pouco ou nenhum exercício)</SelectItem>
                <SelectItem value="leve">Levemente Ativo (Exercício leve 1-3 dias/semana)</SelectItem>
                <SelectItem value="moderado">Moderado (Exercício moderado 3-5 dias/semana)</SelectItem>
                <SelectItem value="ativo">Muito Ativo (Exercício intenso 6-7 dias/semana)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Número de Refeições */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              Número de Refeições
            </CardTitle>
            <CardDescription>
              Quantas refeições o plano alimentar deve ter por dia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={String(mealsPerDay)}
              onValueChange={(v) => setMealsPerDay(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a quantidade de refeições..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 refeições — Café, Almoço e Jantar</SelectItem>
                <SelectItem value="4">4 refeições — + Lanche da Tarde</SelectItem>
                <SelectItem value="5">5 refeições — + Lanche da Manhã (recomendado)</SelectItem>
                <SelectItem value="6">6 refeições — + Ceia</SelectItem>
              </SelectContent>
            </Select>

            {/* Resumo visual dos horários */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { n: 3, slots: ["07:00", "12:30", "19:30"] },
                { n: 4, slots: ["07:00", "12:30", "16:00", "19:30"] },
                { n: 5, slots: ["07:00", "10:00", "12:30", "16:00", "19:30"] },
                { n: 6, slots: ["07:00", "10:00", "12:30", "16:00", "19:30", "22:00"] },
              ]
                .find((r) => r.n === mealsPerDay)
                ?.slots.map((time) => (
                  <span
                    key={time}
                    className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full"
                  >
                    {time}
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. Restrições Alimentares */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Restrições Alimentares
            </CardTitle>
            <CardDescription>Selecione as alergias e preferências do paciente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={restrictions.lactose} onChange={() => handleCheckboxChange('lactose')} />
                <span className="text-sm font-medium leading-none">Intolerância à Lactose</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={restrictions.gluten} onChange={() => handleCheckboxChange('gluten')} />
                <span className="text-sm font-medium leading-none">Intolerância ao Glúten</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={restrictions.amendoim} onChange={() => handleCheckboxChange('amendoim')} />
                <span className="text-sm font-medium leading-none">Alergia a Amendoim</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={restrictions.vegetariano} onChange={() => handleCheckboxChange('vegetariano')} />
                <span className="text-sm font-medium leading-none">Vegetariano</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={restrictions.vegano} onChange={() => handleCheckboxChange('vegano')} />
                <span className="text-sm font-medium leading-none">Vegano</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outras">Outras Restrições ou Observações</Label>
              <Textarea
                id="outras"
                placeholder="Descreva outras alergias, alimentos que não gosta, etc..."
                value={otherRestrictions}
                onChange={(e) => setOtherRestrictions(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 5. Botão de Gerar */}
      <motion.div variants={fadeInUp} className="pt-4 pb-12">
        <Button
          size="lg"
          className="w-full h-14 text-lg bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all"
          onClick={handleGenerateDiet}
          disabled={isGenerating || !selectedPatientId}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Dieta com IA
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default function CriarDietaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <DietForm />
    </Suspense>
  )
}
