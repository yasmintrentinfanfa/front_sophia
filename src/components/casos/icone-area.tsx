import {
  Briefcase,
  Fingerprint,
  Gavel,
  HardHat,
  Home,
  Landmark,
  Leaf,
  Receipt,
  Scale,
  Shield,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";

import { areaPorId, type IdAreaJuridica } from "@/lib/casos/areas-juridicas";

const ICONES: Record<IdAreaJuridica, LucideIcon> = {
  civil: Scale,
  "familia-sucessoes": Users,
  trabalhista: HardHat,
  previdenciario: Shield,
  consumidor: ShoppingBag,
  empresarial: Briefcase,
  tributario: Receipt,
  penal: Gavel,
  administrativo: Landmark,
  imobiliario: Home,
  ambiental: Leaf,
  digital: Fingerprint,
};

/** Ícone da área jurídica, ao lado do nome do caso. */
export function IconeArea({ area, className = "size-3.5" }: { area?: string; className?: string }) {
  const conhecida = areaPorId(area);
  if (!conhecida) return null;
  const Icone = ICONES[conhecida.id];
  return (
    <span title={conhecida.nome} className="text-destaque inline-flex shrink-0" role="img" aria-label={conhecida.nome}>
      <Icone className={className} aria-hidden />
    </span>
  );
}
