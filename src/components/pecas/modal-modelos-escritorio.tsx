"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { FileText, LoaderCircle, Stamp, Trash2, Upload } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import {
  pecasApi,
  TODAS_AS_PECAS,
  type CatalogoPecas,
  type ModeloEscritorio,
} from "@/lib/api/pecas";
import { formatarDataHora } from "@/lib/formato";
import { cn } from "@/lib/utils";

const TIPOS = [".docx", ".pdf", ".txt"];
const TAMANHO_MAX = 5 * 1024 * 1024;

/** Nome do escopo: "Todas as peças" ou o nome do modelo do catálogo. */
export function rotuloEscopo(catalogo: CatalogoPecas, aplicaA: string) {
  if (aplicaA === TODAS_AS_PECAS) return "Todas as peças";
  return catalogo.modelos.find((modelo) => modelo.id === aplicaA)?.nome ?? aplicaA;
}

function problemaDoArquivo(arquivo: File) {
  const nome = arquivo.name.toLowerCase();
  if (!TIPOS.some((tipo) => nome.endsWith(tipo))) return "Envie o modelo em Word (.docx), PDF ou TXT.";
  if (arquivo.size > TAMANHO_MAX) return "O arquivo passa de 5 MB.";
  return "";
}

/**
 * Peças-modelo do escritório: o advogado envia uma vez e a IA segue estrutura, estilo e dados
 * fixos dele nas próximas minutas. O Modal só monta o conteúdo aberto, então o formulário
 * recomeça vazio a cada abertura.
 */
export function ModalModelosEscritorio({
  aberto,
  catalogo,
  modelos,
  aoFechar,
  aoMudar,
}: {
  aberto: boolean;
  catalogo: CatalogoPecas;
  modelos: ModeloEscritorio[];
  aoFechar: () => void;
  aoMudar: (modelos: ModeloEscritorio[]) => void;
}) {
  const [enviando, setEnviando] = useState(false);

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      bloqueado={enviando}
      titulo="Modelos do escritório"
      descricao="Envie as peças que você já usa. Nas próximas minutas, a IA segue a estrutura, o estilo e os seus dados fixos (nome, OAB, endereço). Os fatos continuam vindo do caso."
      className="max-h-[90dvh] max-w-[600px] overflow-y-auto p-5"
    >
      <Conteudo
        catalogo={catalogo}
        modelos={modelos}
        enviando={enviando}
        setEnviando={setEnviando}
        aoFechar={aoFechar}
        aoMudar={aoMudar}
      />
    </Modal>
  );
}

function Conteudo({
  catalogo,
  modelos,
  enviando,
  setEnviando,
  aoFechar,
  aoMudar,
}: {
  catalogo: CatalogoPecas;
  modelos: ModeloEscritorio[];
  enviando: boolean;
  setEnviando: (valor: boolean) => void;
  aoFechar: () => void;
  aoMudar: (modelos: ModeloEscritorio[]) => void;
}) {
  const idArquivo = useId();
  const idNome = useId();
  const idEscopo = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [aplicaA, setAplicaA] = useState(TODAS_AS_PECAS);
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const substituido = modelos.find((modelo) => modelo.aplicaA === aplicaA);
  const grupos = Object.entries(catalogo.grupos)
    .map(([id, titulo]) => ({ id, titulo, modelos: catalogo.modelos.filter((modelo) => modelo.grupo === id) }))
    .filter((grupo) => grupo.modelos.length > 0);

  function escolher(novo: File | null | undefined) {
    setErro("");
    setAviso("");
    if (!novo) return;
    const problema = problemaDoArquivo(novo);
    if (problema) {
      setArquivo(null);
      setErro(problema);
      return;
    }
    setArquivo(novo);
    if (!nome.trim()) setNome(novo.name.replace(/\.[^.]+$/, ""));
  }

  function aoSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastando(false);
    escolher(evento.dataTransfer.files?.[0]);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!arquivo || enviando) return;
    setEnviando(true);
    setErro("");
    setAviso("");
    try {
      const salvo = await pecasApi.enviarModeloEscritorio(arquivo, nome, aplicaA);
      aoMudar([salvo, ...modelos.filter((modelo) => modelo.id !== salvo.id && modelo.aplicaA !== salvo.aplicaA)]);
      setAviso(`Modelo "${salvo.nome}" salvo. Ele vale para: ${rotuloEscopo(catalogo, salvo.aplicaA)}.`);
      setArquivo(null);
      setNome("");
      if (entrada.current) entrada.current.value = "";
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível enviar o modelo.");
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(id: string) {
    setExcluindo(id);
    setErro("");
    setAviso("");
    try {
      await pecasApi.excluirModeloEscritorio(id);
      aoMudar(modelos.filter((modelo) => modelo.id !== id));
      setConfirmandoExclusao(null);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível excluir o modelo.");
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-5">
      <section className="flex flex-col gap-2" aria-label="Seus modelos">
        <h3 className="text-[13px] font-semibold">Seus modelos</h3>
        {modelos.length ? (
          <ul className="flex flex-col gap-2">
            {modelos.map((modelo) => (
              <li
                key={modelo.id}
                className="border-borda flex items-center gap-3 rounded-[10px] border px-3 py-2.5"
              >
                <span className="bg-destaque-suave text-destaque flex size-8 shrink-0 items-center justify-center rounded-[8px]">
                  <FileText className="size-4" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold">{modelo.nome}</span>
                    {modelo.comTimbre ? (
                      <span className="bg-destaque-suave text-destaque flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        <Stamp className="size-3" aria-hidden />
                        Com timbre
                      </span>
                    ) : null}
                  </span>
                  <span className="text-tinta-suave truncate text-[11px]">
                    Vale para: <strong className="text-tinta font-medium">{rotuloEscopo(catalogo, modelo.aplicaA)}</strong>{" "}
                    · {modelo.arquivoNome} · {formatarDataHora(modelo.criadoEm)}
                  </span>
                </span>
                {confirmandoExclusao === modelo.id ? (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void excluir(modelo.id)}
                      disabled={excluindo !== null}
                      className="pressionavel bg-destructive flex h-8 items-center rounded-[8px] px-2.5 text-[12px] font-semibold text-white disabled:opacity-60"
                    >
                      {excluindo === modelo.id ? "Excluindo…" : "Excluir"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoExclusao(null)}
                      disabled={excluindo !== null}
                      className="pressionavel border-borda flex h-8 items-center rounded-[8px] border px-2.5 text-[12px] font-semibold"
                    >
                      Manter
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(modelo.id)}
                    aria-label={`Excluir o modelo ${modelo.nome}`}
                    className="pressionavel text-tinta-suave hover:text-destructive flex size-8 shrink-0 items-center justify-center rounded-[8px]"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-borda text-tinta-suave rounded-[10px] border border-dashed px-3 py-4 text-center text-[12px]">
            Nenhum modelo enviado ainda. Sem modelo, as minutas seguem o padrão da Sophia.
          </p>
        )}
      </section>

      <form onSubmit={enviar} className="border-borda flex flex-col gap-3 rounded-[12px] border p-4">
        <h3 className="text-[13px] font-semibold">Enviar modelo</h3>

        <label
          htmlFor={idArquivo}
          onDragOver={(evento) => {
            evento.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={aoSoltar}
          className={cn(
            "bg-campo flex cursor-pointer flex-col items-center gap-1.5 rounded-[10px] border border-dashed px-4 py-5 text-center transition-colors",
            arrastando ? "border-destaque bg-destaque-suave" : "border-borda hover:border-destaque/60",
          )}
        >
          <Upload className="text-destaque size-5" aria-hidden />
          <span className="text-[13px] font-semibold">
            {arquivo ? arquivo.name : "Clique ou arraste a peça-modelo aqui"}
          </span>
          <span className="text-tinta-suave text-[11px]">Word (.docx), PDF ou TXT, até 5 MB</span>
          <input
            ref={entrada}
            id={idArquivo}
            type="file"
            accept={TIPOS.join(",")}
            className="sr-only"
            disabled={enviando}
            onChange={(evento: ChangeEvent<HTMLInputElement>) => escolher(evento.target.files?.[0])}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={idNome} className="text-[12px] font-semibold">
              Nome do modelo
            </label>
            <input
              id={idNome}
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              maxLength={120}
              disabled={enviando}
              placeholder="Ex.: Inicial padrão do escritório"
              className="border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={idEscopo} className="text-[12px] font-semibold">
              Usar em
            </label>
            <select
              id={idEscopo}
              value={aplicaA}
              onChange={(evento) => setAplicaA(evento.target.value)}
              disabled={enviando}
              className="border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 rounded-[8px] border px-2 text-[13px] outline-none focus:ring-2"
            >
              <option value={TODAS_AS_PECAS}>Todas as peças</option>
              {grupos.map((grupo) => (
                <optgroup key={grupo.id} label={grupo.titulo}>
                  {grupo.modelos.map((modelo) => (
                    <option key={modelo.id} value={modelo.id}>
                      {modelo.nome}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <ul className="text-tinta-suave flex list-disc flex-col gap-1 pl-4 text-[11px] leading-relaxed">
          <li>
            O modelo de uma peça específica tem prioridade; nas demais, vale o de &quot;Todas as peças&quot;.
          </li>
          <li>Em Word (.docx), o arquivo baixado das minutas sai com o seu timbre (cabeçalho e rodapé).</li>
          {substituido ? (
            <li className="text-tinta font-medium">
              Vai substituir o modelo atual para {rotuloEscopo(catalogo, aplicaA)}: {substituido.nome}.
            </li>
          ) : null}
        </ul>

        {erro ? (
          <p role="alert" className="bg-destructive/10 text-destructive rounded-[8px] px-3 py-2.5 text-[12px] font-medium">
            {erro}
          </p>
        ) : null}
        {aviso ? (
          <p role="status" className="bg-destaque-suave text-destaque rounded-[8px] px-3 py-2.5 text-[12px] font-medium">
            {aviso}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={aoFechar}
            disabled={enviando}
            className="pressionavel border-borda flex h-10 items-center rounded-[8px] border px-4 text-[13px] font-semibold disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            type="submit"
            disabled={!arquivo || enviando}
            className="pressionavel bg-acao text-acao-tinta flex h-10 items-center gap-2 rounded-[8px] px-4 text-[13px] font-semibold disabled:opacity-50"
          >
            {enviando ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
            {enviando ? "Lendo o modelo…" : "Enviar modelo"}
          </button>
        </div>
      </form>
    </div>
  );
}
