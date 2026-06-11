# NutriAI

**Plataforma SaaS de Inteligência Clínica para Nutricionistas**

NutriAI é uma aplicação web Full-Stack de produção que digitaliza e acelera o fluxo clínico do nutricionista — do cadastro de pacientes à geração de planos alimentares personalizados com exportação em PDF profissional. O coração do sistema é um motor híbrido que combina cálculo determinístico baseado em evidências clínicas (Mifflin-St Jeor, VET) com curadoria e narrativa via LLM, garantindo rastreabilidade total das decisões nutricionais.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI (Python 3.11), SQLAlchemy ORM, Pydantic v2 |
| Banco de dados | PostgreSQL 15 |
| Autenticação | JWT (Bearer Token), Passlib bcrypt |
| Motor IA | Híbrido: regras clínicas determinísticas + LLM (Groq / Ollama / OpenAI) |
| Containerização | Docker + Docker Compose |
| Rate Limiting | SlowAPI |

---

## Arquitetura

```
nutriAI-main/
├── app/                        # Backend FastAPI
│   ├── main.py                 # Entrypoint, CORS, startup hooks
│   ├── routes/                 # Endpoints REST (user, patient, diet, ai, nutrition)
│   ├── models/                 # Modelos SQLAlchemy (ORM)
│   ├── schemas/                # Schemas Pydantic (validação de I/O)
│   ├── services/
│   │   ├── nutrition_ai.py     # Motor híbrido de dietas
│   │   ├── clinical_math.py    # Cálculo TMB / GET / VET
│   │   ├── taco_seed.py        # Seed da base TACO
│   │   └── security.py         # Hash e verificação de senhas
│   └── Dockerfile
│
├── nutriAI/                    # Frontend Next.js
│   ├── app/
│   │   ├── (dashboard)/        # Área autenticada
│   │   ├── login/
│   │   └── page.tsx            # Landing / redirect
│   ├── components/ui/          # Primitivos shadcn/ui
│   ├── lib/api.ts              # Cliente HTTP centralizado
│   └── Dockerfile
│
└── docker-compose.yml          # Orquestração dos 3 serviços
```

### Motor de Dietas — Fluxo Interno

```
Dados do Paciente
       │
       ▼
Cálculo Clínico (Mifflin-St Jeor → GET → VET)
       │
       ▼
Perfil de Restrições (flags + notas clínicas → termos bloqueados)
       │
       ▼
Filtragem da Base Nutricional (meal_tag × goal × restrições)
       │
       ▼
Curadoria de Despensa via LLM  ──► fallback: lista filtrada
       │
       ▼
Motor de Regras (porcionamento dinâmico por intra-weights)
       │
       ▼
Narrativa Clínica via LLM  ──► fallback: texto estático por objetivo
       │
       ▼
Persistência no PostgreSQL
```

---

## Como rodar localmente (Docker)

### Pré-requisitos

- Docker Desktop instalado e em execução
- Porta 3000 e 8000 livres

### 1. Clone e configure o ambiente

```bash
git clone <url-do-repositorio>
cd nutriAI-main
```

Crie o arquivo `.env` na raiz com as variáveis necessárias (veja `.env.example`):

```env
GROQ_API_KEY=sua_chave_groq_aqui
GROQ_MODEL=llama-3.1-8b-instant
```

### 2. Suba todos os serviços

```bash
docker compose up --build
```

O Docker irá subir três containers:

| Container | Serviço | Porta |
|-----------|---------|-------|
| `nutriai_db_container` | PostgreSQL 15 | 5432 (interno) |
| `nutriai_backend` | FastAPI | 8000 |
| `nutriai_frontend` | Next.js | 3000 |

O backend aguarda o healthcheck do banco antes de iniciar e executa as migrations + seed automaticamente no startup.

### 3. Acesse a aplicação

```
Frontend:  http://localhost:3000
API Docs:  http://localhost:8000/docs
```

---

## Variáveis de Ambiente

### Backend (`app/.env` ou via `docker-compose.yml`)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string do PostgreSQL |
| `SECRET_KEY` | Sim | Segredo para assinatura JWT |
| `GROQ_API_KEY` | Não | Chave Groq para LLM (tier gratuito) |
| `GROQ_MODEL` | Não | Modelo Groq (default: `llama-3.1-8b-instant`) |
| `OLLAMA_ENABLED` | Não | `true` para usar LLM local via Ollama |
| `OLLAMA_BASE_URL` | Não | URL do Ollama (default: `http://ollama:11434/v1`) |
| `OPENAI_API_KEY` | Não | Fallback OpenAI (pago) |

### Frontend (`nutriAI/.env.local`)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL do backend (default: `http://localhost:8000`) |

---

## Comandos úteis

```bash
# Ver status dos containers
docker compose ps

# Logs do backend em tempo real
docker compose logs -f backend

# Logs do frontend
docker compose logs -f frontend

# Resetar banco (destrói volume de dados)
docker compose down -v && docker compose up --build

# Parar tudo
docker compose down --remove-orphans
```

---

## Funcionalidades

- **Autenticação** — cadastro e login de nutricionistas com JWT e refresh automático
- **Gestão de Pacientes** — CRUD completo com dados físicos, objetivos, IMC calculado e notas clínicas
- **Base Nutricional** — alimentos com macros, tags de refeição, objetivo e restrições alimentares (TACO + seed customizado)
- **Geração de Dietas** — motor híbrido com distribuição calórica por refeição, porcionamento dinâmico e curadoria inteligente
- **Check-ins de Peso** — histórico de evolução por paciente com delta de peso
- **Clinical Insights** — observações geradas pelo LLM com base no histórico do paciente
- **Exportação em PDF** — plano alimentar formatado para impressão diretamente no navegador
- **Dashboard** — KPIs, gráfico mensal de novos cadastros e lista de pacientes recentes

---

## Licença

Proprietário — todos os direitos reservados.
