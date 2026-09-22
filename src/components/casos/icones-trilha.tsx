/**
 * Ícones da trilha lateral. No protótipo eles são desenhados com retângulos
 * vetoriais em vez de um pacote de ícones, então a geometria abaixo reproduz
 * exatamente as medidas do Figma (caixa de 20x20, traço de 1,5px em #6b665e).
 * O ícone de configurações é um asset exportado e vem de `public/`.
 */

export function IconeNovoCaso() {
  return (
    <span className="relative block size-5">
      <span className="border-tinta-suave absolute top-[3px] left-[3px] size-[14px] rounded-[3px] border-[1.5px]" />
      <span className="bg-tinta-suave absolute top-[9.25px] left-[6px] h-[1.5px] w-[8px]" />
      <span className="bg-tinta-suave absolute top-[6px] left-[9.25px] h-[8px] w-[1.5px]" />
    </span>
  );
}

export function IconeCasos() {
  return (
    <span className="relative block size-5">
      <span className="border-tinta-suave absolute top-[2px] left-[4px] h-[15px] w-[12px] rounded-[2px] border-[1.5px]" />
      <span className="bg-tinta-suave absolute top-[7px] left-[7px] h-[1.2px] w-[6px]" />
      <span className="bg-tinta-suave absolute top-[10px] left-[7px] h-[1.2px] w-[6px]" />
    </span>
  );
}

export function IconeRepositorio() {
  return (
    <span className="relative block size-5">
      <span className="border-tinta-suave absolute top-[5px] left-[3px] h-[2.5px] w-[7px] rounded-[1px] border-[1.5px]" />
      <span className="border-tinta-suave absolute top-[7px] left-[3px] h-[10px] w-[14px] rounded-[2px] border-[1.5px]" />
    </span>
  );
}

export function IconeConfiguracoes() {
  return (
    <span className="relative block size-5">
      <span className="border-tinta-suave absolute top-[3.25px] left-[3.25px] size-[13.5px] rounded-full border-[1.5px]" />
    </span>
  );
}

export function Hamburguer() {
  return (
    <span aria-hidden className="flex h-[12px] w-[18px] flex-col gap-[4px]">
      <span className="bg-tinta-suave h-[1.5px] w-[16px] rounded-[1px]" />
      <span className="bg-tinta-suave h-[1.5px] w-[16px] rounded-[1px]" />
      <span className="bg-tinta-suave h-[1.5px] w-[16px] rounded-[1px]" />
    </span>
  );
}
