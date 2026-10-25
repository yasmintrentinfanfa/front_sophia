/** Classifica o arquivo escolhido na tela de relato. O texto dos documentos é extraído no servidor. */

/** Áudios que o Whisper desta instalação consegue abrir. */
export const EXTENSOES_AUDIO = [
  ".mp3",
  ".wav",
  ".m4a",
  ".m4b",
  ".aac",
  ".mp4",
  ".ogg",
  ".opus",
  ".flac",
  ".webm",
  ".wma",
  ".aiff",
  ".aif",
  ".mp2",
  ".amr",
  ".3gp",
];

export const EXTENSOES_DOCUMENTO = [".pdf", ".docx", ".txt"];

export function ehAudio(arquivo: File) {
  const nome = arquivo.name.toLowerCase();
  return EXTENSOES_AUDIO.some((extensao) => nome.endsWith(extensao));
}

export function ehDocumento(arquivo: File) {
  const nome = arquivo.name.toLowerCase();
  return EXTENSOES_DOCUMENTO.some((extensao) => nome.endsWith(extensao));
}
