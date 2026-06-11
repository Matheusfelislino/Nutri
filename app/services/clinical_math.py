"""
Módulo de matemática clínica — cálculos nutricionais padrão-ouro.

Fórmulas de referência:
  TMB  : Mifflin-St Jeor (1990)
  GET  : TMB × fator de atividade (Harris-Benedict revisado)
  VET  : GET ajustado pelo objetivo clínico (déficit/superávit fixo)
  Macros: proteína 2 g/kg → gordura 1 g/kg → carboidratos = resto do VET

Constantes calóricas:
  Proteína    = 4 kcal/g
  Carboidrato = 4 kcal/g
  Gordura     = 9 kcal/g
"""
from __future__ import annotations

# ─── Constantes calóricas ─────────────────────────────────────────────────────

KCAL_POR_G_PROTEINA    = 4
KCAL_POR_G_CARBOIDRATO = 4
KCAL_POR_G_GORDURA     = 9

# ─── Fatores de atividade (Ainsworth, 2000) ───────────────────────────────────

_ACTIVITY_FACTORS: dict[str, float] = {
    "sedentario":   1.20,   # Pouco ou nenhum exercício
    "leve":         1.375,  # Exercício leve 1–3 dias/semana
    "moderado":     1.55,   # Exercício moderado 3–5 dias/semana
    "ativo":        1.725,  # Exercício intenso 6–7 dias/semana
    "muito_ativo":  1.90,   # Exercício muito intenso + trabalho físico
}

# ─── Parâmetros de ajuste do VET ─────────────────────────────────────────────

_DEFICIT_EMAGRECIMENTO = 400   # kcal abaixo do GET → ~0,5 kg de gordura/semana
_SUPERAVIT_HIPERTROFIA = 400   # kcal acima  do GET → ganho de massa controlado
_VET_MINIMO            = 1_200 # limite de segurança clínica
_VET_MAXIMO            = 5_000 # limite prático


# ─── Funções públicas ─────────────────────────────────────────────────────────

def calcular_tmb(
    peso: float,
    altura: float,
    idade: int,
    genero: str,
) -> float:
    """
    Taxa Metabólica Basal — fórmula de Mifflin-St Jeor (1990).

    Args:
        peso:   kg
        altura: cm  (se valor < 3 assume-se metros e converte automaticamente)
        idade:  anos inteiros
        genero: "masculino" | "male" | "m"  → +5 kcal
                qualquer outro valor        → −161 kcal (feminino)

    Returns:
        TMB em kcal/dia (float, antes da correção de atividade).
    """
    if altura < 3:
        altura *= 100  # metros → centímetros

    base = (10.0 * peso) + (6.25 * altura) - (5.0 * idade)
    base += 5.0 if genero.lower() in ("masculino", "male", "m") else -161.0
    return base


def calcular_get(tmb: float, fator_atividade: str) -> float:
    """
    Gasto Energético Total = TMB × fator de atividade.

    Níveis válidos: sedentario, leve, moderado, ativo, muito_ativo.
    Valores não reconhecidos assumem fator 1.55 (moderado).

    Returns:
        GET em kcal/dia (float).
    """
    fator = _ACTIVITY_FACTORS.get(fator_atividade.lower(), 1.55)
    return tmb * fator


def calcular_vet(get: float, objetivo: str) -> int:
    """
    Valor Energético Total ajustado pelo objetivo clínico.

    - "emagrecimento" : GET − 400 kcal  (déficit conservador, ~0,5 kg/semana)
    - "hipertrofia"   : GET + 400 kcal  (superávit controlado para massa magra)
    - qualquer outro  : = GET           (normocalórico / manutenção)

    O resultado é arredondado para o múltiplo de 50 mais próximo e clampeado
    dentro dos limites clínicos de segurança (1 200–5 000 kcal).

    Returns:
        VET em kcal/dia (int).
    """
    if objetivo == "emagrecimento":
        vet = get - _DEFICIT_EMAGRECIMENTO
    elif objetivo == "hipertrofia":
        vet = get + _SUPERAVIT_HIPERTROFIA
    else:
        vet = get

    vet = max(_VET_MINIMO, min(_VET_MAXIMO, vet))
    return int(round(vet / 50) * 50)


def calcular_macros(peso: float, vet: int) -> dict[str, float | int]:
    """
    Distribuição de macronutrientes a partir do VET e do peso corporal.

    Protocolo de prioridade:
      1. Proteína    = peso × 2,0 g/kg  (suporte à massa muscular)
      2. Gordura     = peso × 1,0 g/kg  (funções hormonais e celulares)
      3. Carboidrato = calorias restantes ÷ 4 kcal/g  (combustível principal)

    Args:
        peso: kg
        vet:  Valor Energético Total em kcal/dia

    Returns:
        Dict com gramas e kcal de cada macro:
        {
            "proteina_g", "carboidrato_g", "gordura_g",
            "proteina_kcal", "carboidrato_kcal", "gordura_kcal"
        }
    """
    proteina_g    = peso * 2.0
    gordura_g     = peso * 1.0

    proteina_kcal  = proteina_g  * KCAL_POR_G_PROTEINA
    gordura_kcal   = gordura_g   * KCAL_POR_G_GORDURA

    carbo_kcal = max(vet - proteina_kcal - gordura_kcal, 0.0)
    carbo_g    = carbo_kcal / KCAL_POR_G_CARBOIDRATO

    # Fibra: DRI = 14 g por 1 000 kcal (Academy of Nutrition and Dietetics)
    fibra_g = round(vet * 14 / 1000, 1)

    return {
        "proteina_g":       round(proteina_g, 1),
        "carboidrato_g":    round(carbo_g, 1),
        "gordura_g":        round(gordura_g, 1),
        "proteina_kcal":    round(proteina_kcal),
        "carboidrato_kcal": round(carbo_kcal),
        "gordura_kcal":     round(gordura_kcal),
        "fibra_g":          fibra_g,
    }
