import { redirect } from "next/navigation";

/** Endereço antigo: o chat do caso fica junto da análise, em "Casos em análise". */
export default async function PaginaChatRepositorio({ params }: { params: Promise<{ casoId: string }> }) {
  const { casoId } = await params;
  redirect(`/casos/${encodeURIComponent(casoId)}/chat`);
}
