/**
 * Traz o começo do elemento à vista quando ele ficou acima da área visível da rolagem em volta
 * (ex.: ao recolher um texto longo ou trocar de página). Se o começo já está à vista, não mexe.
 */
export function mostrarInicio(elemento: Element | null | undefined) {
  if (!elemento) return;
  let rolagem = elemento.parentElement;
  while (rolagem && !/(auto|scroll)/.test(getComputedStyle(rolagem).overflowY)) rolagem = rolagem.parentElement;
  const limite = rolagem ? rolagem.getBoundingClientRect().top : 0;
  if (elemento.getBoundingClientRect().top < limite) elemento.scrollIntoView({ block: "start" });
}
