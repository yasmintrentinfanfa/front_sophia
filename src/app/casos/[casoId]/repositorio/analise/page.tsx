import { redirect } from "next/navigation";

/** Endereço antigo: a análise do caso fica em "Casos em análise", fora do repositório. */
export default async function PaginaAnaliseRepositorio({ params }: { params: Promise<{ casoId: string }> }) {
  const { casoId } = await params;
  redirect(`/casos/${encodeURIComponent(casoId)}/analise`);
}
