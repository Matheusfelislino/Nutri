"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Folder, FileText, Download, Search, ChevronRight, ArrowLeft } from "lucide-react"
import { apiFetch } from "@/lib/api"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
}

export default function ArquivosPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)

  // Busca os pacientes para criar as pastas
  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await apiFetch("/patients/")

        if (response.ok) {
          const data = await response.json()
          setPatients(data)
        }
      } catch (error) {
        console.error("Erro ao buscar pacientes:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPatients()
  }, [])

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="space-y-6"
    >
      {/* Cabeçalho */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gerenciador de Arquivos</h1>
          <p className="text-muted-foreground">Organize as dietas e PDFs dos seus pacientes</p>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card className="bg-card min-h-[500px]">
          <CardHeader>
            {selectedPatient ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setSelectedPatient(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary fill-primary/20" />
                    {selectedPatient.name}
                  </CardTitle>
                  <CardDescription>Arquivos e PDFs gerados para este paciente</CardDescription>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Pastas dos Pacientes</CardTitle>
                  <CardDescription>Selecione um paciente para ver seus arquivos</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pasta..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Carregando pastas...</div>
            ) : selectedPatient ? (
              // Visão DENTRO da pasta do paciente
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Aqui no futuro nós podemos listar múltiplos PDFs se houver. Por enquanto, criamos um placeholder simulando a dieta atual */}
                <div className="group border border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer flex flex-col items-center text-center gap-3 bg-muted/20">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Plano Alimentar - {selectedPatient.goal || "Atual"}.pdf</p>
                    <p className="text-xs text-muted-foreground mt-1">Gerado recentemente</p>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full mt-2 gap-2">
                    <Download className="w-4 h-4" /> Baixar
                  </Button>
                </div>
              </div>
            ) : (
              // Visão GERAL (Lista de pastas)
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(patient => (
                    <div 
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="group flex items-center p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Folder className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium text-foreground text-sm truncate">{patient.name}</p>
                        <p className="text-xs text-muted-foreground truncate">1 arquivo</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                    Nenhuma pasta encontrada.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}