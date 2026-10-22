import type { ComponentType } from "react";
import { Banknote, FilePlus2, Mail, MessageSquareText, Scale, ShieldCheck, Zap } from "lucide-react";

import type { FasePeca } from "@/lib/api/pecas";

const ICONES: Record<FasePeca, ComponentType<{ className?: string }>> = {
  inicial: FilePlus2,
  defesa: ShieldCheck,
  manifestacao: MessageSquareText,
  urgencia: Zap,
  recurso: Scale,
  execucao: Banknote,
  extrajudicial: Mail,
};

export function IconeFase({ fase, className }: { fase: FasePeca; className?: string }) {
  const Icone = ICONES[fase] ?? FilePlus2;
  return <Icone className={className} aria-hidden />;
}
