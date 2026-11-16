import { corpoJson, repassarJson } from "@/lib/servidor/repassar";
import { idDoUsuarioNaSessao } from "@/lib/servidor/sessao-usuario";

export const maxDuration = 300;

/** Começa a acompanhar uma OAB ou um processo. A primeira consulta ao DJEN já sai daqui. */
export async function POST(pedido: Request) {
  const corpo = (await pedido.json().catch(() => ({}))) as {
    tipo?: string;
    oabNumero?: string;
    oabUf?: string;
    numeroProcesso?: string;
    casoId?: string;
  };
  const userId = await idDoUsuarioNaSessao();
  if (!userId) return Response.json({ erro: "Entre na sua conta para acompanhar prazos." }, { status: 401 });
  const texto = (valor: unknown, limite: number) => (typeof valor === "string" ? valor.trim().slice(0, limite) : "");
  const casoId = texto(corpo.casoId, 120);
  return repassarJson(
    "/prazos/monitoramentos",
    corpoJson({
      user_id: userId,
      tipo: texto(corpo.tipo, 20),
      oab_numero: texto(corpo.oabNumero, 20),
      oab_uf: texto(corpo.oabUf, 2),
      numero_processo: texto(corpo.numeroProcesso, 30),
      ...(casoId ? { caso_id: casoId } : {}),
    }),
    "Não foi possível salvar o acompanhamento.",
  );
}
