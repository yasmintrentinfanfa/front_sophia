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
    throw new Error(dados.erro_mongo);
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

export async function processarEntrevista(
  casoId: string,
  arquivo: Blob,
  nomeArquivo: string,
  aoTranscrever?: (texto: string) => void,
) {
  const bruto = await transcreverAudio(arquivo, nomeArquivo);
  aoTranscrever?.(bruto);
  const resultado = await revisarTranscricao(bruto);
  await salvarTranscricaoDoCaso(casoId, resultado.texto);
  return resultado;
}
