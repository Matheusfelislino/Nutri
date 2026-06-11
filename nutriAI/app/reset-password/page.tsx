"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Leaf, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
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

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) setError("Token de recuperação não encontrado. Solicite um novo link.")
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) { setError("A senha deve ter pelo menos 8 caracteres"); return }
    if (!/[A-Z]/.test(password)) { setError("A senha deve conter pelo menos uma letra maiúscula"); return }
    if (!/[0-9]/.test(password)) { setError("A senha deve conter pelo menos um número"); return }
    if (password !== confirmPassword) { setError("As senhas não coincidem"); return }

    setIsLoading(true)
    try {
      const response = await apiFetch("/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (Array.isArray(data.detail)) {
          setError(data.detail[0]?.msg?.replace("Value error, ", "") || "Erro de validação")
        } else {
          setError(data.detail || "Erro ao redefinir a senha")
        }
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      setError("Erro de conexão. Verifique se o servidor está ativo.")
    } finally {
      setIsLoading(false)
    }
  }

  const strength = getPasswordStrength(password)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

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
            <CardTitle className="text-2xl">Nova Senha</CardTitle>
            <CardDescription>
              {success ? "Senha redefinida com sucesso!" : "Crie uma nova senha segura para sua conta"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 py-4"
              >
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Sua senha foi redefinida com sucesso. Redirecionando para o login...
                </p>
                <Link href="/login">
                  <Button className="w-full">Ir para o login</Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={!token}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres, 1 maiúscula e 1 número</p>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                              strength >= level ? STRENGTH_COLORS[strength] : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{STRENGTH_LABELS[strength]}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={!token}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading || !token}>
                  {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Voltar ao login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
