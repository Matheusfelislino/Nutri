"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Edit,
  Salad,
  Trash2,
  Eye,
  Filter
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import type { Patient } from "@/types/api"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterObjective, setFilterObjective] = useState("all")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 1. Função para deletar paciente (Dando vida ao botão excluir)
  const handleDeletePatient = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este paciente?")) return

    try {
      const response = await apiFetch(`/patients/${id}`, { method: "DELETE" })

      if (response.ok) {
        // Remove da lista local para sumir da tela na hora
        setPatients(prev => prev.filter(p => p.id !== id))
      } else {
        alert("Erro ao excluir paciente no servidor.")
      }
    } catch (error) {
      console.error("Erro ao deletar:", error)
      alert("Erro ao conectar com o servidor.")
    }
  }

  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await apiFetch("/patients/")

        if (response.ok) {
          const data = await response.json()
          setPatients(data)
        }
      } catch (error) {
        console.error("Erro ao buscar a lista de pacientes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPatients()
  }, [])

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const patientGoal = patient.goal || "Não definido"
    const matchesFilter = filterObjective === "all" || patientGoal === filterObjective
    
    return matchesSearch && matchesFilter
  })

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={fadeInUp}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie todos os seus pacientes</p>
        </div>
        <Link href="/dashboard/pacientes/novo">
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterObjective} onValueChange={setFilterObjective}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Reeducação Alimentar">Reeducação Alimentar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>{filteredPatients.length} pacientes encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Carregando pacientes...
              </div>
            ) : filteredPatients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Idade</TableHead>
                    <TableHead className="hidden lg:table-cell">Peso/Altura</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead className="hidden sm:table-cell">Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">{patient.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{patient.age} anos</TableCell>
                      <TableCell className="hidden lg:table-cell">{patient.weight}kg / {patient.height}cm</TableCell>
                      <TableCell>
                        <Badge variant="outline">{patient.goal || "Não definido"}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR') : "-"}
                      </TableCell>
                      <TableCell><Badge variant="default">Ativo</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/pacientes/${patient.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/pacientes/${patient.id}/editar`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/criar-dieta?paciente=${patient.id}`}>
                                <Salad className="w-4 h-4 mr-2" />
                                Nova Dieta
                              </Link>
                            </DropdownMenuItem>

                            {/* Linha separadora opcional para destacar a exclusão */}
                            <div className="h-px my-1 bg-muted" />

                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                              onSelect={() => handleDeletePatient(patient.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center border-2 border-dashed rounded-lg border-muted">
                <p className="text-muted-foreground">Nenhum paciente encontrado.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}