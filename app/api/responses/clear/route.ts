import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  try {
    const { slideId } = await request.json();

    if (!slideId) {
      return NextResponse.json(
        { error: 'ID do slide é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🗑️ API: Clearing all responses for slide ${slideId}`);
    
    // Buscar respostas que serão deletadas para logs
    const responsesToDelete = await prisma.studentResponse.findMany({
      where: {
        slideId: slideId
      },
      select: {
        id: true,
        studentId: true,
      }
    });

    // Deletar todas as respostas do slide
    const deleteResult = await prisma.studentResponse.deleteMany({
      where: {
        slideId: slideId
      }
    });

    console.log(`🗑️ API: Deleted ${deleteResult.count} responses for slide ${slideId}`);
    
    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `${deleteResult.count} respostas foram removidas`
    });

  } catch (error) {
    console.error('Erro ao limpar respostas do slide:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 