'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePresentation, useSocket, AnswerUpdateData } from '../../shared/hooks';
import { Presentation, Slide, SlideElement } from '../../shared/types';
import { generateId } from '../../shared/utils';
import SlideCanvas from '../components/SlideCanvas';
import Toolbar from '../components/Toolbar';
import SlideList from '../components/SlideList';
import PropertiesPanel from '../components/PropertiesPanel';
import { LivePresentationPanel } from '../components/LivePresentationPanel';
import { LiveResponseVisualizations } from '../components/LiveResponseVisualizations';
import { v4 as uuid } from 'uuid';

export default function EditorIdPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { presentation, setPresentation, savePresentation, loading } = usePresentation(resolvedParams.id);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [originalTitle, setOriginalTitle] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);
  const [showLivePanel, setShowLivePanel] = useState(false);
  
  // Estados de responsividade
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [liveResponses, setLiveResponses] = useState<AnswerUpdateData[]>([]);
  const [totalStudentsOnline, setTotalStudentsOnline] = useState(0);
  const [showLiveStats, setShowLiveStats] = useState(false);
  const [slideResponsesCache, setSlideResponsesCache] = useState<Map<string, AnswerUpdateData[]>>(new Map());
  
  const [roomId] = useState(() => uuid().substring(0, 8).toUpperCase());
  const [userId] = useState(() => uuid());
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  const { socket, isConnected, joinRoom, updateCurrentSlide } = useSocket();

  // Detectar se é mobile/tablet
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        // Em mobile, colapsar painéis por padrão
        setSidebarCollapsed(true);
        setPropertiesPanelCollapsed(true);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Listener para fechar properties panel do mobile
  useEffect(() => {
    const handleClosePropertiesPanel = () => {
      setPropertiesPanelCollapsed(true);
    };

    const handleCloseSidebar = () => {
      setSidebarCollapsed(true);
    };

    window.addEventListener('closePropertiesPanel', handleClosePropertiesPanel);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    
    return () => {
      window.removeEventListener('closePropertiesPanel', handleClosePropertiesPanel);
      window.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, []);

  useEffect(() => {
    if (presentation && isConnected && !hasJoinedRoom && session?.user) {
      const createSessionAndJoin = async () => {
        try {
          const response = await fetch('/api/sessions/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              presentationId: presentation.id,
              roomCode: roomId
            }),
          });

          if (response.ok) {
            const sessionData = await response.json();
            setSessionActive(true);
            setSessionError(null);
          } else {
            setSessionActive(false);
            setSessionError('Erro ao criar sessão no banco de dados');
          }

          const userName = session.user.name || 'Professor';
          joinRoom(roomId, 'teacher', userId, userName);
          setHasJoinedRoom(true);
        } catch (error) {
          setSessionActive(false);
          setSessionError('Erro de conexão com o banco de dados');
      const userName = session.user.name || 'Professor';
      joinRoom(roomId, 'teacher', userId, userName);
      setHasJoinedRoom(true);
        }
      };

      createSessionAndJoin();
    }
  }, [presentation, isConnected, hasJoinedRoom, session, joinRoom, roomId, userId]);

  useEffect(() => {
    const endSession = async () => {
      if (hasJoinedRoom) {
        try {
          await fetch('/api/sessions/end', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              roomCode: roomId
            }),
          });
        } catch (error) {
        }
      }
    };

    return () => {
      endSession();
    };
  }, [hasJoinedRoom, roomId]);

  useEffect(() => {
    if (presentation && hasJoinedRoom && autoSyncEnabled && isConnected) {
      const currentSlide = presentation.slides[currentSlideIndex];
      if (currentSlide) {
        console.log(`🔄 Auto-sync: Sending slide ${currentSlideIndex} (${currentSlide.id}) to students`);
        updateCurrentSlide(
          roomId,
          currentSlideIndex,
          currentSlide.id,
          presentation.id,
          presentation.title,
          presentation.slides.length,
          currentSlide 
        );
        console.log(`Auto-synced slide ${currentSlideIndex} to students`);
      }
    }
  }, [presentation, currentSlideIndex, hasJoinedRoom, autoSyncEnabled, isConnected, updateCurrentSlide, roomId]);

  useEffect(() => {
    if (presentation && hasJoinedRoom && autoSyncEnabled && isConnected) {
      const currentSlide = presentation.slides[currentSlideIndex];
      if (currentSlide) {
        console.log(`🔄 Sync activated: Sending current slide ${currentSlideIndex} to students`);
        updateCurrentSlide(
          roomId,
          currentSlideIndex,
          currentSlide.id,
          presentation.id,
          presentation.title,
          presentation.slides.length,
          currentSlide 
        );
      }
    }
  }, [autoSyncEnabled]); 


  useEffect(() => {
    if (socket && hasJoinedRoom) {
      const handleStudentJoined = (data: { userId: string; userName: string; totalStudents: number }) => {
        setTotalStudentsOnline(data.totalStudents);
      };

      const handleStudentLeft = (data: { userId: string; userName: string; totalStudents: number }) => {
        setTotalStudentsOnline(data.totalStudents);
      };

      const handleStudentsUpdate = (data: { totalStudents: number; students: any[] }) => {
        setTotalStudentsOnline(data.totalStudents);
      };

      const handleSlideResponsesUpdate = (data: { slideId: string; responses: AnswerUpdateData[]; totalStudents: number }) => {
        
        setSlideResponsesCache(prev => {
          const newCache = new Map(prev);
          newCache.set(data.slideId, data.responses);
          return newCache;
        });
        
      
        const currentSlide = presentation?.slides[currentSlideIndex];
        if (currentSlide && data.slideId === currentSlide.id) {
          setLiveResponses(data.responses);
          setTotalStudentsOnline(data.totalStudents);
          
          if (data.responses.length > 0 && (currentSlide as any).isInteractive) {
            setShowLiveStats(true);
          }
        }
      };

      const handleAnswerUpdate = (data: AnswerUpdateData) => {
        const currentSlide = presentation?.slides[currentSlideIndex];
        if (currentSlide && data.slideId === currentSlide.id) {
          setLiveResponses(prev => {
            const existingIndex = prev.findIndex(
              r => r.userId === data.userId && r.elementId === data.elementId
            );
            
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = data;
              return updated;
            } else {
              return [...prev, data];
            }
          });
          
          if ((currentSlide as any).isInteractive) {
            setShowLiveStats(true);
          }
        }
        
        setSlideResponsesCache(prev => {
          const newCache = new Map(prev);
          const slideResponses = newCache.get(data.slideId) || [];
          const existingIndex = slideResponses.findIndex(
            r => r.userId === data.userId && r.elementId === data.elementId
          );
          
          if (existingIndex >= 0) {
            slideResponses[existingIndex] = data;
          } else {
            slideResponses.push(data);
          }
          
          newCache.set(data.slideId, slideResponses);
          return newCache;
        });
      };

      // Registrar listeners
      socket.on('student-joined', handleStudentJoined);
      socket.on('student-left', handleStudentLeft);
      socket.on('students-update', handleStudentsUpdate);
      socket.on('slide-responses-update', handleSlideResponsesUpdate);
      socket.on('answer-update', handleAnswerUpdate);

      return () => {
        socket.off('student-joined', handleStudentJoined);
        socket.off('student-left', handleStudentLeft);
        socket.off('students-update', handleStudentsUpdate);
        socket.off('slide-responses-update', handleSlideResponsesUpdate);
        socket.off('answer-update', handleAnswerUpdate);
      };
    }
  }, [socket, hasJoinedRoom, presentation, currentSlideIndex]);

  useEffect(() => {
    if (presentation && currentSlideIndex >= 0) {
      const currentSlide = presentation.slides[currentSlideIndex];
      if (currentSlide) {        
        const cachedResponses = slideResponsesCache.get(currentSlide.id);
        if (cachedResponses && cachedResponses.length > 0) {
          setLiveResponses(cachedResponses);
          if ((currentSlide as any).isInteractive) {
            setShowLiveStats(true);
          }
        } else {
    setLiveResponses([]);
    setShowLiveStats(false);
          
          if ((currentSlide as any).isInteractive) {
            fetchSlideResponses(currentSlide.id);
          }
        }
      }
    }
  }, [currentSlideIndex, presentation, slideResponsesCache]);

  const fetchSlideResponses = async (slideId: string) => {
    try {
      const response = await fetch(`/api/responses/slide/${slideId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.responses.length > 0) {
          const formattedResponses = data.responses.map((r: any) => ({
            slideId: r.slideId || slideId,
            elementId: r.response?.elementId || 'interactive',
            value: r.response?.value || r.response,
            timestamp: new Date(r.createdAt),
            userId: r.student?.registrationNumber || r.studentId || 'student-' + Math.random().toString(36).substr(2, 9),
            userName: r.student?.name || 'Estudante',
          }));
          
          setLiveResponses(formattedResponses);
          setSlideResponsesCache(prev => {
            const newCache = new Map(prev);
            newCache.set(slideId, formattedResponses);
            return newCache;
          });
          setShowLiveStats(true);
        }
      }
    } catch (error) {
      console.error('Error fetching slide responses:', error);
    }
  };

  useEffect(() => {
    if (presentation?.title) {
      document.title = `${presentation.title} - Editor de Slides`;
    } else {
      document.title = 'Editor de Slides';
    }
  }, [presentation?.title]);

  const updatePresentationTitle = (newTitle: string) => {
    if (!presentation) return;

    const updatedPresentation = {
      ...presentation,
      title: newTitle.trim() || 'Untitled Presentation',
      updatedAt: new Date(),
    };

    setPresentation(updatedPresentation);
  };

  const startEditingTitle = () => {
    if (!presentation) return;
    setIsEditingTitle(true);
    setOriginalTitle(presentation.title);
    setTempTitle(presentation.title);
  };

  const saveTitleChanges = () => {
    if (!presentation) return;
    const finalTitle = tempTitle.trim() || 'Untitled Presentation';
    updatePresentationTitle(finalTitle);
    setIsEditingTitle(false);
    
    setTitleSaved(true);
    setTimeout(() => setTitleSaved(false), 2000);
  };

  const cancelTitleEditing = () => {
    setTempTitle(originalTitle);
    setIsEditingTitle(false);
  };

  const hasUnsavedTitleChanges = isEditingTitle && tempTitle !== originalTitle;

  const addSlide = () => {
    if (!presentation) return;
    
    const newSlide: Slide = {
      id: generateId(),
      title: `Slide ${presentation.slides.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedPresentation = {
      ...presentation,
      slides: [...presentation.slides, newSlide],
      updatedAt: new Date(),
    };

    setPresentation(updatedPresentation);
    setCurrentSlideIndex(presentation.slides.length);
  };

  const deleteSlide = (slideIndex: number) => {
    if (!presentation || presentation.slides.length <= 1) return;

    const updatedSlides = presentation.slides.filter((_, index) => index !== slideIndex);
    const updatedPresentation = {
      ...presentation,
      slides: updatedSlides,
      updatedAt: new Date(),
    };

    setPresentation(updatedPresentation);
    
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    }
  };

  const updateSlide = (slideIndex: number, updatedSlide: Slide) => {
    if (!presentation) return;

    const updatedSlides = presentation.slides.map((slide, index) => 
      index === slideIndex ? updatedSlide : slide
    );

    const updatedPresentation = {
      ...presentation,
      slides: updatedSlides,
      updatedAt: new Date(),
    };

    setPresentation(updatedPresentation);
  };

  const addElementToCurrentSlide = async (element: SlideElement) => {
    if (!presentation) return;

    const currentSlide = presentation.slides[currentSlideIndex];
    
    if (element.type === 'interactive') {
      const hasInteractiveElement = (currentSlide as any).isInteractive || 
                                   currentSlide.elements.some(el => el.type === 'interactive');
      
      if (hasInteractiveElement) {
        const userConfirmed = window.confirm(
          `ATENÇÃO: Este slide já possui um elemento interativo.\n\n` +
          `Ao criar um novo elemento interativo:\n` +
          `• O elemento interativo atual será removido\n` +
          `• Todas as respostas dos estudantes serão apagadas\n` +
          `• As estatísticas serão perdidas\n\n` +
          `Deseja continuar?`
        );
        
        if (!userConfirmed) {
          return; // Cancelar criação
        }
        
        try {
          const response = await fetch('/api/responses/clear', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              slideId: currentSlide.id
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            
            setLiveResponses([]);
            setSlideResponsesCache(prev => {
              const newCache = new Map(prev);
              newCache.delete(currentSlide.id);
              return newCache;
            });
            setShowLiveStats(false);
            
            alert(`Elemento interativo substituído!\nForam removidas ${data.deletedCount} respostas anteriores.`);
          } else {
            console.error('Failed to clear responses');
            alert('Erro ao limpar respostas anteriores. O elemento será criado mesmo assim.');
          }
          
          if (socket && roomId) {
            socket.emit('interactive-element-removed', {
              roomId: roomId,
              slideId: currentSlide.id
            });
          }
        } catch (error) {
          console.error('Error clearing responses:', error);
          alert('Erro ao limpar respostas anteriores. O elemento será criado mesmo assim.');
          
          if (socket && roomId) {
            socket.emit('interactive-element-removed', {
              roomId: roomId,
              slideId: currentSlide.id
            });
          }
        }
      }
      
      const interactiveElement = element as any;
      const updatedSlide = {
        ...currentSlide,
        isInteractive: true,
        question: interactiveElement.question,
        interactiveType: interactiveElement.interactionType,
        options: interactiveElement.options,
        interactivePosition: { x: 50, y: 50 },
        interactiveSize: { width: 400, height: 300 },
        elements: currentSlide.elements.filter(el => el.type !== 'interactive'),
        updatedAt: new Date(),
      };
      updateSlide(currentSlideIndex, updatedSlide);
      
      if (hasJoinedRoom && isConnected && socket) {
        setTimeout(() => {
          updateCurrentSlide(
            roomId,
            currentSlideIndex,
            updatedSlide.id,
            presentation.id,
            presentation.title,
            presentation.slides.length,
            updatedSlide
          );
        }, 100);
      }
    } else {
      const updatedSlide = {
        ...currentSlide,
        elements: [...currentSlide.elements, element],
        updatedAt: new Date(),
      };
      updateSlide(currentSlideIndex, updatedSlide);
    }
  };

  const handleSave = async () => {
    if (presentation) {
      const success = await savePresentation(presentation);
      if (success) {
        setShowSaveConfirmation(true);
        setTimeout(() => setShowSaveConfirmation(false), 2000);
      }
    }
  };

  const handleBack = () => {
    router.push('/editor');
  };

  const handleSlideChange = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const openLivePresentation = () => {
    setShowLivePanel(true);
  };

  const closeLivePresentation = () => {
    setShowLivePanel(false);
  };

  // Toggle sincronização automática
  const toggleAutoSync = () => {
    setAutoSyncEnabled(!autoSyncEnabled);
  };

  const syncCurrentSlide = () => {
    if (presentation && hasJoinedRoom && isConnected) {
      const currentSlide = presentation.slides[currentSlideIndex];
      if (currentSlide) {
        console.log(`Manual sync: Sending slide ${currentSlideIndex} to students`);
        updateCurrentSlide(
          roomId,
          currentSlideIndex,
          currentSlide.id,
          presentation.id,
          presentation.title,
          presentation.slides.length,
          currentSlide 
        );
        alert('Slide sincronizado com os estudantes!');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Apresentação não encontrada
          </h2>
          <p className="text-gray-600 mb-8">
            A apresentação que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Voltar às Apresentações
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = presentation.slides[currentSlideIndex];

  // Gerar URL para estudantes
  const generateStudentUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/student/login?room=${roomId}`;
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile Overlay */}
      {isMobile && (!sidebarCollapsed || !propertiesPanelCollapsed) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => {
            setSidebarCollapsed(true);
            setPropertiesPanelCollapsed(true);
          }}
        />
      )}

      {/* Sidebar with slides */}
      <div className={`${
        sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
      } ${isMobile ? 'fixed z-40' : 'relative'} w-64 lg:w-64 bg-white shadow-lg border-r border-gray-200 transition-transform duration-300 ease-in-out h-full`}>
        <SlideList
          slides={presentation.slides}
          currentSlideIndex={currentSlideIndex}
          onSlideSelect={setCurrentSlideIndex}
          onAddSlide={addSlide}
          onDeleteSlide={deleteSlide}
        />
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Save confirmation */}
        {showSaveConfirmation && (
          <div className="absolute top-20 left-6 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Apresentação salva com sucesso!</span>
            </div>
          </div>
        )}

        {/* Title saved confirmation */}
        {titleSaved && (
          <div className="absolute top-20 left-6 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Título salvo com sucesso!</span>
            </div>
          </div>
        )}

        {/* Header with editable presentation title */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-3 lg:px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Left Section - Navigation & Title */}
              <div className="flex items-center space-x-2 lg:space-x-4 min-w-0 flex-1">
                {/* Mobile menu buttons */}
                {isMobile && (
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                    title="Toggle slides panel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Voltar às apresentações"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-2 lg:space-x-3 min-w-0">
                  <div className="p-2 bg-gray-50 rounded-lg hidden sm:block">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={isEditingTitle ? tempTitle : (presentation.title || '')}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onFocus={startEditingTitle}
                      onBlur={cancelTitleEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveTitleChanges();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelTitleEditing();
                        }
                      }}
                      className={`text-lg lg:text-xl font-semibold text-gray-900 bg-transparent border-none outline-none px-2 py-1 transition-all w-full ${
                        isEditingTitle 
                          ? 'bg-white border border-blue-300 rounded-md shadow-sm ring-2 ring-blue-100' 
                          : 'hover:bg-gray-50 rounded-md'
                      }`}
                      placeholder="Nome da Apresentação"
                      title="Clique para editar • Enter para salvar • ESC para cancelar"
                    />
                  </div>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
                {/* Mobile properties panel toggle */}
                {isMobile && (
                  <button
                    onClick={() => setPropertiesPanelCollapsed(!propertiesPanelCollapsed)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                    title="Toggle properties panel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </button>
                )}
                
                {/* Live Controls Group */}
                {hasJoinedRoom && (
                  <div className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 bg-gray-50 rounded-lg ${isMobile ? 'hidden sm:flex' : ''}`}>
                    <button
                      onClick={toggleAutoSync}
                      className={`p-1 lg:p-2 rounded-md text-sm font-medium transition-colors ${
                        autoSyncEnabled
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                      title={autoSyncEnabled ? 'Desativar sincronização automática' : 'Ativar sincronização automática'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={syncCurrentSlide}
                      className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-md transition-colors"
                      title="Sincronizar slide atual com os estudantes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        const currentSlide = presentation?.slides[currentSlideIndex];
                        if (currentSlide) {
                          fetchSlideResponses(currentSlide.id);
                        }
                      }}
                      className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-md transition-colors"
                      title="Recarregar respostas do banco de dados"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    {currentSlide && (currentSlide as any).isInteractive && (
                      <button
                        onClick={() => setShowLiveStats(!showLiveStats)}
                        className={`p-2 rounded-md transition-colors relative ${
                          showLiveStats
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                        title={showLiveStats ? 'Esconder estatísticas' : 'Mostrar estatísticas das respostas'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {liveResponses.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {liveResponses.length}
                          </span>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generateStudentUrl());
                        alert('Link para estudantes copiado!');
                      }}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-md transition-colors"
                      title="Copiar link para estudantes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Primary Actions */}
                <button
                  onClick={openLivePresentation}
                  className="px-2 lg:px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1 lg:space-x-2"
                  title="Painel de controle live"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Live</span>
                </button>
                
                <button
                  onClick={() => window.open(generateStudentUrl(), '_blank')}
                  className="px-2 lg:px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors hidden sm:block"
                >
                  Visualizar
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-2 lg:px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <span className="hidden sm:inline">{loading ? 'Salvando...' : 'Salvar'}</span>
                  <span className="sm:hidden">💾</span>
                </button>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="px-6 py-2 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {isEditingTitle ? (
                  <span className={`flex items-center space-x-2 ${hasUnsavedTitleChanges ? "text-amber-600" : "text-blue-600"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>{hasUnsavedTitleChanges ? "Mudanças não salvas" : "Editando título"}</span>
                    <span className="text-xs">• Enter para salvar • ESC para cancelar</span>
                  </span>
                ) : (
                  <>
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{presentation.slides.length} slide{presentation.slides.length !== 1 ? 's' : ''}</span>
                    </span>
                    <span>•</span>
                    <span>Slide {currentSlideIndex + 1}</span>
                  </>
                )}
              </div>

              {/* Live Status */}
              {hasJoinedRoom && (
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                    isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Sala {roomId}</span>
                  </div>
                  
                  {/* Session Status */}
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                    sessionActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : sessionError 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-700'
                  }`} title={sessionError || (sessionActive ? 'Sessão ativa no banco' : 'Sessão não configurada')}>
                    <div className={`w-2 h-2 rounded-full ${
                      sessionActive 
                        ? 'bg-blue-500' 
                        : sessionError 
                          ? 'bg-yellow-500' 
                          : 'bg-gray-500'
                    }`}></div>
                    <span>
                      {sessionActive ? 'DB Ativo' : sessionError ? 'DB Erro' : 'DB Off'}
                    </span>
                  </div>
                  
                  {autoSyncEnabled && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Sincronização ativa</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>{totalStudentsOnline} estudante{totalStudentsOnline !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {liveResponses.length > 0 && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>{liveResponses.length} resposta{liveResponses.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  
                  {slideResponsesCache.size > 0 && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium" title="Respostas em cache para outros slides">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      <span>{slideResponsesCache.size} slide{slideResponsesCache.size !== 1 ? 's' : ''} em cache</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <Toolbar 
          onSave={handleSave} 
          onAddElement={addElementToCurrentSlide}
        />

        {/* Canvas area */}
        <div className="flex-1 flex relative">
          <div className={`flex-1 p-2 lg:p-4 ${showLiveStats && !isMobile ? 'pr-2' : ''} min-w-0`}>
            <SlideCanvas
              slide={currentSlide}
              onUpdateSlide={(updatedSlide) => updateSlide(currentSlideIndex, updatedSlide)}
              presentation={presentation}
              currentSlideIndex={currentSlideIndex}
              socket={socket}
              roomId={roomId}
            />
          </div>

          {/* Live Stats Panel */}
          {showLiveStats && currentSlide && (currentSlide as any).isInteractive && (
            <div className={`${
              isMobile 
                ? 'fixed inset-x-0 bottom-0 top-20 z-50' 
                : 'w-80'
            } bg-white shadow-lg border-l border-gray-200 p-4 overflow-y-auto`}>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Estatísticas em Tempo Real</h3>
                <button
                  onClick={() => setShowLiveStats(false)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Fechar estatísticas"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <LiveResponseVisualizations
                responses={liveResponses}
                totalStudents={totalStudentsOnline}
                interactiveType={(currentSlide as any).interactiveType}
                question={(currentSlide as any).question}
                options={(currentSlide as any).options}
              />
            </div>
          )}

          {/* Properties panel */}
          <div className={`${
            propertiesPanelCollapsed ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'
          } ${isMobile ? 'fixed right-0 top-0 bottom-0 z-40' : 'relative'} ${
            showLiveStats && !isMobile ? 'w-72' : 'w-80'
          } bg-white shadow-lg border-l border-gray-200 transition-transform duration-300 ease-in-out`}>
            <PropertiesPanel
              slide={currentSlide}
              onUpdateSlide={(updatedSlide) => updateSlide(currentSlideIndex, updatedSlide)}
              socket={socket}
              roomId={roomId}
            />
          </div>
        </div>
      </div>

      {/* Live Presentation Panel */}
      {presentation && (
        <LivePresentationPanel
          presentation={presentation}
          currentSlideIndex={currentSlideIndex}
          onSlideChange={handleSlideChange}
          isVisible={showLivePanel}
          onClose={closeLivePresentation}
          roomId={roomId}
          totalStudentsOnline={totalStudentsOnline}
        />
      )}
    </div>
  );
}
