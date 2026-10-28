export async function transcreverAudio(arquivo: Blob, nomeArquivo = "gravacao.webm") {
  const form = new FormData();
  form.append("audio", arquivo, nomeArquivo);
  const res = await fetch("/api/transcricao/transcrever", { method: "POST", body: form });
  const dados = (await res.json().catch(() => ({}))) as { text?: string; erro?: string };
  if (!res.ok) {
    throw new Error(dados.erro ?? "Não foi possível transcrever o áudio.");
  }
  const texto = (dados.text ?? "").trim();
  if (!texto) {
    throw new Error("Nenhuma fala reconhecida no áudio.");
  }
  return texto;
}

export async function revisarTranscricao(texto: string): Promise<{ texto: string; revisado: boolean }> {
  const res = await fetch("/api/transcricao/revisar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto }),
  });
  const dados = (await res.json().catch(() => ({}))) as {
    texto_revisado?: string;
    erro?: string;
  };
  const revisado = (dados.texto_revisado ?? "").trim();
  if (!res.ok || dados.erro || !revisado) {
    return { texto, revisado: false };
  }
  return { texto: revisado, revisado: true };
}

/** Origem do relato em `case.transcript`: transcrição de áudio ou texto escrito à mão. */
export type OrigemRelato = "audio" | "manual";

export async function salvarTranscricaoDoCaso(
  casoId: string,
  texto: string,
  duracaoSegundos?: number,
  origem: OrigemRelato = "audio",
) {
  const duracao = duracaoParaSalvar(duracaoSegundos);
  const res = await fetch("/api/transcricao/salvar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ casoId, texto, origem, ...(duracao === undefined ? {} : { duracaoSegundos: duracao }) }),
  });
  const dados = (await res.json().catch(() => ({}))) as {
    erro?: string;
    erro_mongo?: string;
    case_id?: string;
  };
  if (!res.ok) {
    throw new Error(dados.erro ?? "Não foi possível salvar a transcrição.");
  }
  if (dados.erro_mongo) {
    // Detalhe técnico do banco fica no console; o usuário vê uma mensagem clara.
    console.error("Erro do MongoDB ao salvar a transcrição:", dados.erro_mongo);
    throw new Error("Não foi possível salvar o relato no banco. Tente novamente em instantes.");
  }
  return dados.case_id;
}

/** Envia o PDF/DOCX/TXT; o servidor extrai o texto, grava em `documents` e devolve o texto lido. */
export async function salvarDocumentoDoCaso(casoId: string, arquivo: File) {
  const form = new FormData();
  form.append("arquivo", arquivo, arquivo.name);
  const res = await fetch(`/api/casos/${encodeURIComponent(casoId)}/documentos`, {
    method: "POST",
    body: form,
  });
  const dados = (await res.json().catch(() => ({}))) as {
    erro?: string;
    texto?: string;
    documento?: { id?: string; name?: string; type?: string };
  };
  if (!res.ok) {
    throw new Error(dados.erro ?? "Não foi possível salvar o documento no caso.");
  }
  return {
    id: dados.documento?.id ?? "",
    nome: dados.documento?.name ?? arquivo.name,
    tipo: (dados.documento?.type ?? "").trim().toUpperCase() || "Arquivo",
    texto: (dados.texto ?? "").trim(),
  };
}

export interface DocumentoSalvo {
  id: string;
  nome: string;
  tipo: string;
  texto: string;
}

/** Um item de `case.transcript`. */
export interface RelatoSalvo {
  id: string;
  texto: string;
  origem: OrigemRelato;
  duracaoSegundos: number | null;
}

export async function obterSalvoDoCaso(casoId: string) {
  const vazio = {
    relatos: [] as RelatoSalvo[],
    documentos: [] as DocumentoSalvo[],
  };
  const res = await fetch(`/api/transcricao/caso?casoId=${encodeURIComponent(casoId)}`);
  if (res.status === 404) return vazio;
  const dados = (await res.json().catch(() => ({}))) as {
    erro?: string;
    transcript?: { id?: string; text?: string; source?: string; duration_seconds?: number }[];
    documents?: { id?: string; name?: string; type?: string; text?: string }[];
  };
  if (!res.ok) return vazio;
  const relatos = (Array.isArray(dados.transcript) ? dados.transcript : [])
    .filter((item) => (item.text ?? "").trim())
    .map((item, indice) => ({
      id: item.id || `${casoId}-transcricao-${indice}`,
      texto: (item.text ?? "").trim(),
      origem: (item.source === "manual" ? "manual" : "audio") as OrigemRelato,
      duracaoSegundos:
        typeof item.duration_seconds === "number" && Number.isFinite(item.duration_seconds)
          ? item.duration_seconds
          : null,
    }));
  const documentos = (dados.documents ?? [])
    .filter((item) => (item.text ?? "").trim() || (item.name ?? "").trim())
    .map((item, indice) => ({
      id: item.id || `${casoId}-documento-${indice}`,
      nome: (item.name ?? "").trim() || "Documento",
      tipo: (item.type ?? "").trim().toUpperCase() || "Arquivo",
      texto: (item.text ?? "").trim(),
    }));
  return { relatos, documentos };
}

function duracaoParaSalvar(segundos?: number) {
  if (segundos === undefined || !Number.isFinite(segundos) || segundos <= 0) return undefined;
  return Math.min(Math.round(segundos), 360_000);
}

/** Etapas mostradas ao usuário enquanto o relato vira análise. */
export type EtapaProcessamento = "transcrevendo" | "revisando" | "salvando" | "analisando";

export const ETAPAS_AUDIO: EtapaProcessamento[] = ["transcrevendo", "revisando", "salvando", "analisando"];
export const ETAPAS_TEXTO: EtapaProcessamento[] = ["salvando", "analisando"];

/** Texto final do relato; `revisado` indica se passou pela revisão da Groq. */
export interface ResultadoRelato {
  texto: string;
  revisado: boolean;
}

/** Áudio (gravado ao vivo ou enviado): transcreve, revisa e salva no caso. */
export async function processarEntrevista(
  casoId: string,
  arquivo: Blob,
  nomeArquivo: string,
  aoEtapa?: (etapa: EtapaProcessamento) => void,
  duracaoSegundos?: number,
): Promise<ResultadoRelato> {
  aoEtapa?.("transcrevendo");
  const bruto = await transcreverAudio(arquivo, nomeArquivo);
  aoEtapa?.("revisando");
  const resultado = await revisarTranscricao(bruto);
  aoEtapa?.("salvando");
  await salvarTranscricaoDoCaso(casoId, resultado.texto, duracaoSegundos);
  return resultado;
}

/** Relato digitado: não passa pela transcrição nem pela revisão, vai direto para o caso. */
export async function processarRelatoEscrito(
  casoId: string,
  texto: string,
  aoEtapa?: (etapa: EtapaProcessamento) => void,
): Promise<ResultadoRelato> {
  const relato = texto.trim();
  if (!relato) throw new Error("Escreva o relato antes de gerar a análise.");
  aoEtapa?.("salvando");
  await salvarTranscricaoDoCaso(casoId, relato, undefined, "manual");
  return { texto: relato, revisado: false };
}
