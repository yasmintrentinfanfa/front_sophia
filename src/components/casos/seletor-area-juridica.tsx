"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { areasApi, type AreaJuridica } from "@/lib/api/areas";
import { AREAS_JURIDICAS } from "@/lib/casos/areas-juridicas";
import { cn } from "@/lib/utils";

const CLASSE_CAMPO =
  "border-borda focus:border-destaque focus:ring-destaque/20 bg-campo h-10 w-full rounded-[8px] border px-3 text-[13px] outline-none focus:ring-2";

interface SeletorAreaJuridicaProps {
  id: string;
  valor: string;
  aoMudar: (id: string) => void;
  /** Já abre com a lista de áreas à mostra (ex.: ao clicar em "Alterar área"). */
  abertoInicial?: boolean;
}

/** Busca o catálogo de `GET /areas`; cai no catálogo local se a chamada falhar. */
export function SeletorAreaJuridica({ id, valor, aoMudar, abertoInicial = false }: SeletorAreaJuridicaProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(abertoInicial);
  const [areas, setAreas] = useState<AreaJuridica[]>([...AREAS_JURIDICAS]);
  const nome = areas.find((area) => area.id === valor)?.nome;

  useEffect(() => {
    let ativo = true;
    areasApi.obterCatalogo().then((lista) => {
      if (ativo) setAreas(lista);
    });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;

    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    function cliqueFora(evento: MouseEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false);
    }

    document.addEventListener("keydown", tecla);
    document.addEventListener("mousedown", cliqueFora);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("mousedown", cliqueFora);
    };
  }, [aberto]);

  return (
    <div ref={raiz} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-required="true"
        onClick={() => setAberto((atual) => !atual)}
        className={cn(CLASSE_CAMPO, "flex items-center justify-between gap-2 text-left")}
      >
        <span className={nome ? undefined : "text-destaque text-[11px]"}>
          {nome ?? "Selecione a área jurídica"}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("text-tinta-suave size-4 shrink-0 transition-transform", aberto && "rotate-180")}
        />
      </button>
      {aberto ? (
        <div
          role="listbox"
          aria-labelledby={id}
          className="border-borda bg-campo absolute top-full z-20 mt-1 flex max-h-72 w-full flex-col overflow-y-auto rounded-[8px] border py-1 shadow-lg"
        >
          {areas.map((area) => {
            const ativa = area.id === valor;
            return (
              <button
                key={area.id}
                type="button"
                role="option"
                aria-selected={ativa}
                onClick={() => {
                  aoMudar(area.id);
                  setAberto(false);
                }}
                className={cn(
                  "hover:bg-destaque-suave flex shrink-0 flex-col gap-0.5 px-3 py-2 text-left text-[13px]",
                  ativa && "bg-destaque-suave font-semibold",
                )}
              >
                <span>{area.nome}</span>
                {area.descricao ? (
                  <span className="text-tinta-suave text-[11px] leading-snug font-normal">{area.descricao}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
