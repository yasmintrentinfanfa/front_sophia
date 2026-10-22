"use client";

import { ChatCaso } from "@/components/chat/chat-caso";

export default function PaginaChat() {
  return <ChatCaso destinoVoltar={(casoId) => `/casos/${casoId}/analise`} />;
}
