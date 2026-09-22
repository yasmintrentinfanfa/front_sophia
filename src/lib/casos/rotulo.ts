import { normalizar } from "@/lib/texto";

export function rotuloCaso(caso: { titulo: string; cliente: string }) {
  const titulo = caso.titulo.trim();
  const cliente = caso.cliente.trim();
  if (!cliente) return titulo;
  if (normalizar(titulo).includes(normalizar(cliente))) return titulo;
  return `${titulo} — ${cliente}`;
}
