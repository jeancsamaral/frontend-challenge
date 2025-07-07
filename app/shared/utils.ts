import { SlideElement, TextElement, ImageElement, InteractiveElement } from './types';

// Generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Create default elements
export const createTextElement = (x: number = 100, y: number = 100): TextElement => ({
  id: generateId(),
  type: 'text',
  position: { x, y },
  size: { width: 200, height: 50 },
  zIndex: 1,
  content: 'Double-click to edit',
  fontSize: 16,
  fontFamily: 'Arial',
  color: '#000000',
  fontWeight: 'normal',
  textAlign: 'left',
});

export const createImageElement = (src: string, x: number = 100, y: number = 100): ImageElement => ({
  id: generateId(),
  type: 'image',
  position: { x, y },
  size: { width: 200, height: 150 },
  zIndex: 1,
  src,
  alt: 'Image',
});

export const createInteractiveElement = (
  interactionType: 'multiple-choice' | 'word-cloud' | 'live-poll',
  question: string,
  x: number = 100,
  y: number = 100
): InteractiveElement => ({
  id: generateId(),
  type: 'interactive',
  position: { x, y },
  size: { width: 400, height: 300 },
  zIndex: 1,
  interactionType,
  question,
  options: interactionType === 'multiple-choice' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
  responses: [],
});

// Utility functions for element manipulation
export const isPointInElement = (point: { x: number; y: number }, element: SlideElement): boolean => {
  const { x, y } = point;
  const { position, size } = element;
  
  return (
    x >= position.x &&
    x <= position.x + size.width &&
    y >= position.y &&
    y <= position.y + size.height
  );
};

export const getElementBounds = (element: SlideElement) => ({
  left: element.position.x,
  top: element.position.y,
  right: element.position.x + element.size.width,
  bottom: element.position.y + element.size.height,
});

// Canvas utilities
export const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const constrainToCanvas = (
  position: { x: number; y: number },
  size: { width: number; height: number },
  canvasSize: { width: number; height: number }
): { x: number; y: number } => {
  const x = Math.max(0, Math.min(position.x, canvasSize.width - size.width));
  const y = Math.max(0, Math.min(position.y, canvasSize.height - size.height));
  return { x, y };
};

// Local storage utilities
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

// Color utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Validation utilities
export const isValidImageUrl = (url: string): boolean => {
  const imageRegex = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
  return imageRegex.test(url);
};

export const isValidHexColor = (color: string): boolean => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

// Export utilities
export const exportSlideAsImage = (canvas: any): Promise<string> => {
  return new Promise((resolve) => {
    const dataURL = canvas.toDataURL('image/png');
    resolve(dataURL);
  });
}; 

// Image storage utilities (localStorage for now, S3 in future)
export interface StoredImageData {
  fileName: string;
  data: string; // base64 for localStorage, URL for S3
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
}

/**
 * Image Storage System
 * 
 * Current Implementation: localStorage with base64 encoding
 * Future Implementation: AWS S3 bucket
 * 
 * Migration Guide:
 * 1. Set up AWS S3 bucket with proper CORS configuration
 * 2. Install AWS SDK: npm install aws-sdk
 * 3. Create environment variables:
 *    - AWS_ACCESS_KEY_ID
 *    - AWS_SECRET_ACCESS_KEY
 *    - AWS_REGION
 *    - AWS_S3_BUCKET_NAME
 * 4. Replace localStorage methods with S3 upload/download
 * 5. Update imageData.data to store S3 URL instead of base64
 * 6. Implement proper error handling and retry logic
 * 
 * Example S3 implementation:
 * ```typescript
 * import AWS from 'aws-sdk';
 * 
 * const s3 = new AWS.S3({
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 *   region: process.env.AWS_REGION
 * });
 * 
 * async function uploadToS3(file: File, fileName: string): Promise<string> {
 *   const params = {
 *     Bucket: process.env.AWS_S3_BUCKET_NAME,
 *     Key: fileName,
 *     Body: file,
 *     ContentType: file.type,
 *     ACL: 'public-read'
 *   };
 *   
 *   const result = await s3.upload(params).promise();
 *   return result.Location;
 * }
 * ```
 */
export const imageStorage = {
  // Save image to localStorage (future: S3 bucket)
  async saveImage(file: File): Promise<string> {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `image_${timestamp}.${fileExtension}`;
    
    // Save to localStorage (future: upload to S3)
    const imageData: StoredImageData = {
      fileName,
      data: base64Data,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`teachy_image_${fileName}`, JSON.stringify(imageData));
    
    // TODO: Future S3 implementation
    // const s3Url = await uploadToS3(file, fileName);
    // return s3Url;
    
    console.log('Image saved to localStorage:', fileName);
    return base64Data; // Return base64 for now, will return S3 URL in future
  },

  // Get image from localStorage (future: S3 bucket)
  getImage(fileName: string): StoredImageData | null {
    try {
      const data = localStorage.getItem(`teachy_image_${fileName}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving image:', error);
      return null;
    }
  },

  // List all stored images
  getAllImages(): StoredImageData[] {
    const images: StoredImageData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('teachy_image_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            images.push(JSON.parse(data));
          }
        } catch (error) {
          console.error('Error parsing image data:', error);
        }
      }
    }
    
    return images.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  },

  // Delete image from localStorage (future: S3 bucket)
  deleteImage(fileName: string): boolean {
    try {
      localStorage.removeItem(`teachy_image_${fileName}`);
      // TODO: Future S3 implementation
      // await deleteFromS3(fileName);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  },

  // Get total storage size used by images
  getStorageSize(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('teachy_image_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const imageData: StoredImageData = JSON.parse(data);
            totalSize += imageData.size;
          }
        } catch (error) {
          console.error('Error calculating storage size:', error);
        }
      }
    }
    
    return totalSize;
  },

  // Clean up old images (optional, for localStorage management)
  cleanupOldImages(maxAge: number = 7 * 24 * 60 * 60 * 1000): number { // 7 days default
    const now = Date.now();
    let deletedCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('teachy_image_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const imageData: StoredImageData = JSON.parse(data);
            const uploadTime = new Date(imageData.uploadedAt).getTime();
            
            if (now - uploadTime > maxAge) {
              localStorage.removeItem(key);
              deletedCount++;
            }
          }
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    }
    
    return deletedCount;
  }
};

// Utility function to ensure options is always an array
export const ensureOptionsArray = (options: any): string[] => {
  if (Array.isArray(options)) {
    return options;
  }
  return [];
}; 