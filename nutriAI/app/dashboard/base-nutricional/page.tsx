"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Database, Loader2, Plus, Search } from "lucide-react"
import { apiFetch } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

type NutritionFood = {
  id: number
  name: string
  group: string
  portion: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  meal_tags: string
  goal_tags: string
  restriction_tags: string
  notes?: string
  active: boolean
}

const initialForm = {
  name: "",
  group: "proteina",
  portion: "100 g",
  calories: 100,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
  meal_tags: "almoco,jantar",
  goal_tags: "emagrecimento,hipertrofia,manutencao",
  restriction_tags: "sem_lactose,sem_gluten",
  notes: "",
  active: true
}

export default function BaseNutricionalPage() {
  const [foods, setFoods] = useState<NutritionFood[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(initialForm)

  async function loadFoods() {
    try {
      const response = await apiFetch("/nutrition-foods/")

      if (response.ok) {
        const data = await response.json()
        setFoods(data)
      }
    } catch (error) {
      console.error("Erro ao carregar base nutricional:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFoods()
  }, [])

  function updateForm(field: string, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const response = await apiFetch("/nutrition-foods/", {
        method: "POST",
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || "Erro ao cadastrar alimento")
      }

      setForm(initialForm)
      await loadFoods()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao cadastrar alimento")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredFoods = foods.filter(food => {
    const text = `${food.name} ${food.group} ${food.meal_tags} ${food.goal_tags} ${food.restriction_tags}`.toLowerCase()
    return text.includes(searchTerm.toLowerCase())
  })

  return (
    <motion.div initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeInUp}>
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Base Nutricional da IA</h1>
        </div>
        <p className="text-muted-foreground">
          Cadastre alimentos, porções, macros, refeições indicadas, objetivos e restrições. A IA usa esta base para montar as dietas.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Novo alimento
              </CardTitle>
              <CardDescription>Inclua alimentos que poderão ser recomendados pela IA.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do alimento</Label>
                  <Input value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="Ex: Arroz integral" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Grupo</Label>
                    <Input value={form.group} onChange={e => updateForm("group", e.target.value)} placeholder="proteina" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Porção</Label>
                    <Input value={form.portion} onChange={e => updateForm("portion", e.target.value)} placeholder="100 g" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Calorias</Label>
                    <Input type="number" value={form.calories} onChange={e => updateForm("calories", Number(e.target.value))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Proteínas g</Label>
                    <Input type="number" value={form.protein_g} onChange={e => updateForm("protein_g", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Carboidratos g</Label>
                    <Input type="number" value={form.carbs_g} onChange={e => updateForm("carbs_g", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gorduras g</Label>
                    <Input type="number" value={form.fat_g} onChange={e => updateForm("fat_g", Number(e.target.value))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags de refeição</Label>
                  <Input value={form.meal_tags} onChange={e => updateForm("meal_tags", e.target.value)} placeholder="cafe,lanche,almoco,jantar,ceia" />
                </div>

                <div className="space-y-2">
                  <Label>Tags de objetivo</Label>
                  <Input value={form.goal_tags} onChange={e => updateForm("goal_tags", e.target.value)} placeholder="emagrecimento,hipertrofia,manutencao" />
                </div>

                <div className="space-y-2">
                  <Label>Tags de restrição</Label>
                  <Input value={form.restriction_tags} onChange={e => updateForm("restriction_tags", e.target.value)} placeholder="vegetariano,vegano,sem_lactose,sem_gluten" />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={e => updateForm("notes", e.target.value)} placeholder="Observações clínicas ou de uso do alimento" />
                </div>

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Cadastrar alimento
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Alimentos cadastrados</CardTitle>
                  <CardDescription>{foods.length} alimentos disponíveis para recomendação</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 text-muted-foreground -translate-y-1/2" />
                  <Input className="pl-10" placeholder="Buscar alimento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Carregando alimentos...
                </div>
              ) : (
                <div className="space-y-3 max-h-[760px] overflow-auto pr-2">
                  {filteredFoods.map(food => (
                    <div key={food.id} className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{food.name}</p>
                          <p className="text-sm text-muted-foreground">{food.portion} • {food.calories} kcal • P {food.protein_g}g • C {food.carbs_g}g • G {food.fat_g}g</p>
                        </div>
                        <Badge variant="secondary">{food.group}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {food.meal_tags.split(",").filter(Boolean).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                        {food.goal_tags.split(",").filter(Boolean).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                        {food.restriction_tags.split(",").filter(Boolean).map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                      </div>
                    </div>
                  ))}

                  {filteredFoods.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                      Nenhum alimento encontrado.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
