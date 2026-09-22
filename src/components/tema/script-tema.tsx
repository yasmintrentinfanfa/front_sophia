/**
 * Roda antes da hidratação para o primeiro paint já sair no tema gravado.
 * next/script com beforeInteractive não bloqueia o paint o suficiente.
 */
export function ScriptTema() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{if(localStorage.getItem('sophia-tema')==='escuro'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
      }}
    />
  );
}
