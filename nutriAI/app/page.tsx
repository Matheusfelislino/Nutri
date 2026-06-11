"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Salad, 
  Calculator, 
  UserCheck, 
  FileText, 
  Users, 
  Sparkles, 
  ClipboardList, 
  TrendingUp,
  Activity,
  ChevronRight,
  Play,
  Leaf
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">NutriAI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
            </Link>
            <Link href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </Link>
            <Link href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/login?mode=register">
              <Button size="sm">Começar Agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
        
        <motion.div 
          className="container mx-auto max-w-6xl relative z-10"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <div className="text-center">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by AI</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance"
            >
              NutriAI — Inteligência Artificial
              <span className="text-primary block mt-2">para Nutricionistas</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty"
            >
              Crie dietas personalizadas em segundos utilizando inteligência artificial. 
              Simplifique seu trabalho e ofereça o melhor para seus pacientes.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?mode=register">
                <Button size="lg" className="gap-2 px-8 h-12 text-base">
                  Começar Agora
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 px-8 h-12 text-base">
                <Play className="w-4 h-4" />
                Ver Demonstração
              </Button>
            </motion.div>
          </div>

          <motion.div 
            variants={fadeInUp}
            className="mt-16 relative"
          >
            <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-primary/60" />
              </div>
              <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pacientes</p>
                        <p className="text-2xl font-bold text-foreground">247</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Salad className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dietas Criadas</p>
                        <p className="text-2xl font-bold text-foreground">1,234</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                        <p className="text-2xl font-bold text-foreground">94%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 px-4 bg-muted/30">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que escolher o NutriAI?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas poderosas para otimizar seu trabalho e melhorar os resultados dos seus pacientes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Salad,
                title: "Dietas Personalizadas",
                description: "IA gera dietas específicas para cada paciente com base em seus dados e objetivos."
              },
              {
                icon: Calculator,
                title: "Cálculo Nutricional Automático",
                description: "IMC, calorias e macronutrientes calculados automaticamente com precisão."
              },
              {
                icon: UserCheck,
                title: "Validação pelo Nutricionista",
                description: "O profissional pode editar e ajustar a dieta antes de enviar ao paciente."
              },
              {
                icon: FileText,
                title: "Exportação em PDF",
                description: "Envie o plano alimentar profissional diretamente para o paciente."
              }
            ].map((benefit, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-20 px-4">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Simples, rápido e eficiente. Veja como criar dietas em 4 passos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Cadastre seu paciente", description: "Adicione os dados básicos do paciente ao sistema." },
              { step: 2, title: "Insira os dados físicos", description: "Peso, altura, idade e objetivo nutricional." },
              { step: 3, title: "A IA gera o plano", description: "Nossa IA cria um plano alimentar personalizado." },
              { step: 4, title: "Revise e envie o PDF", description: "Ajuste se necessário e envie ao paciente." }
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-primary/25">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-4 bg-muted/30">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seus pacientes e criar planos alimentares.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Cadastro de Pacientes", description: "Gerencie todos os seus pacientes em um só lugar." },
              { icon: Sparkles, title: "Geração Automática de Dieta", description: "IA cria dietas baseadas nos dados do paciente." },
              { icon: ClipboardList, title: "Edição de Plano Alimentar", description: "Ajuste e personalize as dietas geradas." },
              { icon: Calculator, title: "Cálculo de Macros", description: "Proteínas, carboidratos e gorduras calculados." },
              { icon: TrendingUp, title: "Acompanhamento de Evolução", description: "Monitore o progresso dos seus pacientes." },
              { icon: Activity, title: "Relatórios Nutricionais", description: "Visualize estatísticas e métricas importantes." }
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/50 border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div 
          className="container mx-auto max-w-4xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
              <CardContent className="p-8 md:p-12 text-center relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Comece a usar o NutriAI hoje
                </h2>
                <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                  Junte-se a centenas de nutricionistas que já estão transformando 
                  a forma como criam planos alimentares.
                </p>
                <Link href="/login?mode=register">
                  <Button size="lg" variant="secondary" className="px-8 h-12 text-base gap-2">
                    Criar Conta Gratuita
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">NutriAI</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sobre
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2026 NutriAI. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
