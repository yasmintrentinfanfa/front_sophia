# Contrato de API do Sophia

Referência compartilhada entre o front e a equipe de backend. O front implementa um
adapter (`src/lib/api`) sobre a interface `SophiaApi`; hoje existe apenas o adapter
mockado, e trocar para HTTP não exige mudança nos componentes.

## Implementado no front

A API simulada cobre casos, análise preliminar, mensagens do chat e conteúdo do
repositório. Os tipos atuais estão em `src/lib/api/types.ts` e
`src/lib/api/analise.ts`. Cadastro e pagamento reproduzem o fluxo do protótipo;
não há autenticação externa nem cobrança, e senhas e dados de cartão não são
persistidos.

O adapter mantém os dados em memória até recarregar a página. O caso
`rescisao-silva` contém os textos de demonstração do Figma; outros casos começam
com seus próprios estados vazios. As referências do protótipo não são fontes
jurídicas verificadas. Os detalhes de cada insight deixam essa condição explícita;
análises reais sem URL verificável também exibem `nao verificado` no cartão.

```ts
type StatusCaso = "gravacao_pendente" | "em_analise" | "concluido";

interface Caso {
  id: string;
  titulo: string;      // "Rescisão contratual — Silva"
  cliente: string;     // exibido como "Cliente: …"
  status: StatusCaso;
  atualizadoEm: string; // ISO 8601
}

interface SophiaApi {
  listarCasos(): Promise<Caso[]>;
}
```

## Modelos da análise

Este trecho foi derivado do documento de contexto do produto e orienta a
integração da tela de análise (frame "06 - Análise IA" do protótipo).

### Rastreabilidade das fontes

Requisito não negociável: nenhuma tese, tema ou jurisprudência pode aparecer sem
origem verificável. Quando a IA não consegue citar fonte, o item deve chegar com
`fontes` vazio, e a interface o sinaliza como não verificado — nunca esconde o
item nem inventa a referência.

```ts
interface Fonte {
  tribunal: string;       // "STF", "STJ", "TJRS"
  identificador: string;  // "Tema 975", "REsp 1.234.567/SP"
  data: string;           // ISO 8601
  url?: string;
}
```

Categorias que exigem fonte: `tema_superior`, `tese`, `jurisprudencia`. Perguntas,
necessidades adicionais e possibilidade de acordo são leituras do próprio caso, não
afirmações sobre o direito, e por isso não exigem citação.

### Análise preliminar

```ts
type CategoriaInsight =
  | "tema_superior" | "tese" | "jurisprudencia"
  | "pergunta" | "necessidade" | "acordo";

type NivelRelevancia = "alta" | "media" | "baixa";
type PosicaoJurisprudencial = "majoritaria" | "minoritaria" | "em_analise";

interface Insight {
  id: string;
  categoria: CategoriaInsight;
  titulo: string;
  detalhe?: string;
  relevancia: NivelRelevancia;
  posicaoJurisprudencial?: PosicaoJurisprudencial;
  fontes: Fonte[];
  perguntasSugeridas?: string[];
  relacionadoA?: string;
}

interface AnalisePreliminar {
  id: string;
  casoId: string;
  versao: number;   // reanálises são incrementais, cada rodada gera uma versão
  geradaEm: string;
  insights: Insight[];
  avisos: AvisoAnalise[];
}
```

Decisões tomadas:

- **Relevância é sempre qualitativa.** Nenhum percentual de probabilidade de êxito é
  exposto ao usuário, para não criar falsa sensação de certeza jurídica num público
  que não tem repertório para conferir.
- **Reanálises são incrementais e versionadas**, não substituem a análise anterior.
- `solicitarAnalise(casoId, instrucao?)` recebe a instrução como opcional de
  propósito: o usuário-alvo não deve precisar escrever nada para obter o resultado.

### Documentos anexados

Documentos vêm de sistemas processuais e são tratados como conteúdo não confiável.
A sanitização contra instruções ocultas (prompt injection) acontece antes de o
documento entrar no contexto enviado à IA, e o resultado é visível na interface.

```ts
type ResultadoSanitizacao =
  | { status: "pendente" }
  | { status: "limpo" }
  | { status: "suspeito"; trechosRemovidos: number; descricao: string };
```

### Operações do fluxo

```ts
obterCaso(casoId): Promise<ConteudoCaso>;              // transcrição, documentos, análise e histórico
finalizarSessao(casoId, transcricao): Promise<Caso>;   // salva a transcrição, solicita análise e atualiza o status
solicitarAnalise(casoId, instrucao?): Promise<AnalisePreliminar>;
listarMensagens(casoId): Promise<MensagemChat[]>;
enviarMensagem(casoId, conteudo): Promise<MensagemChat[]>; // [mensagem do advogado, resposta]
```

Essas operações estão implementadas em `src/lib/api/mock/fluxo.ts` e são expostas
pelo mesmo objeto `api` das telas existentes. A reanálise incrementa a versão e
acrescenta um evento ao histórico; conversas são isoladas por `casoId`. Respostas
novas identificam o modo de demonstração, sem simular uma consulta jurídica real.

Ao confirmar o fim da gravação, a sessão aguarda `finalizarSessao`, atualiza a
lista e substitui a rota da sessão pela análise. Falhas mantêm a transcrição na
tela e permitem tentar novamente. O mock recebe as falas demonstrativas exibidas
na sessão (incluindo anotações com `papel: "nota"`); não captura áudio, não faz
transcrição real e não consulta o STF. Casos novos não recebem jurisprudência
fictícia: a análise informa que a integração está pendente. Os dados continuam em
memória e são perdidos ao recarregar a página.

A lista e a barra lateral abrem a gravação para casos `gravacao_pendente` e a
análise para os demais. Os botões de voltar usam a navegação interna da aba ou
uma rota de retorno quando a tela foi aberta diretamente por URL.
