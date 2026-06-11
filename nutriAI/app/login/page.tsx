"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Leaf, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiFetch } from "@/lib/api"

const STRENGTH_LABELS = ["", "Muito fraca", "Fraca", "Média", "Forte"]
const STRENGTH_COLORS = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"]

function getPasswordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  useEffect(() => {
    setIsRegister(searchParams.get("mode") === "register")
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isRegister) {
      if (formData.password.length < 8) {
        alert("A senha deve ter pelo menos 8 caracteres")
        return
      }
      if (!/[A-Z]/.test(formData.password)) {
        alert("A senha deve conter pelo menos uma letra maiúscula")
        return
      }
      if (!/[0-9]/.test(formData.password)) {
        alert("A senha deve conter pelo menos um número")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        alert("As senhas não coincidem")
        return
      }
    }

    setIsLoading(true)

    try {
      let response;

      if (isRegister) {
        response = await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        })
      } else {
        const formParams = new URLSearchParams()
        formParams.append("username", formData.email)
        formParams.append("password", formData.password)

        response = await apiFetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formParams,
        })
      }

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          alert("Muitas tentativas de login. Aguarde 1 minuto antes de tentar novamente.")
        } else if (Array.isArray(data.detail)) {
          const msg = data.detail[0]?.msg?.replace("Value error, ", "") || "Erro de validação"
          alert(msg)
        } else {
          alert(data.detail || "Erro na requisição")
        }
        return
      }

      if (!isRegister) {
        router.push("/dashboard")
      } else {
        alert("Conta criada com sucesso! Faça login.")
        setIsRegister(false)
      }

    } catch (error) {
      console.error(error)
      alert("Erro ao conectar com o servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <Link href="/" className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">NutriAI</span>
            </Link>
            <CardTitle className="text-2xl">
              {isRegister ? "Criar Conta" : "Bem-vindo de volta"}
            </CardTitle>
            <CardDescription>
              {isRegister 
                ? "Preencha os dados para criar sua conta" 
                : "Entre com suas credenciais para acessar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {isRegister && formData.password.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 8 caracteres, 1 maiúscula e 1 número
                  </p>
                )}
                {isRegister && formData.password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                            getPasswordStrength(formData.password) >= level
                              ? STRENGTH_COLORS[getPasswordStrength(formData.password)]
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {STRENGTH_LABELS[getPasswordStrength(formData.password)]}
                    </p>
                  </div>
                )}
              </div>

              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? "Carregando..." : isRegister ? "Criar Conta" : "Entrar"}
              </Button>

              {!isRegister && (
                <div className="text-center mt-3">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isRegister ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-primary hover:underline font-medium"
                >
                  {isRegister ? "Entrar" : "Criar conta"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}