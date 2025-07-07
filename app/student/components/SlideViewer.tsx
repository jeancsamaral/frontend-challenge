'use client';

import React from 'react';
import { Slide, SlideElement, TextElement, ImageElement } from '../../shared/types';

interface SlideViewerProps {
  slide: Slide;
}

// 🎯 DIMENSÕES PADRÃO: Proporção 4:3 como no editor do professor
const SLIDE_WIDTH = 800;
const SLIDE_HEIGHT = 600;

export function SlideViewer({ slide }: SlideViewerProps) {
  if (!slide) {
    return (
      <div 
        className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center relative mx-auto"
        style={{ 
          width: '100%', 
          maxWidth: SLIDE_WIDTH,
          aspectRatio: `${SLIDE_WIDTH}/${SLIDE_HEIGHT}`,
        }}
      >
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">Slide em branco</p>
        </div>
      </div>
    );
  }

  const renderElement = (element: SlideElement) => {
    // 🎯 CORREÇÃO: Calcular proporções baseadas no tamanho atual do container
    const style = {
      position: 'absolute' as const,
      left: `${((element.position?.x || 0) / SLIDE_WIDTH) * 100}%`,
      top: `${((element.position?.y || 0) / SLIDE_HEIGHT) * 100}%`,
      width: `${((element.size?.width || 100) / SLIDE_WIDTH) * 100}%`,
      height: `${((element.size?.height || 50) / SLIDE_HEIGHT) * 100}%`,
      zIndex: element.zIndex || 0,
    };

    switch (element.type) {
      case 'text':
        const textElement = element as TextElement;
        // 🎯 CORREÇÃO: Escalar fontSize proporcionalmente
        const scaledFontSize = Math.max(12, (textElement.fontSize || 16) * 0.8);
        
        return (
          <div
            key={element.id}
            style={{
              ...style,
              fontSize: `${scaledFontSize}px`,
              fontFamily: textElement.fontFamily || 'Arial',
              color: textElement.color || '#000000',
              fontWeight: textElement.fontWeight || 'normal',
              textAlign: textElement.textAlign || 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: textElement.textAlign === 'center' ? 'center' : 
                             textElement.textAlign === 'right' ? 'flex-end' : 'flex-start',
              padding: '4px',
              cursor: 'default',
              wordWrap: 'break-word',
              overflow: 'hidden',
              userSelect: 'none',
              pointerEvents: 'none',
              lineHeight: '1.2',
            }}
          >
            {textElement.content || 'Texto'}
          </div>
        );

      case 'image':
        const imageElement = element as ImageElement;
        return (
          <div
            key={element.id}
            style={style}
            className="overflow-hidden rounded"
          >
            <img
              src={imageElement.src}
              alt={imageElement.alt || 'Imagem do slide'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              onError={(e) => {
                // Fallback para erro de imagem
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px;">
                      <div style="text-align: center; color: #6b7280;">
                        <svg style="width: 24px; height: 24px; margin: 0 auto 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p style="font-size: 12px;">Imagem não encontrada</p>
                      </div>
                    </div>
                  `;
                }
              }}
            />
          </div>
        );

      case 'interactive':
        // Renderizar elemento interativo visual (não funcional) no slide
        const interactiveElement = element as any;
        return (
          <div
            key={element.id}
            style={{
              ...style,
              backgroundColor: '#FAFAFA',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              userSelect: 'none',
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              height: '25%',
              backgroundColor: '#F8F9FA',
              borderBottom: '1px solid #E5E5E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                color: '#6B7280',
                fontWeight: '500',
              }}>
                {(interactiveElement.interactionType || 'interactive').replace('-', ' ').toUpperCase()}
              </div>
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '1px 4px',
                fontSize: '8px',
                color: '#16A34A',
                fontWeight: '500',
              }}>
                LIVE
              </div>
            </div>

            {/* Question */}
            <div style={{
              padding: '8px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#1F2937',
              lineHeight: '1.3',
            }}>
              {interactiveElement.question || 'Interactive Element'}
            </div>

            {/* Content preview based on type */}
            <div style={{ padding: '0 8px 8px 8px', fontSize: '10px' }}>
              {interactiveElement.interactionType === 'multiple-choice' && interactiveElement.options && (
                <div>
                  <div style={{ color: '#6B7280', marginBottom: '4px' }}>Options:</div>
                  {(Array.isArray(interactiveElement.options) ? interactiveElement.options : [])
                    .slice(0, 2).map((option: string, index: number) => (
                    <div key={index} style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #F3F4F6',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      marginBottom: '2px',
                      color: '#4B5563',
                    }}>
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  ))}
                  {(Array.isArray(interactiveElement.options) ? interactiveElement.options : []).length > 2 && (
                    <div style={{ color: '#9CA3AF', fontSize: '9px' }}>
                      +{(Array.isArray(interactiveElement.options) ? interactiveElement.options : []).length - 2} more
                    </div>
                  )}
                </div>
              )}
              
              {interactiveElement.interactionType === 'word-cloud' && (
                <div style={{ color: '#6B7280' }}>
                  Word cloud input
                </div>
              )}
              
              {interactiveElement.interactionType === 'live-poll' && (
                <div style={{ color: '#6B7280' }}>
                  Live poll (1-10 scale)
                </div>
              )}
            </div>

            {/* Response counter */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              left: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '1px 4px',
              fontSize: '9px',
              color: '#64748B',
              fontWeight: '500',
            }}>
              Click sidebar to respond
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div
        className="relative overflow-hidden rounded-lg shadow-lg border border-gray-300 mx-auto"
        style={{
          width: '100%',
          maxWidth: SLIDE_WIDTH,
          aspectRatio: `${SLIDE_WIDTH}/${SLIDE_HEIGHT}`,
          backgroundColor: slide.backgroundColor || '#ffffff',
        }}
      >
        {/* 🎯 DIMENSÕES RESPONSIVAS: Proporções mantidas */}
        <div className="absolute inset-0 w-full h-full">
          {/* Renderizar todos os elementos do slide */}
          {slide.elements && slide.elements.length > 0 ? (
            slide.elements
              .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) // Ordenar por z-index
              .map(renderElement)
          ) : !((slide as any).isInteractive) ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2H5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Slide sem elementos</p>
              </div>
            </div>
          ) : null}

          {/* Renderizar elemento interativo do slide (quando isInteractive é true) */}
          {(slide as any).isInteractive && (
            <div
              style={{
                position: 'absolute',
                left: `${(((slide as any).interactivePosition?.x || 50) / SLIDE_WIDTH) * 100}%`,
                top: `${(((slide as any).interactivePosition?.y || 50) / SLIDE_HEIGHT) * 100}%`,
                width: `${(((slide as any).interactiveSize?.width || 400) / SLIDE_WIDTH) * 100}%`,
                height: `${(((slide as any).interactiveSize?.height || 300) / SLIDE_HEIGHT) * 100}%`,
                backgroundColor: '#FAFAFA',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                userSelect: 'none',
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                height: '25%',
                backgroundColor: '#F8F9FA',
                borderBottom: '1px solid #E5E5E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
              }}>
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  color: '#6B7280',
                  fontWeight: '500',
                }}>
                  {((slide as any).interactiveType || 'interactive').replace('-', ' ').toUpperCase()}
                </div>
                <div style={{
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '8px',
                  padding: '1px 4px',
                  fontSize: '8px',
                  color: '#16A34A',
                  fontWeight: '500',
                }}>
                  LIVE
                </div>
              </div>

              {/* Question */}
              <div style={{
                padding: '8px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#1F2937',
                lineHeight: '1.3',
              }}>
                {(slide as any).question || 'Interactive Element'}
              </div>

              {/* Content preview based on type */}
              <div style={{ padding: '0 8px 8px 8px', fontSize: '10px' }}>
                {(slide as any).interactiveType === 'multiple-choice' && (slide as any).options && (
                  <div>
                    <div style={{ color: '#6B7280', marginBottom: '4px' }}>Options:</div>
                    {(Array.isArray((slide as any).options) ? (slide as any).options : [])
                      .slice(0, 2).map((option: string, index: number) => (
                      <div key={index} style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #F3F4F6',
                        borderRadius: '4px',
                        padding: '2px 4px',
                        marginBottom: '2px',
                        color: '#4B5563',
                      }}>
                        {String.fromCharCode(65 + index)}. {option}
                      </div>
                    ))}
                    {(Array.isArray((slide as any).options) ? (slide as any).options : []).length > 2 && (
                      <div style={{ color: '#9CA3AF', fontSize: '9px' }}>
                        +{(Array.isArray((slide as any).options) ? (slide as any).options : []).length - 2} more
                      </div>
                    )}
                  </div>
                )}
                
                {(slide as any).interactiveType === 'word-cloud' && (
                  <div style={{ color: '#6B7280' }}>
                    Word cloud input
                  </div>
                )}
                
                {(slide as any).interactiveType === 'live-poll' && (
                  <div style={{ color: '#6B7280' }}>
                    Live poll (1-10 scale)
                  </div>
                )}
              </div>

              {/* Response counter */}
              <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '1px 4px',
                fontSize: '9px',
                color: '#64748B',
                fontWeight: '500',
              }}>
                Click sidebar to respond
              </div>
            </div>
          )}

          {/* Overlay para elementos interativos - indicador visual */}
          {(slide as any).isInteractive && (
            <div className="absolute top-2 right-2">
              <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Interativo</span>
              </div>
            </div>
          )}

          {/* Indicador de resolução no canto inferior direito */}
          <div className="absolute bottom-1 right-1 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {SLIDE_WIDTH}×{SLIDE_HEIGHT}
          </div>
        </div>
      </div>
    </div>
  );
} 