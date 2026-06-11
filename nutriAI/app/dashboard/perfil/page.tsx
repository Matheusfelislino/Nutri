"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  User,
  Mail,
  Phone,
  Building,
  Save,
  Bell,
  Moon,
  Shield
} from "lucide-react"
import { apiFetch } from "@/lib/api"

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

export default function PerfilPage() {
  const [isLoading, setIsLoading] = useState(true)

  const [profileData, setProfileData] = useState({
    name: "Carregando...",
    email: "carregando...",
    phone: "",
    crn: "",
    clinic: ""
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await apiFetch("/users/me")

        if (response.ok) {
          const currentUser = await response.json()
          setProfileData(prev => ({
            ...prev,
            name: currentUser.name,
            email: currentUser.email,
            phone: "",
            crn: "",
            clinic: ""
          }))
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
      </motion.div>

      {/* Profile Info */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Atualize seus dados de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <Button variant="outline" size="sm">Alterar foto</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="pl-10"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crn">CRN</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="crn"
                    value={profileData.crn}
                    onChange={(e) => setProfileData({ ...profileData, crn: e.target.value })}
                    className="pl-10"
                    placeholder="CRN XXXXX"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="clinic">Clínica / Consultório</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="clinic"
                    value={profileData.clinic}
                    onChange={(e) => setProfileData({ ...profileData, clinic: e.target.value })}
                    className="pl-10"
                    placeholder="Nome da sua clínica"
                  />
                </div>
              </div>
            </div>

            <Button className="gap-2" disabled={isLoading}>
              <Save className="w-4 h-4" />
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notificações
            </CardTitle>
            <CardDescription>Configure como deseja receber notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Receba atualizações sobre seus pacientes por email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Relatório Semanal</Label>
                <p className="text-sm text-muted-foreground">Receba um resumo semanal das atividades</p>
              </div>
              <Switch
                checked={notifications.weekly}
                onCheckedChange={(checked) => setNotifications({ ...notifications, weekly: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-primary" />
              Aparência
            </CardTitle>
            <CardDescription>Personalize a aparência do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use o botão de alternância de tema no canto superior direito para alternar entre modo claro e escuro.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Segurança
            </CardTitle>
            <CardDescription>Gerencie a segurança da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Alterar Senha</p>
                <p className="text-sm text-muted-foreground">Última alteração há 30 dias</p>
              </div>
              <Button variant="outline">Alterar</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Autenticação em Dois Fatores</p>
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
              </div>
              <Button variant="outline">Configurar</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
