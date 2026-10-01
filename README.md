# Sophia

Front-end do Sophia, sistema com IA para advogados. Stack: Next.js (App Router), TypeScript e Tailwind.

## Como rodar

Dois processos: o Next (telas) e a API Python (cadastro e, depois, transcrição).

```bash
npm install
npm run dev
```

Em outro terminal, na mesma pasta:

```bash
python -m venv backend/venv
backend\venv\Scripts\activate
pip install fastapi "uvicorn[standard]" python-multipart httpx python-dotenv motor bcrypt
copy backend\env.exemplo backend\.env
```

Copie `backend/env.exemplo` para `backend/.env` e preencha a URI **só nesse arquivo local** (ele não vai para o Git). Depois suba a API:

```bash
npm run dev:api
```

Abra [http://localhost:3000](http://localhost:3000). A raiz redireciona para `/login`. O cadastro grava na collection `users` do banco `sophia-data`. Sem a URI, a conta fica em `backend/data/` no mesmo formato, até o Atlas estar no `.env`.
