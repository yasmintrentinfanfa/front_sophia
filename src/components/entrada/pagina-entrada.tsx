import Image from "next/image";
import Link from "next/link";
import { FileSearch, FileText, FolderOpen, MessageCircle, Mic } from "lucide-react";

import { IconeCheck } from "@/components/assinatura/icones";
import { LinkTermos } from "@/components/login/link-termos";
import { BotaoTema } from "@/components/tema/botao-tema";
import { OFERTA_ASSINATURA } from "@/lib/api/mock/dados";
import { cn } from "@/lib/utils";

const BENEFICIOS = [
  {
    icone: Mic,
    titulo: "Grave a entrevista",
    texto: "A conversa com o cliente vira transcrição, sem você ter que anotar tudo na hora.",
  },
  {
    icone: FileSearch,
    titulo: "Análise preliminar",
    texto: "A Sophia organiza fatos, pedidos e fontes em cards para você revisar depois do atendimento.",
  },
  {
    icone: MessageCircle,
    titulo: "Conversa sobre o caso",
    texto: "Tire dúvidas com a IA usando o que já está no processo, sem recomeçar do zero.",
  },
  {
    icone: FileText,
    titulo: "Rascunhos de peças",
    texto: "Minutas a partir do relato, dos documentos e da análise, para você ajustar no seu estilo.",
  },
  {
    icone: FolderOpen,
    titulo: "Tudo no repositório",
    texto: "Áudios, textos, PDFs e versões da análise ficam no mesmo lugar, por caso.",
  },
] as const;

const PASSOS = [
  { n: "1", titulo: "Atenda e grave", texto: "Na reunião, a Sophia registra o que o cliente conta." },
  { n: "2", titulo: "Ela organiza", texto: "Os fatos viram uma análise preliminar, com o que falta esclarecer." },
  { n: "3", titulo: "Você revisa", texto: "Confere os cards, conversa com a IA e segue para as peças." },
] as const;

export function PaginaEntrada() {
  return (
    <div className="tela-publica bg-fundo text-tinta flex min-h-dvh flex-col">
      <header className="border-borda/70 bg-fundo/90 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <Link href="/" className="pressionavel flex items-center gap-2" aria-label="Sophia, página inicial">
            <Image
              src="/logo-sophia.png"
              alt=""
              width={28}
              height={24}
              className="h-6 w-7 object-contain dark:hidden"
            />
            <Image
              src="/logo-sophia-escuro.png"
              alt=""
              width={24}
              height={24}
              className="hidden size-6 rounded-full object-contain dark:block"
            />
            <span className="text-[13px] font-semibold tracking-wide">SOPHIA</span>
          </Link>

          <nav className="text-tinta-suave hidden items-center gap-6 text-[13px] md:flex" aria-label="Seções da página">
            <a href="#beneficios" className="pressionavel hover:text-tinta">
              O que faz
            </a>
            <a href="#planos" className="pressionavel hover:text-tinta">
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <BotaoTema />
            <Link
              href="/login"
              className="bg-acao text-acao-tinta hover:bg-acao/90 pressionavel flex h-9 items-center rounded-[8px] px-4 text-[13px] font-semibold"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-5 py-10 sm:px-8 sm:py-14">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="flex flex-col items-start gap-6">
            <p className="text-destaque text-[12px] font-semibold tracking-wide uppercase">
              Para advogados e escritórios
            </p>
            <div className="flex flex-col gap-4">
              <h1 className="text-[32px] leading-tight font-bold sm:text-[40px]">
                A reunião com o cliente vira o começo da análise
              </h1>
              <p className="text-tinta-suave max-w-[34rem] text-[15px] leading-relaxed">
                A Sophia grava a entrevista, organiza os fatos e monta uma análise preliminar do caso. Você atende com
                atenção; ela cuida do rascunho.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="bg-acao text-acao-tinta hover:bg-acao/90 pressionavel flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold"
              >
                Entrar na conta
              </Link>
              <Link
                href="/criar-conta"
                className="border-borda hover:border-destaque/50 pressionavel flex h-11 items-center rounded-[10px] border bg-transparent px-5 text-[14px] font-semibold"
              >
                Criar conta
              </Link>
            </div>
          </div>

          <figure className="relative aspect-[16/10] overflow-hidden rounded-[20px] shadow-[0_18px_50px_rgba(28,27,26,0.12)]">
            <Image
              src="/entrada/hero-advogada.jpg"
              alt="Advogada em um escritório claro, revisando o caso no notebook"
              fill
              sizes="(max-width: 1024px) 100vw, 46vw"
              priority
              className="object-cover object-[50%_20%]"
            />
          </figure>
        </section>

        <section id="beneficios" className="flex scroll-mt-24 flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="text-[24px] font-bold">O que a Sophia faz no dia a dia</h2>
            <p className="text-tinta-suave text-[14px] leading-relaxed">
              Do primeiro relato até o rascunho da peça, o caso fica reunido para você conferir, complementar e seguir.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS.map((item) => (
              <li
                key={item.titulo}
                className="bg-campo border-borda flex flex-col gap-3 rounded-[16px] border p-5"
              >
                <span className="bg-destaque-suave text-destaque flex size-9 items-center justify-center rounded-[10px]">
                  <item.icone size={18} aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[15px] font-semibold">{item.titulo}</h3>
                  <p className="text-tinta-suave text-[13px] leading-relaxed">{item.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="grid gap-3 sm:grid-cols-2">
            <figure className="relative aspect-[4/3] overflow-hidden rounded-[16px] sm:aspect-[4/5]">
              <Image
                src="/entrada/entrevista.jpg"
                alt="Advogado conversando com uma cliente à mesa, com o notebook aberto entre os dois"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 23vw"
                className="object-cover"
              />
            </figure>
            <figure className="relative aspect-[4/3] overflow-hidden rounded-[16px] sm:mt-10 sm:aspect-[4/5]">
              <Image
                src="/entrada/analise-notebook.jpg"
                alt="Advogada analisando os cards do caso no notebook, com a Sophia na tela"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 23vw"
                className="object-cover object-[40%_50%]"
              />
            </figure>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-[24px] font-bold">Três passos, sem tirar você da conversa</h2>
            <ol className="flex flex-col gap-5">
              {PASSOS.map((passo) => (
                <li key={passo.n} className="flex gap-3">
                  <span className="bg-destaque-suave text-destaque flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold">
                    {passo.n}
                  </span>
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <h3 className="text-[15px] font-semibold">{passo.titulo}</h3>
                    <p className="text-tinta-suave text-[13px] leading-relaxed">{passo.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="planos" className="flex scroll-mt-24 flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="text-[24px] font-bold">Planos pensados para o volume do escritório</h2>
            <p className="text-tinta-suave text-[14px] leading-relaxed">
              Toda assinatura inclui a plataforma. Os créditos de IA mudam conforme o plano. Os valores aparecem na
              hora de assinar, depois do cadastro.
            </p>
          </div>

          <ul className="grid gap-4 md:grid-cols-3">
            {OFERTA_ASSINATURA.planos.map((plano) => (
              <li
                key={plano.id}
                className={cn(
                  "bg-campo relative flex flex-col gap-4 rounded-[16px] border p-5",
                  plano.recomendado ? "border-destaque ring-destaque/15 border-[1.5px] ring-4" : "border-borda",
                )}
              >
                {plano.recomendado ? (
                  <span className="bg-destaque absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    Recomendado
                  </span>
                ) : null}
                <div className="flex flex-col gap-1">
                  <h3 className="text-[17px] font-bold">{plano.nome}</h3>
                  <p className="text-tinta-suave text-[13px] leading-snug">{plano.descricao}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {plano.beneficios.map((beneficio) => (
                    <li key={beneficio} className="flex items-start gap-2 text-[13px]">
                      <IconeCheck className="text-destaque mt-px shrink-0" />
                      {beneficio}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div className="bg-campo border-borda flex flex-col gap-3 rounded-[16px] border p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] font-medium">Incluído em qualquer plano</p>
            <ul className="text-tinta-suave flex flex-col gap-1 text-[12px] sm:max-w-[36rem] sm:text-right">
              {OFERTA_ASSINATURA.plataforma.inclui.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-destaque-suave flex flex-col items-start gap-5 rounded-[20px] px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex max-w-lg flex-col gap-2">
            <h2 className="text-[22px] font-bold">Pronto para o próximo atendimento?</h2>
            <p className="text-tinta-suave text-[14px] leading-relaxed">
              Entre na sua conta ou crie uma. A escolha do plano fica para depois, com calma.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="bg-acao text-acao-tinta hover:bg-acao/90 pressionavel flex h-11 items-center rounded-[10px] px-5 text-[14px] font-semibold"
            >
              Entrar
            </Link>
            <Link
              href="/criar-conta"
              className="border-borda hover:border-destaque/50 pressionavel bg-campo flex h-11 items-center rounded-[10px] border px-5 text-[14px] font-semibold"
            >
              Criar conta
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-borda mt-auto border-t">
        <div className="text-tinta-suave mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-6 text-[12px] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Sophia · IA que apoia advogados em reuniões com clientes</p>
          <LinkTermos />
        </div>
      </footer>
    </div>
  );
}
