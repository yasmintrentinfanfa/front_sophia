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
      <span className="border-tinta-suave absolute top-[7.25px] left-[7.25px] size-[5.5px] rounded-full border-[1.5px]" />
    </span>
  );
}

export function IconeRestaurar() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-5">
      <path
        d="M5 8.5A5 5 0 1 1 6.2 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 4.5v4h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeLixeira() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-5">
      <path
        d="M5 6.5h10M8 6.5V5.2A1.2 1.2 0 0 1 9.2 4h1.6A1.2 1.2 0 0 1 12 5.2V6.5M7 6.5v8.2A1.3 1.3 0 0 0 8.3 16h3.4a1.3 1.3 0 0 0 1.3-1.3V6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeSair() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="text-tinta-suave size-5">
      <path
        d="M8 4.5H5.5A1.5 1.5 0 0 0 4 6v8a1.5 1.5 0 0 0 1.5 1.5H8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 10H16M13.5 7.5 16 10l-2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
