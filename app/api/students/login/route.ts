import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { registrationNumber, name, sessionId } = await request.json();

    // Validar campos obrigatórios
    if (!registrationNumber || !name || !sessionId) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a sessão existe e está ativa
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { isActive: true, allowLateJoin: true }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    if (!session.isActive) {
      return NextResponse.json(
        { error: 'Esta sessão não está ativa' },
        { status: 403 }
      );
    }

    // Buscar ou criar estudante
    let student = await prisma.student.findUnique({
      where: { registrationNumber: registrationNumber.toString() }
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          registrationNumber: registrationNumber.toString(),
          name: name.trim(),
          isActive: true
        }
      });
    } else {
      // Atualizar nome se mudou
      if (student.name !== name.trim()) {
        student = await prisma.student.update({
          where: { id: student.id },
          data: { name: name.trim() }
        });
      }
    }

    // Verificar se o estudante já está na sessão
    const existingSessionStudent = await prisma.sessionStudent.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: sessionId,
          studentId: student.id
        }
      }
    });

    // Se não está na sessão, criar registro
    if (!existingSessionStudent) {
      await prisma.sessionStudent.create({
        data: {
          sessionId: sessionId,
          studentId: student.id,
          isActive: true
        }
      });

      // Atualizar contador de participantes na sessão
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          totalParticipants: {
            increment: 1
          }
        }
      });
    } else {
      // Reativar se estava inativo
      if (!existingSessionStudent.isActive) {
        await prisma.sessionStudent.update({
          where: {
            sessionId_studentId: {
              sessionId: sessionId,
              studentId: student.id
            }
          },
          data: {
            isActive: true,
            leftAt: null
          }
        });
      }
    }

    // Retornar dados do estudante
    return NextResponse.json({
      id: student.id,
      registrationNumber: student.registrationNumber,
      name: student.name,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Erro no login do estudante:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 