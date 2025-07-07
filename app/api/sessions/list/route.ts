import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
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

    // Buscar sessões do usuário (versão simplificada para evitar erros de tipo)
    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        code: session.code,
        title: session.title,
        isActive: session.isActive,
        presentationId: session.presentationId,
        totalParticipants: session.totalParticipants,
        totalResponses: session.totalResponses,
        createdAt: session.createdAt,
        startedAt: session.startedAt,
        endedAt: session.endedAt
      }))
    });

  } catch (error) {
    console.error('Erro ao listar sessões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 