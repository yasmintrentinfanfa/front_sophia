"use client";

import { ChatCaso } from "@/components/chat/chat-caso";

export default function PaginaChatRepositorio() {
  return <ChatCaso destinoVoltar={(casoId) => `/casos/${casoId}/repositorio/analise`} />;
}
