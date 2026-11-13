// MVP sem plano: a escolha do plano saiu do cadastro, e quem abrir este endereço vai para os casos
// (quem redireciona primeiro é o layout.tsx desta pasta).
// Para religar: apague daqui até a marca "Página original" (inclusive), descomente o resto do
// arquivo, religue o layout.tsx e descomente a linha da assinatura em `redirecionamentoDosCasos`
// (src/lib/conta.ts).
import { redirect } from "next/navigation";

export default function PaginaPlanos() {
  redirect("/casos");
}

// --- Página original ---
// "use client";
//
// import { useState } from "react";
// import { useRouter } from "next/navigation";
//
// import { BarraResumo, SeletorPlanos } from "@/components/assinatura/seletor-planos";
// import { useOfertaAssinatura } from "@/components/assinatura/use-oferta-assinatura";
// import { api } from "@/lib/api";
// import type { IdPlano } from "@/lib/api/types";
//
// export default function PaginaPlanos() {
//   const router = useRouter();
//   const { oferta, erro, carregando } = useOfertaAssinatura();
//   const [escolhido, setEscolhido] = useState<IdPlano | null>(null);
//   // MVP: sem cobrança, o plano é ativado aqui mesmo, sem a etapa do cartão.
//   const [ativando, setAtivando] = useState(false);
//   const [erroAtivacao, setErroAtivacao] = useState<string | null>(null);
//
//   if (carregando) {
//     return <p className="text-tinta-suave text-[13px]">Carregando planos…</p>;
//   }
//
//   if (erro || !oferta) {
//     return <p className="text-destructive text-[13px]">Não foi possível carregar os planos. Recarregue a página.</p>;
//   }
//
//   const plano = oferta.planos.find((item) => item.id === escolhido);
//   const total = oferta.plataforma.precoMensal + (plano?.precoMensal ?? 0);
//
//   // MVP: ativa a conta com o plano escolhido, sem cartão. Para voltar a pedir o cartão,
//   // apague esta função e descomente o `onClick` original no botão abaixo.
//   async function ativarSemCartao() {
//     if (!plano || ativando) return;
//     setAtivando(true);
//     setErroAtivacao(null);
//     try {
//       await api.assinar({ planoId: plano.id, tokenCartao: "", titular: { nome: "", cpf: "" } });
//       router.push("/casos");
//     } catch (falha) {
//       setErroAtivacao(falha instanceof Error ? falha.message : "Não foi possível ativar a conta.");
//       setAtivando(false);
//     }
//   }
//
//   return (
//     <div className="flex w-full max-w-[880px] flex-col gap-6 pb-24">
//       <div className="flex flex-col gap-1 text-center">
//         <h1 className="text-2xl font-bold">Escolha seu plano</h1>
//         <p className="text-tinta-suave text-sm">
//           Assinatura mensal da plataforma + créditos de IA para usar nos seus casos.
//         </p>
//       </div>
//
//       <SeletorPlanos oferta={oferta} escolhido={escolhido} aoEscolher={setEscolhido} />
//
//       {erroAtivacao ? (
//         <p role="alert" className="text-destructive text-center text-[13px]">
//           {erroAtivacao}
//         </p>
//       ) : null}
//
//       <BarraResumo
//         legenda={
//           plano ? `${oferta.plataforma.nome} + plano ${plano.nome}` : "Selecione um plano de créditos para continuar"
//         }
//         total={total}
//       >
//         <button
//           type="button"
//           disabled={!plano || ativando}
//           // MVP: etapa do cartão desligada. Original:
//           // onClick={() => plano && router.push(`/assinatura/pagamento?plano=${plano.id}`)}
//           onClick={ativarSemCartao}
//           className="bg-acao text-acao-tinta flex h-10 items-center rounded-[8px] px-5 text-[13px] font-semibold disabled:opacity-40"
//         >
//           {/* MVP: texto original "Continuar para pagamento" */}
//           {ativando ? "Ativando…" : "Começar a usar"}
//         </button>
//       </BarraResumo>
//     </div>
//   );
// }
