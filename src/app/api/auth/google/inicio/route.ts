import { idDoClienteGoogle, novoNonceGoogle } from "@/lib/servidor/google";

const SEM_CACHE = { headers: { "Cache-Control": "no-store" } };

/**
 * Configuração do botão: o ID do cliente (GOOGLE_CLIENT_ID fica só no servidor). Não grava
 * nada, então pode ser pedida quantas vezes for. Sem a variável, `{ ativo: false }`.
 */
export function GET() {
  const clientId = idDoClienteGoogle();
  return Response.json(clientId ? { ativo: true, clientId } : { ativo: false }, SEM_CACHE);
}

/** Nova tentativa de login: nonce novo no cookie httpOnly e o hash dele para o botão. */
export async function POST() {
  const clientId = idDoClienteGoogle();
  if (!clientId) return Response.json({ ativo: false }, SEM_CACHE);
  const nonce = await novoNonceGoogle();
  return Response.json({ ativo: true, clientId, nonce }, SEM_CACHE);
}
