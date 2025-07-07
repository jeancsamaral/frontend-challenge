import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário admin de teste
  const adminEmail = 'admin@example.com'
  const adminPassword = 'password'
  
  // Verificar se o usuário admin já existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('👤 Usuário admin já existe, atualizando senha...')
    
    // Atualizar senha do admin
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { password: hashedPassword }
    })
  } else {
    console.log('👤 Criando usuário admin...')
    
    // Criar usuário admin
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword
      }
    })

    console.log('📊 Criando apresentação de exemplo para admin...')
    
    // Criar apresentação de exemplo para o admin
    await prisma.presentation.create({
      data: {
        title: 'Apresentação de Demonstração',
        description: 'Uma apresentação completa para demonstrar todas as funcionalidades',
        userId: adminUser.id,
        hasInteractiveElements: true,
        slides: {
          create: [
            {
              title: 'Slide de Abertura',
              order: 0,
              type: 'TITLE',
              elements: {
                create: [
                  {
                    type: 'TEXT',
                    content: 'Teachy Slide Editor',
                    position: { x: 150, y: 100 },
                    size: { width: 500, height: 80 },
                    style: {
                      fontSize: 48,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center'
                    }
                  },
                  {
                    type: 'TEXT',
                    content: 'Crie apresentações interativas e envolventes para seus alunos',
                    position: { x: 150, y: 200 },
                    size: { width: 500, height: 60 },
                    style: {
                      fontSize: 20,
                      color: '#6b7280',
                      textAlign: 'center'
                    }
                  }
                ]
              }
            },
            {
              title: 'Recursos Principais',
              order: 1,
              type: 'STANDARD',
              elements: {
                create: [
                  {
                    type: 'TEXT',
                    content: 'Recursos Principais',
                    position: { x: 100, y: 50 },
                    size: { width: 400, height: 60 },
                    style: {
                      fontSize: 32,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center'
                    }
                  },
                  {
                    type: 'TEXT',
                    content: '• Editor visual intuitivo\n• Elementos interativos\n• Respostas em tempo real\n• Exportação e compartilhamento',
                    position: { x: 100, y: 150 },
                    size: { width: 400, height: 200 },
                    style: {
                      fontSize: 18,
                      color: '#374151',
                      textAlign: 'left'
                    }
                  }
                ]
              }
            },
            {
              title: 'Enquete Interativa',
              order: 2,
              type: 'INTERACTIVE',
              isInteractive: true,
              question: 'Qual recurso você considera mais importante em uma apresentação?',
              interactiveType: 'MULTIPLE_CHOICE',
              options: {
                choices: [
                  { id: '1', text: 'Interatividade', votes: 0 },
                  { id: '2', text: 'Design Visual', votes: 0 },
                  { id: '3', text: 'Facilidade de Uso', votes: 0 },
                  { id: '4', text: 'Recursos Colaborativos', votes: 0 }
                ]
              },
              elements: {
                create: [
                  {
                    type: 'TEXT',
                    content: 'Sua Opinião é Importante!',
                    position: { x: 100, y: 50 },
                    size: { width: 400, height: 60 },
                    style: {
                      fontSize: 28,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center'
                    }
                  }
                ]
              }
            },
            {
              title: 'Nuvem de Palavras',
              order: 3,
              type: 'INTERACTIVE',
              isInteractive: true,
              question: 'Descreva em uma palavra como você se sente sobre apresentações interativas',
              interactiveType: 'WORD_CLOUD',
              options: {
                maxWords: 50,
                minLength: 3
              },
              elements: {
                create: [
                  {
                    type: 'TEXT',
                    content: 'Nuvem de Palavras',
                    position: { x: 100, y: 50 },
                    size: { width: 400, height: 60 },
                    style: {
                      fontSize: 32,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center'
                    }
                  }
                ]
              }
            },
            {
              title: 'Conclusão',
              order: 4,
              type: 'CONCLUSION',
              elements: {
                create: [
                  {
                    type: 'TEXT',
                    content: 'Obrigado!',
                    position: { x: 200, y: 150 },
                    size: { width: 400, height: 80 },
                    style: {
                      fontSize: 48,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center'
                    }
                  },
                  {
                    type: 'TEXT',
                    content: 'Esperamos que aproveite o Teachy Slide Editor!',
                    position: { x: 150, y: 250 },
                    size: { width: 500, height: 60 },
                    style: {
                      fontSize: 20,
                      color: '#6b7280',
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
  }

  console.log('✅ Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 