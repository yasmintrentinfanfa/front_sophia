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

export async function salvarTranscricaoDoCaso(casoId: string, texto: string) {
  const res = await fetch("/api/transcricao/salvar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ casoId, texto }),
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

export async function obterTranscricaoDoCaso(casoId: string) {
  const res = await fetch(`/api/transcricao/caso?casoId=${encodeURIComponent(casoId)}`);
  if (res.status === 404) return "";
  const dados = (await res.json().catch(() => ({}))) as {
    erro?: string;
    transcript?: { text?: string };
  };
  if (!res.ok) return "";
  return (dados.transcript?.text ?? "").trim();
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
): Promise<ResultadoRelato> {
  aoEtapa?.("transcrevendo");
  const bruto = await transcreverAudio(arquivo, nomeArquivo);
  aoEtapa?.("revisando");
  const resultado = await revisarTranscricao(bruto);
  aoEtapa?.("salvando");
  await salvarTranscricaoDoCaso(casoId, resultado.texto);
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
  await salvarTranscricaoDoCaso(casoId, relato);
  return { texto: relato, revisado: false };
}
