import { redirect } from "next/navigation";

// MVP: a etapa do cartão está desligada e quem abrir este endereço volta para a escolha do plano.
// Para religar, apague o redirect abaixo e descomente o bloco original.
//
// import { CheckoutPagamento } from "@/components/assinatura/checkout-pagamento";
//
// export default async function PaginaPagamento({
//   searchParams,
// }: {
//   searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
// }) {
//   const { plano } = await searchParams;
//   return <CheckoutPagamento planoId={typeof plano === "string" ? plano : ""} />;
// }

export default function PaginaPagamento() {
  redirect("/assinatura");
}
