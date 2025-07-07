import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slideId = params.id;
    
    if (!slideId) {
      return NextResponse.json(
        { success: false, error: 'ID do slide é obrigatório' },
        { status: 400 }
      );
    }

    // For now, we'll load from the generated JSON files
    // In a real app, this would come from your database
    const generatedPath = join(process.cwd(), 'app/generated');
    
    if (!existsSync(generatedPath)) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma apresentação encontrada' },
        { status: 404 }
      );
    }

    // Find the presentation that contains this slide
    const files = require('fs').readdirSync(generatedPath);
    let foundSlide = null;

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = join(generatedPath, file);
          const presentation = JSON.parse(readFileSync(filePath, 'utf-8'));
          
          const slide = presentation.slides?.find((s: any) => s.id === slideId);
          if (slide) {
            foundSlide = slide;
            break;
          }
        } catch (err) {
          console.error(`Error reading file ${file}:`, err);
          continue;
        }
      }
    }

    if (!foundSlide) {
      return NextResponse.json(
        { success: false, error: 'Slide não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: foundSlide
    });

  } catch (error) {
    console.error('Error fetching slide:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 