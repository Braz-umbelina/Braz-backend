<div align="right">
  <a href="./README.md">🇺🇸 English</a>
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

## 📋 Sobre

Backend do **Braz**, um assistente educacional feito para uma turma de 9º ano do Colégio Estadual Umbelina Braz Gomides, em Cirilândia, Santa Isabel, Goiás. Foi desenvolvido como **Projeto Extensionista II: Tecnologia Aplicada à Inclusão Digital**, do curso de Análise e Desenvolvimento de Sistemas do Centro Universitário Internacional UNINTER.

A API atende dois públicos. O aluno tem um chat que tira dúvidas da matéria da aula que está aberta, e que foi feito para **nunca entregar a resposta de um exercício**. A professora tem um painel para abrir, pausar e encerrar a aula, e para ler um relatório por aluno no fim dela.

Duas decisões moldam a maior parte do código. Só pode existir **uma aula aberta por vez em toda a escola**, e é isso que permite ao aluno simplesmente entrar e começar a escrever. E a conversa vive no Redis apenas até o relatório dela ser escrito, o que mantém a quantidade de dado de adolescente guardado no mínimo que a funcionalidade permite.

Repositório do frontend: [Braz-chat](https://github.com/Geovanni-dev/Braz-chat)

---

## 🛠 Tecnologias

| Camada         | Tecnologia                                     |
| -------------- | ---------------------------------------------- |
| Runtime        | Node.js (TypeScript, ESM)                      |
| Framework      | Express 5                                      |
| Banco de dados | PostgreSQL + Prisma ORM                        |
| Conversa       | Redis (chaves com expiração própria)           |
| Autenticação   | JSON Web Token (JWT)                           |
| Validação      | Zod                                            |
| IA             | DeepSeek (SDK `openai`, compatível com OpenAI) |
| E-mail         | API da Brevo                                   |
| Tempo real     | Server Sent Events (nativo)                    |
| Segurança      | bcrypt + express-rate-limit + Redis            |
| Logs           | pino                                           |
| Qualidade      | ESLint + Prettier + EditorConfig               |

---

## 🗂️ Estrutura do projeto

```text
Braz-extensionista-II/
├── prisma/
│   ├── migrations/               # Histórico de migrations
│   ├── schema.prisma             # Modelo de dados
│   └── seed.ts                   # Professoras, disciplinas e chaves de acesso
├── scripts/
│   ├── excluirAluno.ts           # Exclui um aluno a pedido
│   └── limparAnoLetivo.ts        # Limpa um ano letivo
├── src/
│   ├── lib/
│   │   ├── Aluno/                # Cadastro, verificação por e-mail, login, troca de senha
│   │   ├── Aula/                 # Abrir, pausar e encerrar aula, e o fluxo SSE
│   │   ├── Chat/                 # Conversa do aluno e o cache dela no Redis
│   │   ├── Professor/            # Lista pública de professoras e login por chave
│   │   ├── Relatorio/            # Geração e recuperação de relatórios
│   │   ├── IA-Models/client.ts   # Cliente do DeepSeek (SDK compatível com OpenAI)
│   │   ├── prompts/              # Prompts do chat e do relatório
│   │   ├── middlewares/          # Autenticação por papel e limite de requisições
│   │   ├── config/env.ts         # Ambiente validado com Zod na subida
│   │   ├── prisma/               # Cliente do Prisma
│   │   ├── redis/                # Cliente do Redis
│   │   ├── service/              # E-mail transacional
│   │   ├── errors.ts             # Erros de domínio nomeados
│   │   └── logger.ts             # Instância do pino
│   ├── types/express.d.ts        # Acrescenta aluno e professor ao Request
│   ├── app.ts                    # Instância do Express, CORS e rotas
│   └── server.ts                 # Ponto de entrada
├── .env.example                  # Referência das variáveis de ambiente
├── eslint.config.js
└── tsconfig.json
```

---

## ✨ Funcionalidades e segurança

**O assistente nunca dá a resposta.** O prompt proíbe resolver o exercício, substituir os números do próprio aluno numa fórmula e resolver passos intermediários. Ele explica a regra e deixa o aluno aplicar. A recusa nunca menciona regras nem instruções, porque recusa que se explica convida à negociação.

**Uma aula por vez em toda a escola.** Abrir uma aula encerra a que estiver aberta, de quem for, e gera os relatórios dela. O painel avisa a professora antes, com o nome da colega.

**O chat só responde durante a aula.** A rota do aluno devolve 404 quando não há aula aberta e 403 quando a professora pausou. O frontend reflete isso, mas o bloqueio é do servidor.

**As conversas não se acumulam.** Cada turno entra numa lista do Redis que expira em 15 dias. A chave só é apagada depois que o relatório está gravado no PostgreSQL, e é isso que torna uma geração que falhou recuperável em vez de perdida.

**Os relatórios são idempotentes.** O `@@unique([aulaId, alunoId])` junto do `upsert` garante que uma nova tentativa nunca produza dois relatórios do mesmo aluno na mesma aula. A coluna `pendentes` na `Aula` guarda quantos ainda faltam, e é o que o painel usa para oferecer a nova tentativa.

**Uma professora não alcança o dado da outra.** Toda rota que recebe um `aulaId` verifica de quem é a aula e responde **404** em vez de 403, para não confirmar que existe uma aula que ela não vai servir.

**Ambiente validado na subida.** O `env.ts` lê o `process.env` com Zod, então um segredo faltando derruba o servidor no início em vez de falhar depois, na requisição de alguém.

As senhas usam bcrypt. O limite de requisições é apoiado em Redis e se aplica globalmente, no login e em toda rota que dispara e-mail.

---

## 📡 Rotas da API

URL base: `/`

### Alunos — `/aluno`

| Método | Rota                  | Descrição                            |
| ------ | --------------------- | ------------------------------------ |
| POST   | `/registro`           | Cadastro com o código da turma       |
| POST   | `/verificar-codigo`   | Confirma o código enviado por e-mail |
| POST   | `/reenviar`           | Reenvia o código de verificação      |
| POST   | `/login`              | Entra e recebe um JWT válido por 8h  |
| POST   | `/codigo-troca-senha` | Pede o código de troca de senha      |
| POST   | `/trocar-senha`       | Define a nova senha usando o código  |

### Chat — `/chat` _(token de aluno)_

| Método | Rota           | Descrição                                      |
| ------ | -------------- | ---------------------------------------------- |
| POST   | `/`            | Envia uma mensagem e recebe a resposta do Braz |
| GET    | `/chat-aberto` | Histórico da conversa da aula aberta           |

### Professoras — `/professor`

| Método | Rota          | Descrição                                      |
| ------ | ------------- | ---------------------------------------------- |
| GET    | `/`           | Lista pública de professoras, alimenta o login |
| POST   | `/login`      | Entra com a chave de acesso                    |
| GET    | `/disciplina` | Disciplinas da professora logada               |
| PATCH  | `/nome`       | Atualiza o próprio nome                        |

### Aulas — `/aula`

| Método | Rota                       | Acesso     | Descrição                                             |
| ------ | -------------------------- | ---------- | ----------------------------------------------------- |
| GET    | `/eventos`                 | público    | Fluxo SSE, avisa que o estado da aula mudou           |
| GET    | `/aberta`                  | público    | A aula aberta no momento, de quem for                 |
| GET    | `/atual`                   | professora | A aula aberta dela, ou null                           |
| POST   | `/abrir`                   | professora | Abre uma aula, encerrando qualquer outra aberta       |
| POST   | `/fechar/:aulaId`          | professora | Encerra e gera os relatórios                          |
| POST   | `/gerar-relatorio/:aulaId` | professora | Gera apenas os relatórios que faltam                  |
| POST   | `/pausar/:aulaId`          | professora | Suspende as respostas sem encerrar a aula             |
| POST   | `/despausar/:aulaId`       | professora | Retoma                                                |
| GET    | `/buscar-aula`             | professora | As 15 últimas aulas dela, com a contagem de pendentes |
| GET    | `/relatorio/:aulaId`       | professora | Relatórios de uma aula                                |

O evento do SSE não carrega dado nenhum (`data: {}`). Ele só diz que algo mudou, e o cliente busca o estado. É isso que permite manter o fluxo público sem expor nada.

---

## 🔒 Dados e privacidade

Este projeto lida com dados de adolescentes numa escola pública, então algumas coisas são deliberadas, não acidentais.

A atividade acontece sob um **termo de anuência assinado pela direção da escola**. A base legal declarada aos alunos é o consentimento, e recusar usar o Braz não afeta nota nenhuma.

As conversas são apagadas assim que o relatório é escrito, ou em 15 dias caso a aula nunca seja encerrada. Relatórios e contas ficam até o fim do ano letivo e depois são excluídos pelo `scripts/limparAnoLetivo.ts`. Pedidos individuais de exclusão são atendidos pelo `scripts/excluirAluno.ts`, e o `RegistroExclusao` registra que houve exclusão sem guardar quem foi excluído.

Os relatórios descrevem comportamento observado, nunca características: o que o aluno fez, nunca o que ele é.

Política completa: [/privacidade](https://github.com/Geovanni-dev/Braz-chat) no frontend.

Contato para pedidos sobre dados: `projetobraz.umbelina@gmail.com`

---

## 🚀 Rodando localmente

### Pré-requisitos

- Node.js 20 ou mais novo
- Um banco PostgreSQL
- Uma instância Redis
- Uma chave da API do DeepSeek
- Uma conta na Brevo para e-mail transacional

### Passos

```bash
# 1. Instale as dependências
yarn install

# 2. Crie seu .env a partir da referência
cp .env.example .env

# 3. Aplique as migrations e gere o cliente do Prisma
yarn prisma:migrate
yarn prisma:generate

# 4. Popule professoras, disciplinas e chaves de acesso
yarn seed

# 5. Suba o servidor de desenvolvimento
yarn dev
```

### Variáveis de ambiente

| Variável           | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `DATABASE_URL`     | String de conexão do PostgreSQL                   |
| `REDIS_URL`        | String de conexão do Redis                        |
| `DEEPSEEK_API_KEY` | Chave da API do DeepSeek                          |
| `JWT_SECRET`       | Segredo usado para assinar os tokens              |
| `CODIGO_TURMA`     | Código da turma que o aluno digita no cadastro    |
| `BREVO_EMAIL`      | Remetente do e-mail transacional                  |
| `BREVO_API_KEY`    | Chave da API da Brevo                             |
| `CLIENT_URL`       | Origens permitidas no CORS, separadas por vírgula |

> ⚠️ As conversas são enviadas para a API do DeepSeek para processamento, que armazena e processa os dados na China. Um pedido de opt-out do uso para treino foi enviado em 11 de setembro de 2026 e aguarda confirmação; a política de privacidade já reflete isso e deve ser atualizada assim que o DeepSeek confirmar.

O `PORT` é injetado pela hospedagem e não deve ser definido na mão.

---

## 🌐 Deploy

Hospedado na **Render**, com PostgreSQL na **Neon** e Redis na **Upstash**.

Comando de build:

```bash
yarn install && npx prisma generate && npx prisma migrate deploy && yarn build
```

Comando de start: `yarn start`

---

## 📄 Licença

**[MIT](./LICENSE) © Geovani Eterno Rodrigues**
