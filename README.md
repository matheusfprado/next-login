🚀 Painel de Criptomoedas – Next.js

Este é um projeto Next.js criado com create-next-app
, desenvolvido para acompanhar cotações de criptomoedas e as últimas notícias do mercado cripto em tempo real.

📦 Tecnologias Utilizadas

Next.js
 – Framework React para SSR/SSG

React
 – Biblioteca para UI

TypeScript
 – Tipagem estática

Tailwind CSS
 – Estilização utilitária

NextAuth
 – Autenticação

Prisma
 – ORM para banco de dados

CoinGecko API
 – Dados de preços de criptomoedas

Crypto News RSS
 – Feed de notícias sobre criptomoedas

⚡ Funcionalidades

✅ Login e cadastro com email e senha
✅ Autenticação via SMS (OTP) usando Twilio
✅ Painel do usuário protegido por autenticação
✅ Acompanhamento das principais criptomoedas
✅ Feed com as últimas notícias do mercado cripto
✅ Layout minimalista, moderno e responsivo
✅ Dark mode habilitado 🌙

📸 Preview
🔐 Login

Formulário estilizado com Tailwind.

📊 Dashboard

Painel com informações de preços de criptomoedas.

📰 Últimas Notícias

Integração com feed RSS, exibindo cards com imagens, título, fonte e data.

💻 Como rodar o projeto localmente
1. Clone o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio

2. Instale as dependências
npm install
# ou
yarn
# ou
pnpm install

3. Configure variáveis de ambiente

Crie um arquivo .env.local na raiz do projeto e adicione:

DATABASE_URL="sua_string_de_conexao_prisma"
NEXTAUTH_SECRET="uma_chave_segura"
NEXTAUTH_URL="http://localhost:3000"
TWILIO_ACCOUNT_SID="seu_account_sid"
TWILIO_AUTH_TOKEN="seu_auth_token"
TWILIO_VERIFY_SID="seu_verify_sid"
TWILIO_MESSAGING_SERVICE_SID="seu_messaging_service"
EMAIL_HOST="smtp.seuprovedor.com"
EMAIL_PORT="465"
EMAIL_USER="seu_usuario"
EMAIL_PASS="sua_senha"
EMAIL_FROM="InvestHub <no-reply@seuprojeto.com>"

4. Rode as migrações do Prisma
npx prisma migrate dev

5. Inicie o servidor de desenvolvimento
npm run dev
# ou
yarn dev
# ou
pnpm dev
