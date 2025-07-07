import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface SlideData {
  id: string;
  title?: string;
  isInteractive?: boolean;
  backgroundColor?: string;
  question?: string;
  interactiveType?: string;
  options?: any;
  interactivePosition?: { x: number; y: number };
  interactiveSize?: { width: number; height: number };
  elements?: ElementData[];
}

interface ElementData {
  id: string;
  type: string;
  content?: string;
  position: any;
  size: any;
  style?: any;
  isLocked?: boolean;
  isVisible?: boolean;
  zIndex?: number;
  animations?: any;
  interactions?: any;
}

interface PresentationData {
  id: string;
  title: string;
  description?: string;
  slides: SlideData[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get specific presentation
      const presentation = await prisma.presentation.findUnique({
        where: { id },
        include: {
          slides: {
            include: {
              elements: true,
              responses: true,
            },
            orderBy: { order: 'asc' },
          },
          sessions: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!presentation) {
        return NextResponse.json({
          success: false,
          error: 'Presentation not found',
        }, { status: 404 });
      }

                // Transform data to match frontend types
          const transformedPresentation = {
            id: presentation.id,
            title: presentation.title,
            description: presentation.description,
            slides: presentation.slides.map((slide: any) => ({
              id: slide.id,
              title: slide.title,
              elements: slide.elements.map((element: any) => {
                const baseElement = {
                  id: element.id,
                  type: element.type.toLowerCase(), // Convert back to lowercase for frontend
                  content: element.content,
                  position: element.position,
                  size: element.size,
                  isLocked: element.isLocked,
                  isVisible: element.isVisible,
                  zIndex: element.zIndex,
                  animations: element.animations,
                  interactions: element.interactions,
                };

                // For text elements, convert style object to individual properties
                if (element.type.toLowerCase() === 'text' && element.style) {
                  return {
                    ...baseElement,
                    fontSize: element.style.fontSize || 16,
                    fontFamily: element.style.fontFamily || 'Arial',
                    color: element.style.color || '#000000',
                    fontWeight: element.style.fontWeight || 'normal',
                    textAlign: element.style.textAlign || 'left',
                  };
                }

                // For image elements, preserve src and alt
                if (element.type.toLowerCase() === 'image') {
                  return {
                    ...baseElement,
                    src: element.content || '',
                    alt: element.style?.alt || '',
                  };
                }

                return baseElement;
              }),
          backgroundColor: typeof slide.background === 'object' && slide.background && 'backgroundColor' in slide.background 
             ? (slide.background as any).backgroundColor 
             : '#ffffff',
          isInteractive: slide.isInteractive,
          question: slide.question,
          interactiveType: slide.interactiveType ? slide.interactiveType.toLowerCase().replace('_', '-') : null, // Convert back to hyphens for frontend
          options: slide.options,
          interactivePosition: slide.interactivePosition,
          interactiveSize: slide.interactiveSize,
          createdAt: slide.createdAt,
          updatedAt: slide.updatedAt,
        })),
        hasInteractiveElements: presentation.hasInteractiveElements,
        currentSlideIndex: 0,
        createdAt: presentation.createdAt,
        updatedAt: presentation.updatedAt,
      };

      return NextResponse.json({
        success: true,
        data: transformedPresentation,
      });
    }

    // Get all presentations for the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const presentations = await prisma.presentation.findMany({
      where: { userId: user.id },
      include: {
        slides: {
          select: { id: true },
        },
        _count: {
          select: { slides: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform data for presentation list
    const transformedPresentations = presentations.map((presentation: any) => ({
      id: presentation.id,
      title: presentation.title,
      description: presentation.description,
      thumbnail: presentation.thumbnail,
      slidesCount: presentation._count.slides,
      hasInteractiveElements: presentation.hasInteractiveElements,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedPresentations,
    });

  } catch (error) {
    console.error('Error fetching presentations:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const presentationData: PresentationData = await request.json();
    
    // Validate presentation data
    if (!presentationData.title || !presentationData.slides) {
      return NextResponse.json({
        success: false,
        error: 'Invalid presentation data',
      }, { status: 400 });
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {
        name: session.user.name,
        image: session.user.image,
      },
      create: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    });

    // Check if presentation exists (update) or create new
    const existingPresentation = await prisma.presentation.findUnique({
      where: { id: presentationData.id },
    });

    if (existingPresentation) {
      // Update existing presentation
      const updatedPresentation = await prisma.presentation.update({
        where: { id: presentationData.id },
        data: {
          title: presentationData.title,
          description: presentationData.description,
          hasInteractiveElements: presentationData.slides.some((slide: SlideData) => slide.isInteractive),
          updatedAt: new Date(),
        },
        include: {
          slides: {
            include: {
              elements: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      // Get current slide IDs from the presentation
      const currentSlideIds = presentationData.slides.map(slide => slide.id);
      
      // Delete slides that are no longer in the presentation
      await prisma.slide.deleteMany({
        where: {
          presentationId: presentationData.id,
          id: {
            notIn: currentSlideIds,
          },
        },
      });

      // Update slides
      for (let i = 0; i < presentationData.slides.length; i++) {
        const slideData = presentationData.slides[i];
        
        await prisma.slide.upsert({
          where: { id: slideData.id },
          update: {
            title: slideData.title,
            order: i,
            type: slideData.isInteractive ? 'INTERACTIVE' : 'STANDARD',
            background: slideData.backgroundColor ? { backgroundColor: slideData.backgroundColor } : undefined,
            isInteractive: slideData.isInteractive || false,
            question: slideData.question,
            interactiveType: slideData.interactiveType ? slideData.interactiveType.toUpperCase().replace('-', '_') as any : null,
            options: slideData.options,
            interactivePosition: slideData.interactivePosition,
            interactiveSize: slideData.interactiveSize,
            updatedAt: new Date(),
          },
          create: {
            id: slideData.id,
            title: slideData.title,
            order: i,
            type: slideData.isInteractive ? 'INTERACTIVE' : 'STANDARD',
            background: slideData.backgroundColor ? { backgroundColor: slideData.backgroundColor } : undefined,
            isInteractive: slideData.isInteractive || false,
            question: slideData.question,
            interactiveType: slideData.interactiveType ? slideData.interactiveType.toUpperCase().replace('-', '_') as any : null,
            options: slideData.options,
            interactivePosition: slideData.interactivePosition,
            interactiveSize: slideData.interactiveSize,
            presentationId: presentationData.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Update slide elements
        if (slideData.elements) {
          // Remove existing elements
          await prisma.slideElement.deleteMany({
            where: { slideId: slideData.id },
          });

          // Add new elements (excluding interactive elements)
          for (const element of slideData.elements) {
            // Skip interactive elements - they are handled as slide properties
            if (element.type === 'interactive') {
              continue;
            }
            
            // Convert text element properties to style object
            let styleData = element.style || {};
            
            // For text elements, convert individual properties to style object
            if (element.type === 'text' && element.content) {
              styleData = {
                fontSize: (element as any).fontSize || 16,
                fontFamily: (element as any).fontFamily || 'Arial',
                color: (element as any).color || '#000000',
                fontWeight: (element as any).fontWeight || 'normal',
                textAlign: (element as any).textAlign || 'left',
              };
            }

            // For image elements, preserve alt in style
            if (element.type === 'image') {
              styleData = {
                alt: (element as any).alt || '',
              };
            }
            
            await prisma.slideElement.create({
              data: {
                id: element.id,
                type: element.type.toUpperCase() as any, // Convert to uppercase for enum
                content: element.type === 'image' ? (element as any).src : element.content,
                position: element.position,
                size: element.size,
                style: styleData,
                isLocked: element.isLocked || false,
                isVisible: element.isVisible !== false,
                zIndex: element.zIndex || 0,
                animations: element.animations,
                interactions: element.interactions,
                slideId: slideData.id,
              },
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          id: updatedPresentation.id,
          title: updatedPresentation.title,
          description: updatedPresentation.description,
          slides: presentationData.slides,
          hasInteractiveElements: updatedPresentation.hasInteractiveElements,
          createdAt: updatedPresentation.createdAt,
          updatedAt: updatedPresentation.updatedAt,
        },
      });

    } else {
      // Create new presentation
      const newPresentation = await prisma.presentation.create({
        data: {
          id: presentationData.id,
          title: presentationData.title,
          description: presentationData.description,
          hasInteractiveElements: presentationData.slides.some((slide: SlideData) => slide.isInteractive),
          userId: user.id,
          slides: {
            create: presentationData.slides.map((slide: SlideData, index: number) => ({
              id: slide.id,
              title: slide.title,
              order: index,
              type: slide.isInteractive ? 'INTERACTIVE' : 'STANDARD',
              background: slide.backgroundColor ? { backgroundColor: slide.backgroundColor } : undefined,
              isInteractive: slide.isInteractive || false,
              question: slide.question,
              interactiveType: slide.interactiveType ? slide.interactiveType.toUpperCase().replace('-', '_') as any : null,
              options: slide.options,
              interactivePosition: slide.interactivePosition,
              interactiveSize: slide.interactiveSize,
              elements: {
                create: slide.elements?.filter((element: ElementData) => element.type !== 'interactive').map((element: ElementData) => {
                  // Convert text element properties to style object
                  let styleData = element.style || {};
                  
                  // For text elements, convert individual properties to style object
                  if (element.type === 'text' && element.content) {
                    styleData = {
                      fontSize: (element as any).fontSize || 16,
                      fontFamily: (element as any).fontFamily || 'Arial',
                      color: (element as any).color || '#000000',
                      fontWeight: (element as any).fontWeight || 'normal',
                      textAlign: (element as any).textAlign || 'left',
                    };
                  }

                  // For image elements, preserve alt in style
                  if (element.type === 'image') {
                    styleData = {
                      alt: (element as any).alt || '',
                    };
                  }
                  
                  return {
                    id: element.id,
                    type: element.type.toUpperCase() as any, // Convert to uppercase for enum
                    content: element.type === 'image' ? (element as any).src : element.content,
                    position: element.position,
                    size: element.size,
                    style: styleData,
                    isLocked: element.isLocked || false,
                    isVisible: element.isVisible !== false,
                    zIndex: element.zIndex || 0,
                    animations: element.animations,
                    interactions: element.interactions,
                  };
                }) || [],
              },
            })),
          },
        },
        include: {
          slides: {
            include: {
              elements: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: newPresentation.id,
          title: newPresentation.title,
          description: newPresentation.description,
          slides: presentationData.slides,
          hasInteractiveElements: newPresentation.hasInteractiveElements,
          createdAt: newPresentation.createdAt,
          updatedAt: newPresentation.updatedAt,
        },
      });
    }

  } catch (error) {
    console.error('Error saving presentation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save presentation',
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Presentation ID is required',
      }, { status: 400 });
    }

    // Check if presentation exists and belongs to user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const presentation = await prisma.presentation.findUnique({
      where: { id },
    });

    if (!presentation) {
      return NextResponse.json({
        success: false,
        error: 'Presentation not found',
      }, { status: 404 });
    }

    if (presentation.userId !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 403 });
    }

    // Delete presentation (cascade will handle slides and elements)
    await prisma.presentation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Presentation deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting presentation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete presentation',
    }, { status: 500 });
  }
} 