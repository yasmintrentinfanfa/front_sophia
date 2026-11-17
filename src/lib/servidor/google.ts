import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { MENSAGEM_API_INDISPONIVEL, urlDoBack } from "@/lib/servidor/back";
import { gravarUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

/**
 * Login com Google, lado do servidor do Next.
 *
 * Cada tentativa tem um nonce. O valor bruto fica só neste cookie httpOnly (o JavaScript da
 * página nunca o vê); o botão do Google recebe o hash, que volta dentro do ID token assinado.
 * O backend confere o token e se o hash do nonce do cookie é o do token. Assim:
 * - um token copiado (de log, de outra aba, de outro aparelho) não serve sem este cookie;
 * - um site de fora não consegue logar ninguém numa conta dele (o cookie é SameSite=Lax e
 *   não vai em POST vindo de outro site).
 */
export const COOKIE_NONCE_GOOGLE = "sophia_google_nonce";
const CAMINHO_DO_COOKIE = "/api/auth/google";
const VALIDADE_DO_NONCE = 30 * 60;
/** Um ID token do Google tem ~1 KB; acima disso é lixo e nem vai ao backend. */
const TAMANHO_MAXIMO = 4096;

export function hashDoNonce(nonce: string) {
  return createHash("sha256").update(nonce).digest("base64url");
}

function opcoesDoCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: CAMINHO_DO_COOKIE,
    maxAge,
  };
}

/** Começa uma tentativa: grava o nonce novo e devolve o hash para o botão do Google. */
export async function novoNonceGoogle() {
  const nonce = randomBytes(32).toString("base64url");
  const jar = await cookies();
  jar.set(COOKIE_NONCE_GOOGLE, nonce, opcoesDoCookie(VALIDADE_DO_NONCE));
  return hashDoNonce(nonce);
}

type RotaDoBack = "/entrar/google" | "/entrar/google/vincular";

/**
 * Repassa o ID token (e, no vínculo, a senha) ao backend com o nonce do cookie. Com a conta
 * conferida, grava a sessão e apaga o nonce: cada um vale para um login só. Na resposta
 * `vincular_conta` o nonce fica, porque o mesmo token volta junto com a senha.
 */
export async function entrarComGoogle(pedido: Request, rota: RotaDoBack) {
  const corpo = (await pedido.json().catch(() => ({}))) as { credencial?: unknown; senha?: unknown };
  const credencial = typeof corpo.credencial === "string" ? corpo.credencial.trim() : "";
  if (!credencial || credencial.length > TAMANHO_MAXIMO) {
    return Response.json({ erro: "Login com Google inválido. Tente de novo." }, { status: 400 });
  }

  const jar = await cookies();
  const nonce = jar.get(COOKIE_NONCE_GOOGLE)?.value ?? "";
  if (!nonce) {
    return Response.json(
      { erro: "O login com Google expirou. Clique no botão de novo.", codigo: "nonce" },
      { status: 401 },
    );
  }

  const extra = rota === "/entrar/google/vincular" ? { senha: typeof corpo.senha === "string" ? corpo.senha : "" } : {};
  try {
    const res = await fetch(urlDoBack(rota), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credencial, nonce, ...extra }),
    });
    const dados = (await res.json().catch(() => ({}))) as { usuario?: { _id?: string } };
    if (res.ok && dados.usuario?._id) {
      await gravarUsuarioNaSessao(dados.usuario._id);
      jar.set(COOKIE_NONCE_GOOGLE, "", opcoesDoCookie(0));
    }
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json({ erro: MENSAGEM_API_INDISPONIVEL }, { status: 503 });
  }
}
