import { urlDoBack } from "@/lib/servidor/back";

export const maxDuration = 300;

export async function POST(pedido: Request) {
  try {
    const form = await pedido.formData();
    const res = await fetch(urlDoBack("/transcribe"), { method: "POST", body: form });
    const dados = await res.json().catch(() => ({}));
    return Response.json(dados, { status: res.status });
  } catch {
    return Response.json(
      { erro: "Não foi possível transcrever. Confira se a API está na porta 8000." },
      { status: 503 },
    );
  }
}
