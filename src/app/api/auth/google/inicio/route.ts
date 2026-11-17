import { novoNonceGoogle } from "@/lib/servidor/google";

/** Nova tentativa de login com Google: nonce no cookie httpOnly e o hash dele para o botão. */
export async function POST() {
  const nonce = await novoNonceGoogle();
  return Response.json({ nonce }, { headers: { "Cache-Control": "no-store" } });
}
