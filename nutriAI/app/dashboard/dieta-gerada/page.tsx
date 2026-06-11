"use client"

import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Coffee, Apple, UtensilsCrossed, Cookie, Moon, Salad,
  Edit, RefreshCw, Check, User, Sparkles, Loader2, Info,
  AlertTriangle, Zap, Beef, Wheat, Droplets, Leaf, Lightbulb,
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import type { Patient, Meal, MacroBreakdown, AIDietResponse } from "@/types/api"

// ─── Animações ────────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
}

const stagger = { animate: { transition: { staggerChildren: 0.07 } } }

// ─── Mapa de ícones por refeição ──────────────────────────────────────────────

const MEAL_ICONS: Record<string, React.ElementType> = {
  "Café da Manhã":  Coffee,
  "Lanche da Manhã": Apple,
  "Almoço":         UtensilsCrossed,
  "Lanche da Tarde": Cookie,
  "Jantar":         Salad,
  "Ceia":           Moon,
}

const MEAL_COLORS: Record<string, string> = {
  "Café da Manhã":   "bg-amber-100 text-amber-600",
  "Lanche da Manhã": "bg-lime-100 text-lime-600",
  "Almoço":          "bg-emerald-100 text-emerald-600",
  "Lanche da Tarde": "bg-orange-100 text-orange-600",
  "Jantar":          "bg-indigo-100 text-indigo-600",
  "Ceia":            "bg-purple-100 text-purple-600",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcImc(weight: number, height: number): string {
  const h = height > 3 ? height / 100 : height
  return (weight / (h * h)).toFixed(1)
}

function imcLabel(imc: number): string {
  if (imc < 18.5) return "Abaixo do peso"
  if (imc < 25)   return "Peso saudável"
  if (imc < 30)   return "Sobrepeso"
  return "Obesidade"
}

function goalLabel(goal: string): string {
  const g = (goal || "").toLowerCase()
  if (g.includes("emag") || g.includes("perder")) return "Emagrecimento"
  if (g.includes("hipert") || g.includes("ganhar") || g.includes("massa")) return "Hipertrofia"
  return "Manutenção"
}

function deficitLabel(goal: string, target: number): string {
  const g = goalLabel(goal)
  if (g === "Emagrecimento") return `Déficit −400 kcal`
  if (g === "Hipertrofia")   return `Superávit +400 kcal`
  return "Manutenção calórica"
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function PatientRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 shrink-0 text-xs">{label}</span>
      <span className="text-slate-800 text-xs font-medium text-right">{value}</span>
    </div>
  )
}

interface MacroCardProps {
  Icon: React.ElementType
  label: string
  value: string
  unit: string
  sub: string
  accent: string
  bgColor: string
}

function MacroCard({ Icon, label, value, unit, sub, accent, bgColor }: MacroCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white rounded-xl shadow-sm p-3 flex flex-col gap-1"
    >
      <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center mb-1`}>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-slate-800">{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      <span className="text-[11px] text-slate-400 leading-tight">{sub}</span>
    </motion.div>
  )
}

interface MealRowProps {
  meal: {
    id: number
    title: string
    time: string
    total_calories: number
    foods?: { name: string; quantity: string; calories: number }[]
  }
  patientId: string
}

function MealRow({ meal, patientId }: MealRowProps) {
  const Icon = MEAL_ICONS[meal.title] ?? Salad
  const colorClass = MEAL_COLORS[meal.title] ?? "bg-slate-100 text-slate-600"
  const foodsText = (meal.foods ?? []).map(f => `${f.name} (${f.quantity})`).join(" • ")

  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 group"
    >
      <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-slate-400 font-medium tabular-nums">{meal.time}</span>
          <span className="text-sm font-semibold text-slate-800">{meal.title}</span>
        </div>
        <p className="text-xs text-slate-500 truncate">{foodsText}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-slate-700 tabular-nums">
          {meal.total_calories} kcal
        </span>
        <Link href={`/dashboard/editar-dieta?paciente=${patientId}&refeicao=${meal.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Conteúdo principal ───────────────────────────────────────────────────────

function DietaGeradaContent() {
  const searchParams = useSearchParams()
  const patientId    = searchParams.get("paciente") || "1"

  const [isLoading, setIsLoading]         = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showAlert, setShowAlert]         = useState(true)

  const [patient, setPatient] = useState<Patient | null>(null)
  const [meals, setMeals]     = useState<Meal[]>([])
  const [macros, setMacros]   = useState<MacroBreakdown | null>(null)
  const [targetCal, setTargetCal] = useState<number>(0)
  const [clinicalInsights, setClinicalInsights] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [pRes, dRes] = await Promise.all([
          apiFetch(`/patients/${patientId}/`),
          apiFetch(`/diets/patient/${patientId}/`),
        ])

        if (pRes.ok) {
          const p = await pRes.json()
          setPatient(p)
        }

        if (dRes.ok) {
          const diets = await dRes.json()
          if (diets.length > 0) {
            const latest = diets[diets.length - 1]
            setMeals(latest.meals ?? [])
          }
        }

        // Macros, meta calórica e insights clínicos vêm da última geração por IA
        const stored = localStorage.getItem("latest_ai_diet")
        if (stored) {
          const parsed = JSON.parse(stored) as AIDietResponse
          setMacros(parsed.macros ?? null)
          setTargetCal(parsed.target_calories ?? 0)
          setClinicalInsights(parsed.clinical_insights ?? [])
        }
      } catch (err) {
        console.error("Erro ao carregar dieta:", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [patientId])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm">Sincronizando com o NutriAI...</p>
      </div>
    )
  }

  const imc     = patient ? parseFloat(calcImc(patient.weight, patient.height)) : 0
  const pct     = (kcal: number) => targetCal ? Math.round(kcal / targetCal * 100) : 0
  const gLabel  = goalLabel(patient?.goal ?? "")

  const macroCards = macros
    ? [
        {
          Icon: Zap, label: "Energia", value: String(targetCal), unit: "kcal",
          sub: deficitLabel(patient?.goal ?? "", targetCal),
          accent: "text-blue-600", bgColor: "bg-blue-100",
        },
        {
          Icon: Beef, label: "Proteínas", value: String(macros.proteina_g), unit: "g",
          sub: `${pct(macros.proteina_kcal)}% (${macros.proteina_kcal} kcal)`,
          accent: "text-orange-600", bgColor: "bg-orange-100",
        },
        {
          Icon: Wheat, label: "Carboidratos", value: String(macros.carboidrato_g), unit: "g",
          sub: `${pct(macros.carboidrato_kcal)}% (${macros.carboidrato_kcal} kcal)`,
          accent: "text-yellow-600", bgColor: "bg-yellow-100",
        },
        {
          Icon: Droplets, label: "Gorduras", value: String(macros.gordura_g), unit: "g",
          sub: `${pct(macros.gordura_kcal)}% (${macros.gordura_kcal} kcal)`,
          accent: "text-red-500", bgColor: "bg-red-100",
        },
        {
          Icon: Leaf, label: "Fibras", value: String(macros.fibra_g ?? "—"), unit: "g",
          sub: "Adequado (DRI)",
          accent: "text-emerald-600", bgColor: "bg-emerald-100",
        },
      ]
    : []

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="min-h-screen bg-slate-50 -m-6 p-6"
    >
      {/* ── Cabeçalho ─────────────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900">Geração de dieta com IA</h1>
        </div>
        <p className="text-sm text-slate-500">
          A IA como apoio para criar planos alimentares personalizados e baseados em evidências.
        </p>
      </motion.div>

      {/* ── Banner de aviso ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>A dieta gerada pela IA é apenas uma sugestão</strong> e deve ser revisada
                pelo nutricionista antes de ser utilizada. Sempre considere o contexto clínico,
                preferências e evolução do paciente.
              </p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="text-amber-400 hover:text-amber-600 shrink-0 text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layout de duas colunas ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

        {/* ── Coluna esquerda: resumo do paciente ────────────────────────────── */}
        <motion.div variants={stagger} className="space-y-4">

          {/* Card: paciente */}
          <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  {patient?.name ?? "—"}
                </p>
                <p className="text-xs text-slate-400">
                  {patient?.age ? `${patient.age} anos` : "Idade não informada"}
                </p>
              </div>
            </div>
            <Link href={`/dashboard/pacientes/${patientId}`}>
              <span className="text-xs text-emerald-600 hover:underline font-medium">
                Ver perfil completo ↗
              </span>
            </Link>
          </motion.div>

          {/* Card: resumo clínico */}
          <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Resumo do paciente
              </h3>
              <Link href={`/dashboard/pacientes/${patientId}/editar`}>
                <Edit className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-600 transition-colors" />
              </Link>
            </div>
            <div>
              <PatientRow label="Objetivo"    value={gLabel} />
              <PatientRow label="Peso"        value={patient?.weight ? `${patient.weight} kg` : "—"} />
              <PatientRow label="Altura"      value={patient?.height ? `${patient.height} m` : "—"} />
              <PatientRow label="IMC"         value={imc ? `${imc} — ${imcLabel(imc)}` : "—"} />
              {targetCal > 0 && (
                <PatientRow label="VET (meta)" value={`${targetCal} kcal/dia`} />
              )}
              <PatientRow
                label="Observações"
                value={patient?.notes ? patient.notes.slice(0, 80) + (patient.notes.length > 80 ? "…" : "") : "Nenhuma"}
              />
            </div>
          </motion.div>

          {/* Card: ajustes da IA */}
          <motion.div variants={fadeUp} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-2">
              Ajustes que a IA considerou
            </h3>
            <ul className="space-y-1.5">
              {[
                gLabel === "Emagrecimento"
                  ? "Déficit calórico controlado (−400 kcal/dia)"
                  : gLabel === "Hipertrofia"
                  ? "Superávit calórico controlado (+400 kcal/dia)"
                  : "Manutenção calórica (equilíbrio)",
                "Distribuição de macros equilibrada",
                "Alimentos naturais e de fácil preparo",
                "Templates culinários por horário",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-emerald-700">
                  <Check className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* ── Coluna direita: dieta gerada ───────────────────────────────────── */}
        <motion.div variants={stagger} className="space-y-4">

          {/* Cabeçalho da dieta */}
          <motion.div
            variants={fadeUp}
            className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-3 flex-wrap"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-800">
                Sugestão de dieta gerada pela IA
              </h2>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs font-medium">
                Gerada agora
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-sm"
              onClick={() => {
                setIsRegenerating(true)
                window.location.href = `/dashboard/criar-dieta?paciente=${patientId}`
              }}
              disabled={isRegenerating}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              Regerar dieta
            </Button>
          </motion.div>

          {/* Dashboard de macros */}
          {macroCards.length > 0 && (
            <motion.div
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            >
              {macroCards.map((c) => (
                <MacroCard key={c.label} {...c} />
              ))}
            </motion.div>
          )}

          {/* Card: Insights Clínicos do Co-piloto */}
          {clinicalInsights.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-amber-900">
                    Visão do Co-piloto
                  </span>
                </div>
                <span className="text-[10px] font-medium text-amber-600 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 shrink-0 whitespace-nowrap">
                  Não vai para o PDF
                </span>
              </div>
              <ul className="space-y-2">
                {clinicalInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-800 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    {insight}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Lista de refeições */}
          {meals.length > 0 ? (
            <motion.div variants={fadeUp} className="bg-white rounded-xl shadow-sm px-4 py-2">
              <motion.div variants={stagger}>
                {meals.map((meal) => (
                  <MealRow key={meal.id} meal={meal} patientId={patientId} />
                ))}
              </motion.div>
              <p className="text-[11px] text-slate-400 text-right pt-3 pb-1 italic">
                Valores aproximados. Revise as quantidades conforme a necessidade do paciente.
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-xl shadow-sm p-12 text-center"
            >
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">Nenhuma dieta gerada para este paciente.</p>
              <Button
                onClick={() => { window.location.href = `/dashboard/criar-dieta?paciente=${patientId}` }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Primeira Sugestão
              </Button>
            </motion.div>
          )}

          {/* Botões de ação */}
          {meals.length > 0 && (
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <Link href={`/dashboard/editar-dieta?paciente=${patientId}`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full h-12 gap-2">
                  <Edit className="w-4 h-4" />
                  Editar Dieta
                </Button>
              </Link>
              <Link href={`/dashboard/gerar-pdf?paciente=${patientId}`} className="flex-1">
                <Button
                  size="lg"
                  className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-4 h-4" />
                  Aprovar e Gerar PDF
                </Button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Wrapper com Suspense (obrigatório para useSearchParams no Next.js) ────────

export default function DietaGeradaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-20 gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-sm">Carregando interface...</span>
        </div>
      }
    >
      <DietaGeradaContent />
    </Suspense>
  )
}
