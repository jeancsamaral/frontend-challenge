import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Type assertion for socket server
    const httpServer = (res as any).socket.server;
    
    if (!httpServer.io) {
      console.log('⚡ Initializing Socket.IO server...');
      
      const io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
          credentials: false,
        },
        allowEIO3: true,
        transports: ['polling', 'websocket'],
        pingTimeout: 60000,
        pingInterval: 25000,
      });

      // Simple in-memory storage
      const rooms = new Map();

      io.on('connection', (socket) => {
        console.log('🔌 Socket connected:', socket.id);

        // Join room handler
        socket.on('join-room', (data) => {
          console.log('📥 Join room event:', data);
          
          try {
            const { roomId, role, userId, userName } = data || {};
            
            if (!roomId || !role || !userId || !userName) {
              console.error('❌ Invalid join-room data:', data);
              socket.emit('error', { message: 'Invalid room data' });
              return;
            }

            socket.join(roomId);
            (socket as any).roomData = { roomId, role, userId, userName };
            
            if (!rooms.has(roomId)) {
              rooms.set(roomId, {
                id: roomId,
                teacherId: '',
                students: new Map(), // 🎯 CORREÇÃO: Usar Map para melhores dados dos estudantes
                currentSlide: 0,
                currentSlideId: null,
                currentSlideData: null,
                presentationId: null,
                presentationTitle: '',
                totalSlides: 0,
                isActive: false,
                responses: new Map() // 🎯 NOVA: Armazenar respostas por slide
              });
            }

            const room = rooms.get(roomId);
            
            if (role === 'teacher') {
              room.teacherId = userId;
              console.log(`👨‍🏫 Teacher ${userName} joined room ${roomId}`);
              
              // 🎯 CORREÇÃO: Notificar professor sobre estudantes atuais
              socket.emit('students-update', {
                totalStudents: room.students.size,
                students: Array.from(room.students.values())
              });
              
            } else {
              // 🎯 CORREÇÃO: Armazenar dados completos do estudante
              room.students.set(userId, {
                id: userId,
                name: userName,
                joinedAt: new Date(),
                lastActivity: new Date()
              });
              
              // 🎯 CORREÇÃO: Notificar professor sobre novo estudante com contagem correta
              socket.to(roomId).emit('student-joined', {
                userId,
                userName,
                totalStudents: room.students.size,
              });
              
              // Enviar slide atual automaticamente para o estudante
              console.log(`📊 Room state for ${roomId}:`, {
                currentSlideId: room.currentSlideId,
                currentSlide: room.currentSlide,
                presentationId: room.presentationId,
                isActive: room.isActive,
                hasSlideData: !!room.currentSlideData
              });
              
              if (room.currentSlideId) {
                console.log(`📊 Sending current slide ${room.currentSlide} (${room.currentSlideId}) to new student ${userName}`);
                socket.emit('slide-change', {
                  slideIndex: room.currentSlide,
                  slideId: room.currentSlideId,
                  slideData: room.currentSlideData
                });
                
                // Se há apresentação ativa, enviar dados da apresentação
                if (room.presentationId) {
                  console.log(`📊 Sending presentation data to new student ${userName}`);
                  socket.emit('presentation-start', {
                    presentationId: room.presentationId,
                    title: room.presentationTitle,
                    totalSlides: room.totalSlides,
                  });
                }
              } else {
                console.log(`⚠️ No current slide set for room ${roomId} - student ${userName} will wait`);
              }
              
              console.log(`👨‍🎓 Student ${userName} joined room ${roomId} (total: ${room.students.size})`);
            }

          } catch (error) {
            console.error('❌ Error in join-room:', error);
            socket.emit('error', { message: 'Failed to join room' });
          }
        });

        // 🎯 NOVA FUNCIONALIDADE: Teacher current slide update (quando professor navega no editor)
        socket.on('teacher-current-slide', (data) => {
          console.log('📍 Teacher current slide update:', data);
          
          try {
            const { roomId, slideIndex, slideId, presentationId, presentationTitle, totalSlides, slideData } = data || {};
            const roomData = (socket as any).roomData;
            
            if (!roomData || roomData.role !== 'teacher') {
              console.error('❌ Unauthorized slide update attempt');
              return;
            }

            const room = rooms.get(roomId);
            if (room) {
              // Atualizar dados da sala
              room.currentSlide = slideIndex;
              room.currentSlideId = slideId;
              room.currentSlideData = slideData; // 🎯 NOVA: Armazenar dados completos do slide
              room.presentationId = presentationId;
              room.presentationTitle = presentationTitle;
              room.totalSlides = totalSlides;
              room.isActive = true; // Considerar que a apresentação está ativa quando professor navega
              
              // 🎯 NOVA: Enviar dados completos do slide para todos os estudantes na sala
              socket.to(roomId).emit('slide-change', { 
                slideIndex, 
                slideId,
                slideData // 🎯 NOVA: Incluir dados completos do slide
              });
              
              // Se é a primeira vez que define uma apresentação, enviar dados da apresentação
              if (presentationId && presentationTitle) {
                socket.to(roomId).emit('presentation-start', {
                  presentationId,
                  title: presentationTitle,
                  totalSlides,
                });
              }
              
              console.log(`📊 Current slide updated to ${slideIndex} for room ${roomId}, broadcasted to ${room.students.size} students`);
            }

          } catch (error) {
            console.error('❌ Error updating current slide:', error);
          }
        });

        // Answer handler
        socket.on('answer', (data) => {
          console.log('📝 Answer received:', data);
          
          try {
            const { roomId, slideId, elementId, value } = data || {};
            const roomData = (socket as any).roomData;
            
            if (!roomData || !roomId || !slideId) {
              console.error('❌ Invalid answer data');
              return;
            }

            const room = rooms.get(roomId);
            if (!room) {
              console.error('❌ Room not found for answer');
              return;
            }

            // 🎯 NOVA FUNCIONALIDADE: Armazenar resposta com dados completos
            const answerData = {
              slideId,
              elementId,
              value,
              timestamp: new Date(),
              userId: roomData.userId,
              userName: roomData.userName,
            };

            // Criar chave única para a resposta (userId + slideId + elementId)
            const responseKey = `${roomData.userId}-${slideId}-${elementId}`;
            
            // Armazenar resposta no Map de respostas da sala
            if (!room.responses.has(slideId)) {
              room.responses.set(slideId, new Map());
            }
            room.responses.get(slideId).set(responseKey, answerData);

            // Atualizar atividade do estudante
            const student = room.students.get(roomData.userId);
            if (student) {
              student.lastActivity = new Date();
            }

            // 🎯 NOVA: Enviar estatísticas atualizadas para o professor
            const slideResponses = Array.from(room.responses.get(slideId)?.values() || []);
            
            // Broadcast resposta individual e estatísticas
            io.to(roomId).emit('answer-update', answerData);
            
            // Enviar estatísticas apenas para o professor
            const teacherSocket = Array.from(io.sockets.sockets.values())
              .find(s => (s as any).roomData?.roomId === roomId && (s as any).roomData?.role === 'teacher');
            
            if (teacherSocket) {
              teacherSocket.emit('slide-responses-update', {
                slideId,
                responses: slideResponses,
                totalStudents: room.students.size
              });
            }

            console.log(`✅ Answer saved and broadcasted from ${roomData.userName}: ${value} (Total responses for slide: ${slideResponses.length})`);

          } catch (error) {
            console.error('❌ Error processing answer:', error);
          }
        });

        // Slide change handler (manual pelo painel live)
        socket.on('teacher-slide-change', (data) => {
          console.log('🎯 Manual slide change:', data);
          
          try {
            const { roomId, slideIndex, slideId } = data || {};
            const roomData = (socket as any).roomData;
            
            if (!roomData || roomData.role !== 'teacher') {
              console.error('❌ Unauthorized slide change attempt');
              return;
            }

            const room = rooms.get(roomId);
            if (room) {
              room.currentSlide = slideIndex;
              room.currentSlideId = slideId;
              socket.to(roomId).emit('slide-change', { slideIndex, slideId });
              console.log(`📊 Manual slide changed to ${slideIndex} in room ${roomId}`);
            }

          } catch (error) {
            console.error('❌ Error changing slide:', error);
          }
        });

        // Start presentation
        socket.on('start-presentation', (data) => {
          console.log('🚀 Starting presentation:', data);
          
          try {
            const { roomId, presentationId, title, totalSlides } = data || {};
            const roomData = (socket as any).roomData;
            
            if (!roomData || roomData.role !== 'teacher') {
              console.error('❌ Unauthorized presentation start');
              return;
            }

            const room = rooms.get(roomId);
            if (room) {
              room.isActive = true;
              room.presentationId = presentationId;
              room.presentationTitle = title;
              room.totalSlides = totalSlides;
              
              socket.to(roomId).emit('presentation-start', {
                presentationId,
                title,
                totalSlides,
              });
              
              console.log(`🎬 Presentation "${title}" started in room ${roomId}`);
            }

          } catch (error) {
            console.error('❌ Error starting presentation:', error);
          }
        });

        // End presentation
        socket.on('end-presentation', (data) => {
          console.log('🛑 Ending presentation:', data);
          
          try {
            const { roomId } = data || {};
            const roomData = (socket as any).roomData;
            
            if (!roomData || roomData.role !== 'teacher') {
              console.error('❌ Unauthorized presentation end');
              return;
            }

            const room = rooms.get(roomId);
            if (room) {
              room.isActive = false;
              socket.to(roomId).emit('presentation-end');
              console.log(`🏁 Presentation ended in room ${roomId}`);
            }

          } catch (error) {
            console.error('❌ Error ending presentation:', error);
          }
        });

        // Interactive element removed
        socket.on('interactive-element-removed', (data) => {
          try {
            const { roomId, slideId } = data || {};
            const roomData = (socket as any).roomData;
            
            if (!roomData || roomData.role !== 'teacher') {
              return;
            }

            const room = rooms.get(roomId);
            if (room && room.responses.has(slideId)) {
              room.responses.delete(slideId);
            }

            socket.to(roomId).emit('interactive-element-removed', { slideId });
          } catch (error) {
          }
        });

        // Leave room handler
        socket.on('leave-room', (data) => {
          try {
            const { roomId } = data || {};
            const roomData = (socket as any).roomData;
            
            if (roomData && roomId) {
              const room = rooms.get(roomId);
              if (room && roomData.role === 'student') {
                // 🎯 CORREÇÃO: Usar Map ao invés de Set
                room.students.delete(roomData.userId);
                socket.to(roomId).emit('student-left', {
                  userId: roomData.userId,
                  userName: roomData.userName,
                  totalStudents: room.students.size,
                });
              }
              socket.leave(roomId);
              console.log(`👋 ${roomData.userName} left room ${roomId} (remaining: ${room?.students.size || 0})`);
            }
          } catch (error) {
            console.error('❌ Error leaving room:', error);
          }
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
          
          try {
            const roomData = (socket as any).roomData;
            if (roomData) {
              const room = rooms.get(roomData.roomId);
              if (room && roomData.role === 'student') {
                // 🎯 CORREÇÃO: Usar Map ao invés de Set
                room.students.delete(roomData.userId);
                socket.to(roomData.roomId).emit('student-left', {
                  userId: roomData.userId,
                  userName: roomData.userName,
                  totalStudents: room.students.size,
                });
                console.log(`🔌 Student ${roomData.userName} disconnected from room ${roomData.roomId} (remaining: ${room.students.size})`);
              }
            }
          } catch (error) {
            console.error('❌ Error during disconnect cleanup:', error);
          }
        });

        // Error handler
        socket.on('error', (error) => {
          console.error('🚨 Socket error:', error);
        });
      });

      httpServer.io = io;
      console.log('✅ Socket.IO server ready!');
    }
    
    res.status(200).json({ status: 'ok', transport: 'socket.io' });
    
  } catch (error) {
    console.error('💥 Fatal Socket.IO error:', error);
    res.status(500).json({ 
      error: 'Socket.IO initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 