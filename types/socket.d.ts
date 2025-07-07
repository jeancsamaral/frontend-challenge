import { NextApiResponse } from 'next';
import { Server as NetServer, Socket } from 'net';
import { Server as SocketIOServer } from 'socket.io';

// Extend NextApiResponse to include Socket.IO server
export interface NextApiResponseServerIO extends NextApiResponse {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
}

// Socket.IO Event types
export interface ServerToClientEvents {
  'answer-update': (data: AnswerUpdateData) => void;
  'slide-change': (data: SlideChangeData) => void;
  'presentation-start': (data: PresentationStartData) => void;
  'presentation-end': () => void;
  'student-joined': (data: StudentJoinedData) => void;
  'student-left': (data: StudentLeftData) => void;
  'live-stats': (data: LiveStatsData) => void;
}

export interface ClientToServerEvents {
  'join-room': (data: JoinRoomData) => void;
  'leave-room': (data: LeaveRoomData) => void;
  'answer': (data: AnswerData) => void;
  'teacher-slide-change': (data: TeacherSlideChangeData) => void;
  'start-presentation': (data: StartPresentationData) => void;
  'end-presentation': (data: EndPresentationData) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  role: 'teacher' | 'student';
  userId: string;
  userName: string;
  roomId: string;
}

// Event payload interfaces
export interface JoinRoomData {
  roomId: string;
  role: 'teacher' | 'student';
  userId: string;
  userName: string;
}

export interface LeaveRoomData {
  roomId: string;
}

export interface AnswerData {
  roomId: string;
  slideId: string;
  elementId: string;
  value: string | number;
  timestamp: Date;
}

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
}

export interface TeacherSlideChangeData {
  roomId: string;
  slideIndex: number;
  slideId: string;
}

export interface PresentationStartData {
  presentationId: string;
  title: string;
  totalSlides: number;
}

export interface StartPresentationData {
  roomId: string;
  presentationId: string;
  title: string;
  totalSlides: number;
}

export interface EndPresentationData {
  roomId: string;
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

export interface LiveStatsData {
  slideId: string;
  elementId: string;
  stats: {
    totalResponses: number;
    responses: Array<{
      value: string | number;
      count: number;
      percentage: number;
    }>;
  };
}

// Room management types
export interface RoomInfo {
  id: string;
  presentationId?: string;
  teacherId: string;
  studentIds: Set<string>;
  currentSlideIndex: number;
  isActive: boolean;
  createdAt: Date;
}

export type Role = 'teacher' | 'student'; 