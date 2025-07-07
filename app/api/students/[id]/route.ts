import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const studentId = params.id;

    if (!studentId) {
      return NextResponse.json(
        { error: 'ID do estudante é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar estudante pelo ID
    const student = await prisma.student.findUnique({
      where: {
        id: studentId
      },
      select: {
        id: true,
        registrationNumber: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Estudante não encontrado' },
        { status: 404 }
      );
    }

    if (!student.isActive) {
      return NextResponse.json(
        { error: 'Estudante inativo' },
        { status: 403 }
      );
    }

    // Retornar dados do estudante
    return NextResponse.json({
      id: student.id,
      registrationNumber: student.registrationNumber,
      name: student.name,
      email: student.email,
      createdAt: student.createdAt
    });

  } catch (error) {
    console.error('Erro ao buscar estudante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 