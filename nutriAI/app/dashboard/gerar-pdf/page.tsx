"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText, Download, Mail, Printer, User,
  Coffee, Apple, UtensilsCrossed, Cookie, Moon, Salad,
  ArrowLeft, Loader2
} from "lucide-react"
import { apiFetch } from "@/lib/api"

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
const stagger = { animate: { transition: { staggerChildren: 0.08 } } }

const iconMap: Record<string, React.ElementType> = {
  "Café da Manhã": Coffee,
  "Lanche da Manhã": Apple,
  "Almoço": UtensilsCrossed,
  "Lanche da Tarde": Cookie,
  "Jantar": Salad,
  "Ceia": Moon,
}

function GerarPDFContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get("paciente")
  const previewRef = useRef<HTMLDivElement>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [patientData, setPatientData] = useState<any>(null)
  const [nutritionistName, setNutritionistName] = useState("Nutricionista")
  const [meals, setMeals] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      if (!patientId) {
        setLoadError("Paciente não informado. Volte para a dieta gerada e clique em Aprovar e Gerar PDF.")
        setIsLoading(false)
        return
      }
      try {
        const [pRes, dRes, uRes] = await Promise.all([
          apiFetch(`/patients/${patientId}/`),
          apiFetch(`/diets/patient/${patientId}/`),
          apiFetch("/users/me"),
        ])

        if (!pRes.ok) { setLoadError("Não foi possível carregar os dados do paciente."); return }
        if (!dRes.ok) { setLoadError("Não foi possível carregar a dieta do paciente."); return }

        const p = await pRes.json()
        const heightM = p.height > 3 ? p.height / 100 : p.height
        const imc = heightM > 0 ? (p.weight / (heightM ** 2)).toFixed(2) : "0.00"
        setPatientData({ ...p, imc })

        if (uRes.ok) {
          const u = await uRes.json()
          setNutritionistName(u.name || "Nutricionista")
        }

        const diets = await dRes.json()
        if (diets.length > 0) {
          setMeals(diets[diets.length - 1].meals || [])
        } else {
          setLoadError("Nenhuma dieta foi encontrada para este paciente.")
        }
      } catch (error) {
        console.error("Erro ao carregar dados do PDF:", error)
        setLoadError("Erro de conexão. Verifique se o servidor está ativo.")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [patientId])

  const totalCalories = meals.reduce((acc, m) => acc + (m.total_calories || 0), 0)

  const generatePDF = async () => {
    if (!previewRef.current) return
    setIsGenerating(true)
    try {
      // Importações dinâmicas para não aumentar o bundle inicial
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ])

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      const pageWidth = pdf.internal.pageSize.getWidth()   // 210 mm
      const pageHeight = pdf.internal.pageSize.getHeight() // 297 mm
      const imgHeightMm = (canvas.height * pageWidth) / canvas.width

      if (imgHeightMm <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeightMm)
      } else {
        // Conteúdo maior que uma página — divide em páginas
        let renderedHeight = 0
        while (renderedHeight < imgHeightMm) {
          if (renderedHeight > 0) pdf.addPage()
          pdf.addImage(imgData, "PNG", 0, -renderedHeight, pageWidth, imgHeightMm)
          renderedHeight += pageHeight
        }
      }

      const filename = `plano-alimentar-${(patientData?.name || "paciente")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}.pdf`

      pdf.save(filename)
      setPdfGenerated(true)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Erro ao gerar o PDF. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => window.print()

  if (isLoading) return <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin w-5 h-5" /> Preparando documento...</div>
  if (loadError) return <div className="p-10 text-center space-y-4"><p className="text-muted-foreground">{loadError}</p><Button onClick={() => router.back()}>Voltar</Button></div>
  if (!patientData) return <div className="p-10 text-center text-muted-foreground">Selecione um paciente válido.</div>

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="max-w-4xl mx-auto space-y-6 pb-20">

      {/* Cabeçalho da página */}
      <motion.div variants={fadeInUp} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Exportar Plano Alimentar</h1>
          <p className="text-muted-foreground text-sm">Confira os dados antes de gerar o arquivo final</p>
        </div>
      </motion.div>

      {/* Preview A4 — este div é capturado pelo html2canvas */}
      <motion.div variants={fadeInUp} className="shadow-2xl border rounded-sm overflow-hidden">
        <div ref={previewRef} className="bg-white text-slate-900 p-10 font-sans">

          {/* Cabeçalho do documento */}
          <div className="flex justify-between items-start border-b-2 border-green-500 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg">N</span>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-green-700">NutriAI</h2>
                <p className="text-xs text-slate-500">Plataforma de Nutrição Clínica</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p className="font-bold text-slate-600 mb-1">PLANO ALIMENTAR PERSONALIZADO</p>
              <p>Nutricionista: <span className="font-semibold text-slate-700">{nutritionistName}</span></p>
              <p>Gerado em: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
          </div>

          {/* Perfil do paciente */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 text-green-700 font-bold uppercase text-xs tracking-widest mb-4">
              <User className="w-4 h-4" /> Perfil do Paciente
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase mb-1">Nome</p>
                <p className="font-bold text-sm">{patientData.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase mb-1">IMC</p>
                <p className="font-bold text-sm">{patientData.imc} kg/m²</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase mb-1">Peso / Altura</p>
                <p className="font-bold text-sm">
                  {Number(patientData.weight).toFixed(1)} kg / {Number(patientData.height).toFixed(0)} cm
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase mb-1">Objetivo</p>
                <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                  {patientData.goal}
                </span>
              </div>
            </div>
          </div>

          {/* Resumo calórico */}
          <div className="bg-green-600 rounded-xl p-5 mb-8 flex justify-between items-center text-white">
            <div>
              <p className="text-green-100 text-[10px] uppercase tracking-widest font-bold">Meta Energética Diária</p>
              <h3 className="text-3xl font-black">{totalCalories} <span className="text-base font-normal">kcal / dia</span></h3>
            </div>
            <div className="text-right text-xs text-green-100">
              <p>{meals.length} refeições planejadas</p>
              <p>Calculado via NutriAI</p>
            </div>
          </div>

          {/* Cronograma alimentar */}
          <h3 className="font-bold text-lg border-l-4 border-green-500 pl-3 mb-6">Cronograma Alimentar</h3>
          <div className="space-y-5">
            {meals.map((meal: any) => (
              <div key={meal.id} className="border border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="font-bold text-slate-800">{meal.title}</span>
                    <span className="text-slate-400 text-sm ml-2">às {meal.time}</span>
                  </div>
                  <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded text-slate-600">
                    {meal.total_calories} kcal
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-2 font-medium">Alimento</th>
                      <th className="pb-2 font-medium text-right">Quantidade</th>
                      <th className="pb-2 font-medium text-right">Kcal</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {meal.foods?.map((food: any) => (
                      <tr key={food.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-1.5">{food.name}</td>
                        <td className="py-1.5 text-right">{food.quantity}</td>
                        <td className="py-1.5 text-right font-medium">{food.calories}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Rodapé do documento */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-end text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-600">NutriAI — Plataforma de Nutrição Clínica</p>
              <p>Este documento é de uso exclusivo do profissional de nutrição responsável.</p>
            </div>
            <p>Pág. 1</p>
          </div>
        </div>
      </motion.div>

      {/* Botões de ação */}
      <motion.div variants={fadeInUp} className="flex flex-col gap-3">
        {!pdfGenerated ? (
          <Button
            size="lg"
            className="h-16 text-lg gap-2 shadow-xl"
            onClick={generatePDF}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Gerar e Baixar PDF
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-green-600 font-medium">
              PDF gerado com sucesso! Verifique seus downloads.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button size="lg" className="h-14 gap-2" onClick={generatePDF} disabled={isGenerating}>
                <Download className="w-5 h-5" />
                {isGenerating ? "Gerando..." : "Baixar Novamente"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 gap-2"
                onClick={() => {
                  window.location.href = `mailto:?subject=Plano alimentar - ${patientData.name}&body=Segue o plano alimentar gerado no NutriAI.`
                }}
              >
                <Mail className="w-5 h-5" />
                Enviar por E-mail
              </Button>
              <Button size="lg" variant="outline" className="h-14 gap-2" onClick={handlePrint}>
                <Printer className="w-5 h-5" />
                Imprimir
              </Button>
            </div>
          </div>
        )}
      </motion.div>

    </motion.div>
  )
}

export default function GerarPDFPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>}>
      <GerarPDFContent />
    </Suspense>
  )
}
