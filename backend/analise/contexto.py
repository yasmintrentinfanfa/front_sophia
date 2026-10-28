"""
Monta o texto do caso que vai para a IA: relatos em ordem cronológica e documentos anexados
como dado não confiável (regra 7 do prompt), com limites de tamanho para caber no contexto do
modelo sem cortar no meio de uma palavra qualquer.
"""
from __future__ import annotations

import hashlib
from typing import Any, Dict, List, Optional, Tuple

from .document_utils import ExtractedDocument, detect_suspicious

# Groq on_demand desta org: 8 mil tokens por pedido. Português + JSON gastam ~1,2
# caractere por token; o sistema já leva ~3 mil caracteres.
LIMITE_RELATOS = 2_000
LIMITE_DOCUMENTO = 800
LIMITE_DOCUMENTOS = 2_800


def _origem(relato: Dict[str, Any]) -> str:
    return "escrito à mão, " if relato.get("origem") == "manual" else ""


def texto_dos_relatos(relatos: List[Dict[str, Any]], limite: int = LIMITE_RELATOS) -> str:
    """Um relato vai como está; vários ganham cabeçalho com a data. Se passar do limite,
    os mais antigos saem primeiro (o relato mais recente é o que reflete o caso hoje)."""
    validos = [r for r in relatos if str(r.get("texto") or "").strip()]
    if len(validos) == 1:
        return validos[0]["texto"].strip()[-limite:]
    blocos = [f"--- Relato {i + 1} ({_origem(r)}registrado em {r.get('criado_em') or 'data não informada'}) ---\n"
              f"{r['texto'].strip()}" for i, r in enumerate(validos)]
    escolhidos: List[str] = []
    total = 0
    for bloco in reversed(blocos):
        if total + len(bloco) > limite and escolhidos:
            escolhidos.append("[Relatos mais antigos omitidos por tamanho.]")
            break
        escolhidos.append(bloco[-limite:])
        total += len(bloco)
    return "\n\n".join(reversed(escolhidos))


def bloco_dos_documentos(documentos: List[Dict[str, Any]],
                         ids_primeiro: Optional[List[str]] = None
                         ) -> Tuple[str, List[Dict[str, Any]]]:
    """Devolve o bloco rotulado para o prompt e os metadados que ficam salvos na análise.

    `ids_primeiro`: arquivos ainda sem análise entram antes, para não serem cortados
    pelo limite de tamanho.
    """
    prioridade = {str(item) for item in (ids_primeiro or []) if item}
    ordenados = sorted(
        documentos,
        key=lambda doc: 0 if str(doc.get("id") or "") in prioridade else 1,
    )
    extraidos: List[ExtractedDocument] = []
    meta: List[Dict[str, Any]] = []
    total = 0
    for doc in ordenados:
        texto = str(doc.get("text") or "").strip()
        if not texto or total >= LIMITE_DOCUMENTOS:
            continue
        texto = texto[:min(LIMITE_DOCUMENTO, LIMITE_DOCUMENTOS - total)]
        total += len(texto)
        suspeitos = detect_suspicious(texto)
        extraido = ExtractedDocument(
            filename=str(doc.get("name") or "documento"), text=texto,
            sha256=hashlib.sha256(texto.encode("utf-8")).hexdigest(),
            suspicious=bool(suspeitos), suspicious_matches=suspeitos)
        extraidos.append(extraido)
        item = {"nome": extraido.filename, "sha256": extraido.sha256, "suspeito": extraido.suspicious}
        if doc.get("id"):
            item["id"] = str(doc["id"])
        meta.append(item)
    bloco = "\n\n".join(d.as_untrusted_block(i + 1) for i, d in enumerate(extraidos))
    return bloco, meta


def fontes_do_caso(relatos: List[Dict[str, Any]], documentos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Uma fonte por relato e por arquivo. O índice da análise é gravado na coleção `analises`."""
    fontes: List[Dict[str, Any]] = []
    relatos_validos = [r for r in relatos if str(r.get("texto") or "").strip()]
    varios = len(relatos_validos) > 1
    for i, relato in enumerate(relatos_validos):
        fontes.append({
            "tipo": "transcricao",
            "id": str(relato.get("id") or f"relato-{i}"),
            "nome": f"Transcrição {i + 1}" if varios else "Transcrição",
            "texto": str(relato["texto"]).strip(),
            "documento": None,
        })
    for doc in documentos:
        texto = str(doc.get("text") or "").strip()
        if not texto:
            continue
        fontes.append({
            "tipo": "documento",
            "id": str(doc.get("id") or f"documento-{len(fontes)}"),
            "nome": str(doc.get("name") or "Documento"),
            "texto": texto,
            "documento": doc,
        })
    return fontes


def escolher_fontes(fontes: List[Dict[str, Any]], tipo: Optional[str], fonte_id: Optional[str]) -> List[Dict[str, Any]]:
    """Filtra a fonte pedida. Sem tipo, devolve todas para gerar o que ainda falta."""
    tipo = (tipo or "").strip().lower()
    fonte_id = (fonte_id or "").strip()
    if tipo and fonte_id:
        return [fonte for fonte in fontes if fonte["tipo"] == tipo and fonte["id"] == fonte_id]
    if tipo == "transcricao":
        relatos = [fonte for fonte in fontes if fonte["tipo"] == "transcricao"]
        return relatos[-1:] if relatos else []
    if tipo == "documento":
        docs = [fonte for fonte in fontes if fonte["tipo"] == "documento"]
        return docs[-1:] if docs else []
    return fontes
