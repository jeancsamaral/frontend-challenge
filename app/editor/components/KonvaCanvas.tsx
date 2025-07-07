'use client';

import React from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva';
import { SlideElement, TextElement, ImageElement, Slide, Presentation } from '../../shared/types';
import { AnswerUpdateData } from '../../../types/socket';
import { ensureOptionsArray } from '../../shared/utils';

interface KonvaCanvasProps {
  stageRef: React.RefObject<any>;
  stageSize: { width: number; height: number };
  backgroundColor: string;
  elements: SlideElement[];
  slide: Slide;
  selectedElementId: string | null;
  loadedImages: { [key: string]: HTMLImageElement };
  editingTextId: string | null;
  onStageClick: (e: any) => void;
  onElementClick: (elementId: string) => void;
  onElementDblClick: (elementId: string) => void;
  onElementDragEnd: (elementId: string, e: any) => void;
  onElementTransform: (elementId: string, e: any) => void;
  presentation?: Presentation;
  currentSlideIndex?: number;
  liveResponses?: AnswerUpdateData[];
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  stageRef,
  stageSize,
  backgroundColor,
  elements,
  slide,
  selectedElementId,
  loadedImages,
  editingTextId,
  onStageClick,
  onElementClick,
  onElementDblClick,
  onElementDragEnd,
  onElementTransform,
  presentation,
  currentSlideIndex,
  liveResponses = [],
}) => {
  const transformerRef = React.useRef<any>(null);
  const cleanupTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Clean up transformer when component unmounts
  React.useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (transformerRef.current) {
        try {
          transformerRef.current.nodes([]);
        } catch (error) {
          console.warn('Error during transformer cleanup:', error);
        }
      }
    };
  }, []);

  // Safely update transformer with proper cleanup and validation
  const updateTransformer = React.useCallback(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const transformer = transformerRef.current;
    
    try {
      // Clear any pending timeout
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }

      // If no element is selected or we're editing text, clear transformer
      if (!selectedElementId || editingTextId) {
        transformer.nodes([]);
        const layer = transformer.getLayer();
        if (layer) {
          layer.batchDraw();
        }
        return;
      }

      // Check if the selected element still exists in the elements array
      const elementExists = elements.some(el => el.id === selectedElementId);
      if (!elementExists) {
        transformer.nodes([]);
        const layer = transformer.getLayer();
        if (layer) {
          layer.batchDraw();
        }
        return;
      }

      // Small delay to ensure DOM is updated before finding node
      cleanupTimeoutRef.current = setTimeout(() => {
        try {
          if (!transformerRef.current || !stageRef.current) return;
          
          const selectedNode = stageRef.current.findOne(`#${selectedElementId}`);
          
          // Validate the node thoroughly
          if (selectedNode && 
              selectedNode.getAbsoluteTransform && 
              typeof selectedNode.getAbsoluteTransform === 'function' &&
              selectedNode.getParent() && // Ensure node is still in the scene
              selectedNode.isVisible() !== false) { // Ensure node is visible
            
            // Double-check that the node is still valid
            try {
              selectedNode.getAbsoluteTransform(); // Test the method call
              transformer.nodes([selectedNode]);
            } catch (nodeError) {
              console.warn('Selected node is invalid:', nodeError);
              transformer.nodes([]);
            }
          } else {
            transformer.nodes([]);
          }
          
          // Safely batch draw
          const layer = transformer.getLayer();
          if (layer && layer.getStage()) {
            layer.batchDraw();
          }
        } catch (error) {
          console.warn('Transformer update error:', error);
          // Reset transformer on any error
          if (transformerRef.current) {
            transformerRef.current.nodes([]);
          }
        }
        
        cleanupTimeoutRef.current = null;
      }, 10); // Small delay to ensure consistency

    } catch (error) {
      console.warn('Transformer setup error:', error);
      transformer.nodes([]);
    }
  }, [selectedElementId, editingTextId, elements, stageRef]);

  React.useEffect(() => {
    updateTransformer();
  }, [updateTransformer]);



  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElementId === element.id;
    const isEditing = editingTextId === element.id;
    
    // Don't render text elements that are being edited inline
    if (isEditing && element.type === 'text') {
      return null;
    }
    
    const commonProps = {
      id: element.id,
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      draggable: !isEditing,
      onClick: () => onElementClick(element.id),
      onDblClick: () => onElementDblClick(element.id),
      onDragEnd: (e: any) => onElementDragEnd(element.id, e),
      onTransformEnd: (e: any) => onElementTransform(element.id, e),
    };

    switch (element.type) {
      case 'text':
        const textElement = element as TextElement;
        return (
          <Text
            key={element.id}
            {...commonProps}
            text={textElement.content}
            fontSize={textElement.fontSize}
            fontFamily={textElement.fontFamily}
            fill={textElement.color}
            fontStyle={textElement.fontWeight}
            align={textElement.textAlign}
          />
        );
      
      case 'image':
        const imageElement = element as ImageElement;
        const loadedImage = loadedImages[element.id];
        
        if (loadedImage) {
          return (
            <KonvaImage
              key={element.id}
              {...commonProps}
              image={loadedImage}
            />
          );
        } else {
          return (
            <Rect
              key={element.id}
              {...commonProps}
              fill="#f5f5f5"
              stroke="#ddd"
              strokeWidth={1}
              cornerRadius={4}
            />
          );
        }
      
      case 'interactive':
        const interactiveElement = element as any; // InteractiveElement
        return (
          <React.Fragment key={element.id}>
            {/* Main container with subtle background */}
            <Rect
              {...commonProps}
              fill="#FAFAFA"
              stroke="#E5E5E5"
              strokeWidth={1}
              cornerRadius={8}
            />
            
            {/* Header section */}
            <Rect
              x={element.position.x}
              y={element.position.y}
              width={element.size.width}
              height={40}
              fill="#F8F9FA"
              stroke="#E5E5E5"
              strokeWidth={1}
              cornerRadius={[8, 8, 0, 0]}
              listening={false}
            />
            
            {/* Type badge */}
            <Rect
              x={element.position.x + 12}
              y={element.position.y + 8}
              width={100}
              height={24}
              fill="#FFFFFF"
              stroke="#E5E5E5"
              strokeWidth={1}
              cornerRadius={4}
              listening={false}
            />
            
            {/* Type text */}
            <Text
              x={element.position.x + 20}
              y={element.position.y + 16}
              text={interactiveElement.interactionType?.replace('-', ' ').toUpperCase() || 'INTERACTIVE'}
              fontSize={10}
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              fill="#6B7280"
              fontStyle="500"
              listening={false}
            />
            
            {/* Status indicator */}
            <Rect
              x={element.position.x + element.size.width - 60}
              y={element.position.y + 12}
              width={48}
              height={16}
              fill="#F0FDF4"
              stroke="#BBF7D0"
              strokeWidth={1}
              cornerRadius={8}
              listening={false}
            />
            <Text
              x={element.position.x + element.size.width - 52}
              y={element.position.y + 17}
              text="LIVE"
              fontSize={8}
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              fill="#16A34A"
              fontStyle="500"
              listening={false}
            />
            
            {/* Question text */}
            <Text
              x={element.position.x + 16}
              y={element.position.y + 60}
              width={element.size.width - 32}
              text={interactiveElement.question || 'Interactive Element'}
              fontSize={14}
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              fill="#1F2937"
              fontStyle="500"
              wrap="word"
              lineHeight={1.4}
              listening={false}
            />
            
            {/* Content preview */}
            {interactiveElement.interactionType === 'multiple-choice' && ensureOptionsArray(interactiveElement.options).length > 0 && (
              <React.Fragment>
                <Text
                  x={element.position.x + 16}
                  y={element.position.y + 100}
                  text="Options:"
                  fontSize={11}
                  fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                  fill="#6B7280"
                  fontStyle="500"
                  listening={false}
                />
                {ensureOptionsArray(interactiveElement.options).slice(0, 3).map((option: string, index: number) => (
                  <React.Fragment key={index}>
                    <Rect
                      x={element.position.x + 16}
                      y={element.position.y + 120 + (index * 24)}
                      width={element.size.width - 32}
                      height={20}
                      fill="#FFFFFF"
                      stroke="#F3F4F6"
                      strokeWidth={1}
                      cornerRadius={4}
                      listening={false}
                    />
                    <Text
                      x={element.position.x + 24}
                      y={element.position.y + 127 + (index * 24)}
                      width={element.size.width - 48}
                      text={`${String.fromCharCode(65 + index)}. ${option}`}
                      fontSize={10}
                      fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                      fill="#4B5563"
                      wrap="word"
                      listening={false}
                    />
                  </React.Fragment>
                ))}
                {ensureOptionsArray(interactiveElement.options).length > 3 && (
                  <Text
                    x={element.position.x + 16}
                    y={element.position.y + 200}
                    text={`+${ensureOptionsArray(interactiveElement.options).length - 3} more`}
                    fontSize={9}
                    fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                    fill="#9CA3AF"
                    listening={false}
                  />
                )}
              </React.Fragment>
            )}
            
            {/* Response counter */}
            <Rect
              x={element.position.x + 16}
              y={element.position.y + element.size.height - 32}
              width={80}
              height={20}
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth={1}
              cornerRadius={4}
              listening={false}
            />
            <Text
              x={element.position.x + 24}
              y={element.position.y + element.size.height - 26}
              text="0 responses"
              fontSize={9}
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              fill="#64748B"
              fontStyle="500"
              listening={false}
            />
          </React.Fragment>
        );
      
      default:
        return null;
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      onClick={onStageClick}
    >
      <Layer>
        {/* Background */}
        <Rect
          x={0}
          y={0}
          width={stageSize.width}
          height={stageSize.height}
          fill={backgroundColor}
        />
        
        {/* Elements */}
        {elements.map(renderElement)}
        
        {/* Interactive slide overlay */}
        {slide.isInteractive && (
          <React.Fragment>
            {/* Interactive slide container */}
            <Rect
              id="interactive-slide"
              x={slide.interactivePosition?.x || 50}
              y={slide.interactivePosition?.y || 50}
              width={slide.interactiveSize?.width || 400}
              height={slide.interactiveSize?.height || 300}
              fill="#FAFAFA"
              stroke="#E5E5E5"
              strokeWidth={1}
              cornerRadius={8}
              onClick={() => onElementClick('interactive-slide')}
              onDblClick={() => onElementDblClick('interactive-slide')}
              onDragEnd={(e) => onElementDragEnd('interactive-slide', e)}
              onTransformEnd={(e) => onElementTransform('interactive-slide', e)}
              draggable={true}
            />
            
            {/* Header section */}
            <Rect
              x={slide.interactivePosition?.x || 50}
              y={slide.interactivePosition?.y || 50}
              width={slide.interactiveSize?.width || 400}
              height={40}
              fill="#F8F9FA"
              stroke="#E5E5E5"
              strokeWidth={1}
              cornerRadius={[8, 8, 0, 0]}
              listening={false}
            />
            
            {/* Type badge */}
            <Rect
              x={(slide.interactivePosition?.x || 50) + 12}
              y={(slide.interactivePosition?.y || 50) + 8}
              width={100}
              height={24}
              fill="#FFFFFF"
              stroke="#E5E5E5"
              strokeWidth={1}
              cornerRadius={4}
              listening={false}
            />
            
            {/* Type text */}
            <Text
              x={(slide.interactivePosition?.x || 50) + 20}
              y={(slide.interactivePosition?.y || 50) + 16}
              text={slide.interactiveType?.replace('-', ' ').toUpperCase() || 'INTERACTIVE'}
              fontSize={10}
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              fill="#6B7280"
              fontStyle="500"
              listening={false}
            />
            
            {/* Status indicator */}
            <Rect
              x={(slide.interactivePosition?.x || 50) + (slide.interactiveSize?.width || 400) - 60}
              y={(slide.interactivePosition?.y || 50) + 12}
              width={48}
              height={16}
              fill="#F0FDF4"
              stroke="#BBF7D0"
              strokeWidth={1}
              cornerRadius={8}
              listening={false}
            />
            <Text
              x={(slide.interactivePosition?.x || 50) + (slide.interactiveSize?.width || 400) - 52}
              y={(slide.interactivePosition?.y || 50) + 17}
              text="LIVE"
              fontSize={8}
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              fill="#16A34A"
              fontStyle="500"
              listening={false}
            />
            
            {/* Question text */}
            <Text
              x={(slide.interactivePosition?.x || 50) + 16}
              y={(slide.interactivePosition?.y || 50) + 60}
              width={(slide.interactiveSize?.width || 400) - 32}
              text={slide.question || 'Interactive Element'}
              fontSize={14}
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              fill="#1F2937"
              fontStyle="500"
              wrap="word"
              lineHeight={1.4}
              listening={false}
            />
            
            {/* Content preview */}
            {slide.interactiveType === 'multiple-choice' && ensureOptionsArray(slide.options).length > 0 && (
              <React.Fragment>
                <Text
                  x={(slide.interactivePosition?.x || 50) + 16}
                  y={(slide.interactivePosition?.y || 50) + 100}
                  text="Options:"
                  fontSize={11}
                  fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                  fill="#6B7280"
                  fontStyle="500"
                  listening={false}
                />
                {ensureOptionsArray(slide.options).slice(0, 3).map((option: string, index: number) => (
                  <React.Fragment key={index}>
                    <Rect
                      x={(slide.interactivePosition?.x || 50) + 16}
                      y={(slide.interactivePosition?.y || 50) + 120 + (index * 24)}
                      width={(slide.interactiveSize?.width || 400) - 32}
                      height={20}
                      fill="#FFFFFF"
                      stroke="#F3F4F6"
                      strokeWidth={1}
                      cornerRadius={4}
                      listening={false}
                    />
                    <Text
                      x={(slide.interactivePosition?.x || 50) + 24}
                      y={(slide.interactivePosition?.y || 50) + 127 + (index * 24)}
                      width={(slide.interactiveSize?.width || 400) - 48}
                      text={`${String.fromCharCode(65 + index)}. ${option}`}
                      fontSize={10}
                      fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                      fill="#4B5563"
                      wrap="word"
                      listening={false}
                    />
                  </React.Fragment>
                ))}
                {ensureOptionsArray(slide.options).length > 3 && (
                  <Text
                    x={(slide.interactivePosition?.x || 50) + 16}
                    y={(slide.interactivePosition?.y || 50) + 200}
                    text={`+${ensureOptionsArray(slide.options).length - 3} more`}
                    fontSize={9}
                    fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                    fill="#9CA3AF"
                    listening={false}
                  />
                )}
              </React.Fragment>
            )}
            
            {/* Response counter */}
            <Rect
              x={(slide.interactivePosition?.x || 50) + 16}
              y={(slide.interactivePosition?.y || 50) + (slide.interactiveSize?.height || 300) - 32}
              width={80}
              height={20}
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth={1}
              cornerRadius={4}
              listening={false}
            />
            <Text
              x={(slide.interactivePosition?.x || 50) + 24}
              y={(slide.interactivePosition?.y || 50) + (slide.interactiveSize?.height || 300) - 26}
              text="0 responses"
              fontSize={9}
              fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
              fill="#64748B"
              fontStyle="500"
              listening={false}
            />
          </React.Fragment>
        )}
        
        {/* Transformer */}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum size constraints
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
};

export default KonvaCanvas; 