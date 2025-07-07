'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSocket, useLivePresentation } from '../shared/hooks';
import { Presentation, Slide } from '../shared/types';
import { MultipleChoice, WordCloudInput, LivePoll } from './components/InteractiveComponents';
import { SlideViewer } from './components/SlideViewer';
import { v4 as uuid } from 'uuid';

function StudentPageContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams?.get('room');
  const studentId = searchParams?.get('studentId');
  const studentName = searchParams?.get('name') || 'Estudante';

  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<{
    id: string;
    registrationNumber: string;
    name: string;
  } | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Map<string, any>>(new Map());
  const [loadingResponses, setLoadingResponses] = useState(false);
  
  const [presentationData, setPresentationData] = useState<{
    id: string;
    title: string;
    totalSlides: number;
  } | null>(null);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [slideData, setSlideData] = useState<Slide | null>(null);
  
  const [isLoadingSlide, setIsLoadingSlide] = useState(false);
  const [waitingForPresentation, setWaitingForPresentation] = useState(true);

  const { socket, isConnected, joinRoom, sendAnswer } = useSocket();
  const { studentsCount, onSlideChange, onPresentationStart, onPresentationEnd } = useLivePresentation(socket);

  useEffect(() => {
    if (!roomId) {
      setConnectionError('Código da sala não fornecido. Verifique o link.');
      return;
    }
    if (!studentId) {
      setConnectionError('Você precisa fazer login para acessar esta sala.');
      return;
    }
  }, [roomId, studentId]);

  useEffect(() => {
    if (studentId && !studentData) {
      fetchStudentData();
    }
  }, [studentId, studentData]);

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        setConnectionError('Erro no servidor - resposta inválida.');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
      } else {
        const errorText = await response.text();
        setConnectionError('Erro ao carregar dados do estudante.');
      }
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        setConnectionError('Erro no servidor - resposta inválida.');
      } else {
        setConnectionError('Erro ao carregar dados do estudante.');
      }
    }
  };

  useEffect(() => {
    if (roomId && studentId && isConnected && !hasJoinedRoom && studentData) {
      joinRoom(roomId, 'student', studentId, studentData.name);
      setHasJoinedRoom(true);
    }
  }, [roomId, studentId, isConnected, hasJoinedRoom, joinRoom, studentData]);

  useEffect(() => {
    if (socket) {
      const handleSlideChange = (data: { slideIndex: number; slideId: string; slideData?: any }) => {
        setCurrentSlideIndex(data.slideIndex);
        setCurrentSlideId(data.slideId);
        setWaitingForPresentation(false);
        
        if (data.slideData) {
          setSlideData(data.slideData);
          setIsLoadingSlide(false);
        } else {
          setSlideData({
            id: data.slideId,
            title: `Slide ${data.slideIndex + 1}`,
            elements: [],
            backgroundColor: '#ffffff',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setIsLoadingSlide(false);
        }
        
        if (data.slideId && studentId) {
          loadStudentResponsesForSlide(data.slideId);
        }
      };

      const handlePresentationStart = (data: { presentationId: string; title: string; totalSlides: number }) => {
        setPresentationData({
          id: data.presentationId,
          title: data.title,
          totalSlides: data.totalSlides
        });
        setWaitingForPresentation(false);
      };

      const handlePresentationEnd = () => {
        setWaitingForPresentation(true);
        setSlideData(null);
        setCurrentSlideId(null);
      };

      const handleInteractiveElementRemoved = (data: { slideId: string }) => {
        setSubmittedAnswers(prev => {
          const newMap = new Map(prev);
          const keysToRemove: string[] = [];
          
          for (const [key] of newMap.entries()) {
            if (key.startsWith(`${data.slideId}-`)) {
              keysToRemove.push(key);
            }
          }
          
          keysToRemove.forEach(key => newMap.delete(key));
          return newMap;
        });
        
        setLoadingResponses(true);
        setTimeout(() => {
          setLoadingResponses(false);
        }, 500);
      };

      socket.on('slide-change', handleSlideChange);
      socket.on('presentation-start', handlePresentationStart);
      socket.on('presentation-end', handlePresentationEnd);
      socket.on('interactive-element-removed', handleInteractiveElementRemoved);

      return () => {
        socket.off('slide-change', handleSlideChange);
        socket.off('presentation-start', handlePresentationStart);
        socket.off('presentation-end', handlePresentationEnd);
        socket.off('interactive-element-removed', handleInteractiveElementRemoved);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (currentSlideId && studentId) {
      loadStudentResponsesForSlide(currentSlideId);
    }
  }, [currentSlideId, studentId]);

  const loadStudentResponsesForSlide = async (slideId: string) => {
    if (!studentId) return;
    
    try {
      setLoadingResponses(true);
      
      const response = await fetch(`/api/responses/slide/${slideId}?studentId=${studentId}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.responses && data.responses.length > 0) {
          setSubmittedAnswers(prev => {
            const newMap = new Map(prev);
            data.responses.forEach((responseData: any) => {
              const responseContent = responseData.response;
              const elementId = responseContent.elementId || 'interactive';
              const value = responseContent.value || responseContent;
              
              const answerKey = `${slideId}-${elementId}`;
              newMap.set(answerKey, {
                elementId: elementId,
                value: value,
                slideId: slideId,
                timestamp: new Date(responseData.createdAt)
              });
            });
            return newMap;
          });
        }
      } else {
        const errorText = await response.text();
      }
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
      }
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleAnswerSubmit = async (elementId: string, value: string | number) => {
    if (roomId && currentSlideId && isConnected && studentId) {
      try {
        const answerKey = `${currentSlideId}-${elementId}`;
        setSubmittedAnswers(prev => {
          const newMap = new Map(prev);
          newMap.set(answerKey, { elementId, value, slideId: currentSlideId, timestamp: new Date() });
          return newMap;
        });

        const response = await fetch('/api/responses/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: studentId,
            slideId: currentSlideId,
            elementId: elementId,
            value: value,
            responseTime: null
          }),
        });

        if (response.ok) {
          sendAnswer(roomId, currentSlideId, elementId, value, studentId);
        }
      } catch (error) {
      }
    }
  };

  if (connectionError) {
    const isLoginRequired = connectionError.includes('login');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-2xl text-center max-w-md border-0">
          <div className={`mb-4 ${isLoginRequired ? 'text-blue-500' : 'text-red-500'}`}>
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isLoginRequired ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              )}
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isLoginRequired ? 'Login Necessário' : 'Erro de Conexão'}
          </h2>
          <p className="text-gray-600 mb-4">{connectionError}</p>
          <div className="space-y-3">
            {isLoginRequired ? (
              <button
                onClick={() => window.location.href = '/student/login'}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                Fazer Login
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                Tentar Novamente
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-2xl text-center max-w-md border-0">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Conectando...</h2>
          <p className="text-gray-600">Estabelecendo conexão com a sala de aula</p>
        </div>
      </div>
    );
  }

  if (waitingForPresentation || !currentSlideId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-2xl text-center max-w-md border-0">
          <div className="text-blue-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Conectado à Sala!</h2>
          <p className="text-gray-600 mb-4">
            Aguardando o professor navegar para um slide...
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Sala:</span>
              <span className="font-mono font-semibold">{roomId}</span>
            </div>
            <div className="flex justify-between">
              <span>Seu nome:</span>
              <span className="font-semibold">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span>Estudantes online:</span>
              <span className="font-semibold text-blue-600">{studentsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-semibold text-green-600">🟢 Conectado</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              📡 <strong>Dicas:</strong><br/>
              • O professor precisa ativar o "Sync ON" no editor<br/>
              • Quando navegar para um slide, você verá automaticamente<br/>
              • O professor pode usar "Sincronizar Agora" para forçar o envio
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingSlide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-2xl text-center max-w-md border-0">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Carregando Slide...</h2>
          <p className="text-gray-600">Sincronizando com o professor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-[100%] bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    {presentationData?.title || 'Apresentação'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Slide {currentSlideIndex + 1}
                    {presentationData?.totalSlides && ` de ${presentationData.totalSlides}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Conectado</span>
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-mono">{roomId}</span>
              </div>
              {studentData && (
                <div className="text-sm text-gray-500">
                  <span className="font-mono">{studentData.registrationNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main slide content - 2 colunas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Slide Title */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  {slideData?.title || `Slide ${currentSlideIndex + 1}`}
                </h2>
                {slideData?.elements && slideData.elements.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {slideData.elements.length} elemento(s) no slide
                  </p>
                )}
              </div>

              {/* Slide Canvas - Centralizado com dimensões fixas */}
              <div className="bg-gray-100 p-6 flex items-center justify-center">
                {slideData ? (
                  <SlideViewer slide={slideData} />
                ) : (
                  <div className="w-full max-w-4xl bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center" style={{ aspectRatio: '4/3', minHeight: '400px' }}>
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">Aguardando slide...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - 1 coluna */}
          <div className="lg:col-span-1">
            {/* Interactive Panel */}
            <div className="space-y-6">
              {slideData && (slideData as any).isInteractive ? (
                <div>
                  {/* 🎯 NOVO: Mostrar carregamento ou resposta já enviada */}
                  {loadingResponses ? (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-700 font-medium">
                          Carregando respostas anteriores...
                        </span>
                      </div>
                    </div>
                  ) : submittedAnswers.has(`${currentSlideId}-interactive`) ? (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-700 font-medium">
                          Resposta enviada: {submittedAnswers.get(`${currentSlideId}-interactive`)?.value}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Sua resposta foi salva e será preservada durante a apresentação.
                      </p>
                    </div>
                  ) : null}
                  
                  {(slideData as any).interactiveType === 'multiple-choice' && (slideData as any).options && (
                    <MultipleChoice
                      question={(slideData as any).question}
                      options={(slideData as any).options}
                      onAnswer={(value) => handleAnswerSubmit('interactive', value)}
                      disabled={submittedAnswers.has(`${currentSlideId}-interactive`)}
                      selectedAnswer={submittedAnswers.get(`${currentSlideId}-interactive`)?.value as string}
                    />
                  )}
                  
                  {(slideData as any).interactiveType === 'word-cloud' && (
                    <WordCloudInput
                      question={(slideData as any).question}
                      onAnswer={(value) => handleAnswerSubmit('interactive', value)}
                      placeholder="Digite uma palavra ou frase..."
                      disabled={submittedAnswers.has(`${currentSlideId}-interactive`)}
                    />
                  )}
                  
                  {(slideData as any).interactiveType === 'live-poll' && (
                    <LivePoll
                      question={(slideData as any).question}
                      onAnswer={(value) => handleAnswerSubmit('interactive', value)}
                      min={1}
                      max={10}
                      unit="pts"
                      disabled={submittedAnswers.has(`${currentSlideId}-interactive`)}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Interação</h3>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-500 text-sm">
                        Nenhuma interação disponível neste slide
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Panel */}
            <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Informações</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-semibold">{studentData?.name || studentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Matrícula:</span>
                  <span className="font-mono font-semibold">{studentData?.registrationNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sala:</span>
                  <span className="font-mono font-semibold">{roomId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estudantes:</span>
                  <span className="font-semibold text-blue-600">{studentsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-green-600">📡 Sincronizado</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Resolução:</span>
                  <span className="font-mono text-xs text-gray-500">800×600</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Respostas cached:</span>
                  <span className="font-semibold text-purple-600">{submittedAnswers.size}</span>
                </div>
                {loadingResponses && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-blue-600">🔄 Carregando...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-2xl text-center max-w-md border-0">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Carregando...</h2>
          <p className="text-gray-600">Preparando a experiência do estudante</p>
        </div>
      </div>
    }>
      <StudentPageContent />
    </Suspense>
  );
} 