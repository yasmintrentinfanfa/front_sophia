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

### Aceite dos termos de uso

O aceite fica na própria conta, em `users.terms_accepted_at` (data e hora) e
`users.terms_version`. Os termos aparecem logo depois do cadastro e, no login, só
para quem ainda não aceitou a versão atual (`VERSAO_TERMOS` no backend). O
checkbox "Li e concordo" libera o botão "Concordo"; a rota `POST /api/conta/termos`
grava o aceite da conta do cookie. Mudar `VERSAO_TERMOS` faz todos aceitarem de novo.

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

## Prompt por área jurídica

O backend junta ao prompt padrão uma orientação específica para a área jurídica do caso
(`legal_area`) na análise preliminar, no chat e na geração de minuta. O front não manda a
área nem monta prompt: ela já está salva no caso, e o backend a lê de lá.

### `GET /areas`

Lista fixa das 12 áreas, sem `user_id`. Proxy: `GET /api/areas` (`src/app/api/areas/route.ts`),
cliente: `src/lib/api/areas.ts` (`areasApi.obterCatalogo()`), com fallback local em
`src/lib/casos/areas-juridicas.ts` se a chamada falhar.

```json
{
  "areas": [
    {
      "id": "previdenciario",
      "nome": "Direito Previdenciário",
      "descricao": "Aposentadorias, benefícios por incapacidade, pensão por morte, BPC/LOAS e revisões no INSS.",
      "gruposPecas": ["previdenciario", "juizados", "civel", "superiores", "extrajudicial"]
    }
  ]
}
```

`gruposPecas` são chaves de `grupos` de `GET /pecas/modelos`, na ordem de prioridade: o
seletor de modelos de peça (`TelaPecas`) os usa para destacar "Sugerido para este caso".

### `PATCH /casos/{caso_id}` aceita `legal_area`

Troca a área de um caso já criado. Corpo: `{ "user_id": "...", "legal_area": "penal" }`
(pode vir junto com `folder` e/ou `status`). Área inválida → `400`; caso inexistente ou de
outro usuário → `404`. A nova área vale a partir da próxima análise, mensagem de chat ou
minuta; análises antigas não são refeitas sozinhas. No front: `api.alterarArea(id, area)`
(`SophiaApi`), exposto em `useListaCasos()` e usado por `EditorAreaCaso`
(`src/components/casos/editor-area-caso.tsx`) na tela de análise do caso.

### Análise ganhou `area`

Em `POST /analise/{caso_id}` e `GET /analise/{caso_id}`, cada objeto de análise (`analise`,
e cada item de `analises`/`versoes`) pode ter `area?: string`: o id da área cuja orientação
a IA usou. Ausente = prompt genérico (caso sem área, ou análise anterior a esta mudança).
Mapeado em `AnalisePreliminar.area` (`src/lib/api/analise.ts`); exibido como selo "Analisada
como: {nome}" em `ListaAnalises`, que também avisa quando a área da análise mostrada
diverge da área atual do caso.

Sem mudança: `POST /casos` (continua exigindo `legal_area`), `POST /chat/{caso_id}`,
`POST /pecas/{caso_id}` e `GET /pecas/modelos` — nenhuma dessas chamadas manda `area` no
corpo.

## Análise, chat e minutas com IA (`backend/analise`)

Módulo vindo do repositório `repotestesmerged`: prompts com as regras anti-alucinação,
validação do JSON com uma nova tentativa, provedores de IA (Groq por padrão) e marcação
de documentos anexados como dado não confiável. A chave da IA fica só no `backend/.env`.

### Rotas

| Next (cookie assinado) | Backend | O que faz |
|---|---|---|
| `POST /api/analise` `{ casoId }` | `POST /analise/{caso}` | Gera uma nova versão da análise com todos os relatos e documentos do caso |
| `POST /api/analise` `{ casoId, incluirChat: true }` | `POST /analise/{caso}` `incluir_chat` | Botão "Atualizar análise com a conversa": refaz a análise com os relatos, os documentos e as últimas 20 mensagens do advogado no chat (`origem: "chat"`) |
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

Análises, mensagens e minutas são documentos próprios, inseridos sem reescrever o caso.
Relatos e documentos anexados ficam só no próprio caso (collection `case`), sem collection
paralela:

| Coleção | Um documento por | Campos principais |
|---|---|---|
| `analises` | versão da análise | `user_id`, `caso_id`, `versao` (único por caso), `gerada_em`, `modelo`, `analise` (JSON validado da IA), `documentos_meta`, `origem` (`relato` ou `chat`), `mensagens_consideradas` |
| `mensagens` | mensagem do chat | `user_id`, `caso_id`, `papel` (`user`/`assistant`), `conteudo`, `criada_em` |
| `pecas` | minuta gerada | `user_id`, `caso_id`, `modelo_id`, `titulo`, `texto`, `instrucoes`, `analise_versao`, `gerada_em` |

- **Cards:** guardamos o JSON validado da IA, não os cards prontos. O `mapeador` monta os
  cards na leitura, então mudar a forma de exibir não exige migrar dados antigos.
- **Chat:** o front manda só a mensagem nova. O backend lê as últimas 10 mensagens (as
  respostas longas entram resumidas), a última análise e um trecho do relato.
- **Relatos (`case.transcript`):** array; cada gravação, áudio ou texto vira um item
  `{ id, text, source, created_at, duration_seconds? }`. `source` é `"audio"` (transcrição) ou
  `"manual"` (relato escrito à mão). A análise considera todos, em ordem cronológica, e os
  mais antigos saem primeiro se passarem do limite de tamanho. Casos antigos, com `transcript`
  em objeto único, são lidos como array de um item e convertidos no próximo relato salvo.
- **Documentos (`case.documents`):** array; um item `{ id, name, type, text, created_at }` por
  PDF, DOCX ou TXT anexado (o texto é extraído no backend, em `POST /anexar-documento`).
- **Limite do Groq gratuito:** 8 mil tokens por minuto. Ao receber 429, o backend espera o
  tempo indicado e tenta de novo até 3 vezes.
- **Atualizar a análise pelo chat:** só as mensagens do advogado entram, como dado (nunca as
  respostas da IA). A análise é refeita do zero com esses fatos, sem receber a versão
  anterior: com ela, a IA tendia a copiar teses que os fatos novos derrubaram. As versões
  anteriores continuam salvas.
- **`python-docx`** só é carregado ao baixar a minuta: sem o pacote, o backend sobe e só o
  download do `.docx` responde 503 com a instrução de instalação.

## Acompanhamento de prazos (`backend/prazos`)

O advogado informa um número de OAB (com a UF) ou um número de processo, e a Sophia traz as
intimações do **DJEN** (Diário de Justiça Eletrônico Nacional, CNJ). Desde 16/05/2025, a
publicação no DJEN é o marco oficial dos prazos (Resolução CNJ 455/2022, alterada pela 569/2024).
**A Sophia não calcula o prazo:** o advogado define a data final. A calculadora do modal só
ajuda a preencher o campo e é conservadora: considera apenas feriados nacionais, então a data
calculada nunca passa da real (`src/lib/prazos/calendario.ts`).

- **Tela geral:** `/casos/prazos` (ícone de calendário na trilha lateral). Acompanha OAB e
  processos e permite ligar um processo a um caso.
- **No caso:** `/casos/{id}/prazos` (botão "Prazos" na análise). É opcional: sem processo
  informado, a tela só explica o recurso. No caso, entra apenas o número do processo, não a OAB.

### Fonte de dados

API pública `GET https://comunicaapi.pje.jus.br/api/v1/comunicacao` (sem autenticação), com
filtros `numeroOab`+`ufOab` ou `numeroProcesso`, `dataDisponibilizacaoInicio/Fim`,
`itensPorPagina` (até 100) e `pagina`. O teor da intimação chega em HTML e vira texto no
backend. Limite observado em 11/2026: **20 requisições por janela, por IP**
(`X-RateLimit-Limit`). Um 429 interrompe a sincronização, que é retomada na próxima vez.

Fora do DJEN, e portanto fora do módulo: citações pelo Domicílio Judicial Eletrônico,
intimações feitas só dentro do sistema do tribunal e publicações do STF (diário próprio).
A tela avisa isso.

### Sincronização

Sob demanda, porque o backend roda como função serverless: a tela pede ao abrir (só para o
que está há mais de 30 min sem atualizar) e no botão "Atualizar agora" (mínimo de 1 min).
A primeira consulta por OAB cobre os últimos 30 dias. A primeira por processo traz o
histórico inteiro dele. As consultas seguintes repetem os últimos 5 dias e olham 7 dias à
frente, porque o DJEN registra a comunicação antes do dia da disponibilização. Para uma
rotina agendada no futuro, basta chamar `sincronizar_usuario` (`backend/prazos/router.py`).

### Rotas

| Next (cookie assinado) | Backend | O que faz |
|---|---|---|
| `GET /api/prazos[?casoId=]` | `GET /prazos/painel` | Acompanhamentos, intimações e prazos (do caso, se `casoId`) |
| `POST /api/prazos/sincronizar` `{ casoId?, forcar? }` | `POST /prazos/sincronizar` | Consulta o DJEN e devolve `{ novas, consultados, erros, painel }` |
| `POST /api/prazos/monitoramentos` `{ tipo, oabNumero?, oabUf?, numeroProcesso?, casoId? }` | `POST /prazos/monitoramentos` | Começa a acompanhar e já faz a primeira consulta (`{ aviso, painel }`) |
| `PATCH /api/prazos/monitoramentos/{id}` `{ casoId \| null }` | `PATCH /prazos/monitoramentos/{id}` | Liga ou desliga o processo de um caso |
| `DELETE /api/prazos/monitoramentos/{id}` | `DELETE /prazos/monitoramentos/{id}` | Deixa de acompanhar (204) |
| `GET /api/prazos/publicacoes/{id}` | `GET /prazos/publicacoes/{id}` | Intimação com o inteiro teor (no painel, o teor vem resumido em 1.200 caracteres) |
| `PATCH /api/prazos/publicacoes/{id}` `{ situacao }` | `PATCH /prazos/publicacoes/{id}` | `sem_prazo` ou `pendente` (409 se já tem prazo) |
| `POST /api/prazos/agenda` `{ descricao, dataFinal, publicacaoId?, casoId?, numeroProcesso? }` | `POST /prazos/agenda` | Agenda o prazo com a data do advogado |
| `PATCH /api/prazos/agenda/{id}` `{ descricao?, dataFinal?, cumprido? }` | `PATCH /prazos/agenda/{id}` | Edita ou marca como cumprido |
| `DELETE /api/prazos/agenda/{id}` | `DELETE /prazos/agenda/{id}` | Exclui (204). Se era o único prazo da intimação, ela volta a `pendente` |

Item de outro usuário responde 404. Caso alheio ou excluído também. Número de processo com
dígito verificador errado responde 400 sem consultar o DJEN.

### Coleções

| Coleção | Um documento por | Campos principais |
|---|---|---|
| `monitoramentos` | OAB ou processo acompanhado | `user_id`, `chave` (única por usuário: `oab:123/SP`, `processo:<20 dígitos>`), `tipo`, `oab_numero`, `oab_uf`, `numero_processo`, `caso_id` (opcional), `ultima_sincronizacao`, `sincronizado_ate`, `ultimo_erro` |
| `publicacoes` | intimação do DJEN | `user_id`, `djen_id` (único por usuário), `monitoramento_ids`, `data_disponibilizacao`, `tribunal`, `orgao`, `tipo_documento`, `numero_processo`, `texto`, `link`, `situacao` (`pendente`/`agendada`/`sem_prazo`), `cancelada` |
| `prazos` | prazo agendado | `user_id`, `publicacao_id?`, `caso_id?`, `numero_processo?`, `descricao`, `data_final`, `cumprido`, `cumprido_em` |

Ao deixar de acompanhar, saem só as intimações que vieram apenas por aquele acompanhamento e
que ninguém agendou. Os prazos continuam. Limite de 20 acompanhamentos por conta.

### Pontos de atenção em produção

- **Região do servidor:** o backend publicado está na Vercel. É preciso confirmar se a API do
  CNJ responde a partir da região dele. Há relatos de bloqueio fora do Brasil, e o erro 403
  aparece como "O DJEN recusou a consulta deste servidor". Se acontecer, publicar a função em
  `gru1` (São Paulo).
- **Limite por IP:** é compartilhado entre todos os usuários do mesmo servidor. Com muitos
  usuários, vale uma rotina agendada que espalhe as consultas, ou um fornecedor pago.
