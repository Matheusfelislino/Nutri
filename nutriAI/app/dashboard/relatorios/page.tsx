"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Target,
  Scale,
  TrendingUp,
  Users
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
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

export default function RelatoriosPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await apiFetch("/patients/")

        if (response.ok) {
          const data = await response.json()
          setPatients(data)
        }
      } catch (error) {
        console.error("Erro ao buscar pacientes para os relatórios:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const reportData = useMemo(() => {
    if (patients.length === 0) {
      return {
        total: 0,
        imcMedio: "0.00",
        objectivesData: [],
        imcDistributionData: []
      }
    }

    // 1. Contagem de Objetivos para o Gráfico de Pizza
    const goalsCount: Record<string, number> = {}
    patients.forEach(p => {
      const goal = p.goal || "Não definido"
      goalsCount[goal] = (goalsCount[goal] || 0) + 1
    })

    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]
    const objectivesData = Object.keys(goalsCount).map((goal, index) => ({
      name: goal,
      value: Math.round((goalsCount[goal] / patients.length) * 100),
      color: colors[index % colors.length]
    }))

    // 2. Cálculo de IMC e Distribuição
    let totalImc = 0
    let validImcCount = 0
    const imcRanges = {
      "< 18.5": 0,
      "18.5-24.9": 0,
      "25-29.9": 0,
      "30-34.9": 0,
      "35-39.9": 0,
      "> 40": 0
    }

    patients.forEach(p => {
      if (p.weight && p.height) {
        const heightM = p.height > 3 ? p.height / 100 : p.height
        const imc = p.weight / (heightM * heightM)
        totalImc += imc
        validImcCount++

        if (imc < 18.5) imcRanges["< 18.5"]++
        else if (imc < 25) imcRanges["18.5-24.9"]++
        else if (imc < 30) imcRanges["25-29.9"]++
        else if (imc < 35) imcRanges["30-34.9"]++
        else if (imc < 40) imcRanges["35-39.9"]++
        else imcRanges["> 40"]++
      }
    })

    const imcDistributionData = [
      { range: "< 18.5", count: imcRanges["< 18.5"], label: "Abaixo do peso" },
      { range: "18.5-24.9", count: imcRanges["18.5-24.9"], label: "Peso normal" },
      { range: "25-29.9", count: imcRanges["25-29.9"], label: "Sobrepeso" },
      { range: "30-34.9", count: imcRanges["30-34.9"], label: "Obesidade I" },
      { range: "35-39.9", count: imcRanges["35-39.9"], label: "Obesidade II" },
      { range: "> 40", count: imcRanges["> 40"], label: "Obesidade III" },
    ]

    return {
      total: patients.length,
      imcMedio: validImcCount > 0 ? (totalImc / validImcCount).toFixed(2) : "0.00",
      objectivesData,
      imcDistributionData
    }
  }, [patients])

  const summaryStats = [
    {
      title: "Total de Pacientes",
      value: reportData.total.toString(),
      change: "Cadastrados no banco",
      icon: Users,
    },
    {
      title: "Taxa de Sucesso",
      value: "N/A",
      change: "Aguardando funcionalidade de Histórico",
      icon: Target,
    },
    {
      title: "IMC Médio",
      value: reportData.imcMedio,
      change: "Baseado no peso atual",
      icon: Scale,
    },
    {
      title: "Evolução de Peso",
      value: "N/A",
      change: "Aguardando funcionalidade de Histórico",
      icon: TrendingUp,
    },
  ]

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">Carregando relatórios...</div>
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise e estatísticas dos seus pacientes</p>
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="30days" disabled>Últimos 30 dias (Em breve)</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xs text-primary mt-1">{stat.change}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objectives Distribution */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle>Objetivos Mais Comuns</CardTitle>
              <CardDescription>Distribuição dos objetivos nutricionais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {reportData.objectivesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.objectivesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {reportData.objectivesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Porcentagem"]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Sem dados suficientes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* IMC Distribution */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle>Distribuição de IMC</CardTitle>
              <CardDescription>Classificação dos pacientes por faixa de IMC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.imcDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="range"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value, name, props) => [value, props.payload.label]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-50 pointer-events-none">
        {/* Weight Evolution */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle>Evolução de Peso</CardTitle>
              <CardDescription>Média de peso (Aguardando Histórico de Pacientes)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Funcionalidade em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Activity */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle>Atividade Mensal</CardTitle>
              <CardDescription>Novos pacientes (Aguardando Filtro por Data)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Funcionalidade em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
