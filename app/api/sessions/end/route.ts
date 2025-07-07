import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { roomCode } = await request.json();

    if (!roomCode) {
      return NextResponse.json(
        { error: 'Código da sala é obrigatório' },
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

    // Buscar e encerrar sessão
    const updatedSession = await prisma.session.updateMany({
      where: {
        code: roomCode.toUpperCase(),
        userId: user.id,
        isActive: true
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    if (updatedSession.count === 0) {
      return NextResponse.json(
        { error: 'Sessão não encontrada ou já encerrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sessão encerrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao encerrar sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 