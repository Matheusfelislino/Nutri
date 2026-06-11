from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import re
import unicodedata

logger = logging.getLogger(__name__)
from dataclasses import dataclass
from typing import Iterable, List, Optional

from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.diet import Diet, FoodItem, Meal
from app.models.nutrition import NutritionFood
from app.models.patient import Patient
from app.services.clinical_math import calcular_tmb, calcular_get, calcular_vet


# ─── Inicialização do cliente LLM ─────────────────────────────────────────────
#
# Hierarquia de provedores por custo (do mais barato ao mais caro):
#   1. Groq    — free tier generoso; API compatível com OpenAI SDK
#   2. Ollama  — LLM local, custo zero (exige OLLAMA_ENABLED=true)
#   3. OpenAI  — fallback pago (gpt-4o-mini)
#   4. Nenhum  — motor de regras puro, custo zero

_LLM_CLIENT: Optional[object] = None
_LLM_MODEL: str = ""
_LLM_AVAILABLE: bool = False


def _init_llm_client() -> None:
    global _LLM_CLIENT, _LLM_MODEL, _LLM_AVAILABLE

    try:
        from openai import AsyncOpenAI
    except ImportError:
        return  # SDK não instalado — fica com motor de regras

    # Prioridade 1: Groq
    if groq_key := os.getenv("GROQ_API_KEY", "").strip():
        _LLM_CLIENT = AsyncOpenAI(
            api_key=groq_key,
            base_url="https://api.groq.com/openai/v1",
        )
        _LLM_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        _LLM_AVAILABLE = True
        return

    # Prioridade 2: Ollama local (exige OLLAMA_ENABLED=true no .env)
    if os.getenv("OLLAMA_ENABLED", "false").lower() == "true":
        _LLM_CLIENT = AsyncOpenAI(
            api_key="ollama",  # Ollama aceita qualquer string como API key
            base_url=os.getenv("OLLAMA_BASE_URL", "http://ollama:11434/v1"),
        )
        _LLM_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        _LLM_AVAILABLE = True
        return

    # Prioridade 3: OpenAI (fallback pago)
    if openai_key := os.getenv("OPENAI_API_KEY", "").strip():
        _LLM_CLIENT = AsyncOpenAI(api_key=openai_key)
        _LLM_MODEL = "gpt-4o-mini"
        _LLM_AVAILABLE = True
        return

    # Prioridade 4: nenhuma chave configurada — modo regras puro


_init_llm_client()


# ─── Dados de seed ────────────────────────────────────────────────────────────

SEED_FOODS = [
    {"name": "Aveia em flocos", "group": "carboidrato", "portion": "40 g", "calories": 150, "protein_g": 5, "carbs_g": 27, "fat_g": 3, "fiber_g": 4, "meal_tags": "cafe,lanche,ceia", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose"},
    {"name": "Banana", "group": "fruta", "portion": "1 unidade média", "calories": 90, "protein_g": 1, "carbs_g": 23, "fat_g": 0, "fiber_g": 2.6, "meal_tags": "cafe,lanche,pre_treino", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Maçã", "group": "fruta", "portion": "1 unidade média", "calories": 80, "protein_g": 0, "carbs_g": 21, "fat_g": 0, "fiber_g": 3.5, "meal_tags": "lanche,ceia", "goal_tags": "emagrecimento,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Mamão", "group": "fruta", "portion": "1 fatia média", "calories": 65, "protein_g": 1, "carbs_g": 16, "fat_g": 0, "fiber_g": 2, "meal_tags": "cafe,lanche", "goal_tags": "emagrecimento,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Ovo cozido", "group": "proteina", "portion": "2 unidades", "calories": 140, "protein_g": 12, "carbs_g": 1, "fat_g": 10, "fiber_g": 0, "meal_tags": "cafe,lanche,jantar", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,sem_lactose,sem_gluten"},
    {"name": "Iogurte natural", "group": "proteina", "portion": "170 g", "calories": 110, "protein_g": 8, "carbs_g": 11, "fat_g": 4, "fiber_g": 0, "meal_tags": "cafe,lanche,ceia", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,sem_gluten"},
    {"name": "Iogurte vegetal", "group": "proteina", "portion": "170 g", "calories": 120, "protein_g": 4, "carbs_g": 18, "fat_g": 4, "fiber_g": 1, "meal_tags": "cafe,lanche,ceia", "goal_tags": "emagrecimento,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Pão integral", "group": "carboidrato", "portion": "2 fatias", "calories": 140, "protein_g": 6, "carbs_g": 24, "fat_g": 2, "fiber_g": 4, "meal_tags": "cafe,lanche", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose"},
    {"name": "Tapioca", "group": "carboidrato", "portion": "2 colheres de sopa", "calories": 130, "protein_g": 0, "carbs_g": 32, "fat_g": 0, "fiber_g": 0, "meal_tags": "cafe,lanche", "goal_tags": "hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Arroz integral", "group": "carboidrato", "portion": "4 colheres de sopa", "calories": 150, "protein_g": 3, "carbs_g": 32, "fat_g": 1, "fiber_g": 2, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Batata doce", "group": "carboidrato", "portion": "120 g", "calories": 115, "protein_g": 2, "carbs_g": 27, "fat_g": 0, "fiber_g": 3, "meal_tags": "almoco,jantar,pre_treino", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Feijão carioca", "group": "leguminosa", "portion": "1 concha média", "calories": 110, "protein_g": 7, "carbs_g": 19, "fat_g": 1, "fiber_g": 6, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Grão de bico", "group": "leguminosa", "portion": "4 colheres de sopa", "calories": 135, "protein_g": 7, "carbs_g": 22, "fat_g": 2, "fiber_g": 6, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Peito de frango grelhado", "group": "proteina", "portion": "120 g", "calories": 195, "protein_g": 36, "carbs_g": 0, "fat_g": 4, "fiber_g": 0, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "sem_lactose,sem_gluten"},
    {"name": "Patinho moído", "group": "proteina", "portion": "100 g", "calories": 210, "protein_g": 28, "carbs_g": 0, "fat_g": 10, "fiber_g": 0, "meal_tags": "almoco,jantar", "goal_tags": "hipertrofia,manutencao", "restriction_tags": "sem_lactose,sem_gluten"},
    {"name": "Tilápia grelhada", "group": "proteina", "portion": "120 g", "calories": 155, "protein_g": 32, "carbs_g": 0, "fat_g": 3, "fiber_g": 0, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "sem_lactose,sem_gluten"},
    {"name": "Tofu grelhado", "group": "proteina", "portion": "120 g", "calories": 145, "protein_g": 15, "carbs_g": 4, "fat_g": 8, "fiber_g": 2, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Salada verde", "group": "vegetal", "portion": "1 prato de sobremesa", "calories": 35, "protein_g": 2, "carbs_g": 6, "fat_g": 0, "fiber_g": 3, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Brócolis cozido", "group": "vegetal", "portion": "1 xícara", "calories": 55, "protein_g": 4, "carbs_g": 11, "fat_g": 0, "fiber_g": 5, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Abacate", "group": "gordura", "portion": "3 colheres de sopa", "calories": 120, "protein_g": 1, "carbs_g": 6, "fat_g": 11, "fiber_g": 5, "meal_tags": "lanche,ceia", "goal_tags": "hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Azeite de oliva", "group": "gordura", "portion": "1 colher de sopa", "calories": 90, "protein_g": 0, "carbs_g": 0, "fat_g": 10, "fiber_g": 0, "meal_tags": "almoco,jantar", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Castanhas", "group": "gordura", "portion": "20 g", "calories": 120, "protein_g": 4, "carbs_g": 5, "fat_g": 10, "fiber_g": 2, "meal_tags": "lanche,ceia", "goal_tags": "hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
    {"name": "Whey protein", "group": "proteina", "portion": "30 g", "calories": 120, "protein_g": 24, "carbs_g": 3, "fat_g": 2, "fiber_g": 0, "meal_tags": "lanche,ceia,pos_treino", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "sem_gluten"},
    {"name": "Proteína vegetal", "group": "proteina", "portion": "30 g", "calories": 115, "protein_g": 22, "carbs_g": 3, "fat_g": 2, "fiber_g": 1, "meal_tags": "lanche,ceia,pos_treino", "goal_tags": "emagrecimento,hipertrofia,manutencao", "restriction_tags": "vegetariano,vegano,sem_lactose,sem_gluten"},
]

MEAL_TEMPLATES = [
    ("Café da Manhã",    "07:00", "cafe",   ["carboidrato", "proteina", "fruta"]),
    ("Lanche da Manhã", "10:00", "lanche",  ["fruta", "proteina"]),
    ("Almoço",          "12:30", "almoco",  ["carboidrato", "proteina", "leguminosa", "vegetal"]),
    ("Lanche da Tarde", "16:00", "lanche",  ["carboidrato", "proteina", "fruta"]),
    ("Jantar",          "19:30", "jantar",  ["carboidrato", "proteina", "vegetal"]),
    ("Ceia",            "22:00", "ceia",    ["proteina", "fruta"]),
]

# ─── Seleção e distribuição calórica por número de refeições ─────────────────
#
# Índices de MEAL_TEMPLATES para cada contagem, priorizando os horários
# clinicamente mais relevantes quando há menos refeições.

_MEAL_SELECTION: dict[int, list[int]] = {
    3: [0, 2, 4],           # Café da Manhã, Almoço, Jantar
    4: [0, 2, 3, 4],        # Café da Manhã, Almoço, Lanche da Tarde, Jantar
    5: [0, 1, 2, 3, 4],     # Café da Manhã, Lanche da Manhã, Almoço, Lanche da Tarde, Jantar
    6: [0, 1, 2, 3, 4, 5],  # Todos os slots (+ Ceia)
}

# Distribuição percentual das calorias do VET por refeição.
# Somas = 1.00; maior peso para almoço, menor para ceia e lanches.
_MEAL_WEIGHTS: dict[int, list[float]] = {
    3: [0.30, 0.40, 0.30],
    4: [0.25, 0.35, 0.15, 0.25],
    5: [0.22, 0.10, 0.30, 0.13, 0.25],
    6: [0.20, 0.10, 0.30, 0.12, 0.20, 0.08],
}


# ─── Representação interna das refeições ─────────────────────────────────────

@dataclass
class _MealData:
    title: str
    time: str
    foods: list[tuple[str, str, int]]  # (name, quantity, calories)


# ─── Utilitários ──────────────────────────────────────────────────────────────

def normalize_text(value: str | None) -> str:
    value = (value or "").lower()
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return value


FOOD_CATEGORY_TERMS = {
    "fruta":    {"fruta", "frutas", "banana", "maca", "maçã", "mamao", "mamão", "abacate", "uva", "pera", "laranja", "morango", "melancia", "melao"},
    "vegetal":  {"verdura", "verduras", "legume", "legumes", "salada", "brocolis", "brócolis", "vegetal", "vegetais"},
    "lactose":  {"lactose", "leite", "iogurte", "queijo", "whey"},
    "gluten":   {"gluten", "glúten", "pao", "pão", "trigo", "aveia"},
    "carne":    {"carne", "frango", "peixe", "patinho", "tilapia", "tilápia"},
    "ovo":      {"ovo", "ovos"},
    "amendoim": {"amendoim", "castanhas", "castanha"},
}


def expand_restriction_terms(terms: set[str]) -> set[str]:
    expanded = set()
    normalized_terms = {normalize_text(term).strip() for term in terms if term and term.strip()}
    for term in normalized_terms:
        expanded.add(term)
        for category, synonyms in FOOD_CATEGORY_TERMS.items():
            normalized_synonyms = {normalize_text(item) for item in synonyms}
            if term == category or term in normalized_synonyms or category in term:
                expanded.add(category)
                expanded.update(normalized_synonyms)
    return {term for term in expanded if len(term) >= 3}


def extract_blocked_terms_from_notes(notes: str | None) -> set[str]:
    text = normalize_text(notes)
    if not text:
        return set()

    terms = set()
    for pattern in [
        r"(?:sem|evitar|excluir|retirar)\s+([^.;\n]+)",
        r"(?:nao|não)\s+(?:come|consome|gosta|aceita|pode comer)\s+(?:de\s+)?([^.;\n]+)",
        r"(?:alergia|intolerancia)\s+(?:a|ao|à|de)?\s*([^.;\n]+)",
    ]:
        for match in re.finditer(pattern, text):
            fragment = match.group(1)
            for term in re.split(r",|;|\n| e | ou |/", fragment):
                term = term.strip()
                if len(term) >= 3:
                    terms.add(term)

    return expand_restriction_terms(terms)


@dataclass
class RestrictionProfile:
    blocked_tags: set[str]
    required_tags: set[str]
    raw_terms: set[str]


def seed_nutrition_database() -> None:
    db = SessionLocal()
    try:
        if db.query(NutritionFood).count() > 0:
            return
        db.add_all([NutritionFood(**food) for food in SEED_FOODS])
        db.commit()
    finally:
        db.close()


def normalize_goal(goal: str | None) -> str:
    text = (goal or "").lower()
    if any(term in text for term in ["emag", "perder", "cut", "defini"]):
        return "emagrecimento"
    if any(term in text for term in ["hipert", "ganhar", "massa", "bulking"]):
        return "hipertrofia"
    return "manutencao"



def build_restriction_profile(
    flags, other_restrictions: str | None, professional_notes: str | None = None
) -> RestrictionProfile:
    blocked: set[str] = set()
    required: set[str] = set()

    if getattr(flags, "lactose", False):
        blocked.update({"lactose", "leite", "iogurte", "queijo", "whey"})
        required.add("sem_lactose")
    if getattr(flags, "gluten", False):
        blocked.update({"gluten", "pao", "pão", "trigo"})
        required.add("sem_gluten")
    if getattr(flags, "amendoim", False):
        blocked.update({"amendoim", "castanha", "castanhas"})
    if getattr(flags, "vegetariano", False):
        required.add("vegetariano")
        blocked.update({"carne", "frango", "peixe", "patinho", "tilapia", "tilápia"})
    if getattr(flags, "vegano", False):
        required.add("vegano")
        required.add("vegetariano")
        blocked.update({"carne", "frango", "peixe", "ovo", "leite", "iogurte", "whey", "queijo"})

    notes = "\n".join(part for part in [other_restrictions or "", professional_notes or ""] if part)

    raw_terms = {
        normalize_text(term).strip()
        for term in re.split(r"[,;\n]", notes)
        if len(term.strip()) >= 3
    }

    extracted_terms = extract_blocked_terms_from_notes(notes)
    raw_terms.update(extracted_terms)
    blocked.update(expand_restriction_terms(raw_terms))

    return RestrictionProfile(blocked_tags=blocked, required_tags=required, raw_terms=raw_terms)


def _passes_restrictions(food: NutritionFood, profile: RestrictionProfile) -> bool:
    """Verifica apenas as restrições alimentares, sem checar meal_tag ou goal."""
    text = normalize_text(f"{food.name} {food.group} {food.restriction_tags} {food.notes or ''}")
    tags = {normalize_text(tag).strip() for tag in (food.restriction_tags or "").split(",")}
    return (
        not any(blocked in text for blocked in profile.blocked_tags)
        and profile.required_tags.issubset(tags)
    )


def food_matches(
    food: NutritionFood, meal_tag: str, goal: str, profile: RestrictionProfile
) -> bool:
    text      = normalize_text(f"{food.name} {food.group} {food.restriction_tags} {food.notes or ''}")
    tags      = {normalize_text(tag).strip() for tag in (food.restriction_tags or "").split(",")}
    meal_tags = {normalize_text(tag).strip() for tag in (food.meal_tags or "").split(",")}
    goal_tags = {normalize_text(tag).strip() for tag in (food.goal_tags or "").split(",")}

    if meal_tag not in meal_tags:
        return False
    if goal not in goal_tags and "manutencao" not in goal_tags:
        return False
    if any(blocked in text for blocked in profile.blocked_tags):
        return False
    if not profile.required_tags.issubset(tags):
        return False
    return True


# ─── Distribuição calórica intra-refeição por grupo alimentar ────────────────
#
# Define o percentual de calorias que cada grupo deve receber dentro de uma
# refeição. Usado no porcionamento dinâmico para calcular o peso exato.

_MEAL_INTRA_WEIGHTS: dict[str, dict[str, float]] = {
    "cafe":       {"carboidrato": 0.45, "proteina": 0.35, "fruta": 0.20},
    "lanche":     {"proteina": 0.45, "fruta": 0.30, "carboidrato": 0.25},
    "almoco":     {"proteina": 0.40, "carboidrato": 0.30, "leguminosa": 0.15, "vegetal": 0.10, "gordura": 0.05},
    "jantar":     {"proteina": 0.40, "carboidrato": 0.35, "vegetal": 0.20, "leguminosa": 0.05},
    "ceia":       {"proteina": 0.60, "fruta": 0.40},
    "pre_treino": {"carboidrato": 0.60, "fruta": 0.40},
}


def _calculate_portion(food: NutritionFood, target_calories: int) -> tuple[str, int]:
    """
    Calcula a porção dinâmica pelo método da regra de 3.

    Para alimentos com porção em gramas (ex: "100 g", "120 g") calcula exatamente
    quantos gramas são necessários para atingir target_calories. Para alimentos com
    porções não-grama (ex: "2 colheres de sopa"), retorna a porção original.
    """
    match = re.match(r'^(\d+(?:\.\d+)?)\s*g\b', (food.portion or "").strip(), re.IGNORECASE)
    if match and food.calories > 0:
        base_grams = float(match.group(1))
        needed = (target_calories * base_grams) / food.calories
        needed = max(20.0, min(400.0, needed))
        needed = round(needed / 5) * 5  # arredonda para múltiplo de 5g
        actual_cal = int(round((needed / base_grams) * food.calories))
        return f"{int(needed)} g", actual_cal
    return food.portion, food.calories


# ─── Seleção de alimentos (aleatoriedade controlada + porcionamento dinâmico) ─

_TOP_N = 3  # sorteio entre os N candidatos mais próximos da meta calórica


def pick_foods(
    candidates: Iterable[NutritionFood],
    groups: list[str],
    calories_for_meal: int,
    meal_tag: str = "",
) -> list[tuple[NutritionFood, str, int]]:
    """
    Seleciona alimentos para uma refeição com porcionamento dinâmico.

    Para cada grupo do template:
      1. Calcula a meta calórica proporcional usando _MEAL_INTRA_WEIGHTS.
      2. Sorteia entre os _TOP_N mais próximos dessa meta (variedade controlada).
      3. Ajusta a porção em gramas pela regra de 3 para atingir a meta.

    Retorna lista de (alimento, quantidade, calorias_reais).
    """
    selected: list[tuple[NutritionFood, str, int]] = []
    used_ids: set[int] = set()
    candidates_list = list(candidates)

    intra_weights = _MEAL_INTRA_WEIGHTS.get(meal_tag, {})

    # Normaliza pesos para os grupos efetivamente presentes no template
    active_weights = {g: intra_weights.get(g, 1.0 / max(len(groups), 1)) for g in groups}
    total_w = sum(active_weights.values()) or 1.0

    for group in groups:
        group_options = [
            f for f in candidates_list if f.group == group and f.id not in used_ids
        ]
        if not group_options:
            continue

        # Meta calórica normalizada para este grupo
        norm_weight  = active_weights[group] / total_w
        group_target = max(int(calories_for_meal * norm_weight), 50)

        sorted_opts = sorted(group_options, key=lambda f: abs(f.calories - group_target))
        pool        = sorted_opts[:min(_TOP_N, len(sorted_opts))]
        chosen      = random.choice(pool)

        quantity, actual_cal = _calculate_portion(chosen, group_target)
        selected.append((chosen, quantity, actual_cal))
        used_ids.add(chosen.id)

    # Fallback: nenhum grupo casou — pega o mais próximo da meta total
    if not selected and candidates_list:
        sorted_all = sorted(candidates_list, key=lambda f: abs(f.calories - calories_for_meal))
        pool   = sorted_all[:min(_TOP_N, len(sorted_all))]
        chosen = random.choice(pool)
        quantity, actual_cal = _calculate_portion(chosen, calories_for_meal)
        selected.append((chosen, quantity, actual_cal))

    return selected


# ─── Motor de regras (monta sempre a dieta) ───────────────────────────────────

def _generate_meals_rules(
    foods: list[NutritionFood],
    templates: list[tuple],
    weights: list[float],
    target: int,
    goal: str,
    profile: RestrictionProfile,
    warnings: list[str],
) -> list[_MealData]:
    result: list[_MealData] = []

    for index, (title, time, meal_tag, groups) in enumerate(templates):
        meal_target = int(target * weights[index])
        candidates  = [f for f in foods if food_matches(f, meal_tag, goal, profile)]
        chosen      = pick_foods(candidates, groups, meal_target, meal_tag)

        if not chosen:
            warnings.append(f"Não foram encontrados alimentos compatíveis para {title}.")
            continue

        result.append(_MealData(
            title=title,
            time=time,
            foods=[(food.name, quantity, calories) for food, quantity, calories in chosen],
        ))

    return result


# ─── Curadoria de Despensa via LLM ───────────────────────────────────────────

async def _curate_pantry_with_llm(
    patient: Patient,
    goal: str,
    available_foods: list[NutritionFood],
) -> list[NutritionFood]:
    """
    Seleciona de 12 a 18 alimentos que harmonizem entre si para um dia de dieta.

    O LLM atua como Chef/Nutricionista brasileiro e evita combinações culinárias
    incoerentes. Timeout de 4 s; fallback retorna a lista original intacta.
    """
    # Sem LLM ou já pequeno o suficiente: curadoria desnecessária
    if not _LLM_AVAILABLE or _LLM_CLIENT is None or len(available_foods) <= 18:
        return available_foods

    compact = [{"id": f.id, "name": f.name, "group": f.group} for f in available_foods]

    system_prompt = (
        "Você é um Nutricionista Clínico Brasileiro de elite. Sua tarefa é receber uma lista de "
        "ingredientes disponíveis e selecionar entre 12 e 18 IDs para compor a despensa de UM DIA de dieta.\n\n"
        "Regras Absolutas de Harmonia Culinária:\n\n"
        "Afinidade Cultural Brasileira: Se selecionar Arroz, obrigatoriamente tente selecionar "
        "Feijão (se disponível).\n\n"
        "Coerência de Refeição: Garanta ingredientes para um Café da Manhã tradicional "
        "(ex: Pão, Ovo, Queijo, Fruta, Café/Leite) e Almoço/Jantar normais "
        "(Proteína magra, Carboidrato base, Vegetais).\n\n"
        "Sem Bizarrices: Nunca selecione ingredientes que não combinam na mesma refeição "
        "apenas por seus macros (ex: misturar lasanha com peixe cru, ou achocolatado com refeição salgada).\n\n"
        f"Praticidade: Prefira alimentos comuns e fáceis de preparar. Evite excesso de alimentos "
        f"ultraprocessados ou preparações incompatíveis com o objetivo de {goal}.\n\n"
        'Formato: Retorne EXCLUSIVAMENTE um JSON no formato: {"selected_ids": [id1, id2, ...]}. '
        "Não adicione nenhum texto explicativo."
    )

    user_prompt = "Ingredientes disponíveis:\n" + json.dumps(compact, ensure_ascii=False)

    try:
        from openai import AsyncOpenAI
        client: AsyncOpenAI = _LLM_CLIENT  # type: ignore[assignment]

        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=_LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                max_tokens=150,
                temperature=0.3,
            ),
            timeout=10.0,
        )
        raw     = response.choices[0].message.content.strip()
        cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
        data    = json.loads(cleaned)

        raw_ids      = data.get("selected_ids", [])
        selected_ids = {int(i) for i in raw_ids if str(i).isdigit() or isinstance(i, int)}
        curated      = [f for f in available_foods if f.id in selected_ids]

        # Sanity check: precisa cobrir ao menos 8 alimentos para o motor funcionar
        return curated if len(curated) >= 8 else available_foods

    except Exception as exc:
        logger.warning("Curadoria de despensa falhou (%s: %s) — usando fallback", type(exc).__name__, exc)
        return available_foods


# ─── Texto narrativo via LLM (opcional, não toma decisões clínicas) ──────────

def _default_strategy(goal: str) -> str:
    return {
        "emagrecimento": (
            "Priorizados alimentos com boa saciedade, proteínas magras, fibras "
            "e controle calórico."
        ),
        "hipertrofia": (
            "Priorizados proteínas, carboidratos distribuídos ao longo do dia "
            "e maior densidade energética."
        ),
        "manutencao": (
            "Buscado equilíbrio entre proteínas, carboidratos, "
            "gorduras boas e vegetais."
        ),
    }.get(goal, "Plano equilibrado gerado com base no perfil do paciente.")


def _parse_llm_json(text: str) -> tuple[str, list[str]]:
    """Extrai strategy e clinical_insights do JSON retornado pelo LLM."""
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()
    try:
        data = json.loads(cleaned)
        strategy = str(data.get("strategy", "")).strip()
        raw = data.get("clinical_insights", [])
        insights = [str(i).strip() for i in raw if str(i).strip()][:3] if isinstance(raw, list) else []
        return strategy, insights
    except (json.JSONDecodeError, TypeError):
        return "", []


async def _generate_strategy_narrative(
    meals: list[_MealData],
    goal: str,
    target: int,
    checkins: List[object] = [],
) -> tuple[str, list[str]]:
    """
    Gera strategy (narrativa da dieta) e clinical_insights (dicas para o nutricionista) via LLM.

    Retorna (strategy, clinical_insights). Timeout de 7 s; fallback é texto estático e lista vazia.
    """
    if not _LLM_AVAILABLE or _LLM_CLIENT is None:
        return _default_strategy(goal), []

    meal_summary = "\n".join(
        f"- {m.title} ({sum(cal for _, _, cal in m.foods)} kcal): "
        + ", ".join(name for name, _, _ in m.foods)
        for m in meals
    )

    checkin_block = ""
    if checkins:
        lines = []
        sorted_ck = sorted(checkins, key=lambda c: getattr(c, "created_at", None) or "", reverse=True)
        for i, ck in enumerate(sorted_ck):
            w = getattr(ck, "weight", None)
            dt = getattr(ck, "created_at", None)
            notes = getattr(ck, "notes", None) or ""
            date_str = dt.strftime("%d/%m/%Y") if hasattr(dt, "strftime") else str(dt or "")[:10]
            prev = sorted_ck[i + 1] if i + 1 < len(sorted_ck) else None
            delta_str = ""
            if prev and getattr(prev, "weight", None):
                delta = round(w - prev.weight, 1)
                delta_str = f" ({'+' if delta >= 0 else ''}{delta} kg)"
            note_str = f" — {notes}" if notes else ""
            lines.append(f"  • {date_str}: {w} kg{delta_str}{note_str}")
        checkin_block = "Histórico recente de peso (mais recente primeiro):\n" + "\n".join(lines)
    else:
        checkin_block = "Histórico de peso: nenhum registro ainda."

    prompt = (
        "Você é um Nutricionista Clínico Revisor. Analise o plano e responda SOMENTE com JSON válido (sem markdown).\n\n"
        f"Objetivo: {goal} | Meta: {target} kcal/dia\n"
        f"Plano:\n{meal_summary}\n\n"
        f"{checkin_block}\n\n"
        'JSON esperado (exatamente neste formato):\n'
        '{"strategy": "...", "clinical_insights": ["...", "..."]}\n\n'
        "strategy: 2 frases em pt-BR sobre a estratégia nutricional do plano. Técnico e motivador.\n"
        "clinical_insights: 1 a 3 observações clínicas curtas (≤15 palavras cada) para o nutricionista "
        "sobre saciedade, distribuição de macros, padrão de estagnação de peso ou ajustes comportamentais."
    )

    try:
        from openai import AsyncOpenAI
        client: AsyncOpenAI = _LLM_CLIENT  # type: ignore[assignment]

        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=_LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.4,
            ),
            timeout=10.0,
        )
        raw_text = response.choices[0].message.content.strip()
        strategy, insights = _parse_llm_json(raw_text)
        if not strategy:
            strategy = _default_strategy(goal)
        return strategy, insights

    except Exception as exc:
        logger.warning("Narrativa LLM falhou (%s: %s) — usando fallback", type(exc).__name__, exc)
        return _default_strategy(goal), []


# ─── Orquestrador principal ────────────────────────────────────────────────────

async def generate_and_save_diet(
    db: Session, patient: Patient, request, checkins: List[object] = []
) -> tuple[Diet, int, list[str], str, list[str]]:
    goal     = normalize_goal(patient.goal)
    warnings: list[str] = []

    # ── Cálculo clínico do VET (Mifflin-St Jeor → GET → VET) ─────────────
    if request.calorie_target:
        target = request.calorie_target
    else:
        peso   = float(patient.weight or 70)
        altura = float(patient.height or 170)
        idade  = int(patient.age or 30)
        genero = (getattr(patient, "gender", None) or "masculino").lower()
        tmb    = calcular_tmb(peso, altura, idade, genero)
        get    = calcular_get(tmb, request.activity_level)
        target = calcular_vet(get, goal)

    profile = build_restriction_profile(
        request.restrictions, request.other_restrictions, request.professional_notes
    )

    if not getattr(patient, "gender", None):
        warnings.append(
            "Sexo do paciente não informado — TMB calculada com referência masculina. "
            "Atualize o cadastro para maior precisão."
        )

    foods = db.query(NutritionFood).filter(NutritionFood.active.is_(True)).all()

    # ── Curadoria de despensa: filtro por restrições → harmonização via LLM ──
    eligible_foods = [f for f in foods if _passes_restrictions(f, profile)]
    curated_foods  = await _curate_pantry_with_llm(patient, goal, eligible_foods)

    # ── Seleção dinâmica de refeições e pesos calóricos ───────────────────
    n         = min(max(request.meals_per_day, 3), 6)
    templates = [MEAL_TEMPLATES[i] for i in _MEAL_SELECTION[n]]
    weights   = _MEAL_WEIGHTS[n]

    # Motor de regras SEMPRE monta a dieta — decisão clínica é determinística
    # Recebe a despensa já harmonizada; food_matches ainda filtra por meal_tag/goal
    meal_data = _generate_meals_rules(curated_foods, templates, weights, target, goal, profile, warnings)

    # LLM gera a narrativa e os insights clínicos (com timeout + fallback automático)
    strategy, clinical_insights = await _generate_strategy_narrative(meal_data, goal, target, checkins)

    # ── Persistência ────────────────────────────────────────────────────────
    db_diet = Diet(patient_id=patient.id, total_calories=0)
    db.add(db_diet)
    db.flush()

    total = 0
    for meal in meal_data:
        meal_total = sum(cal for _, _, cal in meal.foods)
        total += meal_total
        db_meal = Meal(
            diet_id=db_diet.id,
            title=meal.title,
            time=meal.time,
            total_calories=meal_total,
        )
        db.add(db_meal)
        db.flush()
        for name, quantity, calories in meal.foods:
            db.add(FoodItem(meal_id=db_meal.id, name=name, quantity=quantity, calories=calories))

    db_diet.total_calories = total
    db.commit()
    db.refresh(db_diet)

    if profile.raw_terms:
        warnings.append("Restrições aplicadas: " + ", ".join(sorted(profile.raw_terms)))

    if total < target * 0.70:
        warnings.append(
            "A dieta gerada ficou abaixo da meta calórica. "
            "Cadastre mais alimentos compatíveis com as restrições do paciente."
        )

    return db_diet, target, warnings, strategy, clinical_insights
