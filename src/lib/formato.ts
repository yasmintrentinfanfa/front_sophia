const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Datas da lista de casos, como no protótipo: "Hoje", "Ontem" ou a data cheia. */
export function formatarDataCurta(iso: string, agora = new Date()) {
  const data = new Date(iso);
  const meiaNoiteDe = (valor: Date) =>
    new Date(valor.getFullYear(), valor.getMonth(), valor.getDate()).getTime();
  const diferencaEmDias = Math.round((meiaNoiteDe(agora) - meiaNoiteDe(data)) / 86_400_000);

  if (diferencaEmDias === 0) return "Hoje";
  if (diferencaEmDias === 1) return "Ontem";
  return dataCurta.format(data);
}
