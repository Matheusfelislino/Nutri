"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft, Plus, Loader2, ChevronDown, ChevronUp,
  Weight, Ruler, Target, TrendingUp, Utensils, Calendar, Flame,
  ClipboardList, Save, Activity, TrendingDown,
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import type { Patient, Diet, PatientCheckin } from "@/types/api"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// ─── helpers ────────────────────────────────────────────────────────────────

function weightVariationColor(delta: number, goal: string | null): string {
  const g = (goal ?? "").toLowerCase()
  const isLoss = g.includes("emag") || g.includes("perder")
  const isGain = g.includes("hipert") || g.includes("ganhar") || g.includes("massa")
  if (delta < 0) return isLoss ? "text-emerald-600" : isGain ? "text-red-500" : "text-slate-500"
  if (delta > 0) return isGain ? "text-emerald-600" : isLoss ? "text-red-500" : "text-slate-500"
  return "text-slate-400"
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toFixed(1)} kg`
}

// ─── component ───────────────────────────────────────────────────────────────

export default function DetalhesPacientePage() {
  const { id } = useParams()
  const router = useRouter()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [diets, setDiets] = useState<Diet[]>([])
  const [checkins, setCheckins] = useState<PatientCheckin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedDietId, setExpandedDietId] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  // Dialog de check-in
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [checkinWeight, setCheckinWeight] = useState("")
  const [checkinNotes, setCheckinNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [patientRes, dietsRes, checkinsRes] = await Promise.all([
          apiFetch(`/patients/${id}/`),
          apiFetch(`/diets/patient/${id}/`),
          apiFetch(`/patients/${id}/checkins`),
        ])

        if (patientRes.ok) {
          const data = await patientRes.json()
          setPatient(data)
          setNotes(data.notes ?? "")
        }
        if (dietsRes.ok) setDiets(await dietsRes.json())
        if (checkinsRes.ok) setCheckins(await checkinsRes.json())
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    setNotesSaved(false)
    try {
      const response = await apiFetch(`/patients/${id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      })
      if (response.ok) {
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 3000)
      }
    } catch {
      // silencia — a UI permanece em estado editável
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleSubmitCheckin = async () => {
    const w = parseFloat(checkinWeight)
    if (!checkinWeight || isNaN(w) || w <= 0) {
      alert("Informe um peso válido.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/patients/${id}/checkins`, {
        method: "POST",
        body: JSON.stringify({ weight: w, notes: checkinNotes || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        alert(err?.detail ?? "Erro ao salvar check-in.")
        return
      }
      const created: PatientCheckin = await res.json()
      setCheckins((prev) => [created, ...prev])
      setCheckinOpen(false)
      setCheckinWeight("")
      setCheckinNotes("")
    } catch {
      alert("Erro ao conectar com o servidor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const chartData = [...diets]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((d) => ({
      date: new Date(d.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      calorias: d.total_calories,
    }))

  const checkinChartData = [...checkins]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((c) => ({
      date: new Date(c.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      peso: c.weight,
    }))

  const imc =
    patient?.weight && patient?.height
      ? (
          patient.weight /
          Math.pow(patient.height > 3 ? patient.height / 100 : patient.height, 2)
        ).toFixed(1)
      : null

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-primary" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Paciente não encontrado.
      </div>
    )
  }

  return (
    <>
      {/* ── Dialog de novo check-in ───────────────────────────────────────── */}
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Registro de Evolução</DialogTitle>
            <DialogDescription>
              Registre o peso atual de {patient.name} para acompanhar a evolução.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ck-weight">Peso Atual (kg)</Label>
              <Input
                id="ck-weight"
                type="number"
                step="0.1"
                min="0"
                placeholder="Ex: 72.5"
                value={checkinWeight}
                onChange={(e) => setCheckinWeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ck-notes">Anotações <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                id="ck-notes"
                placeholder="Observações sobre o estado atual do paciente..."
                className="resize-none min-h-[80px]"
                value={checkinNotes}
                onChange={(e) => setCheckinNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCheckin} disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Página ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{patient.name}</h1>
              <p className="text-sm text-muted-foreground">
                {patient.created_at
                  ? `Paciente desde ${new Date(patient.created_at).toLocaleDateString("pt-BR")}`
                  : "Paciente"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setCheckinOpen(true)}>
              <Activity className="w-4 h-4" />
              Novo Registro
            </Button>
            <Link href={`/dashboard/criar-dieta?paciente=${id}`}>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Dieta com IA
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do Paciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {patient.age != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Idade</span>
                    <span className="font-medium">{patient.age} anos</span>
                  </div>
                )}
                {patient.gender && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sexo</span>
                    <span className="font-medium capitalize">{patient.gender}</span>
                  </div>
                )}
                {patient.weight != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Weight className="w-3.5 h-3.5" /> Peso inicial
                    </span>
                    <span className="font-medium">{patient.weight} kg</span>
                  </div>
                )}
                {checkins.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Weight className="w-3.5 h-3.5" /> Peso atual
                    </span>
                    <span className="font-semibold text-primary">{checkins[0].weight} kg</span>
                  </div>
                )}
                {patient.height != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5" /> Altura
                    </span>
                    <span className="font-medium">{patient.height} cm</span>
                  </div>
                )}
                {imc && (
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-muted-foreground">IMC</span>
                    <span className="font-semibold text-primary">{imc}</span>
                  </div>
                )}
                {patient.goal && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Objetivo
                    </span>
                    <Badge variant="secondary" className="text-xs">{patient.goal}</Badge>
                  </div>
                )}
                {patient.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-mail</span>
                    <span className="font-medium text-xs truncate max-w-[160px]">{patient.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-muted/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{diets.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {diets.length === 1 ? "dieta gerada" : "dietas geradas"}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{checkins.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {checkins.length === 1 ? "check-in" : "check-ins"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Coluna direita */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Histórico de Check-ins ─────────────────────────────────── */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="w-4 h-4 text-primary" />
                    Evolução de Peso
                  </CardTitle>
                  <CardDescription>
                    {checkins.length > 0
                      ? `${checkins.length} ${checkins.length === 1 ? "registro" : "registros"}`
                      : "Nenhum registro ainda"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setCheckinOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Registro
                </Button>
              </CardHeader>
              <CardContent>
                {checkins.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed rounded-lg border-muted">
                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Nenhum registro de peso ainda.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setCheckinOpen(true)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Primeiro Registro
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Gráfico de evolução de peso — só aparece com 2+ checkins */}
                    {checkinChartData.length >= 2 && (
                      <div className="h-[160px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={checkinChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                              dataKey="date"
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={11}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={11}
                              tickLine={false}
                              tickFormatter={(v) => `${v}kg`}
                              width={52}
                              domain={["auto", "auto"]}
                            />
                            <Tooltip
                              formatter={(value: number) => [`${value} kg`, "Peso"]}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="peso"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ fill: "hsl(var(--primary))", r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Lista de registros */}
                    {checkins.map((checkin, index) => {
                      const prev = checkins[index + 1]
                      const delta = prev ? checkin.weight - prev.weight : null
                      const deltaColor = delta !== null
                        ? weightVariationColor(delta, patient.goal)
                        : ""

                      return (
                        <div
                          key={checkin.id}
                          className="flex items-start justify-between gap-3 py-3 border-b border-border last:border-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Weight className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">
                                  {checkin.weight} kg
                                </span>
                                {index === 0 && (
                                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border-0">
                                    Atual
                                  </Badge>
                                )}
                                {delta !== null && (
                                  <span className={`text-xs font-medium flex items-center gap-0.5 ${deltaColor}`}>
                                    {delta < 0
                                      ? <TrendingDown className="w-3 h-3" />
                                      : delta > 0
                                      ? <TrendingUp className="w-3 h-3" />
                                      : null
                                    }
                                    {formatDelta(delta)}
                                  </span>
                                )}
                              </div>
                              {checkin.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                  {checkin.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 tabular-nums mt-1">
                            {new Date(checkin.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de evolução calórica */}
            {chartData.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Evolução Calórica
                  </CardTitle>
                  <CardDescription>
                    Total de calorias por plano alimentar ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(v) => `${v}kcal`}
                          width={72}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${value} kcal`, "Calorias"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="calorias"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico de dietas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Utensils className="w-4 h-4 text-primary" />
                  Histórico de Dietas
                </CardTitle>
                <CardDescription>
                  {diets.length > 0
                    ? `${diets.length} ${diets.length === 1 ? "plano alimentar gerado" : "planos alimentares gerados"}`
                    : "Nenhuma dieta gerada ainda"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {diets.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed rounded-lg border-muted">
                    <Utensils className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma dieta gerada ainda para este paciente.
                    </p>
                    <Link href={`/dashboard/criar-dieta?paciente=${id}`}>
                      <Button size="sm" variant="outline" className="gap-2 mt-4">
                        <Plus className="w-3.5 h-3.5" />
                        Gerar primeira dieta
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diets.map((diet, index) => (
                      <div key={diet.id} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                          onClick={() =>
                            setExpandedDietId(expandedDietId === diet.id ? null : diet.id)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Flame className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm text-foreground">
                                  {new Date(diet.created_at).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </p>
                                {index === 0 && (
                                  <Badge className="text-[10px] px-1.5 py-0 h-4">
                                    Mais recente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {diet.total_calories} kcal/dia • {diet.meals.length}{" "}
                                {diet.meals.length === 1 ? "refeição" : "refeições"}
                              </p>
                            </div>
                          </div>
                          {expandedDietId === diet.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>

                        <AnimatePresence>
                          {expandedDietId === diet.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t px-4 py-3 space-y-4 bg-muted/20">
                                {diet.meals.map((meal) => (
                                  <div key={meal.id}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-sm font-medium text-foreground">
                                          {meal.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {meal.time}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {meal.total_calories} kcal
                                      </span>
                                    </div>
                                    <ul className="pl-5 space-y-0.5">
                                      {meal.foods.map((food) => (
                                        <li
                                          key={food.id}
                                          className="text-xs text-muted-foreground flex justify-between"
                                        >
                                          <span>
                                            {food.name} — {food.quantity}
                                          </span>
                                          <span>{food.calories} kcal</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Observações Clínicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Observações Clínicas
                </CardTitle>
                <CardDescription>
                  Anotações privadas sobre consultas e evolução do paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[140px] p-3 rounded-md border bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Anote observações sobre a última consulta, dificuldades relatadas ou ajustes no plano alimentar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex items-center justify-between mt-2">
                  {notesSaved ? (
                    <p className="text-xs text-green-600">Anotação salva</p>
                  ) : (
                    <span />
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="gap-2"
                  >
                    {isSavingNotes
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Save className="w-3.5 h-3.5" />
                    }
                    Salvar Anotação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  )
}
