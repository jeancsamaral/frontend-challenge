import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { studentId, slideId, elementId, value, responseTime } = await request.json();

    // Validar campos obrigatórios
    if (!studentId || !slideId || !elementId || value === undefined) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se o estudante existe
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, isActive: true }
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

    // Verificar se o slide existe
    const slide = await prisma.slide.findUnique({
      where: { id: slideId },
      select: { id: true, isInteractive: true }
    });

    if (!slide) {
      return NextResponse.json(
        { error: 'Slide não encontrado' },
        { status: 404 }
      );
    }

    // Buscar sessão ativa relacionada ao slide
    const session = await prisma.session.findFirst({
      where: {
        presentation: {
          slides: {
            some: {
              id: slideId
            }
          }
        },
        isActive: true
      },
      select: { id: true }
    });

    // Verificar se já existe uma resposta deste estudante para este slide/elemento
    const existingResponse = await prisma.studentResponse.findFirst({
      where: {
        studentId: studentId,
        slideId: slideId,
        response: {
          path: ['elementId'],
          equals: elementId
        }
      }
    });

    let savedResponse;

    if (existingResponse) {
      // Atualizar resposta existente
      savedResponse = await prisma.studentResponse.update({
        where: {
          id: existingResponse.id
        },
        data: {
          response: {
            elementId,
            value,
            timestamp: new Date().toISOString()
          },
          responseTime: responseTime || null,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null
        }
      });
    } else {
      // Criar nova resposta
      savedResponse = await prisma.studentResponse.create({
        data: {
          studentId: studentId,
          slideId: slideId,
          sessionId: session?.id || null,
          response: {
            elementId,
            value,
            timestamp: new Date().toISOString()
          },
          responseTime: responseTime || null,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null
        }
      });

      // Incrementar contador de respostas na sessão
      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: {
            totalResponses: {
              increment: 1
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      responseId: savedResponse.id,
      message: existingResponse ? 'Resposta atualizada' : 'Resposta salva'
    });

  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 