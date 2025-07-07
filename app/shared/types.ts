// Types for slide editor elements
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseElement {
  id: string;
  type: 'text' | 'image' | 'interactive';
  position: Position;
  size: Size;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
}

export interface InteractiveElement extends BaseElement {
  type: 'interactive';
  interactionType: 'multiple-choice' | 'word-cloud' | 'live-poll';
  question: string;
  options?: string[]; // for multiple choice
  responses: Response[];
  // Live response data
  liveStats?: {
    totalResponses: number;
    responses: Array<{
      value: string | number;
      count: number;
      percentage: number;
    }>;
  };
}

export type SlideElement = TextElement | ImageElement | InteractiveElement;

export interface Slide {
  id: string;
  title: string;
  elements: SlideElement[];
  backgroundColor: string;
  thumbnail?: string;
  isInteractive?: boolean;
  question?: string;
  interactiveType?: 'multiple-choice' | 'word-cloud' | 'live-poll';
  options?: string[];
  interactivePosition?: { x: number; y: number };
  interactiveSize?: { width: number; height: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  currentSlideIndex: number;
  createdAt: Date;
  updatedAt: Date;
  // Live presentation data
  roomId?: string;
  isLive?: boolean;
  liveUrl?: string;
}

// Types for student responses
export interface Response {
  id: string;
  slideId: string;
  elementId: string;
  studentId: string;
  content: string;
  timestamp: Date;
  // Real-time data
  userName?: string;
  sessionId?: string;
}

export interface StudentSession {
  id: string;
  presentationId: string;
  joinCode: string;
  isActive: boolean;
  // Real-time session info
  roomId?: string;
  studentsCount?: number;
  lastActivity?: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Editor state types
export interface EditorState {
  selectedElementId: string | null;
  isEditing: boolean;
  tool: 'select' | 'text' | 'image' | 'interactive';
  zoom: number;
}

// Real-time specific types
export interface LivePresentationSession {
  roomId: string;
  presentationId: string;
  teacherId: string;
  currentSlideIndex: number;
  isActive: boolean;
  studentsCount: number;
  startedAt: Date;
  endedAt?: Date;
}

export interface LiveResponse {
  id: string;
  slideId: string;
  elementId: string;
  value: string | number;
  userId: string;
  userName: string;
  timestamp: Date;
  sessionId: string;
}

export interface WordCloudData {
  word: string;
  count: number;
  size: number;
  color: string;
  x: number;
  y: number;
}

export interface PollOption {
  id: string;
  text: string;
  count: number;
  percentage: number;
  color: string;
} 