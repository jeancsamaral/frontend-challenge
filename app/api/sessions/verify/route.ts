import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Código da sala é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar sessão pelo código
    const session = await prisma.session.findUnique({
      where: {
        code: code.toUpperCase()
      },
      include: {
        presentation: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    // Retornar dados da sessão
    return NextResponse.json({
      id: session.id,
      code: session.code,
      title: session.title,
      isActive: session.isActive,
      presentation: session.presentation
    });

  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 