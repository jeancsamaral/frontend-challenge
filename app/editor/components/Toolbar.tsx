'use client';

import React, { useState } from 'react';
import { useEditorState } from '../../shared/hooks';
import { createTextElement, createImageElement, createInteractiveElement, imageStorage } from '../../shared/utils';

interface ToolbarProps {
  onSave: () => void;
  onAddElement?: (element: any) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onSave, onAddElement }) => {
  const { editorState, setTool } = useEditorState();
  const [showImageModal, setShowImageModal] = useState(false);
  const [showInteractiveModal, setShowInteractiveModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [isUploading, setIsUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [interactiveType, setInteractiveType] = useState<'multiple-choice' | 'word-cloud' | 'live-poll'>('multiple-choice');
  const [question, setQuestion] = useState('');

  // Initialize gallery images on mount
  React.useEffect(() => {
    loadGalleryImages();
  }, []);

  // Add keyboard event handlers for modal management
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showImageModal) {
          setShowImageModal(false);
          setImageUrl('');
          setSelectedFile(null);
          setPreviewUrl('');
          setUploadMethod('url');
          setShowGallery(false);
        } else if (showInteractiveModal) {
          setShowInteractiveModal(false);
          setQuestion('');
        }
      }
    };

    if (showImageModal || showInteractiveModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showImageModal, showInteractiveModal]);

  const tools = [
    { id: 'select', label: 'Select', icon: '↖️' },
    { id: 'text', label: 'Text', icon: 'T' },
    { id: 'image', label: 'Image', icon: '🖼️' },
    { id: 'interactive', label: 'Interactive', icon: '📊' },
  ] as const;

  const handleToolClick = (toolId: string) => {
    setTool(toolId as any);
    
    if (toolId === 'text') {
      const textElement = createTextElement(100, 100);
      onAddElement?.(textElement);
    } else if (toolId === 'image') {
      setShowImageModal(true);
      loadGalleryImages();
    } else if (toolId === 'interactive') {
      setShowInteractiveModal(true);
    }
  };

  const loadGalleryImages = () => {
    try {
      const images = imageStorage.getAllImages();
      setGalleryImages(images || []);
    } catch (error) {
      console.error('Error loading gallery images:', error);
      setGalleryImages([]);
    }
  };

  const saveImageToStorage = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      return await imageStorage.saveImage(file);
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Image size must be less than 5MB.');
        return;
      }
      
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result && typeof result === 'string') {
          setPreviewUrl(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl('');
    }
  };

  const handleSelectGalleryImage = (imageData: any) => {
    const imageElement = createImageElement(imageData.data, 100, 100);
    onAddElement?.(imageElement);
    
    setImageUrl('');
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadMethod('url');
    setShowGallery(false);
    setShowImageModal(false);
  };

  const handleDeleteGalleryImage = (fileName: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      imageStorage.deleteImage(fileName);
      loadGalleryImages(); 
    }
  };

  const handleAddImage = async () => {
    try {
      let imageSrc = '';
      
      if (uploadMethod === 'url') {
        if (!imageUrl.trim()) {
          alert('Please enter a valid image URL.');
          return;
        }
        imageSrc = imageUrl.trim();
      } else {
        if (!selectedFile) {
          alert('Please select an image file.');
          return;
        }
        imageSrc = await saveImageToStorage(selectedFile);
        loadGalleryImages();
      }
      
      const imageElement = createImageElement(imageSrc, 100, 100);
      onAddElement?.(imageElement);
      
      // Reset modal state
      setImageUrl('');
      setSelectedFile(null);
      setPreviewUrl('');
      setUploadMethod('url');
      setShowImageModal(false);
      
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Failed to add image. Please try again.');
    }
  };

  const handleAddInteractive = () => {
    if (question.trim()) {
      const interactiveElement = createInteractiveElement(interactiveType, question.trim(), 100, 100);
      onAddElement?.(interactiveElement);
      setQuestion('');
      setShowInteractiveModal(false);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-2 lg:px-4 py-2 lg:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 lg:space-x-2 overflow-x-auto scrollbar-hide">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`
                  px-2 lg:px-3 py-1 lg:py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0
                  ${
                    editorState.tool === tool.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
                title={tool.label}
              >
                <span className="mr-1">{tool.icon}</span>
                <span className="hidden sm:inline">{tool.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
            <div className="flex items-center space-x-1 border-r border-gray-300 pr-1 lg:pr-2">
              <button
                onClick={() => {}}
                className="p-1 lg:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Undo"
              >
                ↶
              </button>
              <button
                onClick={() => {}}
                className="p-1 lg:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Redo"
              >
                ↷
              </button>
            </div>

            <button
              onClick={onSave}
              className="bg-blue-600 text-white px-2 lg:px-4 py-1 lg:py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <span className="hidden sm:inline">Save</span>
              <span className="sm:hidden">💾</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Image</h3>
            
            {/* Upload method selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose method:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="imageMethod"
                    value="url"
                    checked={uploadMethod === 'url' && !showGallery}
                    onChange={(e) => {
                      setUploadMethod(e.target.value as 'url' | 'file');
                      setShowGallery(false);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Image URL</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="imageMethod"
                    value="file"
                    checked={uploadMethod === 'file' && !showGallery}
                    onChange={(e) => {
                      setUploadMethod(e.target.value as 'url' | 'file');
                      setShowGallery(false);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Upload from computer</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="imageMethod"
                    value="gallery"
                    checked={showGallery}
                    onChange={(e) => setShowGallery(true)}
                    className="mr-2"
                  />
                  <span className="text-sm">From gallery ({galleryImages?.length || 0})</span>
                </label>
              </div>
            </div>

            {showGallery ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select from Gallery
                </label>
                {galleryImages && galleryImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-2">
                    {galleryImages.map((imageData) => (
                      <div key={imageData.fileName} className="relative group">
                        <img
                          src={imageData.data}
                          alt={imageData.originalName}
                          className="w-full h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-blue-500"
                          onClick={() => handleSelectGalleryImage(imageData)}
                        />
                        <button
                          onClick={() => handleDeleteGalleryImage(imageData.fileName)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete image"
                        >
                          ×
                        </button>
                        <div className="text-xs text-gray-500 mt-1 truncate" title={imageData.originalName}>
                          {imageData.originalName}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No images in gallery</p>
                    <p className="text-sm">Upload some images to see them here</p>
                  </div>
                )}
                {galleryImages && galleryImages.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Gallery: {galleryImages.length} images</p>
                    <p>Storage used: {((imageStorage.getStorageSize?.() || 0) / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            ) : uploadMethod === 'url' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (imageUrl.trim()) {
                        handleAddImage();
                      }
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Press Enter to add image</p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Selected: {selectedFile.name}</p>
                    <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {!showGallery && (previewUrl || (uploadMethod === 'url' && imageUrl)) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview:
                </label>
                <div className="border rounded-md p-2">
                  <img
                    src={previewUrl || imageUrl}
                    alt="Preview"
                    className="max-w-full h-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> {showGallery 
                  ? 'Click on any image to add it to your slide. Hover over images to see the delete button.'
                  : uploadMethod === 'url' 
                  ? 'Make sure the image URL is publicly accessible and ends with a common image format (jpg, png, gif, etc.).'
                  : 'Images are saved locally for now. Max size: 5MB. Supported formats: JPG, PNG, GIF, WebP.'
                }
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                <strong>Keyboard shortcuts:</strong> Press Enter to add image, ESC to cancel
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrl('');
                  setSelectedFile(null);
                  setPreviewUrl('');
                  setUploadMethod('url');
                  setShowGallery(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isUploading}
              >
                Cancel
              </button>
              {!showGallery && (
                <button
                  onClick={handleAddImage}
                  disabled={isUploading || (uploadMethod === 'url' ? !imageUrl.trim() : !selectedFile)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Add Image'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Elements Modal */}
      {showInteractiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Interactive Element</h3>
                  <p className="text-sm text-gray-500">Create engaging content for students</p>
                </div>
                <button
                  onClick={() => {
                    setShowInteractiveModal(false);
                    setQuestion('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Interaction Type */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  Interaction Type
                </label>
                <div className="grid gap-3">
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    interactiveType === 'multiple-choice' 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="interactiveType"
                      value="multiple-choice"
                      checked={interactiveType === 'multiple-choice'}
                      onChange={(e) => setInteractiveType(e.target.value as any)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Multiple Choice</div>
                      <div className="text-sm text-gray-500">Students pick from options</div>
                    </div>
                  </label>

                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    interactiveType === 'word-cloud' 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="interactiveType"
                      value="word-cloud"
                      checked={interactiveType === 'word-cloud'}
                      onChange={(e) => setInteractiveType(e.target.value as any)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Word Cloud</div>
                      <div className="text-sm text-gray-500">Students submit words</div>
                    </div>
                  </label>

                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    interactiveType === 'live-poll' 
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="interactiveType"
                      value="live-poll"
                      checked={interactiveType === 'live-poll'}
                      onChange={(e) => setInteractiveType(e.target.value as any)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Live Poll</div>
                      <div className="text-sm text-gray-500">Students submit responses</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Question Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                  Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (question.trim()) {
                        handleAddInteractive();
                      }
                    }
                  }}
                  placeholder="What would you like to ask your students?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500">Press Enter to create, Shift+Enter for new line</p>
              </div>
              
              {/* Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h6 className="font-medium text-gray-900 mb-2">Next steps:</h6>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>• Element will be added to your slide</div>
                  <div>• Configure options in Properties Panel</div>
                  <div>• Generate join code for students</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Keyboard shortcuts:</strong> Enter to create, Shift+Enter for new line, ESC to cancel
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowInteractiveModal(false);
                    setQuestion('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddInteractive}
                  disabled={!question.trim()}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  Add Element
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar; 