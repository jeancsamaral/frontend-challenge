import { useState, useEffect, useCallback, useRef } from 'react';
import { Presentation, Slide, SlideElement, EditorState } from './types';
import { io, Socket } from 'socket.io-client';

// Tipos para Socket.IO
export type Role = 'teacher' | 'student';

export interface AnswerUpdateData {
  slideId: string;
  elementId: string;
  value: string | number;
  timestamp: Date;
  userId: string;
  userName: string;
}

export interface SlideChangeData {
  slideIndex: number;
  slideId: string;
  slideData?: any; 
}

export interface PresentationStartData {
  presentationId: string;
  title: string;
  totalSlides: number;
}

export interface StudentJoinedData {
  userId: string;
  userName: string;
  totalStudents: number;
}

export interface StudentLeftData {
  userId: string;
  userName: string;
  totalStudents: number;
}

type SocketRef = Socket | null;

export interface UseSocketReturn {
  socket: SocketRef;
  isConnected: boolean;
  joinRoom: (roomId: string, role: Role, userId: string, userName: string) => void;
  leaveRoom: (roomId: string) => void;
  sendAnswer: (roomId: string, slideId: string, elementId: string, value: string | number, studentId?: string) => void;
  changeSlide: (roomId: string, slideIndex: number, slideId: string) => void;
  updateCurrentSlide: (roomId: string, slideIndex: number, slideId: string, presentationId: string, presentationTitle: string, totalSlides: number, slideData?: any) => void;
  startPresentation: (roomId: string, presentationId: string, title: string, totalSlides: number) => void;
  endPresentation: (roomId: string) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<SocketRef>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socket = io({
      path: '/api/socket',
      autoConnect: false,
      transports: ['polling', 'websocket'],
      upgrade: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = socket;

    // Connect the socket
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId: string, role: Role, userId: string, userName: string) => {
    if (socketRef.current && isConnected) {
      console.log(`Joining room: ${roomId} as ${role}`);
      socketRef.current.emit('join-room', { roomId, role, userId, userName });
    }
  }, [isConnected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-room', { roomId });
    }
  }, [isConnected]);

  const sendAnswer = useCallback((roomId: string, slideId: string, elementId: string, value: string | number, studentId?: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('answer', {
        roomId,
        slideId,
        elementId,
        value,
        studentId,
        timestamp: new Date(),
      });
    }
  }, [isConnected]);

  const changeSlide = useCallback((roomId: string, slideIndex: number, slideId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('teacher-slide-change', {
        roomId,
        slideIndex,
        slideId,
      });
    }
  }, [isConnected]);

  const updateCurrentSlide = useCallback((
    roomId: string, 
    slideIndex: number, 
    slideId: string, 
    presentationId: string, 
    presentationTitle: string, 
    totalSlides: number,
    slideData?: any 
  ) => {
    if (socketRef.current && isConnected) {
      console.log(`Updating current slide: ${slideIndex} for room ${roomId}`);
      socketRef.current.emit('teacher-current-slide', {
        roomId,
        slideIndex,
        slideId,
        presentationId,
        presentationTitle,
        totalSlides,
        slideData, 
      });
    }
  }, [isConnected]);

  const startPresentation = useCallback((roomId: string, presentationId: string, title: string, totalSlides: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('start-presentation', {
        roomId,
        presentationId,
        title,
        totalSlides,
      });
    }
  }, [isConnected]);

  const endPresentation = useCallback((roomId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('end-presentation', { roomId });
    }
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendAnswer,
    changeSlide,
    updateCurrentSlide,
    startPresentation,
    endPresentation,
  };
}

// Hook for managing live presentation state
export interface UseLivePresentationReturn {
  studentsCount: number;
  currentSlideIndex: number;
  responses: AnswerUpdateData[];
  isPresenting: boolean;
  onAnswerUpdate: (callback: (data: AnswerUpdateData) => void) => void;
  onSlideChange: (callback: (data: SlideChangeData) => void) => void;
  onStudentJoined: (callback: (data: StudentJoinedData) => void) => void;
  onStudentLeft: (callback: (data: StudentLeftData) => void) => void;
  onPresentationStart: (callback: (data: PresentationStartData) => void) => void;
  onPresentationEnd: (callback: () => void) => void;
}

export function useLivePresentation(socket: SocketRef): UseLivePresentationReturn {
  const [studentsCount, setStudentsCount] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [responses, setResponses] = useState<AnswerUpdateData[]>([]);
  const [isPresenting, setIsPresenting] = useState(false);

  const onAnswerUpdate = useCallback((callback: (data: AnswerUpdateData) => void) => {
    if (socket) {
      const handler = (data: AnswerUpdateData) => {
        console.log('Answer update received:', data);
        setResponses(prev => [...prev, data]);
        callback(data);
      };
      
      socket.on('answer-update', handler);
      
      // Return cleanup function
      return () => {
        socket.off('answer-update', handler);
      };
    }
  }, [socket]);

  const onSlideChange = useCallback((callback: (data: SlideChangeData) => void) => {
    if (socket) {
      const handler = (data: SlideChangeData) => {
        console.log('Slide change received:', data);
        setCurrentSlideIndex(data.slideIndex);
        // Clear responses when slide changes
        setResponses([]);
        callback(data);
      };
      
      socket.on('slide-change', handler);
      
      return () => {
        socket.off('slide-change', handler);
      };
    }
  }, [socket]);

  const onStudentJoined = useCallback((callback: (data: StudentJoinedData) => void) => {
    if (socket) {
      const handler = (data: StudentJoinedData) => {
        console.log('Student joined:', data);
        setStudentsCount(data.totalStudents);
        callback(data);
      };
      
      socket.on('student-joined', handler);
      
      return () => {
        socket.off('student-joined', handler);
      };
    }
  }, [socket]);

  const onStudentLeft = useCallback((callback: (data: StudentLeftData) => void) => {
    if (socket) {
      const handler = (data: StudentLeftData) => {
        console.log('Student left:', data);
        setStudentsCount(data.totalStudents);
        callback(data);
      };
      
      socket.on('student-left', handler);
      
      return () => {
        socket.off('student-left', handler);
      };
    }
  }, [socket]);

  const onPresentationStart = useCallback((callback: (data: PresentationStartData) => void) => {
    if (socket) {
      const handler = (data: PresentationStartData) => {
        console.log('Presentation started:', data);
        setIsPresenting(true);
        callback(data);
      };
      
      socket.on('presentation-start', handler);
      
      return () => {
        socket.off('presentation-start', handler);
      };
    }
  }, [socket]);

  const onPresentationEnd = useCallback((callback: () => void) => {
    if (socket) {
      const handler = () => {
        console.log('Presentation ended');
        setIsPresenting(false);
        setResponses([]);
        callback();
      };
      
      socket.on('presentation-end', handler);
      
      return () => {
        socket.off('presentation-end', handler);
      };
    }
  }, [socket]);

  return {
    studentsCount,
    currentSlideIndex,
    responses,
    isPresenting,
    onAnswerUpdate,
    onSlideChange,
    onStudentJoined,
    onStudentLeft,
    onPresentationStart,
    onPresentationEnd,
  };
}

// Hook for managing presentations
export const usePresentation = (presentationId?: string) => {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPresentation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/slides?id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setPresentation(data.data);
      } else {
        setError(data.error || 'Failed to load presentation');
      }
    } catch (err) {
      setError('Failed to load presentation');
    } finally {
      setLoading(false);
    }
  }, []);

  const savePresentation = useCallback(async (presentation: Presentation) => {
    try {
      const response = await fetch('/api/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(presentation),
      });
      
      const data = await response.json();
      if (data.success) {
        // Keep the current presentation state, only update the updatedAt timestamp
        setPresentation(prevPresentation => 
          prevPresentation ? {
            ...prevPresentation,
            updatedAt: new Date(),
          } : null
        );
        return true;
      } else {
        setError(data.error || 'Failed to save presentation');
        return false;
      }
    } catch (err) {
      setError('Failed to save presentation');
      return false;
    }
  }, []);

  useEffect(() => {
    if (presentationId) {
      loadPresentation(presentationId);
    } else {
      setLoading(false);
    }
  }, [presentationId, loadPresentation]);

  return {
    presentation,
    setPresentation,
    loading,
    error,
    savePresentation,
    loadPresentation,
  };
};

// Hook for managing slide elements
export const useSlideElements = (slideId: string) => {
  const [elements, setElements] = useState<SlideElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const addElement = useCallback((element: SlideElement) => {
    setElements(prev => [...prev, element]);
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    setElements(prev => 
      prev.map(el => 
        el.id === elementId ? { ...el, ...updates } as SlideElement : el
      )
    );
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const moveElement = useCallback((elementId: string, newPosition: { x: number; y: number }) => {
    updateElement(elementId, { position: newPosition });
  }, [updateElement]);

  const resizeElement = useCallback((elementId: string, newSize: { width: number; height: number }) => {
    updateElement(elementId, { size: newSize });
  }, [updateElement]);

  const getSelectedElement = useCallback(() => {
    return elements.find(el => el.id === selectedElementId) || null;
  }, [elements, selectedElementId]);

  return {
    elements,
    setElements,
    selectedElementId,
    setSelectedElementId,
    addElement,
    updateElement,
    deleteElement,
    moveElement,
    resizeElement,
    getSelectedElement,
  };
};

// Hook for editor state management
export const useEditorState = () => {
  const [editorState, setEditorState] = useState<EditorState>({
    selectedElementId: null,
    isEditing: false,
    tool: 'select',
    zoom: 1,
  });

  const setTool = useCallback((tool: EditorState['tool']) => {
    setEditorState(prev => ({ ...prev, tool }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setEditorState(prev => ({ ...prev, zoom }));
  }, []);

  const setSelectedElement = useCallback((elementId: string | null) => {
    setEditorState(prev => ({ 
      ...prev, 
      selectedElementId: elementId,
      isEditing: false 
    }));
  }, []);

  const setIsEditing = useCallback((isEditing: boolean) => {
    setEditorState(prev => ({ ...prev, isEditing }));
  }, []);

  return {
    editorState,
    setTool,
    setZoom,
    setSelectedElement,
    setIsEditing,
  };
};

// Hook for real-time responses
export const useRealTimeResponses = (slideId: string, elementId: string) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // This would be implemented with WebSockets or Server-Sent Events
    // For now, we'll use polling as a placeholder
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/responses?slideId=${slideId}&elementId=${elementId}`);
        const data = await response.json();
        
        if (data.success) {
          setResponses(data.data);
          setConnected(true);
        }
      } catch (err) {
        setConnected(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [slideId, elementId]);

  return { responses, connected };
}; 