# Sophia

Front-end do Sophia, sistema com IA para advogados. Stack: Next.js (App Router), TypeScript e Tailwind.

## Como rodar

Dois processos: o Next (telas) e a API Python (cadastro e, depois, transcrição). O ambiente virtual do Windows não serve no Linux: crie o `venv` na máquina em que o projeto vai rodar.

Nas duas plataformas, na pasta do projeto:

```bash
npm install
npm run dev
```

### Windows

Em outro terminal, na mesma pasta:

```bash
python -m venv backend/venv
backend\venv\Scripts\activate
pip install -r backend/requirements.txt
copy backend\env.exemplo backend\.env
```

Preencha a URI **só em** `backend/.env` (ele não vai para o Git). Depois suba a API:

```bash
npm run dev:api
```

### Linux

Em outro terminal, na mesma pasta:

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
cp backend/env.exemplo backend/.env
```

Preencha a URI **só em** `backend/.env` (ele não vai para o Git). O atalho `npm run dev:api` aponta para o Python do Windows. No Linux, suba a API com:

```bash
cd backend && ./venv/bin/python -m uvicorn main:app --reload --reload-exclude venv --port 8000
```

Abra [http://localhost:3000](http://localhost:3000). A raiz redireciona para `/login`. O cadastro grava na collection `users` do banco `sophia-data`. Sem a URI, a conta fica em `backend/data/` no mesmo formato, até o Atlas estar no `.env`.
