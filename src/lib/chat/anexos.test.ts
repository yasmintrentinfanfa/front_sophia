import { describe, expect, it } from "vitest";

import { comAnexos, separarAnexos, tamanhoDoArquivo } from "@/lib/chat/anexos";

describe("anexos na mensagem do chat", () => {
  it("vai e volta com os nomes e o texto", () => {
    const mensagem = comAnexos("O que muda com este extrato?", ["extrato-fgts.pdf", "holerite.pdf"]);
    expect(mensagem).toBe(
      "[Documento anexado: extrato-fgts.pdf]\n[Documento anexado: holerite.pdf]\nO que muda com este extrato?",
    );
    expect(separarAnexos(mensagem)).toEqual({
      anexos: ["extrato-fgts.pdf", "holerite.pdf"],
      texto: "O que muda com este extrato?",
    });
  });

  it("mensagem comum fica como está, mesmo citando a marca no meio", () => {
    const texto = "Veja isto:\n[Documento anexado: x.pdf]";
    expect(separarAnexos(texto)).toEqual({ anexos: [], texto });
  });

  it("mostra o tamanho em KB ou MB", () => {
    expect(tamanhoDoArquivo(300)).toBe("1 KB");
    expect(tamanhoDoArquivo(820 * 1024)).toBe("820 KB");
    expect(tamanhoDoArquivo(1.4 * 1024 * 1024)).toBe("1,4 MB");
  });
});
