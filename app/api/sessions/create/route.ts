import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { presentationId, roomCode } = await request.json();

    if (!presentationId || !roomCode) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se a apresentação existe e pertence ao usuário
    const presentation = await prisma.presentation.findFirst({
      where: {
        id: presentationId,
        userId: user.id
      }
    });

    if (!presentation) {
      return NextResponse.json(
        { error: 'Apresentação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe uma sessão ativa para esta apresentação
    const existingSession = await prisma.session.findFirst({
      where: {
        presentationId: presentationId,
        userId: user.id,
        isActive: true
      }
    });

    if (existingSession) {
      // Se já existe, atualizar o código da sala se necessário
      if (existingSession.code !== roomCode) {
        const updatedSession = await prisma.session.update({
          where: { id: existingSession.id },
          data: { code: roomCode.toUpperCase() }
        });
        
        return NextResponse.json({
          id: updatedSession.id,
          code: updatedSession.code,
          title: updatedSession.title,
          isActive: updatedSession.isActive,
          presentation: {
            id: presentation.id,
            title: presentation.title
          }
        });
      }
      
      return NextResponse.json({
        id: existingSession.id,
        code: existingSession.code,
        title: existingSession.title,
        isActive: existingSession.isActive,
        presentation: {
          id: presentation.id,
          title: presentation.title
        }
      });
    }

    // Criar nova sessão
    const newSession = await prisma.session.create({
      data: {
        code: roomCode.toUpperCase(),
        title: `Sessão: ${presentation.title}`,
        userId: user.id,
        presentationId: presentation.id,
        isActive: true,
        allowLateJoin: true,
        showResults: true
      }
    });

    return NextResponse.json({
      id: newSession.id,
      code: newSession.code,
      title: newSession.title,
      isActive: newSession.isActive,
      presentation: {
        id: presentation.id,
        title: presentation.title
      }
    });

  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 