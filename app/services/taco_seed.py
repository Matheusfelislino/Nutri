"""
Importação da Tabela Brasileira de Composição de Alimentos (TACO)
com Filtro Culinário v2 — remove ingredientes não consumíveis,
estados de preparo inadequados e ultraprocessados.

Fonte: NEPA/UNICAMP — https://www.unicamp.br/nepa/taco/
"""
from __future__ import annotations

import logging
import unicodedata
from typing import Optional

import requests
from sqlalchemy.orm import Session

from app.models.nutrition import NutritionFood

logger = logging.getLogger(__name__)

_TACO_URL = (
    "https://raw.githubusercontent.com/marcelosanto/tabela_taco/main/TACO.json"
)
_REQUEST_TIMEOUT = 20

# Versão do filtro — alterar para forçar re-seed quando as regras mudarem
_TACO_NOTES_MARKER = "Fonte: TACO/NEPA-UNICAMP v2"


# ─── Categorias ignoradas ─────────────────────────────────────────────────────
_SKIP_CATEGORIES = frozenset({
    "Bebidas (alcoólicas e não alcoólicas)",
    "Produtos açucarados",
    "Miscelâneas",
    "Outros alimentos industrializados",
    "Alimentos preparados",
})


# ─── Mapeamento categoria TACO → group do NutritionFood ──────────────────────
_CATEGORY_TO_GROUP: dict[str, str] = {
    "Cereais e derivados":              "carboidrato",
    "Verduras, hortaliças e derivados": "vegetal",
    "Frutas e derivados":               "fruta",
    "Gorduras e óleos":                 "gordura",
    "Pescados e frutos do mar":         "proteina",
    "Carnes e derivados":               "proteina",
    "Leite e derivados":                "proteina",
    "Ovos e derivados":                 "proteina",
    "Leguminosas e derivados":          "leguminosa",
    "Nozes e sementes":                 "gordura",
}


# ─── Filtro Culinário — conjuntos de exclusão ────────────────────────────────

# Grupos nos quais o estado "cru" é natural e aceitável
_ALLOW_RAW_GROUPS = frozenset({"fruta", "vegetal"})

# Ultraprocessados, fritos e embutidos — nunca entram num plano clínico
_ULTRAPROCESSED_KEYWORDS = frozenset({
    "pastel",      # pastel (frito ou cru)
    "bacon",
    "salsicha",
    "mortadela",
    "linguica",    # linguiça (normalizado)
    "nugget",
    "hamburguer",  # hambúrguer (normalizado)
    "recheado",    # biscoito recheado, salgado recheado
    "recheada",    # forma feminina
    "empanado",    # empanado frito
    "empanada",    # forma feminina
    "croquete",
    "coxinha",
    "frito",       # frango frito, peixe frito…
    "frita",       # batata frita…
    "torresmo",
    "calabresa",
    "paio",
    "margarina",
})

# Ingredientes de preparo — não se ingere sozinho como refeição
_PREP_INGREDIENT_PREFIXES = frozenset({
    "farinha",      # Farinha de trigo, de mandioca, de arroz…
    "fermento",     # Fermento biológico, químico
    "amido",        # Amido de milho, de batata
    "bicarbonato",
    "vinagre",      # condimento
    "tempero",      # tempero pronto
    "extrato de",   # Extrato de tomate, de carne
})

# Nomes exatos (parte antes da primeira vírgula, normalizados) a excluir
_EXACT_EXCLUSIONS = frozenset({
    "sal",
    "acucar",           # açúcar refinado
    "oleo de soja",
    "oleo de canola",
    "oleo de milho",
    "oleo de girassol",
    "oleo de algodao",  # óleo de algodão
    "gordura vegetal",
    "banha de porco",
    "banha de galinha",
})


# ─── Indicadores de alérgenos / restrições ───────────────────────────────────
_GLUTEN_KEYS = frozenset({
    "trigo", "aveia", "centeio", "cevada", "malte",
    "pao", "pão", "macarrao", "macarrão", "espaguete",
    "talharim", "nhoque", "lasanha", "biscoito", "bolacha",
    "bolo", "waffle", "crepe", "panqueca", "semolina",
    "farinha de trigo",
})

_LACTOSE_KEYS = frozenset({
    "leite", "iogurte", "queijo", "manteiga", "creme de leite",
    "nata", "requeijao", "requeijão", "ricota", "coalhada",
    "kefir", "soro de leite", "caseina", "caseína",
})

_BREAKFAST_KEYS = frozenset({
    "aveia", "granola", "muesli", "cereal matinal", "corn flake",
    "pao", "pão", "torrada", "tapioca", "bolo", "biscoito", "bolacha",
    "waffle", "crepe", "panqueca",
})

_PASTA_KEYS = frozenset({
    "macarrao", "macarrão", "espaguete", "talharim", "nhoque",
    "lasanha", "penne", "fusilli",
})


# ─── Helpers gerais ───────────────────────────────────────────────────────────

def _normalize(text: str) -> str:
    """Lowercase sem acentos para comparação de keywords."""
    text = text.lower()
    text = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in text if not unicodedata.combining(ch))


def _safe_float(value) -> float:
    """
    Converte valores do JSON TACO para float.
    "NA"  → campo não analisado → 0.0
    "Tr"  → traços              → 0.0
    ""    → não determinado     → 0.0
    """
    if value is None or value == "" or value == "NA":
        return 0.0
    if isinstance(value, str) and value.strip().lower() == "tr":
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


# ─── Filtro Culinário ─────────────────────────────────────────────────────────

def _culinary_filter(name_lower: str, group: str) -> bool:
    """
    Retorna True se o alimento DEVE ser inserido, False se deve ser descartado.

    Regras aplicadas em ordem:
      1. Bloqueia estado "cru/crua/crus/cruas" para carnes, aves, peixes,
         cereais e leguminosas — frutas e vegetais crus são mantidos.
      2. Bloqueia ultraprocessados, fritos e embutidos.
      3. Bloqueia ingredientes de preparo (farinhas, fermento, sal, etc.).
    """
    words = set(name_lower.split())

    # ── Regra 1: bloqueia "cru" fora de frutas e vegetais ─────────────────
    if words & {"cru", "crua", "crus", "cruas"}:
        if group not in _ALLOW_RAW_GROUPS:
            return False

    # ── Regra 2: ultraprocessados, fritos e embutidos ──────────────────────
    for keyword in _ULTRAPROCESSED_KEYWORDS:
        if keyword in name_lower:
            return False

    # ── Regra 3a: prefixos de ingredientes de preparo ──────────────────────
    # Compara o "ingrediente principal" (texto antes da primeira vírgula)
    main_part = name_lower.split(",")[0].strip()
    for prefix in _PREP_INGREDIENT_PREFIXES:
        if main_part.startswith(prefix):
            return False

    # ── Regra 3b: exclusões exatas (ingrediente principal) ─────────────────
    if main_part in _EXACT_EXCLUSIONS:
        return False

    return True


# ─── Classificação de refeições e objetivos ───────────────────────────────────

def _meal_tags(name_lower: str, category: str, group: str) -> str:
    """
    Determina em quais refeições o alimento é adequado.

    Carnes, aves, pescados e leguminosas → almoço e jantar APENAS.
    Laticínios e ovos → café, lanche e (ovos também) almoço/jantar.
    Frutas → café, lanche e pré-treino.
    Pães e cereais de café → café e lanche.
    """
    if group == "fruta":
        return "cafe,lanche,pre_treino"

    if group == "vegetal":
        return "almoco,jantar"

    if group == "leguminosa":
        return "almoco,jantar"

    if group == "gordura":
        if any(k in name_lower for k in ("azeite", "oleo", "banha")):
            return "almoco,jantar"
        # Nozes, sementes, castanhas → lanches e complemento de refeições
        return "lanche,almoco,jantar,ceia"

    if group == "proteina":
        if category == "Leite e derivados":
            # Iogurtes, queijos, leite → café, lanche e ceia
            return "cafe,lanche,ceia"
        if category == "Ovos e derivados":
            # Ovos são versáteis — servem em qualquer refeição
            return "cafe,lanche,almoco,jantar"
        # Carnes, aves e pescados → refeições principais APENAS
        return "almoco,jantar"

    if group == "carboidrato":
        if any(k in name_lower for k in _BREAKFAST_KEYS):
            return "cafe,lanche"
        if any(k in name_lower for k in _PASTA_KEYS):
            return "almoco,jantar"
        # Arroz, batata, mandioca, inhame, milho → refeições principais
        return "almoco,jantar"

    return "almoco,jantar"


def _goal_tags(
    group: str,
    calories: float,
    protein_g: float,
    fat_g: float,
    carbs_g: float,
) -> str:
    tags: set[str] = {"manutencao"}

    if protein_g >= 15.0:
        tags.add("hipertrofia")

    if group in ("vegetal", "fruta"):
        tags.add("emagrecimento")
    elif calories <= 80:
        tags.add("emagrecimento")
    elif calories <= 150 and fat_g <= 5.0:
        tags.add("emagrecimento")

    if fat_g >= 20.0:
        tags.add("hipertrofia")
        tags.discard("emagrecimento")

    if group == "carboidrato" and carbs_g >= 30.0:
        tags.add("hipertrofia")

    if len(tags) == 1 and calories <= 180:
        tags.add("emagrecimento")

    return ",".join(sorted(tags))


def _restriction_tags(name_lower: str, category: str) -> str:
    is_meat = category in ("Carnes e derivados", "Pescados e frutos do mar")
    is_egg = category == "Ovos e derivados"
    has_lactose = (
        category == "Leite e derivados"
        or any(k in name_lower for k in _LACTOSE_KEYS)
    )
    has_gluten = any(k in name_lower for k in _GLUTEN_KEYS)

    tags: set[str] = set()

    if not is_meat and not is_egg:
        tags.add("vegetariano")

    if not is_meat and not is_egg and not has_lactose:
        tags.add("vegano")

    if not has_lactose:
        tags.add("sem_lactose")

    if not has_gluten:
        tags.add("sem_gluten")

    return ",".join(sorted(tags))


# ─── Construção do registro ────────────────────────────────────────────────────

def _build_record(item: dict) -> Optional[dict]:
    """
    Converte um item do JSON TACO em dict compatível com NutritionFood.
    Retorna None se o item deve ser ignorado por categoria, filtro culinário
    ou ausência de dados nutritivos válidos.
    """
    category = (item.get("category") or "").strip()

    if category in _SKIP_CATEGORIES or category not in _CATEGORY_TO_GROUP:
        return None

    name = (item.get("description") or "").strip()
    if not name:
        return None

    # Coluna name = String(120); trunca com margem de segurança
    name = name[:119]

    calories = _safe_float(item.get("energy_kcal"))
    if calories <= 0:
        return None

    protein_g = _safe_float(item.get("protein_g"))
    fat_g     = _safe_float(item.get("lipid_g"))
    carbs_g   = _safe_float(item.get("carbohydrate_g"))
    fiber_g   = _safe_float(item.get("fiber_g"))

    group      = _CATEGORY_TO_GROUP[category]
    name_lower = _normalize(name)

    # ── Filtro Culinário ────────────────────────────────────────────────────
    if not _culinary_filter(name_lower, group):
        return None

    return {
        "name":             name,
        "group":            group,
        "portion":          "100 g",
        "calories":         round(calories),
        "protein_g":        round(protein_g, 2),
        "carbs_g":          round(carbs_g, 2),
        "fat_g":            round(fat_g, 2),
        "fiber_g":          round(fiber_g, 2),
        "meal_tags":        _meal_tags(name_lower, category, group),
        "goal_tags":        _goal_tags(group, calories, protein_g, fat_g, carbs_g),
        "restriction_tags": _restriction_tags(name_lower, category),
        "notes":            _TACO_NOTES_MARKER,
        "active":           True,
    }


# ─── Download com tratamento de falhas ────────────────────────────────────────

def _download_taco() -> Optional[list[dict]]:
    """Baixa o JSON da TACO. Retorna None em caso de qualquer erro de rede."""
    logger.info("TACO seed: baixando tabela de %s", _TACO_URL)
    try:
        resp = requests.get(_TACO_URL, timeout=_REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        logger.warning("TACO seed: timeout ao baixar tabela. Seed abortado.")
        return None
    except requests.exceptions.RequestException as exc:
        logger.warning("TACO seed: erro de rede — %s. Seed abortado.", exc)
        return None
    except ValueError as exc:
        logger.warning("TACO seed: JSON inválido — %s. Seed abortado.", exc)
        return None


# ─── Função pública ────────────────────────────────────────────────────────────

def seed_taco_foods(db: Session) -> int:
    """
    Limpa o banco e reinsere os alimentos da TACO com Filtro Culinário v2.

    Idempotente por versão: se já existirem registros com _TACO_NOTES_MARKER,
    não faz nada. Para forçar re-seed, altere _TACO_NOTES_MARKER (ex: v3).

    O download ocorre ANTES da limpeza para preservar dados existentes em caso
    de falha de rede — o banco nunca fica vazio por erro de download.
    """
    # ── Idempotência por versão ────────────────────────────────────────────
    already = (
        db.query(NutritionFood)
        .filter(NutritionFood.notes == _TACO_NOTES_MARKER)
        .count()
    )
    if already > 0:
        logger.debug("TACO seed v2: %d alimentos já presentes, pulando.", already)
        return 0

    # ── Download PRIMEIRO — falha aborta sem tocar no banco ───────────────
    taco_items = _download_taco()
    if taco_items is None:
        logger.warning("TACO seed: download falhou. Dados existentes preservados.")
        return 0

    logger.info(
        "TACO seed: %d itens recebidos. Aplicando Filtro Culinário v2...",
        len(taco_items),
    )

    # ── Limpeza total — remove dados antigos e filtros desatualizados ─────
    deleted = db.query(NutritionFood).delete()
    db.flush()
    if deleted:
        logger.info("TACO seed: %d registros removidos para re-seed limpo.", deleted)

    # ── Construção e inserção dos registros filtrados ─────────────────────
    to_insert: list[NutritionFood] = []
    seen_names: set[str] = set()
    n_skipped = 0

    for item in taco_items:
        record = _build_record(item)

        if record is None:
            n_skipped += 1
            continue

        if record["name"] in seen_names:
            n_skipped += 1
            continue

        to_insert.append(NutritionFood(**record))
        seen_names.add(record["name"])

    if not to_insert:
        logger.warning("TACO seed: nenhum alimento aprovado pelo filtro.")
        return 0

    db.add_all(to_insert)
    db.commit()

    logger.info(
        "TACO seed v2 concluído: %d alimentos inseridos, %d descartados pelo filtro.",
        len(to_insert),
        n_skipped,
    )
    return len(to_insert)
