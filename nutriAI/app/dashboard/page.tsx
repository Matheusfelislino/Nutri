"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, FileText, Clock, TrendingUp, UserPlus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import type { Patient } from "@/types/api"

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDiets: 0,
    pendingDiets: 0,
    activePatients: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("Nutricionista")

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const uRes = await apiFetch("/users/me").catch(() => null)

        if (uRes && uRes.ok) {
          const user = await uRes.json()
          setUserName(user.name || "Nutricionista")
        }

        const pRes = await apiFetch("/patients/")
        const dRes = await apiFetch("/diets/").catch(() => null)

        if (pRes.ok) {
          const pData = await pRes.json()
          setPatients(pData)

          let dietCount = 0
          if (dRes && dRes.ok) {
            const dData = await dRes.json()
            dietCount = dData.length
          }

          setStats({
            totalPatients: pData.length,
            totalDiets: dietCount,
            pendingDiets: 0,
            activePatients: pData.length
          })
        }
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Gerar dados para o gráfico baseado nos meses de criação dos pacientes reais
  const getChartData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const counts = new Array(12).fill(0)

    patients.forEach(p => {
      if (!p.created_at) return
      const date = new Date(p.created_at)
      counts[date.getMonth()]++
    })

    return months.map((name, index) => ({
      name,
      pacientes: counts[index]
    })).slice(0, new Date().getMonth() + 1)
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo de volta, {userName}!</p>
        </div>
        <Link href="/dashboard/pacientes/novo">
          <Button className="bg-green-600 hover:bg-green-700">
            <UserPlus className="mr-2 h-4 w-4" /> Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Cards de Métricas Reais */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total de Pacientes" value={stats.totalPatients} trend="+1" icon={Users} />
        <MetricCard title="Dietas Criadas" value={stats.totalDiets} trend="+0" icon={FileText} />
        <MetricCard title="Dietas Pendentes" value={stats.pendingDiets} trend="0" icon={Clock} color="text-slate-400" />
        <MetricCard title="Pacientes Ativos" value={stats.activePatients} trend="+1" icon={TrendingUp} />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Gráfico Real */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pacientes Cadastrados</CardTitle>
            <p className="text-xs text-muted-foreground">Volume de cadastros por mês</p>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="pacientes" fill="#000000" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lista de Pacientes Reais */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Últimos Pacientes</CardTitle>
            <Link href="/dashboard/pacientes" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {patients.length > 0 ? (
              patients.slice(-5).reverse().map((p) => (
                <RecentItem
                  key={p.id}
                  name={p.name}
                  goal={p.goal || "Não definido"}
                  status="Ativo"
                />
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-10">Nenhum paciente cadastrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number
  trend: string
  icon: React.ElementType
  color?: string
}

function MetricCard({ title, value, trend, icon: Icon, color = "text-green-500" }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-slate-100 rounded-full"><Icon className="h-4 w-4 text-slate-600" /></div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-[10px] font-bold ${color}`}>{trend} este mês</p>
      </CardContent>
    </Card>
  )
}

interface RecentItemProps {
  name: string
  goal: string
  status: string
}

function RecentItem({ name, goal, status }: RecentItemProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
      <div>
        <p className="text-sm font-bold">{name}</p>
        <p className="text-xs text-muted-foreground">{goal}</p>
      </div>
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
        {status}
      </Badge>
    </div>
  )
}
