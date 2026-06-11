"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react"
import Link from "next/link"
import { apiFetch } from "@/lib/api"

export default function NovoPacientePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Estado do formulário batendo com os campos do seu models.py
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    gender: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await apiFetch("/patients/", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
        }),
      })

      if (response.ok) {
        // Se salvou, volta para a lista de pacientes
        router.push("/dashboard/pacientes")
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(`Erro ao salvar: ${errorData.detail || "Verifique os dados"}`)
      }
    } catch (error) {
      console.error("Erro na requisição:", error)
      alert("Erro ao conectar com o servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pacientes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Novo Paciente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Preencha as informações básicas para começar o acompanhamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="age">Idade</Label>
                <Input 
                  id="age" 
                  type="number" 
                  required 
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input 
                  id="weight" 
                  type="number" 
                  step="0.1" 
                  required 
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input 
                  id="height" 
                  type="number" 
                  required 
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gender">Sexo</Label>
                <Select
                  onValueChange={(value) => setFormData({...formData, gender: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="goal">Objetivo Principal</Label>
                <Select
                  onValueChange={(value) => setFormData({...formData, goal: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Reeducação Alimentar">Reeducação Alimentar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Salvar Paciente
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}