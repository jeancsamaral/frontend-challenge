import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Função para criar dados de exemplo para novos usuários
async function createSampleDataForUser(userId: string) {
  try {
    // Criar uma apresentação de exemplo
    await prisma.presentation.create({
      data: {
        title: 'Minha Primeira Apresentação',
        description: 'Uma apresentação de exemplo para começar',
        userId: userId,
        slides: {
          create: [
            {
              title: 'Slide de Boas-vindas',
              order: 0,
              type: 'TITLE',
              elements: {
                create: [
                  {
                    type: 'TEXT',
                    content: 'Bem-vindo ao Editor de Slides!',
                    position: { x: 100, y: 100 },
                    size: { width: 400, height: 80 },
                    style: {
                      fontSize: 32,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center'
                    }
                  },
                  {
                    type: 'TEXT',
                    content: 'Crie apresentações interativas e envolventes',
                    position: { x: 100, y: 200 },
                    size: { width: 400, height: 60 },
                    style: {
                      fontSize: 18,
                      color: '#6b7280',
                      textAlign: 'center'
                    }
                  }
                ]
              }
            },
            {
              title: 'Slide Interativo',
              order: 1,
              type: 'INTERACTIVE',
              isInteractive: true,
              question: 'Qual é sua ferramenta favorita para apresentações?',
              interactiveType: 'MULTIPLE_CHOICE',
              options: {
                choices: [
                  { id: '1', text: 'PowerPoint', votes: 0 },
                  { id: '2', text: 'Google Slides', votes: 0 },
                  { id: '3', text: 'Teachy Slides', votes: 0 },
                  { id: '4', text: 'Outras', votes: 0 }
                ]
              },
              elements: {
                create: [
                  {
                    type: 'TEXT',
                    content: 'Slide com Elemento Interativo',
                    position: { x: 100, y: 50 },
                    size: { width: 400, height: 60 },
                    style: {
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center'
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    })
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Buscar usuário no banco de dados
          let user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          // Se o usuário não existir, criar um novo (para o sistema de demonstração)
          if (!user) {
            // Hash da senha
            const hashedPassword = await bcrypt.hash(credentials.password, 12)
            
            // Criar usuário no banco de dados
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0],
                password: hashedPassword
              }
            })

            // Para demonstração, criar alguns dados de exemplo
            await createSampleDataForUser(user.id)
            
            return {
              id: user.id,
              name: user.name || credentials.email.split('@')[0],
              email: user.email,
              image: user.image
            }
          }

          // Verificar credenciais específicas de teste
          if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
            // Se não tem senha cadastrada, criar uma
            if (!user.password) {
              const hashedPassword = await bcrypt.hash('password', 12)
              user = await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
              })
            }
            return {
              id: user.id,
              name: user.name || 'Admin User',
              email: user.email,
              image: user.image
            }
          }

          // Para outros usuários, verificar se a senha está correta
          if (user.password) {
            const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password)
            if (!isPasswordCorrect) {
              return null
            }
          } else {
            // Se não tem senha cadastrada, criar uma nova
            const hashedPassword = await bcrypt.hash(credentials.password, 12)
            user = await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword }
            })
          }
          
          return {
            id: user.id,
            name: user.name || credentials.email.split('@')[0],
            email: user.email,
            image: user.image
          }
        } catch (error) {
          console.error('Erro na autenticação:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Se a URL contém o editor, manter
      if (url.includes('/editor')) {
        return url.startsWith(baseUrl) ? url : `${baseUrl}/editor`
      }
      // Se é uma URL do student, manter
      if (url.includes('/student')) {
        return url.startsWith(baseUrl) ? url : `${baseUrl}${new URL(url).pathname}`
      }
      // Se é uma URL de auth, manter
      if (url.includes('/auth')) {
        return url.startsWith(baseUrl) ? url : `${baseUrl}${new URL(url).pathname}`
      }
      // Por padrão, redirecionar para o editor
      return `${baseUrl}/editor`
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', code, metadata)
    },
    warn(code) {
      console.warn('[NextAuth Warning]', code)
    },
    debug(code, metadata) {
      console.log('[NextAuth Debug]', code, metadata)
    }
  }
} 