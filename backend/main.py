"""
Sophia — API (cadastro + transcrição).
O modelo Whisper só é carregado na primeira transcrição, para o cadastro
funcionar sem esperar o download/carga do modelo.
"""

import asyncio
import io
import json
import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

PASTA_BACK = Path(__file__).resolve().parent
load_dotenv(PASTA_BACK / ".env")
load_dotenv(PASTA_BACK.parent / ".env.local")
load_dotenv(PASTA_BACK.parent / ".env")

app = FastAPI(title="Sophia — API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGODB_URI = os.getenv("MONGODB_URI")
mongo_client = AsyncIOMotorClient(MONGODB_URI) if MONGODB_URI else None
mongo_db = mongo_client["sophia-data"] if mongo_client else None
transcript_collection = mongo_db["transcript"] if mongo_db is not None else None
users_collection = mongo_db["users"] if mongo_db is not None else None
USERS_FILE = PASTA_BACK / "data" / "users.json"
FUSO = timezone(timedelta(hours=-3))


def agora_iso() -> str:
    return datetime.now(FUSO).strftime("%Y-%m-%dT%H:%M:%S")

MODEL_SIZE = "small"
_whisper = None
OVERLAP_SECONDS = 1.0
SALVAR_AUDIO_DEBUG = True
PASTA_DEBUG = str(PASTA_BACK / "debug_audio")


def obter_whisper():
    """Carrega o modelo só quando alguém transcreve — o cadastro não depende disso."""
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel

        _whisper = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
    return _whisper


def transcrever_bloco(audio_bytes: bytes) -> str:
    if SALVAR_AUDIO_DEBUG:
        os.makedirs(PASTA_DEBUG, exist_ok=True)
        nome_arquivo = os.path.join(PASTA_DEBUG, f"bloco_{time.time():.0f}.wav")
        with open(nome_arquivo, "wb") as f:
            f.write(audio_bytes)
        print(f"[debug] áudio salvo em: {nome_arquivo}")

    audio_buffer = io.BytesIO(audio_bytes)
    segments, info = obter_whisper().transcribe(
        audio_buffer,
        language="pt",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        word_timestamps=True,
    )
    segments = list(segments)

    palavras = []
    for seg in segments:
        if not seg.words:
            continue
        for w in seg.words:
            if w.start >= OVERLAP_SECONDS - 0.05:
                palavras.append(w.word)

    texto = "".join(palavras).strip()
    print(
        f"[debug] bytes_recebidos={len(audio_bytes)} "
        f"duracao_audio={info.duration:.2f}s "
        f"idioma_detectado={info.language} "
        f"confianca_idioma={info.language_probability:.2f} "
        f"n_segmentos={len(segments)} "
        f"texto={texto!r}"
    )
    return texto


def transcrever_audio_completo_sync(audio_bytes: bytes) -> str:
    if SALVAR_AUDIO_DEBUG:
        os.makedirs(PASTA_DEBUG, exist_ok=True)
        nome_arquivo = os.path.join(PASTA_DEBUG, f"completo_{time.time():.0f}.webm")
        with open(nome_arquivo, "wb") as f:
            f.write(audio_bytes)
        print(f"[debug] áudio completo salvo em: {nome_arquivo}")

    audio_buffer = io.BytesIO(audio_bytes)
    segments, info = obter_whisper().transcribe(
        audio_buffer,
        language="pt",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )
    segments = list(segments)
    texto = " ".join(seg.text.strip() for seg in segments).strip()
    print(
        f"[debug] TRANSCRIÇÃO COMPLETA: "
        f"duracao_audio={info.duration:.2f}s "
        f"idioma_detectado={info.language} "
        f"n_segmentos={len(segments)} "
        f"tamanho_texto={len(texto)} caracteres"
    )
    return texto


@app.get("/")
async def raiz():
    return {"servico": "Sophia API", "health": "/health", "docs": "/docs"}


@app.get("/health")
async def health():
    mongo_status = "arquivo local (cole a MONGODB_URI do Atlas em backend/.env)"
    if mongo_client is not None:
        try:
            await mongo_client.admin.command("ping")
            mongo_status = "conectado"
        except Exception as exc:  # noqa: BLE001
            mongo_status = f"erro: {exc}"

    return {
        "status": "ok",
        "mongodb": mongo_status,
        "whisper": "pronto" if _whisper is not None else "ainda não carregado",
    }


@app.post("/transcribe")
async def transcrever_audio_completo(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    texto = await asyncio.to_thread(transcrever_audio_completo_sync, audio_bytes)
    return {"text": texto}


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-120b"

PROMPT_REVISAO = """Você está revisando a transcrição de uma entrevista jurídica \
entre um advogado e seu cliente, gerada por um sistema de reconhecimento de voz.

Sua única tarefa é corrigir erros PROVÁVEIS DE TRANSCRIÇÃO — palavras que soam \
parecido foneticamente com o que provavelmente foi dito, mas que não fazem \
sentido no contexto (ex: "tese de dano moral" transcrito errado como "tese \
de dano mural").

Regras estritas:
- NÃO resuma, NÃO reescreva o estilo, NÃO corrija gramática coloquial normal \
de fala.
- NÃO adicione informação nenhuma que não esteja no texto original.
- NÃO remova nada, mesmo que pareça irrelevante.
- Se não tiver certeza se algo é erro de transcrição, MANTENHA como está \
(prefira não mexer a inventar uma correção errada).
- Responda APENAS com o texto corrigido, sem comentários, sem explicações, \
sem aspas ao redor.

Texto a revisar:
"""


class RevisarTextoRequest(BaseModel):
    texto: str
    groq_api_key: str = ""


class CadastroRequest(BaseModel):
    nome: str
    email: str
    senha: str


@app.post("/revisar-transcricao")
async def revisar_transcricao(payload: RevisarTextoRequest):
    if not payload.texto.strip():
        return {"texto_revisado": payload.texto}

    chave = payload.groq_api_key.strip() or os.getenv("GROQ_API_KEY", "")
    if not chave:
        return {
            "erro": (
                "Nenhuma chave da Groq informada (nem no pedido, "
                "nem em GROQ_API_KEY no .env do backend)."
            )
        }

    headers = {
        "Authorization": f"Bearer {chave}",
        "Content-Type": "application/json",
    }
    body = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": PROMPT_REVISAO},
            {"role": "user", "content": payload.texto},
        ],
        "temperature": 0.0,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resposta = await client.post(GROQ_API_URL, headers=headers, json=body)

    if resposta.status_code != 200:
        return {
            "erro": f"Groq retornou status {resposta.status_code}: {resposta.text}"
        }

    dados = resposta.json()
    texto_revisado = dados["choices"][0]["message"]["content"].strip()
    return {"texto_revisado": texto_revisado}


def _ler_users_arquivo() -> list[dict]:
    if not USERS_FILE.exists():
        return []
    return json.loads(USERS_FILE.read_text(encoding="utf-8"))


def _gravar_users_arquivo(lista: list[dict]) -> None:
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(json.dumps(lista, indent=2, ensure_ascii=False), encoding="utf-8")


@app.post("/cadastro")
async def cadastro(payload: CadastroRequest):
    """Cria um documento na collection users (UUID, email, bcrypt, created_at)."""
    nome = payload.nome.strip()
    email = payload.email.strip().lower()
    senha = payload.senha
    if not nome:
        return JSONResponse({"erro": "Informe o nome completo."}, status_code=400)
    if not email or "@" not in email:
        return JSONResponse({"erro": "Informe um email válido."}, status_code=400)
    if len(senha) < 8:
        return JSONResponse(
            {"erro": "A senha deve ter pelo menos 8 caracteres."},
            status_code=400,
        )

    if users_collection is not None:
        existente = await users_collection.find_one({"email": email})
    else:
        existente = next((u for u in _ler_users_arquivo() if u.get("email") == email), None)
    if existente:
        return JSONResponse({"erro": "Já existe uma conta com este email."}, status_code=400)

    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    documento = {
        "_id": user_id,
        "name": nome,
        "email": email,
        "password_hash": password_hash,
        "created_at": agora_iso(),
    }
    try:
        if users_collection is not None:
            await users_collection.create_index("email", unique=True)
            await users_collection.insert_one(documento)
        else:
            lista = _ler_users_arquivo()
            lista.append(documento)
            _gravar_users_arquivo(lista)
    except Exception as exc:  # noqa: BLE001
        if "duplicate" in str(exc).lower():
            return JSONResponse({"erro": "Já existe uma conta com este email."}, status_code=400)
        return JSONResponse({"erro": str(exc)}, status_code=500)

    return {"usuario": {"_id": user_id, "name": nome, "email": email}}


@app.post("/salvar-transcricao")
async def salvar_transcricao(payload: dict):
    texto = (payload.get("texto") or "").strip()
    if not texto:
        return {"erro": "Texto vazio, nada para salvar."}

    agora = time.strftime("%Y-%m-%d_%H-%M-%S")
    pasta_txt = PASTA_BACK / "transcricoes"
    os.makedirs(pasta_txt, exist_ok=True)
    nome_arquivo_txt = str(pasta_txt / f"transcricao_{agora}.txt")
    with open(nome_arquivo_txt, "w", encoding="utf-8") as f:
        f.write(texto)

    resultado = {"arquivo_txt": nome_arquivo_txt}

    if transcript_collection is not None:
        try:
            documento = {
                "text": texto,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            }
            user_id = (payload.get("user_id") or "").strip()
            caso_id = (payload.get("caso_id") or "").strip()
            if user_id:
                documento["user_id"] = user_id
            if caso_id:
                documento["caso_id"] = caso_id
            insercao = await transcript_collection.insert_one(documento)
            resultado["mongo_id"] = str(insercao.inserted_id)
        except Exception as exc:  # noqa: BLE001
            resultado["erro_mongo"] = str(exc)
    else:
        resultado["aviso"] = "MONGODB_URI não configurada — salvo só localmente em .txt."

    return resultado


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            if not audio_bytes:
                continue
            try:
                texto = await asyncio.to_thread(transcrever_bloco, audio_bytes)
            except Exception as exc:  # noqa: BLE001
                await websocket.send_json(
                    {"type": "error", "message": f"Falha ao transcrever: {exc}"}
                )
                continue
            if texto:
                await websocket.send_json(
                    {"type": "transcript", "text": texto, "is_final": True}
                )
    except WebSocketDisconnect:
        pass
