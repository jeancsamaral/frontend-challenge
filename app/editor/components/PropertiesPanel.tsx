'use client';

import React, { useState } from 'react';
import { Slide, SlideElement, TextElement, ImageElement, InteractiveElement } from '../../shared/types';
import { ensureOptionsArray } from '../../shared/utils';

interface PropertiesPanelProps {
  slide: Slide;
  onUpdateSlide: (slide: Slide) => void;
  socket?: any;
  roomId?: string;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ slide, onUpdateSlide, socket, roomId }) => {
  const [activeTab, setActiveTab] = useState<'slide' | 'element'>('slide');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  const selectedElement = slide.elements.find(el => el.id === selectedElementId) || null;
  const isInteractiveSlideSelected = selectedElementId === 'interactive-slide' && slide.isInteractive;

  React.useEffect(() => {
    if (selectedElement || isInteractiveSlideSelected) {
      setActiveTab('element');
    }
  }, [selectedElement, isInteractiveSlideSelected]);

  React.useEffect(() => {
    if (selectedElement && selectedElement.type === 'text' && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [selectedElement]);

  React.useEffect(() => {
    const handleElementSelection = (event: CustomEvent) => {
      setSelectedElementId(event.detail.elementId);
    };

    window.addEventListener('elementSelected', handleElementSelection as EventListener);
    return () => window.removeEventListener('elementSelected', handleElementSelection as EventListener);
  }, []);

  const closePanelOnMobile = () => {
    // Dispatch evento para fechar o panel no mobile
    window.dispatchEvent(new CustomEvent('closePropertiesPanel'));
  };

  const handleSlideBackgroundChange = (color: string) => {
    const updatedSlide = { ...slide, backgroundColor: color };
    onUpdateSlide(updatedSlide);
  };

  const handleElementUpdate = (elementId: string, updates: Partial<SlideElement>) => {
    if (!elementId || !slide?.elements) return;
    
    const updatedElements = slide.elements.map(el => 
      el.id === elementId ? { ...el, ...updates } as SlideElement : el
    );
    
    const updatedSlide = { 
      ...slide, 
      elements: updatedElements,
      updatedAt: new Date()
    };
    
    onUpdateSlide(updatedSlide);
  };

  const renderSlideProperties = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slide Title
        </label>
        <input
          type="text"
          value={slide?.title || ''}
          onChange={(e) => onUpdateSlide({ ...slide, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <input
          type="color"
          value={slide?.backgroundColor || '#ffffff'}
          onChange={(e) => handleSlideBackgroundChange(e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>
    </div>
  );

  const renderTextElementProperties = (element: TextElement) => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Content
          </label>
          <textarea
            value={element?.content || ''}
            onChange={(e) => handleElementUpdate(element.id, { content: e.target.value })}
            onBlur={(e) => handleElementUpdate(element.id, { content: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter your text here..."
          />
          <p className="text-xs text-gray-500 mt-1">Tip: Double-click text on canvas for quick editing</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <input
              type="number"
              value={element?.fontSize || 16}
              onChange={(e) => handleElementUpdate(element.id, { fontSize: Number(e.target.value) })}
              onBlur={(e) => handleElementUpdate(element.id, { fontSize: Number(e.target.value) })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="8"
              max="72"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={element?.fontFamily || 'Arial'}
              onChange={(e) => handleElementUpdate(element.id, { fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Color
          </label>
          <input
            type="color"
            value={element?.color || '#000000'}
            onChange={(e) => handleElementUpdate(element.id, { color: e.target.value })}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Weight
            </label>
            <select
              value={element?.fontWeight || 'normal'}
              onChange={(e) => handleElementUpdate(element.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Align
            </label>
            <select
              value={element?.textAlign || 'left'}
              onChange={(e) => handleElementUpdate(element.id, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderImageElementProperties = (element: ImageElement) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image URL
        </label>
        <input
          type="url"
          value={element?.src || ''}
          onChange={(e) => handleElementUpdate(element.id, { src: e.target.value })}
          onBlur={(e) => handleElementUpdate(element.id, { src: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/image.jpg"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alt Text
        </label>
        <input
          type="text"
          value={element?.alt || ''}
          onChange={(e) => handleElementUpdate(element.id, { alt: e.target.value })}
          onBlur={(e) => handleElementUpdate(element.id, { alt: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description of the image"
        />
      </div>
    </div>
  );

  const renderInteractiveElementProperties = (element: InteractiveElement) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question
        </label>
        <textarea
          value={element?.question || ''}
          onChange={(e) => handleElementUpdate(element.id, { question: e.target.value })}
          onBlur={(e) => handleElementUpdate(element.id, { question: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter your question here..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interaction Type
        </label>
        <select
          value={element?.interactionType || 'multiple-choice'}
          onChange={(e) => handleElementUpdate(element.id, { 
            interactionType: e.target.value as 'multiple-choice' | 'word-cloud' | 'live-poll' 
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="multiple-choice">Multiple Choice</option>
          <option value="word-cloud">Word Cloud</option>
          <option value="live-poll">Live Poll</option>
        </select>
      </div>
      
      {element?.interactionType === 'multiple-choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          {element.options?.map((option, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                value={option || ''}
                onChange={(e) => {
                  const newOptions = [...(element.options || [])];
                  newOptions[index] = e.target.value;
                  handleElementUpdate(element.id, { options: newOptions });
                }}
                onBlur={(e) => {
                  const newOptions = [...(element.options || [])];
                  newOptions[index] = e.target.value;
                  handleElementUpdate(element.id, { options: newOptions });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${index + 1}`}
              />
              <button
                onClick={() => {
                  const newOptions = element.options?.filter((_, i) => i !== index);
                  handleElementUpdate(element.id, { options: newOptions });
                }}
                className="ml-2 px-2 py-1 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newOptions = [...(element.options || []), 'New Option'];
              handleElementUpdate(element.id, { options: newOptions });
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add Option
          </button>
        </div>
      )}
      

    </div>
      );

  const renderInteractiveSlideProperties = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Interactive Element</h4>
            <p className="text-sm text-gray-600">Edit the interactive slide content and settings</p>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question
        </label>
        <textarea
          value={slide.question || ''}
          onChange={(e) => onUpdateSlide({ ...slide, question: e.target.value })}
          onBlur={(e) => onUpdateSlide({ ...slide, question: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="What would you like to ask your students?"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interaction Type
        </label>
        <select
          value={slide.interactiveType || 'multiple-choice'}
          onChange={async (e) => {
            const newType = e.target.value as 'multiple-choice' | 'word-cloud' | 'live-poll';
            const currentType = slide.interactiveType;
            
            if (currentType && currentType !== newType) {
              const userConfirmed = window.confirm(
                `⚠️ ATENÇÃO: Você está alterando o tipo de interação.\n\n` +
                `Ao mudar de "${currentType}" para "${newType}":\n` +
                `• Todas as respostas dos estudantes serão apagadas\n` +
                `• As estatísticas serão perdidas\n` +
                `• As configurações específicas do tipo anterior podem ser perdidas\n\n` +
                `Deseja continuar?`
              );
              
              if (!userConfirmed) {
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
                  alert(`✅ Tipo de interação alterado!\nForam removidas ${data.deletedCount} respostas anteriores.`);
                  
                  if (socket && roomId) {
                    socket.emit('interactive-element-removed', {
                      roomId: roomId,
                      slideId: slide.id
                    });
                  }
                } else {
                  alert('⚠️ Erro ao limpar respostas anteriores. A alteração será feita mesmo assim.');
                }
              } catch (error) {
                alert('⚠️ Erro ao limpar respostas anteriores. A alteração será feita mesmo assim.');
              }
            }
            
            onUpdateSlide({ 
              ...slide, 
              interactiveType: newType 
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="multiple-choice">Multiple Choice</option>
          <option value="word-cloud">Word Cloud</option>
          <option value="live-poll">Live Poll</option>
        </select>
      </div>
      
      {slide.interactiveType === 'multiple-choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Answer Options
          </label>
          <div className="space-y-2">
            {(slide.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  type="text"
                  value={option || ''}
                  onChange={(e) => {
                    const newOptions = [...(slide.options || [])];
                    newOptions[index] = e.target.value;
                    onUpdateSlide({ ...slide, options: newOptions });
                  }}
                  onBlur={(e) => {
                    const newOptions = [...(slide.options || [])];
                    newOptions[index] = e.target.value;
                    onUpdateSlide({ ...slide, options: newOptions });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${index + 1}`}
                />
                {(slide.options || []).length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = (slide.options || []).filter((_, i) => i !== index);
                      onUpdateSlide({ ...slide, options: newOptions });
                    }}
                    className="flex-shrink-0 p-1 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            {(slide.options || []).length < 6 && (
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...(slide.options || []), `Option ${(slide.options || []).length + 1}`];
                  onUpdateSlide({ ...slide, options: newOptions });
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add option</span>
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Position and Size */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position X
          </label>
          <input
            type="number"
            value={slide.interactivePosition?.x || 50}
            onChange={(e) => onUpdateSlide({ 
              ...slide, 
              interactivePosition: { 
                ...slide.interactivePosition, 
                x: Number(e.target.value), 
                y: slide.interactivePosition?.y || 50 
              } 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position Y
          </label>
          <input
            type="number"
            value={slide.interactivePosition?.y || 50}
            onChange={(e) => onUpdateSlide({ 
              ...slide, 
              interactivePosition: { 
                x: slide.interactivePosition?.x || 50, 
                y: Number(e.target.value) 
              } 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Width
          </label>
          <input
            type="number"
            value={slide.interactiveSize?.width || 400}
            onChange={(e) => onUpdateSlide({ 
              ...slide, 
              interactiveSize: { 
                ...slide.interactiveSize, 
                width: Number(e.target.value), 
                height: slide.interactiveSize?.height || 300 
              } 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height
          </label>
          <input
            type="number"
            value={slide.interactiveSize?.height || 300}
            onChange={(e) => onUpdateSlide({ 
              ...slide, 
              interactiveSize: { 
                width: slide.interactiveSize?.width || 400, 
                height: Number(e.target.value) 
              } 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="200"
          />
        </div>
      </div>
    </div>
  );

  const renderElementProperties = () => {
    if (!selectedElement && !isInteractiveSlideSelected) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485a2 2 0 01-2.828 0l-2.829-2.829a2 2 0 010-2.828L7.343 11z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Element Selected</h3>
          <p className="text-gray-500 mb-4">Select an element on the canvas to edit its properties</p>
          <div className="text-sm text-gray-400">
            <p>💡 Click on any element to select it</p>
            <p>📝 Double-click text to edit directly</p>
          </div>
        </div>
      );
    }

    if (isInteractiveSlideSelected) {
      return renderInteractiveSlideProperties();
    }

    if (!selectedElement) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="font-medium text-gray-900 mb-1">
            {selectedElement.type === 'text' ? 'Text Element' : 
             selectedElement.type === 'image' ? 'Image Element' : 
             selectedElement.type === 'interactive' ? 'Interactive Element' : 'Element'}
          </h4>
          <p className="text-sm text-gray-600">
            Configure the {selectedElement.type} element settings.
          </p>
        </div>

        {selectedElement.type === 'text' && renderTextElementProperties(selectedElement as TextElement)}
        {selectedElement.type === 'image' && renderImageElementProperties(selectedElement as ImageElement)}
        {selectedElement.type === 'interactive' && renderInteractiveElementProperties(selectedElement as InteractiveElement)}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" data-properties-panel>
      {/* Header with mobile close button */}
      <div className="p-3 lg:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3 lg:mb-0">
          <h3 className="text-lg font-medium text-gray-900 lg:hidden">Properties</h3>
          <button
            onClick={closePanelOnMobile}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded-md"
            title="Fechar painel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('slide')}
            className={`flex-1 lg:flex-initial px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'slide'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Slide
          </button>
          <button
            onClick={() => setActiveTab('element')}
            className={`flex-1 lg:flex-initial px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'element'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Element
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 lg:p-4">
        {activeTab === 'slide' && renderSlideProperties()}
        {activeTab === 'element' && renderElementProperties()}
      </div>
    </div>
  );
};

export default PropertiesPanel; 