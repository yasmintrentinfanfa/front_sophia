const COOKIE_USUARIO = "sophia_user_id";

/** API FastAPI no Vercel (conta do colega). Sobrescreva com `SOPHIA_BACK_URL`. */
export const URL_API_PRODUCAO = "https://sophia-backend-umber.vercel.app";

export const MENSAGEM_API_INDISPONIVEL =
  "Não foi possível falar com a API. Confira se o backend está no ar.";

export function urlDoBack(caminho = "") {
  const padrao =
    process.env.NODE_ENV === "production" ? URL_API_PRODUCAO : "http://localhost:8000";
  const base = (
    process.env.SOPHIA_BACK_URL ??
    process.env.NEXT_PUBLIC_SOPHIA_TRANSCRICAO ??
    padrao
  ).replace(/\/$/, "");
  return `${base}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}

export function opcoesCookieUsuario() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export { COOKIE_USUARIO };
