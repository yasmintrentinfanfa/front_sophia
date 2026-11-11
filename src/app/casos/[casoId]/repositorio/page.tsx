"use client";

import { useEffect, useId, useState, type ComponentType } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FileAudio, FileText, FolderOpen, Mic, PenLine } from "lucide-react";

import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { useListaCasos } from "@/components/casos/contexto-lista-casos";
import { BotaoVoltar } from "@/components/fluxo/botao-voltar";
import { ProgressoProcessamento } from "@/components/gravacao/progresso-processamento";
import { SeletorArquivos, idDoArquivo, type ItemFila } from "@/components/gravacao/seletor-arquivos";
import type { ConteudoCaso } from "@/lib/api/analise";
import { duracaoDoAudio } from "@/lib/arquivos/duracao-audio";
import { ehAudio, ehDocumento } from "@/lib/arquivos/ler-documento";
import { formatarDuracao } from "@/lib/formato";
import { api } from "@/lib/api";
import {
  ETAPAS_AUDIO,
  ETAPAS_TEXTO,
  obterSalvoDoCaso,
  processarEntrevista,
  processarRelatoEscrito,
  salvarDocumentoDoCaso,
  type DocumentoSalvo,
  type EtapaProcessamento,
  type ResultadoRelato,
} from "@/lib/transcricao/fluxo";
import { cn } from "@/lib/utils";

type ModoRelato = "ao_vivo" | "arquivo" | "texto";

const MINIMO_RELATO = 50;
const MAXIMO_DOCUMENTOS = 10;

const MODOS: { valor: ModoRelato; titulo: string; descricao: string; Icone: ComponentType<{ className?: string }> }[] = [
  {
    valor: "ao_vivo",
    titulo: "Gravar ao vivo",
    descricao: "Grave a conversa com o cliente; a transcrição é feita ao finalizar.",
    Icone: Mic,
  },
  {
    valor: "arquivo",
    titulo: "Enviar áudio ou documento",
    descricao: "Envie um áudio ou um documento em PDF, Word (DOCX) ou TXT.",
    Icone: FileAudio,
  },
  {
    valor: "texto",
    titulo: "Escrever o relato",
    descricao: "Digite ou cole o relato do cliente, sem gravação.",
    Icone: PenLine,
  },
];

/**
 * Repositório do caso: a porta de entrada para somar material (gravar, enviar ou escrever),
 * com o atalho para o que já entrou. Arquivar e excluir ficam na lista de casos.
 */
export default function PaginaRepositorio() {
  const router = useRouter();
  const idRelato = useId();
  const { casoId } = useParams<{ casoId: string }>();
  const { casos, carregando, finalizarSessao } = useListaCasos();
  const [modo, setModo] = useState<ModoRelato>("ao_vivo");
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [anexados, setAnexados] = useState<DocumentoSalvo[]>([]);
  const [totalRelatos, setTotalRelatos] = useState(0);
  const [progressoDocs, setProgressoDocs] = useState("");
  const [okDocs, setOkDocs] = useState("");
  const [relato, setRelato] = useState("");
  const [etapa, setEtapa] = useState<EtapaProcessamento | null>(null);
  const [resultado, setResultado] = useState<ResultadoRelato | null>(null);
  const [veioDeAudio, setVeioDeAudio] = useState(false);
  const [documentoNovoId, setDocumentoNovoId] = useState("");
  const [gerandoAnalise, setGerandoAnalise] = useState(false);
  const [temAnalise, setTemAnalise] = useState(false);
  const [perguntarAtualizacao, setPerguntarAtualizacao] = useState(false);
  const [erro, setErro] = useState("");
  const caso = casos.find((item) => item.id === casoId);
  const processando = etapa !== null || gerandoAnalise;

  useEffect(() => {
    let ativo = true;
    api
      .obterCaso(casoId)
      .then((conteudo) => {
        if (ativo) setTemAnalise(Boolean(conteudo.analise || conteudo.versoesAnalise.length));
      })
      .catch(() => {
        if (ativo) setTemAnalise(false);
      });
    return () => {
      ativo = false;
    };
  }, [casoId]);

  useEffect(() => {
    let ativo = true;
    obterSalvoDoCaso(casoId)
      .then((salvo) => {
        if (!ativo) return;
        setAnexados(salvo.documentos);
        setTotalRelatos(salvo.relatos.length);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [casoId]);

  /** Recarrega o que já está salvo, para a contagem do atalho e a lista de anexados. */
  async function atualizarSalvos() {
    try {
      const salvo = await obterSalvoDoCaso(casoId);
      setAnexados(salvo.documentos);
      setTotalRelatos(salvo.relatos.length);
    } catch {
      // A contagem só é atualizada na próxima abertura da tela.
    }
  }

  const vagas = MAXIMO_DOCUMENTOS - anexados.length - fila.filter((item) => !ehAudio(item.arquivo)).length;

  /** Soma arquivos à fila sem perder os que já estão nela. Áudio é um por vez e não mistura com documentos. */
  function adicionarArquivos(escolhidos: File[]) {
    setErro("");
    setOkDocs("");
    const invalidos = escolhidos.filter((item) => !ehAudio(item) && !ehDocumento(item));
    const validos = escolhidos.filter((item) => ehAudio(item) || ehDocumento(item));
    const audios = validos.filter(ehAudio);
    const documentos = validos.filter((item) => !ehAudio(item));
    const avisos: string[] = [];
    if (invalidos.length) {
      avisos.push(`Formato não suportado: ${invalidos.map((item) => item.name).join(", ")}. Envie um áudio, PDF, DOCX ou TXT.`);
    }

    if (audios.length) {
      const temDocumentoNaFila = fila.some((item) => !ehAudio(item.arquivo));
      if (validos.length > 1 || temDocumentoNaFila) {
        avisos.push("Envie um áudio por vez, separado dos documentos.");
      } else {
        setFila([{ id: idDoArquivo(audios[0]), arquivo: audios[0] }]);
      }
    } else if (documentos.length) {
      if (fila.some((item) => ehAudio(item.arquivo))) {
        avisos.push("Remova o áudio da lista antes de anexar documentos.");
      } else {
        const jaNaFila = new Set(fila.map((item) => item.id));
        const unicos = documentos.filter((item) => !jaNaFila.has(idDoArquivo(item)));
        const cabem = Math.max(0, vagas);
        if (unicos.length > cabem) avisos.push(`Limite de ${MAXIMO_DOCUMENTOS} documentos por caso.`);
        const novos = unicos.slice(0, cabem).map((item) => ({ id: idDoArquivo(item), arquivo: item }));
        if (novos.length) setFila((atual) => [...atual, ...novos]);
      }
    }
    if (avisos.length) setErro(avisos.join(" "));
  }

  function removerDaFila(id: string) {
    setErro("");
    setOkDocs("");
    setFila((atual) => atual.filter((item) => item.id !== id));
  }

  /** Envia os documentos da fila um a um (cada um vira um item em `documents`). A análise só roda se o usuário pedir. */
  async function anexarDocumentos() {
    const itens = fila.filter((item) => !ehAudio(item.arquivo));
    if (!itens.length) return;
    setVeioDeAudio(false);
    setErro("");
    setOkDocs("");
    setResultado(null);
    setFila((atual) => atual.map((item) => ({ ...item, erro: undefined })));
    const falhas = new Map<string, string>();
    let enviados = 0;
    let ultimoId = "";
    setEtapa("salvando");
    for (let indice = 0; indice < itens.length; indice += 1) {
      const item = itens[indice];
      setProgressoDocs(`Anexando arquivo ${indice + 1} de ${itens.length}: ${item.arquivo.name}`);
      try {
        const salvo = await salvarDocumentoDoCaso(casoId, item.arquivo);
        enviados += 1;
        if (salvo.id) ultimoId = salvo.id;
      } catch (falha) {
        falhas.set(item.id, falha instanceof Error ? falha.message : "Não foi possível anexar o arquivo.");
      }
    }
    await atualizarSalvos();
    setFila((atual) =>
      atual.filter((item) => falhas.has(item.id)).map((item) => ({ ...item, erro: falhas.get(item.id) })),
    );
    if (enviados) {
      setDocumentoNovoId(ultimoId);
      setPerguntarAtualizacao(temAnalise);
      setOkDocs(`${enviados} ${enviados === 1 ? "documento anexado" : "documentos anexados"} ao caso.`);
      setResultado({
        texto: `${enviados} ${enviados === 1 ? "documento anexado" : "documentos anexados"} ao caso.`,
        revisado: false,
      });
    }
    if (falhas.size) {
      setErro(
        `${falhas.size} ${falhas.size === 1 ? "arquivo não foi anexado" : "arquivos não foram anexados"}. Veja o motivo na lista.`,
      );
    }
    setProgressoDocs("");
    setEtapa(null);
  }

  /** Salva o relato (áudio ou texto) no caso e mostra o texto final antes de abrir a análise. */
  async function registrarRelato(
    processar: (aoEtapa: (etapa: EtapaProcessamento) => void) => Promise<ResultadoRelato>,
    tempo = "00:00",
  ) {
    setErro("");
    setResultado(null);
    const jaTinhaAnalise = temAnalise;
    try {
      const final = await processar(setEtapa);
      const transcricao: ConteudoCaso["transcricao"] = [
        { id: `${casoId}-transcricao-${Date.now()}`, tempo, texto: final.texto, papel: "cliente" },
      ];
      setEtapa("analisando");
      try {
        await finalizarSessao(casoId, transcricao, !jaTinhaAnalise);
        if (!jaTinhaAnalise) setTemAnalise(true);
      } catch {
        // A fala já foi salva no banco. O status local não impede abrir a análise.
      }
      setPerguntarAtualizacao(jaTinhaAnalise);
      setResultado(final);
      setFila([]);
      void atualizarSalvos();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível registrar o relato. Tente novamente.");
    } finally {
      setEtapa(null);
    }
  }

  const escolherDestino =
    !!resultado && (perguntarAtualizacao || (modo === "arquivo" && !veioDeAudio));

  async function atualizarAnalise() {
    setErro("");
    setGerandoAnalise(true);
    setEtapa("analisando");
    try {
      await api.solicitarAnalise(
        casoId,
        modo === "arquivo" && !veioDeAudio && documentoNovoId
          ? { tipo: "documento", id: documentoNovoId }
          : undefined,
      );
      setTemAnalise(true);
      router.push(`/casos/${casoId}/analise`);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "O material já está salvo. Não foi possível atualizar a análise agora.",
      );
    } finally {
      setGerandoAnalise(false);
      setEtapa(null);
    }
  }

  if (carregando) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Carregando caso…</p>;
  }

  if (!caso) {
    return <p className="text-tinta-suave px-7 pt-6 text-[13px]">Caso não encontrado.</p>;
  }

  const caracteres = relato.trim().length;
  const etapas =
    modo === "ao_vivo" || (modo === "arquivo" && veioDeAudio) ? ETAPAS_AUDIO : ETAPAS_TEXTO;
  const totalMateriais = totalRelatos + anexados.length;

  return (
    <>
      {/* O topo tem a mesma largura do conteúdo, para o atalho ficar alinhado aos cards. */}
      <header className="w-full shrink-0 px-7 pt-5 pb-2 max-[700px]:px-4">
        <div className="flex w-full max-w-[880px] flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <BotaoVoltar destino="/casos" desabilitado={processando} />
              <h1 className="text-[22px] leading-none font-bold">Repositório do caso</h1>
            </div>
            <p className="text-[13px]">{caso.titulo}</p>
          </div>

          <Link
            href={`/casos/${casoId}/repositorio/materiais`}
            aria-disabled={processando || undefined}
            tabIndex={processando ? -1 : undefined}
            className={cn(
              "pressionavel bg-campo border-borda hover:border-destaque/60 flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-semibold",
              processando && "pointer-events-none opacity-50",
            )}
          >
            <FolderOpen className="text-destaque size-3.5" aria-hidden />
            Transcrições e documentos
            {totalMateriais ? (
              <span className="bg-destaque-suave text-destaque min-w-[18px] rounded-full px-1.5 text-center text-[11px] leading-[18px] font-semibold">
                {totalMateriais}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-7 pt-4 pb-7 max-[700px]:px-4">
        <section className="bg-campo border-borda flex w-full max-w-[880px] flex-col gap-1.5 rounded-[10px] border px-4 py-3">
          <h2 className="text-[13px] font-semibold">Consentimento do cliente</h2>
          <p className="text-tinta-suave text-[12px]">
            O cliente foi informado e autorizou a gravação e o processamento dos dados para fins
            jurídicos.
          </p>
        </section>

        <section className="flex w-full max-w-[880px] flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold">O que você quer adicionar ao caso?</h2>
            <p className="text-tinta-suave text-[12px]">
              Cada gravação, arquivo ou relato novo entra no repositório sem apagar o que já estava lá.
            </p>
          </div>

          <div role="radiogroup" aria-label="O que adicionar ao caso" className="grid gap-3 md:grid-cols-3">
            {MODOS.map(({ valor, titulo, descricao, Icone }) => {
              const selecionado = modo === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  disabled={processando}
                  onClick={() => {
                    setModo(valor);
                    setErro("");
                    setResultado(null);
                  }}
                  className={cn(
                    "bg-campo flex h-full flex-col gap-2.5 rounded-[12px] border p-4 text-left disabled:opacity-60",
                    selecionado
                      ? "border-destaque ring-destaque/20 border-[1.5px] ring-4"
                      : "border-borda hover:border-destaque/60",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-[8px]",
                        selecionado ? "bg-destaque text-white" : "bg-destaque-suave text-destaque",
                      )}
                    >
                      <Icone className="size-4" />
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "size-4 rounded-full border",
                        selecionado ? "border-destaque border-[5px]" : "border-borda",
                      )}
                    />
                  </span>
                  <span className="text-[14px] font-bold">{titulo}</span>
                  <span className="text-tinta-suave text-[12px] leading-snug">{descricao}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-campo border-borda flex w-full max-w-[880px] flex-col gap-4 rounded-[12px] border p-5">
          {processando ? (
            <ProgressoProcessamento
              etapas={etapas}
              atual={etapa ?? "analisando"}
              aviso={
                modo === "arquivo" && veioDeAudio
                  ? "A primeira transcrição pode levar alguns minutos. Mantenha esta tela aberta."
                  : progressoDocs || undefined
              }
            />
          ) : resultado ? (
            <>
              <div className="flex flex-col gap-1">
                <h3 className="text-[14px] font-semibold">
                  {modo === "arquivo" && veioDeAudio ? "Transcrição" : "Relato salvo"}
                </h3>
                <p className="text-tinta-suave text-[12px]">
                  {modo === "arquivo" && veioDeAudio
                    ? resultado.revisado
                      ? "Transcrição revisada."
                      : "Texto transcrito pelo Whisper. A revisão da Groq entra quando a chave estiver configurada."
                    : modo === "arquivo"
                      ? "O arquivo foi salvo em Documentos, no repositório do caso."
                      : "O texto foi salvo no caso."}
                </p>
              </div>
              <p className="border-borda max-h-[320px] overflow-y-auto rounded-[8px] border px-3 py-2.5 text-[13px] leading-5 whitespace-pre-wrap">
                {resultado.texto}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {!escolherDestino ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/casos/${casoId}/analise`)}
                    className="pressionavel bg-acao text-acao-tinta flex h-10 items-center rounded-[8px] px-4 text-[13px] font-semibold"
                  >
                    Ver análise
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={gerandoAnalise}
                  onClick={() => {
                    setResultado(null);
                    setDocumentoNovoId("");
                    setPerguntarAtualizacao(false);
                    setFila([]);
                    setRelato("");
                    setErro("");
                    setOkDocs("");
                  }}
                  className="pressionavel border-borda bg-campo flex h-10 items-center rounded-[8px] border px-4 text-[13px] font-semibold disabled:opacity-40"
                >
                  {modo === "arquivo" ? "Enviar outro" : "Registrar outro relato"}
                </button>
              </div>
            </>
          ) : modo === "ao_vivo" ? (
            <>
              <div className="flex flex-col gap-1">
                <h3 className="text-[14px] font-semibold">Gravação ao vivo</h3>
                <p className="text-tinta-suave text-[12px] leading-relaxed">
                  O áudio fica no seu navegador durante a conversa e só é enviado quando você
                  finalizar. Você pode pausar e retomar quando precisar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/casos/${caso.id}/sessao`)}
                className="pressionavel bg-acao text-acao-tinta flex h-10 w-fit items-center gap-2 rounded-[8px] px-4 text-[13px] font-semibold"
              >
                <Mic className="size-4" aria-hidden />
                Iniciar gravação
              </button>
            </>
          ) : modo === "arquivo" ? (
            <>
              <div className="flex flex-col gap-1">
                <h3 className="text-[14px] font-semibold">Áudio ou documentos</h3>
                <p className="text-tinta-suave text-[12px]">
                  O áudio é transcrito e revisado. Documentos (PDF, DOCX e TXT) são lidos e somados ao caso, até{" "}
                  {MAXIMO_DOCUMENTOS} por caso. Depois você escolhe se gera uma nova análise.
                </p>
              </div>

              {anexados.length ? (
                <div className="border-borda flex flex-col gap-1.5 rounded-[10px] border px-4 py-3">
                  <p className="text-[12px] font-semibold">
                    Já anexados neste caso ({anexados.length}/{MAXIMO_DOCUMENTOS})
                  </p>
                  <ul className="flex flex-col gap-1">
                    {anexados.map((documento) => (
                      <li key={documento.id} className="flex items-center gap-2 text-[12px]">
                        <FileText className="text-tinta-suave size-3.5 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{documento.nome}</span>
                        <span className="text-tinta-suave text-[11px]">{documento.tipo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <SeletorArquivos
                fila={fila}
                aoAdicionar={adicionarArquivos}
                aoRemover={removerDaFila}
                vagas={vagas}
                maximo={MAXIMO_DOCUMENTOS}
              />

              {okDocs ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p role="status" className="text-destaque text-[12px] font-medium">
                    {okDocs}
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push(`/casos/${casoId}/analise`)}
                    className="pressionavel border-borda bg-campo flex h-9 items-center rounded-[8px] border px-3 text-[12px] font-semibold"
                  >
                    Ver análise
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                disabled={fila.length === 0}
                onClick={() => {
                  const primeiro = fila[0]?.arquivo;
                  if (!primeiro) return;
                  if (!ehAudio(primeiro)) {
                    void anexarDocumentos();
                    return;
                  }
                  setVeioDeAudio(true);
                  void (async () => {
                    const duracao = await duracaoDoAudio(primeiro).catch(() => 0);
                    await registrarRelato(
                      (aoEtapa) => processarEntrevista(casoId, primeiro, primeiro.name, aoEtapa, duracao),
                      duracao > 0 ? formatarDuracao(duracao) : "00:00",
                    );
                  })();
                }}
                className="pressionavel bg-acao text-acao-tinta flex h-10 w-fit items-center rounded-[8px] px-4 text-[13px] font-semibold disabled:opacity-40"
              >
                {fila[0] && ehAudio(fila[0].arquivo)
                  ? "Processar áudio"
                  : fila.length > 1
                    ? `Anexar ${fila.length} documentos`
                    : "Anexar documento"}
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor={idRelato} className="text-[14px] font-semibold">
                  Relato do cliente
                </label>
                <p className="text-tinta-suave text-[12px]">
                  Conte os fatos como o cliente narrou: datas, valores, documentos e o que ele espera.
                  Quanto mais contexto, melhor a análise.
                </p>
              </div>
              <textarea
                id={idRelato}
                value={relato}
                onChange={(evento) => setRelato(evento.target.value)}
                rows={10}
                placeholder="Ex.: O cliente assinou um contrato de prestação de serviços em janeiro. A empresa atrasou três pagamentos e não respondeu às cobranças por e-mail…"
                className="border-borda focus:border-destaque focus:ring-destaque/20 bg-campo min-h-[200px] w-full resize-y rounded-[8px] border px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:ring-2"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className={cn("text-[11px]", caracteres < MINIMO_RELATO ? "text-tinta-suave" : "text-destaque")}>
                  {caracteres < MINIMO_RELATO
                    ? `Escreva pelo menos ${MINIMO_RELATO} caracteres (${caracteres}/${MINIMO_RELATO}).`
                    : `${caracteres} caracteres`}
                </p>
                <button
                  type="button"
                  disabled={caracteres < MINIMO_RELATO}
                  onClick={() => void registrarRelato((aoEtapa) => processarRelatoEscrito(casoId, relato, aoEtapa))}
                  className="pressionavel bg-acao text-acao-tinta flex h-10 items-center rounded-[8px] px-4 text-[13px] font-semibold disabled:opacity-40"
                >
                  Gerar análise
                </button>
              </div>
            </>
          )}

          {erro && !escolherDestino ? (
            <p role="alert" className="bg-destructive/10 text-destructive rounded-[8px] px-3 py-2.5 text-[12px] font-medium">
              {erro}
            </p>
          ) : null}
        </section>
      </div>
      <ModalConfirmar
        className="max-w-[400px]"
        aberto={escolherDestino}
        titulo={perguntarAtualizacao ? "Atualizar a análise?" : "Gerar análise?"}
        descricao="Deseja atualizar os cards da análise com ele, ou só gravar no repositório do caso?"
        confirmar={
          gerandoAnalise
            ? "Atualizando…"
            : perguntarAtualizacao
              ? "Atualizar análise"
              : "Gerar análise"
        }
        dispensar="Só gravar no repositório"
        processando={gerandoAnalise}
        erro={erro}
        aoFechar={() => router.push(`/casos/${casoId}/repositorio/materiais`)}
        aoConfirmar={() => void atualizarAnalise()}
      />
    </>
  );
}
