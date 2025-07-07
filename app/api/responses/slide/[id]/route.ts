import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slideId = params.id;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId'); // Filtro opcional por estudante

    if (!slideId) {
      return NextResponse.json(
        { error: 'ID do slide é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📊 API: Fetching responses for slide ${slideId}${studentId ? ` for student ${studentId}` : ''}`);
    
    // Buscar respostas do banco de dados (sem dados do estudante para evitar problemas de tipo)
    const responses = await prisma.studentResponse.findMany({
      where: {
        slideId: slideId,
        ...(studentId && { studentId: studentId }), // Filtrar por estudante se fornecido
      },
      select: {
        id: true,
        response: true,
        createdAt: true,
        studentId: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 API: Found ${responses.length} responses for slide ${slideId}`);
    
    return NextResponse.json({
      success: true,
      responses: responses,
      count: responses.length
    });

  } catch (error) {
    console.error('Erro ao buscar respostas do slide:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 