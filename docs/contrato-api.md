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
- `solicitarAnalise(casoId)` não recebe instruções do usuário: o usuário-alvo não
  precisa escrever nada para obter o resultado. Dúvidas sobre o caso vão para o chat.

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
solicitarAnalise(casoId): Promise<AnalisePreliminar>;
listarMensagens(casoId): Promise<MensagemChat[]>;
enviarMensagem(casoId, conteudo): Promise<MensagemChat[]>; // [mensagem do advogado, resposta]
```

Fora dos testes, análise e chat são reais (`src/lib/api/analise-real.ts`, rotas
`/api/analise` e `/api/chat`, módulo `backend/analise`). Nos testes, e com
`NEXT_PUBLIC_ANALISE_REAL=false`, seguem o simulado de `src/lib/api/mock/fluxo.ts`. A
reanálise incrementa a versão e acrescenta um evento ao histórico; conversas são isoladas
por usuário e por `casoId`.

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

## Conta, sessão e assinatura

Cadastro, login e assinatura passam por rotas do próprio Next (`src/app/api`), que
falam com o backend Python (`backend/main.py`, porta 8000) e cuidam do cookie de
sessão. O navegador nunca fala direto com o backend nem envia `user_id`.

### Fluxo

1. `/criar-conta` → `POST /api/auth/criar-conta` → backend `POST /cadastro`. O usuário
   nasce sem `account_status` (= pagamento pendente) e a sessão já é aberta.
2. `/assinatura` (plataforma R$ 150 + plano Básico/Intermediário/Pro) →
   `/assinatura/pagamento`: o cartão é tokenizado **no navegador** pelo gateway
   (`src/lib/pagamento`, hoje mockado) e o front manda só o token.
3. `POST /api/assinatura` lê o dono do cookie e chama o backend `POST /assinatura`,
   que recalcula o preço pelo `plan_id`, grava o resumo em `users.subscription` e passa
   o usuário para `account_status: "ativa"`.
4. No login (`POST /api/auth/entrar`), quem ainda não pagou vai para `/assinatura`;
   quem pagou vai para `/casos` (`rotaInicial` em `src/lib/conta.ts`).
5. `/casos` só abre com sessão e conta ativa (`GET /api/auth/eu` →
   backend `GET /usuario/{id}`); sem sessão vai para `/login`.

### Rotas do Next

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/auth/criar-conta` | `{ nome, email, senha }` | `{ usuario }` + cookie · `400` dados/e-mail em uso |
| POST | `/api/auth/entrar` | `{ email, senha }` | `{ usuario }` (com `account_status`) + cookie · `401` |
| POST | `/api/auth/sair` | — | `{ ok: true }`, apaga o cookie |
| GET | `/api/auth/eu` | — | `{ usuario }` · `401` sem sessão ou cookie adulterado |
| POST | `/api/assinatura` | `{ plan_id, card_token, holder }` | `{ assinatura }` · `402` recusado · `401` |

Erros vêm como `{ "erro": "texto para o usuário" }`, no padrão do backend. Os
formatos (`UsuarioApi`, `AssinaturaApi`…) estão em `src/lib/api/http/mapeadores.ts`.

### Cookie de sessão assinado

O cookie `sophia_user_id` guarda `<userId>.<HMAC-SHA256>` (`src/lib/servidor/cookie-assinado.ts`),
não mais o UUID puro. Antes, bastava editar o cookie com o UUID de outra pessoa para
entrar na conta dela; agora qualquer alteração invalida a sessão. O segredo vem de
`SESSION_SECRET` (obrigatória em produção, ver `.env.example`). Cookies antigos, sem
assinatura, deixam de valer: quem estava logado precisa entrar de novo.

### Assinatura no documento `users`

O resumo fica em `users.subscription`. Não há coleção separada de assinaturas.

```js
{
  id: "uuid",
  plan_id: "intermediario",
  plan_name: "Intermediário",
  monthly_amount: 40000,              // centavos, calculados no backend
  card: { brand: "visa", last4: "4242", expiry: "08/31" },  // só exibição; número e CVV nunca chegam aqui
  since: "2026-10-20T17:25:00"
}
```

Quando o gateway real entrar: guardar o id do cliente/método de pagamento do
gateway, nunca o token de uso único, e atualizar o status mensal por webhook.

## Isolamento por usuário (obrigatório no backend)

Cada usuário só pode ver e alterar os próprios casos. O front já se comporta
assim — nunca envia `user_id`, só mostra o que a API devolve e trata caso alheio
como inexistente —, mas **a garantia de verdade é do backend**.

Regras:

1. **O `user_id` sai sempre da sessão.** Nas rotas do Next ele vem do cookie
   assinado (`idDoUsuarioNaSessao`); nunca da URL, do corpo ou de query string.
2. **Toda consulta a `case` filtra pelo dono** — o backend já faz
   `find_one({ "user_id": ..., "caso_id": ... })` em `/caso` e `/salvar-transcricao`.
3. **Caso de outro usuário responde `404`, igual a caso inexistente**, para não
   revelar que aquele id existe.
4. **`transcript` herda o dono do caso.** Os documentos antigos dessa coleção não
   têm `case_id` nem `user_id`; transcrições novas ficam dentro de `case`, que tem dono.

**Atenção — o backend confia no `user_id` que recebe.** As rotas `/caso`,
`/salvar-transcricao`, `/usuario/{id}` e `/assinatura` aceitam o `user_id` como
parâmetro, e o CORS está liberado para qualquer origem. Isso só é seguro enquanto
a porta 8000 **não** estiver exposta à internet e apenas o servidor Next a chamar.
Em produção: deixar o backend em rede interna ou exigir um token compartilhado
entre Next e backend (ex.: header `X-Sophia-Interno`).

### Ajustes pendentes no banco atual

| Coleção | Ajuste |
|---|---|
| `users` | `account_status` passa a ser gravado pela assinatura; contas antigas sem o campo são tratadas como pagamento pendente. Um documento (`testefront@teste.com`) está sem `name`. |
| `case` | Faltam os campos de listagem (`title`, `client_name`, `status`, `folder`) para a lista de casos sair do mock. O `user_id` do caso de teste (`a3f1c2e4-…-000000000001`) não existe em `users`. |
| `transcript` | Documentos sem dono e com nomes de campo misturados (`texto`/`criado_em` × `text`/`created_at`). |

### Testes

`npm test` roda os testes do front (Vitest): isolamento de casos entre dois
usuários, cookie forjado/adulterado e as rotas de conta. A API real deve cobrir os
mesmos cenários com dois usuários A e B: B não lista, não abre, não altera e não
exclui caso de A (`404`), e nada funciona sem sessão (`401`).

## Análise, chat e minutas com IA (`backend/analise`)

Módulo vindo do repositório `repotestesmerged`: prompts com as regras anti-alucinação,
validação do JSON com uma nova tentativa, provedores de IA (Groq por padrão) e marcação
de documentos anexados como dado não confiável. A chave da IA fica só no `backend/.env`.

### Rotas

| Next (cookie assinado) | Backend | O que faz |
|---|---|---|
| `POST /api/analise` `{ casoId }` | `POST /analise/{caso}` | Gera uma nova versão da análise com todos os relatos e documentos do caso |
| `GET /api/analise?casoId=` | `GET /analise/{caso}` | Última versão e todas as versões |
| `GET /api/chat?casoId=` | `GET /chat/{caso}` | Últimas 200 mensagens, em ordem |
| `POST /api/chat` `{ casoId, mensagem }` | `POST /chat/{caso}` | Uma pergunta; devolve a pergunta e a resposta salvas |
| `GET /api/pecas/modelos` | `GET /pecas/modelos` | Catálogo de modelos de peça (`modelos_pecas.py`) |
| `GET /api/pecas?casoId=` | `GET /pecas/{caso}` | Minutas do caso, sem o texto |
| `POST /api/pecas` `{ casoId, modeloId, instrucoes? }` | `POST /pecas/{caso}` | Gera uma minuta; exige análise (409 sem ela) |
| `GET /api/pecas/{id}?casoId=` | `GET /pecas/{caso}/{id}` | Minuta com o texto |
| `GET /api/pecas/{id}/docx?casoId=` | `GET /pecas/{caso}/{id}/docx` | `.docx` montado em memória |

Toda rota do backend confere antes que o caso existe, é do usuário e não foi excluído
(`in_system` diferente de `false`); caso alheio responde 404.

### Onde cada coisa fica no MongoDB

Cada registro é um documento próprio, inserido sem reescrever o caso. O documento do caso
continua pequeno (o último relato em `transcript` e `analysis_version`) e nenhuma requisição
manda o histórico inteiro:

| Coleção | Um documento por | Campos principais |
|---|---|---|
| `analises` | versão da análise | `user_id`, `caso_id`, `versao` (único por caso), `gerada_em`, `modelo`, `analise` (JSON validado da IA), `documentos_meta` |
| `mensagens` | mensagem do chat | `user_id`, `caso_id`, `papel` (`user`/`assistant`), `conteudo`, `criada_em` |
| `pecas` | minuta gerada | `user_id`, `caso_id`, `modelo_id`, `titulo`, `texto`, `instrucoes`, `analise_versao`, `gerada_em` |
| `relatos` | relato registrado | `user_id`, `caso_id`, `texto`, `duracao_segundos`, `criado_em` |

- **Cards:** guardamos o JSON validado da IA, não os cards prontos. O `mapeador` monta os
  cards na leitura, então mudar a forma de exibir não exige migrar dados antigos.
- **Chat:** o front manda só a mensagem nova. O backend lê as últimas 10 mensagens (as
  respostas longas entram resumidas), a última análise e um trecho do relato.
- **Relatos:** cada gravação, áudio ou texto vira um documento; a análise considera todos,
  em ordem cronológica, e os mais antigos saem primeiro se passarem do limite de tamanho.
- **Limite do Groq gratuito:** 8 mil tokens por minuto. Ao receber 429, o backend espera o
  tempo indicado e tenta de novo até 3 vezes.
