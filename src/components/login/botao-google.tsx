"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { usuarioDaApi, type UsuarioApi } from "@/lib/api/http/mapeadores";
import type { Usuario } from "@/lib/api/types";

/** Só o que usamos da biblioteca do Google (Google Identity Services). */
interface GoogleIdentity {
  initialize(opcoes: {
    client_id: string;
    callback: (resposta: { credential?: string }) => void;
    nonce: string;
    context: "signin" | "signup";
    ux_mode: "popup";
    auto_select: boolean;
    itp_support: boolean;
  }): void;
  renderButton(
    elemento: HTMLElement,
    opcoes: {
      type: "standard";
      theme: "outline" | "filled_black";
      size: "large";
      text: "continue_with" | "signup_with";
      shape: "rectangular";
      logo_alignment: "center";
      width: number;
      locale: string;
    },
  ): void;
  cancel(): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdentity } };
  }
}

export interface PedidoDeVinculo {
  email: string;
  credencial: string;
}

interface Acoes {
  aoEntrar: (usuario: Usuario) => void;
  aoPedirVinculo: (pedido: PedidoDeVinculo) => void;
  aoFalhar: (mensagem: string) => void;
}

interface RespostaDoLogin {
  erro?: string;
  codigo?: string;
  email?: string;
  usuario?: UsuarioApi;
}

/**
 * Botão oficial "Continuar com o Google", com a linha "ou" acima. O token do Google não é
 * lido aqui: vai direto para `/api/auth/google`, e o backend é quem confere a assinatura.
 */
export function BotaoGoogle({ contexto, ...acoes }: { contexto: "signin" | "signup" } & Acoes) {
  const caixa = useRef<HTMLDivElement>(null);
  const botaoClaro = useRef<HTMLDivElement>(null);
  const botaoEscuro = useRef<HTMLDivElement>(null);
  const ultimas = useRef(acoes);
  const [pronto, setPronto] = useState(false);
  const [indisponivel, setIndisponivel] = useState(false);
  const [entrando, setEntrando] = useState(false);
  /** ID do cliente OAuth vindo do servidor: `null` enquanto carrega; `false` = desligado. */
  const [idDoCliente, setIdDoCliente] = useState<string | false | null>(null);
  /** Muda para pedir uma tentativa nova (nonce vencido ou token recusado). */
  const [rodada, setRodada] = useState(0);

  useEffect(() => {
    ultimas.current = acoes;
  });

  // Só a configuração (GET, sem cookie): pode rodar mais de uma vez sem efeito colateral.
  useEffect(() => {
    let ativo = true;
    fetch("/api/auth/google/inicio")
      .then(async (res) => {
        const dados = (await res.json()) as { ativo?: boolean; clientId?: string };
        if (!ativo) return;
        if (res.ok && dados.ativo === false) setIdDoCliente(false);
        else if (res.ok && dados.clientId) setIdDoCliente(dados.clientId);
        else setIndisponivel(true);
      })
      .catch(() => {
        if (ativo) setIndisponivel(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const google = window.google?.accounts?.id;
    if (!pronto || !google || !idDoCliente) return;
    const clientId = idDoCliente;
    let ativo = true;

    /**
     * Desenha as duas versões do botão (clara e escura) de uma vez; o CSS mostra a do tema.
     * Trocar o tema não redesenha nada: sem piscar e sem botão duplicado (o botão
     * personalizado do Google, "Continuar como …", termina de carregar depois).
     * Cada desenho vai para um elemento novo, então um desenho atrasado cai num nó solto.
     */
    function desenhar() {
      const largura = Math.min(400, Math.max(200, caixa.current?.offsetWidth ?? 360));
      const versoes = [
        [botaoClaro.current, "outline"],
        [botaoEscuro.current, "filled_black"],
      ] as const;
      for (const [elemento, theme] of versoes) {
        if (!elemento || !google) continue;
        const alvo = document.createElement("div");
        elemento.replaceChildren(alvo);
        google.renderButton(alvo, {
          type: "standard",
          theme,
          size: "large",
          text: contexto === "signup" ? "signup_with" : "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: largura,
          locale: "pt-BR",
        });
      }
    }

    async function aoVoltarDoGoogle({ credential }: { credential?: string }) {
      if (!credential) {
        ultimas.current.aoFalhar("O Google não confirmou o login. Tente de novo.");
        return;
      }
      setEntrando(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credencial: credential }),
        });
        const dados = (await res.json().catch(() => ({}))) as RespostaDoLogin;
        if (res.ok && dados.usuario) {
          ultimas.current.aoEntrar(usuarioDaApi(dados.usuario));
          return;
        }
        if (res.status === 409 && dados.codigo === "vincular_conta" && dados.email) {
          ultimas.current.aoPedirVinculo({ email: dados.email, credencial: credential });
          return;
        }
        ultimas.current.aoFalhar(dados.erro ?? "Não foi possível entrar com o Google.");
        // Nonce vencido ou token recusado: a próxima tentativa começa do zero.
        if (res.status === 401 && ativo) setRodada((r) => r + 1);
      } catch {
        ultimas.current.aoFalhar("Não foi possível conectar ao servidor. Verifique sua internet.");
      } finally {
        if (ativo) setEntrando(false);
      }
    }

    /**
     * O nonce (POST, grava o cookie) é pedido uma vez só, depois de o script do Google
     * carregar: dois pedidos ao mesmo tempo poderiam deixar no cookie um nonce diferente do
     * que o botão recebeu, e o login falharia.
     */
    async function preparar() {
      try {
        const res = await fetch("/api/auth/google/inicio", { method: "POST" });
        const { nonce } = (await res.json()) as { nonce?: string };
        if (!res.ok || !nonce) throw new Error("sem nonce");
        if (!ativo || !google) return;
        google.initialize({
          client_id: clientId,
          callback: (resposta) => void aoVoltarDoGoogle(resposta),
          nonce,
          context: contexto,
          ux_mode: "popup",
          auto_select: false,
          itp_support: true,
        });
        desenhar();
      } catch {
        if (ativo) setIndisponivel(true);
      }
    }

    void preparar();
    return () => {
      ativo = false;
      google.cancel();
    };
  }, [pronto, idDoCliente, contexto, rodada]);

  // Ainda sem resposta do servidor, ou login com Google desligado: nem a linha "ou" aparece.
  if (!idDoCliente && !indisponivel) return null;

  return (
    <div className="flex flex-col gap-4">
      {idDoCliente ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={() => setPronto(true)}
          onError={() => setIndisponivel(true)}
        />
      ) : null}
      <div className="text-tinta-suave flex items-center gap-3 text-[12px]">
        <span aria-hidden className="bg-borda h-px flex-1" />
        ou
        <span aria-hidden className="bg-borda h-px flex-1" />
      </div>
      {indisponivel ? (
        <p className="text-tinta-suave text-center text-[12px]">
          O login com Google não carregou. Confira a conexão ou se algum bloqueador está ativo.
        </p>
      ) : (
        // color-scheme claro: no tema escuro, o navegador pintaria um fundo branco atrás do
        // iframe do Google (o documento dele é claro). O próprio botão já vem escuro.
        <div
          ref={caixa}
          aria-busy={entrando}
          className={`grid min-h-[44px] w-full [color-scheme:light] transition-opacity ${entrando ? "pointer-events-none opacity-60" : ""}`}
        >
          {/* Empilhados e escondidos com `visibility` (não `display: none`): o botão escondido
              mantém o tamanho, e o script do Google não falha ao medi-lo se o tema mudar
              enquanto ele ainda carrega. Invisível também não recebe clique nem foco. */}
          <div ref={botaoClaro} className="col-start-1 row-start-1 flex justify-center dark:invisible" />
          <div ref={botaoEscuro} className="invisible col-start-1 row-start-1 flex justify-center dark:visible" />
        </div>
      )}
      {entrando ? (
        <p role="status" className="text-tinta-suave -mt-2 text-center text-[12px]">
          Entrando com o Google…
        </p>
      ) : null}
    </div>
  );
}
