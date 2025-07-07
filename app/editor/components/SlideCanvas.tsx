'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Slide, SlideElement, ImageElement, TextElement, Presentation } from '../../shared/types';
import { useEditorState } from '../../shared/hooks';

const KonvaCanvas = dynamic(() => import('./KonvaCanvas'), { ssr: false });

interface SlideCanvasProps {
  slide: Slide;
  onUpdateSlide: (slide: Slide) => void;
  presentation?: Presentation;
  currentSlideIndex?: number;
  socket?: any;
  roomId?: string;
}

const SlideCanvas: React.FC<SlideCanvasProps> = ({ 
  slide, 
  onUpdateSlide, 
  presentation, 
  currentSlideIndex,
  socket,
  roomId 
}) => {
  const [isClient, setIsClient] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const [editingText, setEditingText] = useState<{
    elementId: string;
    content: string;
    position: { x: number; y: number };
    fontSize: number;
    fontFamily: string;
    color: string;
  } | null>(null);
  const [textSaved, setTextSaved] = useState(false);
  
  const stageRef = useRef<any>(null);
  const onUpdateSlideRef = useRef(onUpdateSlide);
  
  useEffect(() => {
    onUpdateSlideRef.current = onUpdateSlide;
  }, [onUpdateSlide]);
  
  const { editorState, setTool, setSelectedElement } = useEditorState();

  const loadImage = useCallback((src: string, elementId: string) => {
    console.log(`Loading image for element ${elementId}: ${src}`);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log(`Image loaded successfully for element ${elementId}`);
      setLoadedImages(prev => ({
        ...prev,
        [elementId]: img
      }));
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        console.log(`Fallback image loaded successfully for element ${elementId}`);
        setLoadedImages(prev => ({
          ...prev,
          [elementId]: fallbackImg
        }));
      };
      fallbackImg.onerror = () => {
        console.error(`Image completely failed to load: ${src}`);
        // Create a placeholder canvas as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#666';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Image failed to load', canvas.width / 2, canvas.height / 2 - 10);
          ctx.fillText('Try a different URL', canvas.width / 2, canvas.height / 2 + 10);
        }
        
        // Convert canvas to image
        const placeholderImg = new Image();
        placeholderImg.src = canvas.toDataURL();
        placeholderImg.onload = () => {
          console.log(`Placeholder image created for element ${elementId}`);
          setLoadedImages(prev => ({
            ...prev,
            [elementId]: placeholderImg
          }));
        };
      };
      fallbackImg.src = src;
    };
    img.src = src;
  }, []);

  const updateElement = (elementId: string, updates: Partial<SlideElement>) => {
    const currentSlide = slide;
    const updatedElements = currentSlide.elements.map(el => {
      if (el.id === elementId) {
        const updatedElement = { ...el, ...updates } as SlideElement;
        
        if (el.type === 'text') {
          const textElement = el as TextElement;
          const textUpdates = updates as Partial<TextElement>;
          
          (updatedElement as TextElement).fontSize = textUpdates.fontSize || textElement.fontSize;
          (updatedElement as TextElement).fontFamily = textUpdates.fontFamily || textElement.fontFamily;
          (updatedElement as TextElement).color = textUpdates.color || textElement.color;
          (updatedElement as TextElement).fontWeight = textUpdates.fontWeight || textElement.fontWeight;
          (updatedElement as TextElement).textAlign = textUpdates.textAlign || textElement.textAlign;
        }
        
        return updatedElement;
      }
      return el;
    });

    const updatedSlide = {
      ...currentSlide,
      elements: updatedElements,
      updatedAt: new Date(),
    };

    onUpdateSlide(updatedSlide);
  };

  const deleteElement = useCallback((elementId: string) => {
    const updatedElements = slide.elements.filter(el => el.id !== elementId);
    
    const updatedSlide = {
      ...slide,
      elements: updatedElements,
      updatedAt: new Date(),
    };
    
    onUpdateSlideRef.current(updatedSlide);
    
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [slide, selectedElementId]);

  const moveElement = useCallback((elementId: string, newPosition: { x: number; y: number }) => {
    updateElement(elementId, { position: newPosition });
  }, [updateElement]);

  const resizeElement = useCallback((elementId: string, newSize: { width: number; height: number }) => {
    updateElement(elementId, { size: newSize });
  }, [updateElement]);

  const updateEditingTextPosition = useCallback(() => {
    if (!editingText || !stageRef.current) return;
    
    const stage = stageRef.current;
    const stageContainer = stage.container();
    
    if (!stageContainer) return;
    
    const stageRect = stageContainer.getBoundingClientRect();
    
    const element = slide.elements.find(el => el.id === editingText.elementId);
    if (!element) return;
    
    const absoluteX = stageRect.left + element.position.x;
    const absoluteY = stageRect.top + element.position.y;
    
    setEditingText(prev => prev ? {
      ...prev,
      position: {
        x: absoluteX,
        y: absoluteY
      }
    } : null);
  }, [editingText?.elementId, slide.elements]);

  const startTextEditing = useCallback((element: TextElement) => {
    if (stageRef.current) {
      const stage = stageRef.current;
      const stageContainer = stage.container();
      const stageRect = stageContainer.getBoundingClientRect();
      
      // Calculate absolute position on screen
      const absoluteX = stageRect.left + element.position.x;
      const absoluteY = stageRect.top + element.position.y;
      
      setEditingText({
        elementId: element.id,
        content: element.content,
        position: {
          x: absoluteX,
          y: absoluteY
        },
        fontSize: element.fontSize,
        fontFamily: element.fontFamily,
        color: element.color
      });
    }
  }, []);

  const finishTextEditing = useCallback((newContent?: string) => {
    if (editingText) {
      const contentToSave = newContent !== undefined ? newContent : editingText.content;
      const finalContent = contentToSave.trim() || 'Text'; // Ensure we have some content
      
      updateElement(editingText.elementId, { content: finalContent });
      
      setTextSaved(true);
      setTimeout(() => setTextSaved(false), 1000);
      
      setEditingText(null);
      
      setSelectedElementId(null);
      setSelectedElement(null);
      
      setTimeout(() => {
        const textUpdateEvent = new CustomEvent('textUpdated', {
          detail: { elementId: editingText.elementId, content: finalContent }
        });
        window.dispatchEvent(textUpdateEvent);
        
        const elementSelectedEvent = new CustomEvent('elementSelected', {
          detail: { elementId: null }
        });
        window.dispatchEvent(elementSelectedEvent);
      }, 100);
    }
  }, [editingText, updateElement, setSelectedElement]);

  const handleElementClick = useCallback((elementId: string) => {
    setSelectedElementId(elementId);
    setSelectedElement(elementId);
    
    // Dispatch custom event to notify PropertiesPanel
    const event = new CustomEvent('elementSelected', {
      detail: { elementId }
    });
    window.dispatchEvent(event);
  }, [setSelectedElement]);

  const handleStageClick = useCallback((e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty && !editingText) {
      // Only handle selection when not editing text
      setSelectedElementId(null);
      setSelectedElement(null);
      
      // Dispatch custom event to notify PropertiesPanel
      const event = new CustomEvent('elementSelected', {
        detail: { elementId: null }
      });
      window.dispatchEvent(event);
    }
    // When editing text, let onBlur handle the save functionality
  }, [setSelectedElement, editingText]);

  const handleElementDblClick = useCallback((elementId: string) => {
    // Handle interactive slide selection (no modal)
    if (elementId === 'interactive-slide' && slide.isInteractive) {
      // Just select the element, don't open modal
      setSelectedElementId('interactive-slide');
      setSelectedElement('interactive-slide');
      
      // Dispatch custom event to notify PropertiesPanel
      const event = new CustomEvent('elementSelected', {
        detail: { elementId: 'interactive-slide' }
      });
      window.dispatchEvent(event);
      return;
    }
    
    // Handle regular text element editing
    const element = slide.elements.find(el => el.id === elementId);
    if (element && element.type === 'text') {
      startTextEditing(element as TextElement);
    }
  }, [slide.elements, slide.isInteractive, startTextEditing, setSelectedElement]);

  const handleElementDragEnd = useCallback((elementId: string, e: any) => {
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    
    // Handle interactive element movement
    if (elementId === 'interactive-slide') {
      const updatedSlide = {
        ...slide,
        interactivePosition: newPosition,
        updatedAt: new Date(),
      };
      onUpdateSlide(updatedSlide);
    } else {
      // Handle regular element movement
      moveElement(elementId, newPosition);
    }
  }, [moveElement, slide, onUpdateSlide]);

  const handleElementTransform = useCallback((elementId: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Reset scale to 1 and adjust size instead
    node.scaleX(1);
    node.scaleY(1);
    
    // Handle interactive element resizing
    if (elementId === 'interactive-slide') {
      const newSize = {
        width: Math.max(300, node.width() * scaleX), // Minimum width for interactive elements
        height: Math.max(200, node.height() * scaleY), // Minimum height for interactive elements
      };
      
      const updatedSlide = {
        ...slide,
        interactiveSize: newSize,
        updatedAt: new Date(),
      };
      onUpdateSlide(updatedSlide);
    } else {
      // Handle regular element resizing
      const newSize = {
        width: Math.max(20, node.width() * scaleX), // Minimum width for regular elements
        height: Math.max(20, node.height() * scaleY), // Minimum height for regular elements
      };
      
      resizeElement(elementId, newSize);
    }
  }, [resizeElement, slide, onUpdateSlide]);

  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    if (selectedElementId && (e.key === 'Delete' || e.key === 'Backspace') && !editingText) {
      if (selectedElementId === 'interactive-slide') {
        const userConfirmed = window.confirm(
          `⚠️ ATENÇÃO: Você está removendo o elemento interativo deste slide.\n\n` +
          `Ao remover o elemento interativo:\n` +
          `• Todas as respostas dos estudantes serão apagadas\n` +
          `• As estatísticas serão perdidas\n` +
          `• As configurações de interação serão removidas\n\n` +
          `Deseja continuar?`
        );
        
        if (!userConfirmed) {
          e.preventDefault();
          return;
        }
        
        try {
          const response = await fetch('/api/responses/clear', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              slideId: slide.id
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            alert(`✅ Elemento interativo removido!\nForam removidas ${data.deletedCount} respostas anteriores.`);
            
            if (socket && roomId) {
              socket.emit('interactive-element-removed', {
                roomId: roomId,
                slideId: slide.id
              });
            }
          } else {
            alert('⚠️ Erro ao limpar respostas anteriores. A remoção será feita mesmo assim.');
          }
        } catch (error) {
          alert('⚠️ Erro ao limpar respostas anteriores. A remoção será feita mesmo assim.');
        }
        
        const updatedSlide = {
          ...slide,
          isInteractive: false,
          question: undefined,
          interactiveType: undefined,
          options: undefined,
          interactivePosition: undefined,
          interactiveSize: undefined,
          updatedAt: new Date(),
        };
        onUpdateSlide(updatedSlide);
        setSelectedElementId(null);
        setSelectedElement(null);
      } else {
        deleteElement(selectedElementId);
      }
      e.preventDefault();
    }
  }, [selectedElementId, deleteElement, editingText, slide, onUpdateSlide, setSelectedElement, socket, roomId]);

  // All useMemo hooks
  const canvasProps = useMemo(() => ({
    stageRef,
    stageSize,
    backgroundColor: slide.backgroundColor,
    elements: slide.elements, // Use slide.elements directly
    slide: slide, // Pass the entire slide object
    selectedElementId,
    loadedImages,
    editingTextId: editingText?.elementId || null,
    onStageClick: handleStageClick,
    onElementClick: handleElementClick,
    onElementDblClick: handleElementDblClick,
    onElementDragEnd: handleElementDragEnd,
    onElementTransform: handleElementTransform,
    presentation,
    currentSlideIndex,
    liveResponses: [],
  }), [
    stageSize,
    slide.backgroundColor,
    slide.elements, // Use slide.elements directly
    slide, // Include the entire slide object
    selectedElementId,
    loadedImages,
    editingText?.elementId,
    handleStageClick,
    handleElementClick,
    handleElementDblClick,
    handleElementDragEnd,
    handleElementTransform,
    presentation,
    currentSlideIndex,
  ]);

  // All useEffect hooks
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const imageElements = slide.elements.filter(element => element.type === 'image') as ImageElement[];
    
    imageElements.forEach(element => {
      if (element.src && !loadedImages[element.id]) {
        loadImage(element.src, element.id);
      }
    });
  }, [slide.elements, loadedImages, loadImage]);

  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
        const container = stageRef.current.container().parentElement;
        if (container) {
          const newWidth = container.offsetWidth - 32;
          const newHeight = container.offsetHeight - 32;
          
          setStageSize(prev => {
            if (prev.width !== newWidth || prev.height !== newHeight) {
              return { width: newWidth, height: newHeight };
            }
            return prev;
          });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500">Loading canvas...</div>
          <div className="text-xs text-gray-400 mt-2">Initializing Konva components</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative ">
      <KonvaCanvas {...canvasProps} />
      
      {/* Inline Text Editor */}
      {editingText && (
        <>
          {/* Invisible overlay to catch clicks outside */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              background: 'transparent',
            }}
            onClick={() => finishTextEditing()}
          />
          
          <input
            type="text"
            value={editingText.content}
            onChange={(e) => {
              setEditingText(prev => prev ? { ...prev, content: e.target.value } : null);
            }}
            onBlur={() => {
              if (editingText) {
                finishTextEditing(editingText.content);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                finishTextEditing(editingText.content);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setEditingText(null);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            autoFocus
            style={{
              position: 'fixed',
              left: editingText.position.x,
              top: editingText.position.y,
              fontSize: `${editingText.fontSize}px`,
              fontFamily: editingText.fontFamily,
              color: editingText.color,
              background: 'white',
              border: '2px solid #3B82F6',
              outline: 'none',
              padding: '4px 8px',
              borderRadius: '6px',
              zIndex: 1000,
              minWidth: '120px',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            }}
            placeholder="Digite seu texto..."
          />
        </>
      )}
      
      {/* Instructions */}
      {slide.elements.length === 0 && !slide.isInteractive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 text-center">
            <p className="text-lg mb-2">Your slide is empty</p>
            <p className="text-sm">Use the toolbar above to add text, images, or interactive elements</p>
            <p className="text-xs mt-2 text-gray-300">💡 Double-click text to edit it directly</p>
          </div>
        </div>
      )}
      
      {/* Usage instructions */}
      {(slide.elements.length > 0 || slide.isInteractive) && !editingText && (
        <div className="absolute bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded text-xs max-w-xs">
          <ul className="list-disc list-inside">
            <li><strong>Double-click text</strong> to edit inline</li>
            {slide.isInteractive && (
              <li><strong>Double-click interactive</strong> to edit in sidebar</li>
            )}
            <li><strong>Press Enter</strong> to save changes</li>
            <li><strong>Click & drag</strong> to move elements</li>
            <li className="text-gray-300">Click outside to save & deselect</li>
          </ul>
        </div>
      )}
      
      {/* Editing instructions */}
      {editingText && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded text-xs">
          <p className="mb-1">✏️ <strong>Editing Text</strong></p>
          <p className="mb-1">Press <kbd className="bg-blue-700 px-1 rounded font-semibold">Enter</kbd> to <strong>SAVE</strong></p>
          <p className="mb-1">Press <kbd className="bg-blue-700 px-1 rounded">Esc</kbd> to cancel</p>
          <p className="text-blue-200 text-xs">💡 Click outside to save & deselect</p>
          <div className="mt-2 text-center">
            <div className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="ml-1 text-xs">Save & deselect</span>
          </div>
        </div>
      )}
      
      {/* Save confirmation */}
      {textSaved && (
        <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded text-xs shadow-lg">
          <p className="flex items-center">
            <span className="mr-1">✅</span>
            <strong>Text saved!</strong>
          </p>
        </div>
      )}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInFade {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutFade {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(20px);
          }
        }
      `}</style>
      
      {/* Element count */}
      <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-2 py-1 rounded text-xs">
        {slide.elements.length + (slide.isInteractive ? 1 : 0)} element{(slide.elements.length + (slide.isInteractive ? 1 : 0)) !== 1 ? 's' : ''}
        {editingText && ' • Editing...'}
      </div>
    </div>
  );
};

export default React.memo(SlideCanvas); 