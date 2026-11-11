import { redirect } from "next/navigation";

/** Endereço antigo: as peças do caso ficam junto da análise, em "Casos em análise". */
export default async function PaginaPecasRepositorio({ params }: { params: Promise<{ casoId: string }> }) {
  const { casoId } = await params;
  redirect(`/casos/${encodeURIComponent(casoId)}/pecas`);
}
