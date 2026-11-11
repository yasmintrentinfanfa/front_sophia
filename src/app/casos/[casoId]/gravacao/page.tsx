import { redirect } from "next/navigation";

/** Endereço antigo: gravar, enviar arquivo e escrever o relato agora ficam no repositório do caso. */
export default async function PaginaGravacao({ params }: { params: Promise<{ casoId: string }> }) {
  const { casoId } = await params;
  redirect(`/casos/${encodeURIComponent(casoId)}/repositorio`);
}
