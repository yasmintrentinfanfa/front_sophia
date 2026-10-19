"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const ESCOPO = "openid email profile";

interface BotaoGoogleProps {
  rotulo?: string;
}

/**
 * Fluxo real de OAuth2 do Google (token client), sem depender de backend: o
 * token de acesso é usado só para buscar nome/email do usuário no endpoint
 * público de userinfo do Google. Autenticação de verdade (sessão, etc.) ainda
 * depende do backend, que está sendo construído em paralelo.
 */
export function BotaoGoogle({ rotulo = "Continuar com Google" }: BotaoGoogleProps) {
  const router = useRouter();
  const [scriptPronto, setScriptPronto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function aoClicar() {
    setErro(null);

    if (!CLIENT_ID) {
      setErro(
        "Login com Google ainda não configurado: defina NEXT_PUBLIC_GOOGLE_CLIENT_ID no .env.",
      );
      return;
    }

    if (!scriptPronto || !window.google) {
      setErro("Carregando o Google, tente novamente em instantes.");
      return;
    }

    setCarregando(true);
    const cliente = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: ESCOPO,
      callback: async (resposta) => {
        if (resposta.error || !resposta.access_token) {
          setErro("Não foi possível concluir o login com Google.");
          setCarregando(false);
          return;
        }
        try {
          await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${resposta.access_token}` },
          });
          // Backend de autenticação ainda em construção: por ora, seguimos direto.
          router.push("/casos");
        } catch {
          setErro("Não foi possível confirmar os dados do Google.");
        } finally {
          setCarregando(false);
        }
      },
      error_callback: () => {
        setErro("Login com Google cancelado.");
        setCarregando(false);
      },
    });
    cliente.requestAccessToken();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptPronto(true)}
      />
      <button
        type="button"
        onClick={aoClicar}
        disabled={carregando}
        className="border-borda bg-campo flex h-11 w-full items-center justify-center gap-2.5 rounded-[8px] border text-[13px] font-semibold disabled:opacity-60"
      >
        <IconeGoogle />
        {carregando ? "Conectando…" : rotulo}
      </button>
      {erro ? <p className="text-destructive text-[11px]">{erro}</p> : null}
    </div>
  );
}

function IconeGoogle() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4">
      <path
        fill="#4285F4"
        d="M19.6 10.23c0-.68-.06-1.32-.17-1.94H10v3.68h5.38c-.23 1.25-.94 2.31-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.26Z"
      />
      <path
        fill="#34A853"
        d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.06v2.58A10 10 0 0 0 10 20Z"
      />
      <path
        fill="#FBBC05"
        d="M4.41 11.9a6 6 0 0 1 0-3.8V5.52H1.06a10 10 0 0 0 0 8.96l3.35-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 10 0 10 10 0 0 0 1.06 5.52L4.41 8.1C5.2 5.74 7.4 3.98 10 3.98Z"
      />
    </svg>
  );
}
