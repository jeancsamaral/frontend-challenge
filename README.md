# Teachy - Sistema de Apresentações Interativas

Um editor de slides moderno e interativo construído com Next.js que permite professores criarem apresentações envolventes com interações em tempo real dos estudantes, similar ao Mentimeter.

## Características

### Editor de Slides Principal
- Criar e gerenciar múltiplos slides
- Navegar entre slides com barra lateral
- Adicionar e editar elementos de texto (arrastar, redimensionar, estilizar)
- Adicionar e editar imagens (arrastar, redimensionar, deletar)
- Deletar elementos dos slides
- Salvar e carregar apresentações
- Interface responsiva e moderna com Tailwind CSS

### Elementos Interativos
Três tipos de slides interativos implementados:

1. **Questões de Múltipla Escolha** - Estudantes selecionam entre opções predefinidas
2. **Nuvem de Palavras** - Estudantes enviam palavras que podem ser visualizadas
3. **Enquete ao Vivo** - Estudantes enviam respostas abertas

### Interface do Estudante
- Interface limpa e amigável para mobile
- Participar usando códigos simples de sala
- Envio de respostas em tempo real
- Feedback de sucesso após envio

### Sistema de Autenticação
- Login com email/senha
- Login com Google OAuth (configurável)
- Login com GitHub OAuth (configurável)
- Proteção de rotas
- Interface moderna e responsiva

### Comunicação em Tempo Real
- Sistema completo com Socket.IO
- Sincronização automática professor-estudantes
- Visualização de respostas em tempo real
- Controle de sessões ao vivo

## Passo a Passo para Rodar a Aplicação

### Pré-requisitos
- Node.js 18 ou superior
- npm ou yarn
- Git

### 1. Clonagem e Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd frontend-challenge

# Instale as dependências
npm install
```

### 2. Configuração do Banco de Dados

```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações do banco
npx prisma migrate dev

# (Opcional) Popule o banco com dados de teste
npm run seed
```

### 3. Configuração das Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Configuração NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-super-segura

# Configuração do Banco de Dados
DATABASE_URL="file:./dev.db"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret

# GitHub OAuth (opcional)
GITHUB_ID=seu-github-id
GITHUB_SECRET=seu-github-secret

# AWS S3 (opcional - para upload de imagens)
AWS_ACCESS_KEY_ID=sua-aws-access-key
AWS_SECRET_ACCESS_KEY=sua-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu-bucket-name
```

**Para gerar uma chave secreta segura:**
```bash
openssl rand -base64 32
```

### 4. Iniciar a Aplicação

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em: [http://localhost:3000](http://localhost:3000)

### 5. Configuração OAuth (Opcional)

#### Google OAuth:
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Habilite a Google+ API
4. Crie credenciais OAuth 2.0
5. Adicione `http://localhost:3000/api/auth/callback/google` como URI de redirecionamento

#### GitHub OAuth:
1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em "New OAuth App"
3. Adicione `http://localhost:3000/api/auth/callback/github` como Authorization callback URL

## Como Usar a Aplicação

### Para Professores

1. **Fazer Login**
   - Acesse [http://localhost:3000](http://localhost:3000)
   - Clique em "Entrar" no header
   - Use as credenciais: `admin@example.com` / `password`
   - Ou configure OAuth para login com Google/GitHub

2. **Criar Apresentação**
   - Vá para [http://localhost:3000/editor](http://localhost:3000/editor)
   - Crie uma nova apresentação ou carregue uma existente
   - Adicione slides usando a barra lateral
   - Use a barra de ferramentas para adicionar texto, imagens ou elementos interativos

3. **Configurar Elementos Interativos**
   - Selecione um elemento interativo no slide
   - Configure as propriedades no painel lateral
   - Defina perguntas e opções conforme necessário

4. **Iniciar Sessão ao Vivo**
   - Clique no botão "Live" no editor
   - Um código de sala será gerado automaticamente
   - Compartilhe o código ou link com os estudantes
   - Use os controles para navegar entre slides
   - Visualize respostas em tempo real

### Para Estudantes

1. **Participar da Sessão**
   - Acesse [http://localhost:3000/student](http://localhost:3000/student)
   - Insira o código da sala fornecido pelo professor
   - Digite seu nome para identificação

2. **Interagir com a Apresentação**
   - O sistema sincroniza automaticamente com o slide atual
   - Responda às perguntas quando aparecerem
   - Acompanhe a navegação do professor

## Arquitetura do Projeto

```
/app
├── api/                    # Rotas da API
│   ├── auth/              # Autenticação NextAuth
│   ├── sessions/          # Gerenciamento de sessões ao vivo
│   ├── slides/            # API dos slides
│   ├── responses/         # API das respostas
│   ├── students/          # API dos estudantes
│   └── upload/            # Upload de arquivos
├── auth/                  # Páginas de autenticação
├── components/            # Componentes globais
├── editor/                # Interface do professor
│   ├── components/        # Componentes específicos do editor
│   │   ├── SlideCanvas.tsx      # Canvas Konva do editor
│   │   ├── Toolbar.tsx          # Barra de ferramentas
│   │   ├── SlideList.tsx        # Gerenciamento de slides
│   │   ├── PropertiesPanel.tsx  # Propriedades dos elementos
│   │   └── LivePresentationPanel.tsx # Controle ao vivo
│   └── [id]/              # Editor específico de apresentação
├── student/               # Interface do estudante
│   ├── components/        # Componentes específicos do estudante
│   │   ├── InteractiveComponents.tsx # Componentes interativos
│   │   ├── QuestionForm.tsx         # Formulários de questão
│   │   └── SlideViewer.tsx          # Visualizador de slides
│   └── login/             # Login de estudante
├── shared/                # Utilitários compartilhados
│   ├── types.ts          # Interfaces TypeScript
│   ├── hooks.ts          # Hooks customizados
│   └── utils.ts          # Funções utilitárias
└── globals.css           # Estilos globais
```

## Stack Técnico

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilização**: Tailwind CSS 4
- **Canvas**: Konva.js + React-Konva
- **Autenticação**: NextAuth.js
- **Banco de Dados**: Prisma + SQLite (dev) / PostgreSQL (prod)
- **Tempo Real**: Socket.IO
- **Upload**: AWS S3 (configurável)
- **State Management**: React hooks

## Dados de Teste

### Credenciais de Login
- **Admin**: `admin@example.com` / `password`
- **Qualquer email válido** / qualquer senha

### Códigos de Sala de Teste
- `ABC123`, `DEF456`, `GHI789`

### Funcionalidades para Testar
1. Criar e editar slides
2. Adicionar elementos interativos
3. Iniciar sessão ao vivo
4. Testar todos os tipos de interação
5. Múltiplos estudantes simultâneos

## Funcionalidades em Tempo Real

O sistema utiliza Socket.IO para:
- Sincronização automática professor-estudantes
- Navegação de slides em tempo real
- Coleta instantânea de respostas
- Visualizações ao vivo
- Contagem de participantes

## Tipos de Elementos Interativos

### 1. Questões de Múltipla Escolha
- Interface com botões de opção para estudantes
- Visualização em gráfico de barras para professores
- Percentuais em tempo real

### 2. Nuvem de Palavras
- Campo de texto para entrada de palavras
- Dados preparados para visualização em nuvem
- Suporte a múltiplas palavras separadas por vírgula

### 3. Enquete ao Vivo
- Entrada numérica com escalas personalizáveis
- Visualização de médias e distribuições
- Ideal para avaliações e feedback

## Deploy em Produção

### Build Local
```bash
npm run build
npm run start
```

### Deploy na Vercel
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Configure o banco PostgreSQL (recomendado: Supabase ou Railway)
4. Atualize `DATABASE_URL` para o banco de produção

## Melhorias Futuras

- Análise e relatórios pós-apresentação
- Mais tipos de interação (desenho, ranking, drag & drop)
- Templates de apresentação
- Exportação para PDF/imagens
- Edição colaborativa
- Dashboard de analytics
- App móvel dedicado
- Integração com ferramentas de videoconferência

## Solução de Problemas

### Problemas Comuns

1. **Erro de conexão do banco**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

2. **Socket.IO não conecta**
   - Verifique se `/api/socket` está funcionando
   - Confirme que a porta está disponível

3. **Login não funciona**
   - Verifique se `NEXTAUTH_SECRET` está configurado
   - Confirme as configurações OAuth

4. **Upload de imagens falha**
   - Configure as credenciais AWS S3
   - Ou use o armazenamento local (modo dev)

### Logs de Debug
```bash
# Ver logs do Next.js
npm run dev

# Ver logs do Prisma
npx prisma studio
```

## Licença

Este projeto faz parte de um desafio técnico para a Teachy.

---

**Desenvolvido com dedicação para criar experiências educacionais interativas e envolventes.**
