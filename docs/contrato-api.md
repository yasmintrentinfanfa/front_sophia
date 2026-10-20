# Contrato de API do Sophia

Referência compartilhada entre o front e a equipe de backend. O front implementa um
adapter (`src/lib/api`) sobre a interface `SophiaApi`; hoje existe apenas o adapter
mockado, e trocar para HTTP não exige mudança nos componentes.

## Implementado no front

Só a parte necessária para as telas de login e de casos.

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

## Modelado, ainda não implementado

Este trecho foi derivado do documento de contexto do produto e vale como contrato
para a tela de análise (frame "06 - Análise IA" do protótipo). Foi removido do
código por não estar em uso, mas as decisões abaixo devem ser preservadas.

### Rastreabilidade das fontes

Requisito não negociável: nenhuma tese, tema ou jurisprudência pode aparecer sem
origem verificável. Quando a IA não consegue citar fonte, o item deve chegar com
`fontes` vazio, e a interface o sinaliza como não verificado — nunca esconde o
item nem inventa a referência.

```ts
interface Fonte {
  origem: string;         // tribunal ("STF", "STJ", "TJRS") ou lei ("Código Civil")
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

### Operações restantes

```ts
obterCaso(casoId): Promise<CasoDetalhado>;             // + transcrição, documentos, análise
solicitarAnalise(casoId, instrucao?): Promise<AnalisePreliminar>;
listarMensagens(casoId): Promise<MensagemChat[]>;
enviarMensagem(casoId, conteudo): Promise<MensagemChat[]>; // [mensagem do advogado, resposta]
```

## Conta e assinatura (pronto no front, aguardando backend)

O front já chama estas rotas pelo adapter HTTP (`src/lib/api/http/adapter.ts`).
Para ligar, defina `NEXT_PUBLIC_API_URL` (ver `.env.example`); sem ela tudo roda
no mock. Casos continuam no mock mesmo com a variável definida, até terem rota.

### Fluxo

1. `/criar-conta` → `POST /auth/cadastro` cria o usuário com
   `statusConta: "pagamento_pendente"` e já abre a sessão.
2. `/assinatura` → `GET /auth/eu` confirma a sessão; `GET /assinatura/oferta`
   traz plataforma e planos.
3. `/assinatura/pagamento` → o cartão é tokenizado **no navegador** pelo SDK do
   gateway (`src/lib/pagamento`); o front manda só o token em `POST /assinatura`.
4. O backend cobra no gateway, grava a assinatura ligada ao usuário da sessão e
   passa `statusConta` para `"ativa"`. O front segue para `/casos`.
5. No login, `POST /auth/entrar` devolve o usuário; quem ainda está com
   `pagamento_pendente` volta para `/assinatura` (`rotaInicial` em `src/lib/conta.ts`).

### Rotas

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/cadastro` | `DadosCadastro` | `201 Usuario` + cookie de sessão · `409` e-mail em uso |
| POST | `/auth/entrar` | `DadosEntrar` | `200 Usuario` + cookie de sessão · `401` credenciais |
| POST | `/auth/sair` | — | `204`, apaga o cookie |
| GET | `/auth/eu` | — | `200 Usuario` · `401` sem sessão |
| GET | `/assinatura/oferta` | — | `200 OfertaAssinatura` |
| POST | `/assinatura` | `DadosAssinatura` | `201 Assinatura` · `402` pagamento recusado · `401` sem sessão |

Os tipos estão em `src/lib/api/types.ts`. Erros devem vir como
`{ "mensagem": "texto para o usuário" }`; sem isso o front usa uma mensagem
padrão pelo status.

Regras para o backend:

- **Sessão em cookie httpOnly, Secure, SameSite=Lax.** O front nunca guarda token e
  nunca envia `usuarioId`: o dono da assinatura sai sempre da sessão. Se o backend
  estiver em outro domínio, habilitar CORS com `credentials` para a origem do front.
- **Valores em centavos** (inteiros) em toda a API.
- **Preço vem do servidor.** `POST /assinatura` recebe só `planoId`; o valor é
  recalculado no backend a partir da oferta, nunca confiado ao front.

### Coleções no MongoDB (sugestão)

```js
// usuarios — índice único em { email: 1 }
{
  _id: ObjectId,
  nome: "João Silva",
  email: "joao@escritorio.com",          // sempre minúsculo
  senhaHash: "...",                       // bcrypt/argon2; nunca a senha
  aceiteTermos: { versao: "2026-10", aceitoEm: ISODate },
  statusConta: "pagamento_pendente",      // | "ativa"
  gatewayClienteId: "cus_...",            // cliente criado no gateway na 1ª assinatura
  criadoEm: ISODate,
  atualizadoEm: ISODate
}

// assinaturas — índice em { usuarioId: 1 }
{
  _id: ObjectId,
  usuarioId: ObjectId,                    // vínculo cartão/assinatura ↔ usuário
  planoId: "intermediario",
  valorPlataforma: 15000,                 // centavos, congelados no momento da compra
  valorPlano: 25000,
  valorMensal: 40000,
  status: "ativa",                        // | "pendente" | "recusada" | "cancelada"
  cartao: {                               // só dados de exibição
    bandeira: "visa",
    final: "1111",
    validade: "12/30",
    gatewayMetodoId: "pm_..."             // referência do cartão salvo no gateway
  },
  gatewayAssinaturaId: "sub_...",
  criadaEm: ISODate,
  proximaCobrancaEm: ISODate,
  canceladaEm: null
}
```

Nunca gravar número do cartão, CVV ou o token de uso único: o gateway guarda o
cartão e devolve um id reutilizável (`gatewayMetodoId`). O CPF do titular vai para o
gateway na cobrança; só guarde no Mongo se houver necessidade (LGPD).

O status da cobrança mensal deve ser atualizado por **webhook** do gateway
(pagamento aprovado, recusado, cartão expirado), não pelo front.
