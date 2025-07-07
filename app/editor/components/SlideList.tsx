'use client';

import React from 'react';
import { Slide } from '../../shared/types';

interface SlideListProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
}

const SlideList: React.FC<SlideListProps> = ({
  slides,
  currentSlideIndex,
  onSlideSelect,
  onAddSlide,
  onDeleteSlide,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Slides</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`
              relative group mb-2 p-3 rounded-lg border-2 cursor-pointer transition-all
              ${
                currentSlideIndex === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => onSlideSelect(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {slide.title}
                </div>
                <div className="text-xs text-gray-500">
                  {slide.elements.length} elements
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-400">
                  {index + 1}
                </span>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlide(index);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-800 transition-opacity"
                    title="Delete slide"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {/* Slide thumbnail placeholder */}
            <div 
              className="mt-2 w-full h-20 rounded border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
              style={{ backgroundColor: slide.backgroundColor }}
            >
              <div className="text-xs text-gray-400">
                Preview
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onAddSlide}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Slide
        </button>
      </div>
    </div>
  );
};

export default SlideList; 