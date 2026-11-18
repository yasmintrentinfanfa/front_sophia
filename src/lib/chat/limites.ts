/**
 * Tamanho máximo da mensagem do advogado no chat, em caracteres. O backend corta no mesmo
 * tamanho (`LIMITES_CHAT["mensagem"]` em analise/router.py); a resposta da Sophia não tem limite.
 */
export const LIMITE_MENSAGEM_CHAT = 10_000;
