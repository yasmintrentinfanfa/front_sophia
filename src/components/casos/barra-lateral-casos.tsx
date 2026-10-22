"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hamburguer,
  IconeCasos,
  IconeConfiguracoes,
  IconeNovoCaso,
  IconeRepositorio,
  IconeSair,
} from "@/components/casos/icones-trilha";
import { BotaoTema } from "@/components/tema/botao-tema";
import { ModalConfiguracoes } from "@/components/casos/modal-configuracoes";
import { ModalConfirmar } from "@/components/casos/modal-confirmar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import type { Caso, IdPlano, Usuario } from "@/lib/api/types";
import { destinoDoCaso } from "@/lib/casos/destino";
import { IconeArea } from "@/components/casos/icone-area";
import { pastaDoCaso, rotuloCaso } from "@/lib/casos/rotulo";
import { normalizar } from "@/lib/texto";
import { cn } from "@/lib/utils";

interface BarraLateralCasosProps {
  casos: Caso[];
  carregando?: boolean;
}

function classeTrilha(ativo: boolean) {
  return cn(
    "pressionavel flex h-8 items-center justify-center rounded-[8px] px-1",
    ativo && "bg-destaque-suave border-destaque border-[1.5px]",
  );
}

export function BarraLateralCasos({ casos, carregando = false }: BarraLateralCasosProps) {
  const pathname = usePathname();
  const [busca, setBusca] = useState("");
  const [expandida, setExpandida] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [configuracoesAberta, setConfiguracoesAberta] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const botaoConta = useRef<HTMLButtonElement>(null);
  const [ancora, setAncora] = useState({ top: 0, left: 0 });
  const segmento = pathname.match(/^\/casos\/([^/]+)/)?.[1] ?? null;
  const rotaDePainel = segmento === "novo" || segmento === "arquivo";
  const idDaRota = segmento && !rotaDePainel ? segmento : null;

  const casosAtivos = useMemo(
    () => casos.filter((caso) => pastaDoCaso(caso) === "ativo"),
    [casos],
  );

  const casosFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return casosAtivos;
    return casosAtivos.filter((caso) => normalizar(`${caso.titulo} ${caso.cliente}`).includes(termo));
  }, [busca, casosAtivos]);

  const idEmDestaque = idDaRota;

  function fecharMenu() {
    setMenuAberto(false);
  }

  function alternarMenu() {
    if (menuAberto) {
      fecharMenu();
      return;
    }
    const caixa = botaoConta.current?.getBoundingClientRect();
    if (caixa) {
      const altura = 148;
      const topo = Math.min(caixa.top, window.innerHeight - altura - 8);
      setAncora({ top: Math.max(8, topo), left: caixa.right + 8 });
    }
    setMenuAberto(true);
  }

  function pedirSaida() {
    setConfiguracoesAberta(false);
    fecharMenu();
    setConfirmarSaida(true);
  }

  useEffect(() => {
    let ativo = true;
    api
      .obterUsuarioAtual()
      .then((atual) => {
        if (ativo) setUsuario(atual);
      })
      .catch(() => {
        if (ativo) setUsuario(null);
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!menuAberto) return;
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") fecharMenu();
    }
    function fora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (asideRef.current?.contains(alvo) || menuRef.current?.contains(alvo)) return;
      fecharMenu();
    }
    document.addEventListener("keydown", tecla);
    document.addEventListener("mousedown", fora);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("mousedown", fora);
    };
  }, [menuAberto]);

  const linhasMenu = (
    <>
      <div className="flex items-center justify-between rounded-[8px] px-2 py-1">
        <span className="text-[12px] font-medium">Tema</span>
        <BotaoTema />
      </div>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          fecharMenu();
          setConfiguracoesAberta(true);
        }}
        className="hover:bg-destaque-suave flex h-8 items-center gap-2 rounded-[8px] px-2 text-left text-[12px] font-medium"
      >
        <IconeConfiguracoes />
        Configurações
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={pedirSaida}
        className="hover:bg-destaque-suave flex h-8 items-center gap-2 rounded-[8px] px-2 text-left text-[12px] font-medium"
      >
        <IconeSair />
        Sair
      </button>
    </>
  );

  return (
    <aside
      ref={asideRef}
      className={cn(
        "bg-barra relative flex h-full shrink-0 items-stretch overflow-hidden px-2 py-2.5 transition-[width] duration-200 ease-out",
        expandida ? "w-[248px]" : "w-[56px]",
      )}
    >
      <TrilhaIcones
        expandida={expandida}
        aoAlternar={() => setExpandida((atual) => !atual)}
        casoId={idDaRota ?? casosAtivos[0]?.id}
        mostrarRepositorio={!carregando && casosAtivos.length > 0}
        usuario={usuario}
        menuAberto={menuAberto}
        aoAlternarMenu={alternarMenu}
        botaoRef={botaoConta}
      />

      {expandida ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            id="painel-lista-casos"
            className="bg-painel relative z-10 flex min-h-0 flex-1 flex-col gap-2 rounded-[8px] px-2.5 py-3"
          >
            <p className="text-[13px] font-bold">SOPHIA</p>
            <h2 className="text-[11px] font-semibold">Casos em análise</h2>

          <div className="border-borda focus-within:border-destaque bg-campo flex h-7 w-full items-center gap-1.5 rounded-[7px] border px-2">
            <span aria-hidden className="text-tinta-suave text-[11px]">
              ⌕
            </span>
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar"
              aria-label="Buscar caso ou cliente"
              className="text-tinta-suave placeholder:text-tinta-suave min-w-0 flex-1 bg-transparent text-[11px] outline-none"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {carregando ? (
              <ListaEsqueleto />
            ) : casosFiltrados.length === 0 ? (
              <p className="text-tinta-suave py-4 text-[11px]">Nenhum caso encontrado.</p>
            ) : (
              <ul className="flex w-full flex-col gap-[6px]">
                {casosFiltrados.map((caso) => (
                  <li key={caso.id}>
                    <Link
                      href={destinoDoCaso(caso, pathname)}
                      aria-current={caso.id === idEmDestaque ? "page" : undefined}
                      className={cn(
                        "pressionavel flex min-h-8 w-full items-center rounded-[7px] px-2 py-1.5 text-left text-[10px] leading-tight font-medium",
                        caso.id === idEmDestaque
                          ? "border-destaque bg-ativo text-ativo-tinta border-[1.5px]"
                          : "bg-chip text-meta border-borda hover:border-destaque/60 border",
                      )}
                    >
                      <span className="flex min-w-0 items-start gap-1.5">
                        <IconeArea area={caso.area} className="mt-0.5 size-3" />
                        <span className="line-clamp-2">{rotuloCaso(caso)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </div>
          <div className="bg-trilha -mt-2 flex shrink-0 flex-col rounded-br-[8px] pt-5">
            <div className="flex h-10 items-center pr-3 pb-2 pl-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] leading-tight font-semibold">
                {usuario?.nome.trim() || "Conta"}
              </p>
              <p className="text-tinta-suave truncate text-[11px] leading-tight">
                {usuario?.assinatura?.nomePlano || "Sem plano"}
              </p>
            </div>
            </div>
          </div>
        </div>
      ) : null}

      {menuAberto && expandida ? (
        <div
          ref={menuRef}
          role="menu"
          className="border-borda bg-campo absolute right-2 bottom-16 left-2 z-30 flex flex-col gap-1 rounded-[10px] border p-1.5 shadow-lg"
        >
          {linhasMenu}
        </div>
      ) : null}
      {menuAberto && !expandida
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="border-borda bg-campo fixed z-50 flex w-[196px] flex-col gap-1 rounded-[10px] border p-1.5 shadow-lg"
              style={{ top: ancora.top, left: ancora.left }}
            >
              {linhasMenu}
            </div>,
            document.body,
          )
        : null}

      <ModalConfiguracoes
        aberto={configuracoesAberta}
        aoFechar={() => setConfiguracoesAberta(false)}
        aoPedirSaida={pedirSaida}
      />
      <ModalConfirmar
        aberto={confirmarSaida}
        titulo="Sair da conta"
        descricao="Deseja mesmo sair? Você voltará para a tela de login."
        confirmar="Sair"
        aoFechar={() => setConfirmarSaida(false)}
        aoConfirmar={() => {
          window.location.assign("/sair");
        }}
      />
    </aside>
  );
}

function TrilhaIcones({
  expandida,
  aoAlternar,
  casoId,
  mostrarRepositorio,
  usuario,
  menuAberto,
  aoAlternarMenu,
  botaoRef,
}: {
  expandida: boolean;
  aoAlternar: () => void;
  casoId?: string;
  mostrarRepositorio: boolean;
  usuario: Usuario | null;
  menuAberto: boolean;
  aoAlternarMenu: () => void;
  botaoRef: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const emRepositorio = pathname.includes("/repositorio");
  const emCasos =
    !emRepositorio &&
    (pathname === "/casos" ||
      pathname.includes("/gravacao") ||
      pathname.includes("/sessao") ||
      pathname.includes("/analise"));

  return (
    <nav
      className={cn(
        "bg-trilha relative z-10 flex w-10 min-h-0 flex-col items-center gap-1.5 px-1 pt-1 pb-2",
        expandida ? "rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px]" : "rounded-[8px]",
      )}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-expanded={expandida}
              aria-controls="painel-lista-casos"
              onClick={aoAlternar}
              className="hover:bg-tinta/5 flex h-6 w-full items-center justify-center rounded-[6px]"
            >
              <Hamburguer />
              <span className="sr-only">
                {expandida ? "Recolher lista de casos" : "Expandir lista de casos"}
              </span>
            </button>
          }
        />
        <TooltipContent side="right">
          {expandida ? "Recolher lista" : "Expandir lista"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/casos/novo"
              aria-current={pathname === "/casos/novo" ? "page" : undefined}
              className={classeTrilha(pathname === "/casos/novo")}
            >
              <IconeNovoCaso />
              <span className="sr-only">Novo caso</span>
            </Link>
          }
        />
        <TooltipContent side="right">Novo caso</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link href="/casos" aria-current={emCasos ? "page" : undefined} className={classeTrilha(emCasos)}>
              <IconeCasos />
              <span className="sr-only">Casos em análise</span>
            </Link>
          }
        />
        <TooltipContent side="right">Casos em análise</TooltipContent>
      </Tooltip>

      {mostrarRepositorio ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href={casoId ? `/casos/${casoId}/repositorio` : "/casos"}
                aria-current={emRepositorio ? "page" : undefined}
                className={classeTrilha(emRepositorio)}
              >
                <IconeRepositorio />
                <span className="sr-only">Repositório</span>
              </Link>
            }
          />
          <TooltipContent side="right">Repositório</TooltipContent>
        </Tooltip>
      ) : null}

      <span className="flex-1" />

      <ContaUsuario
        usuario={usuario}
        aberto={menuAberto}
        aoAlternar={aoAlternarMenu}
        botaoRef={botaoRef}
      />
    </nav>
  );
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

/** Fora da paleta de destaque: ouro, carmesim e café. */
const CORES_PLANO: Record<IdPlano, string> = {
  basico: "bg-[#c4a35a] text-[#241c10]",
  intermediario: "bg-[#9c3044] text-[#fff6f6]",
  pro: "bg-[#6e4b2a] text-[#fff6ec]",
};

function classeDoPlano(planoId?: IdPlano) {
  if (!planoId) return CORES_PLANO.basico;
  return CORES_PLANO[planoId];
}

/** Círculo da conta, que abre tema, configurações e sair. */
function ContaUsuario({
  usuario,
  aberto,
  aoAlternar,
  botaoRef,
}: {
  usuario: Usuario | null;
  aberto: boolean;
  aoAlternar: () => void;
  botaoRef: RefObject<HTMLButtonElement | null>;
}) {
  const nome = usuario?.nome.trim() || "Conta";

  return (
    <button
      ref={botaoRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={aberto}
      aria-label={`Conta de ${nome}`}
      onClick={aoAlternar}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        classeDoPlano(usuario?.assinatura?.planoId),
      )}
    >
      {usuario ? iniciais(nome) : "·"}
    </button>
  );
}

function ListaEsqueleto() {
  return (
    <ul className="flex flex-col gap-[6px]" aria-hidden>
      {[0, 1, 2].map((indice) => (
        <li key={indice} className="bg-superficie h-8 animate-pulse rounded-[7px]" />
      ))}
    </ul>
  );
}
