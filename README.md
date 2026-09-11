<div align="right">
  <a href="./README.pt.md">🇧🇷 Português</a>
</div>

<h1 align="center">🌱 Braz API</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/Zod-3E6B9E?style=for-the-badge&logo=zod&logoColor=white"/>
  <img src="https://img.shields.io/badge/DeepSeek-4D6BFF?style=for-the-badge&logo=deepseek&logoColor=white"/>
  <img src="https://img.shields.io/badge/Brevo-0B996E?style=for-the-badge&logo=brevo&logoColor=white"/>
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black"/>
</p>

---

## 📋 About

Backend of **Braz**, an educational assistant built for a single 9th grade class at Colégio Estadual Umbelina Braz Gomides, in Cirilândia, Santa Isabel, Goiás. It was developed as **Projeto Extensionista II: Tecnologia Aplicada à Inclusão Digital**, part of the Systems Analysis and Development course at Centro Universitário Internacional UNINTER.

The API serves two audiences. Students get a chat that answers doubts about the subject of the class currently open, and that is designed **never to hand over the answer to an exercise**. Teachers get a panel to open, pause and close a class, and to read one report per student at the end of it.

Two design decisions shape most of the code. Only **one class can be open in the whole school at a time**, which is what makes it possible for a student to simply log in and start typing. And the conversation lives in Redis only until its report is written, which keeps the amount of stored adolescent data as small as the feature allows.

Frontend repository: [Braz-chat](https://github.com/Geovanni-dev/Braz-chat)

---

## 🛠 Tech Stack

| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Runtime          | Node.js (TypeScript, ESM)              |
| Framework        | Express 5                              |
| Database         | PostgreSQL + Prisma ORM                |
| Conversation     | Redis (keys expire on their own)       |
| Authentication   | JSON Web Token (JWT)                   |
| Validation       | Zod                                    |
| AI               | DeepSeek (`openai` SDK, OpenAI-compatible) |
| Email            | Brevo API                              |
| Realtime         | Server Sent Events (native)            |
| Security         | bcrypt + express-rate-limit + Redis    |
| Logging          | pino                                   |
| Code Quality     | ESLint + Prettier + EditorConfig       |

---

## 🗂️ Project Structure

```text
Braz-extensionista-II/
├── prisma/
│   ├── migrations/               # Migration history
│   ├── schema.prisma             # Data model
│   └── seed.ts                   # Teachers, subjects and access keys
├── scripts/
│   ├── excluirAluno.ts           # Deletes one student on request
│   └── limparAnoLetivo.ts        # Clears a school year
├── src/
│   ├── lib/
│   │   ├── Aluno/                # Sign up, email verification, login, password reset
│   │   ├── Aula/                 # Open, pause, close a class, and the SSE stream
│   │   ├── Chat/                 # Student conversation and its Redis cache
│   │   ├── Professor/            # Public teacher list and key based login
│   │   ├── Relatorio/            # Report generation and recovery
│   │   ├── IA-Models/client.ts   # DeepSeek client (OpenAI-compatible SDK)
│   │   ├── prompts/              # System prompts for the chat and the report
│   │   ├── middlewares/          # Auth for each role, rate limiting
│   │   ├── config/env.ts         # Environment validated with Zod at boot
│   │   ├── prisma/               # Prisma client
│   │   ├── redis/                # Redis client
│   │   ├── service/              # Transactional email
│   │   ├── errors.ts             # Named domain errors
│   │   └── logger.ts             # pino instance
│   ├── types/express.d.ts        # Adds aluno and professor to Request
│   ├── app.ts                    # Express instance, CORS and routes
│   └── server.ts                 # Entry point
├── .env.example                  # Environment variable reference
├── eslint.config.js
└── tsconfig.json
```

---

## ✨ Features & Security

**The assistant never gives the answer.** The system prompt forbids solving the exercise, substituting the student's own numbers into a formula, or working through intermediate steps. It explains the rule and lets the student apply it. Refusals never mention rules or instructions, because a refusal that explains itself invites negotiation.

**One class at a time, school wide.** Opening a class closes whichever one is open, whoever owns it, and generates its reports. The panel warns the teacher first, naming the colleague.

**The chat only answers during a class.** The student's route returns 404 when no class is open and 403 when the teacher has paused it. The frontend mirrors this, but the block is enforced on the server.

**Conversations do not accumulate.** Each turn goes into a Redis list that expires in 15 days. The key is deleted only after the report is safely stored in PostgreSQL, which is what makes a failed generation recoverable instead of lost.

**Reports are idempotent.** `@@unique([aulaId, alunoId])` plus `upsert` mean a retry can never produce two reports for the same student in the same class. The `pendentes` column on `Aula` records how many are still missing, which is what the panel uses to offer a retry.

**Teachers cannot reach each other's data.** Every route that receives an `aulaId` checks ownership and answers **404** rather than 403, so it does not confirm that a class it will not serve exists.

**Environment validated at boot.** `env.ts` parses `process.env` with Zod, so a missing secret stops the server instead of failing later on a user's request.

Passwords use bcrypt. Rate limiting is backed by Redis and applied globally, on login and on every route that sends an email.

---

## 📡 API Endpoints

Base URL: `/`

### Students — `/aluno`

| Method | Route                 | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| POST   | `/registro`           | Sign up with the class code               |
| POST   | `/verificar-codigo`   | Confirm the code sent by email            |
| POST   | `/reenviar`           | Resend the verification code              |
| POST   | `/login`              | Sign in, returns a JWT valid for 8h       |
| POST   | `/codigo-troca-senha` | Request a password reset code             |
| POST   | `/trocar-senha`       | Set a new password using the code         |

### Chat — `/chat` *(student token)*

| Method | Route          | Description                                        |
| ------ | -------------- | -------------------------------------------------- |
| POST   | `/`            | Send a message and get Braz's answer                |
| GET    | `/chat-aberto` | History of the conversation in the open class       |

### Teachers — `/professor`

| Method | Route         | Description                                       |
| ------ | ------------- | ------------------------------------------------- |
| GET    | `/`           | Public list of teachers, feeds the login screen    |
| POST   | `/login`      | Sign in with the access key                        |
| GET    | `/disciplina` | Subjects taught by the signed in teacher           |
| PATCH  | `/nome`       | Update the teacher's own name                      |

### Classes — `/aula`

| Method | Route                       | Auth      | Description                                          |
| ------ | --------------------------- | --------- | ---------------------------------------------------- |
| GET    | `/eventos`                  | public    | SSE stream, announces that the class state changed    |
| GET    | `/aberta`                   | public    | The class open right now, whoever owns it             |
| GET    | `/atual`                    | teacher   | The signed in teacher's own open class, or null       |
| POST   | `/abrir`                    | teacher   | Opens a class, closing any other that is open         |
| POST   | `/fechar/:aulaId`           | teacher   | Closes and generates the reports                      |
| POST   | `/gerar-relatorio/:aulaId`  | teacher   | Generates only the reports still missing              |
| POST   | `/pausar/:aulaId`           | teacher   | Suspends Braz's answers without closing the class     |
| POST   | `/despausar/:aulaId`        | teacher   | Resumes                                               |
| GET    | `/buscar-aula`              | teacher   | Her last 15 classes, with the pending count           |
| GET    | `/relatorio/:aulaId`        | teacher   | Reports of one class                                  |

The SSE event carries no payload (`data: {}`). It only says that something changed, and the client fetches the state. That is what keeps the stream public without exposing anything.

---

## 🔒 Data & Privacy

This project handles data of adolescents in a public school, so a few things are deliberate rather than incidental.

The activity runs under a **consent form signed by the school principal**. The legal basis declared to students is consent, and refusing to use Braz does not affect any grade.

Conversations are erased as soon as the report is written, or after 15 days if a class is never closed. Reports and accounts are kept until the end of the school year and then deleted by `scripts/limparAnoLetivo.ts`. Individual deletion requests are served by `scripts/excluirAluno.ts`, and `RegistroExclusao` records that a deletion happened without storing who was deleted.

Reports describe observed behaviour, never traits: what the student did, never what the student is.

Full policy: [/privacidade](https://github.com/Geovanni-dev/Braz-chat) on the frontend.

Contact for data requests: `projetobraz.umbelina@gmail.com`

---

## 🚀 Running Locally

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL database
- A Redis instance
- A DeepSeek API key
- A Brevo account for transactional email

### Steps

```bash
# 1. Install dependencies
yarn install

# 2. Create your .env from the reference
cp .env.example .env

# 3. Apply the migrations and generate the Prisma client
yarn prisma:migrate
yarn prisma:generate

# 4. Seed teachers, subjects and access keys
yarn seed

# 5. Start the development server
yarn dev
```

### Environment variables

| Variable         | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                                      |
| `REDIS_URL`      | Redis connection string                                           |
| `DEEPSEEK_API_KEY` | DeepSeek API key                                                |
| `JWT_SECRET`     | Secret used to sign the tokens                                    |
| `CODIGO_TURMA`   | Class code students type when signing up                          |
| `BREVO_EMAIL`    | Sender address for transactional email                            |
| `BREVO_API_KEY`  | Brevo API key                                                     |
| `CLIENT_URL`     | Allowed origins for CORS, comma separated                         |

> ⚠️ Conversations are sent to the DeepSeek API for processing, which stores and processes data in China. An opt-out request for model-training use was sent on September 11, 2026 and is awaiting confirmation; the privacy policy reflects this and should be updated once DeepSeek confirms.

`PORT` is injected by the host and must not be set by hand.

---

## 🌐 Deployment

Hosted on **Render**, with PostgreSQL on **Neon** and Redis on **Upstash**.

Build command:

```bash
yarn install && npx prisma generate && npx prisma migrate deploy && yarn build
```

Start command: `yarn start`

---

## 📄 License

**[MIT](./LICENSE) © Geovani Eterno Rodrigues**
