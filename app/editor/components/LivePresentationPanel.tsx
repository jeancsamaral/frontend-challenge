'use client';

import React, { useState, useEffect } from 'react';
import { useSocket, useLivePresentation } from '../../shared/hooks';
import { Presentation } from '../../shared/types';

interface LivePresentationPanelProps {
  presentation: Presentation;
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  isVisible: boolean;
  onClose: () => void;
  roomId: string;
  totalStudentsOnline?: number; 
}

export function LivePresentationPanel({
  presentation,
  currentSlideIndex,
  onSlideChange,
  isVisible,
  onClose,
  roomId,
  totalStudentsOnline, 
}: LivePresentationPanelProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [userName] = useState('Professor');
  const [userId] = useState('teacher-panel');

  const { socket, isConnected, joinRoom, changeSlide, startPresentation, endPresentation } = useSocket();
  const { studentsCount, responses, onStudentJoined, onStudentLeft, onAnswerUpdate } = useLivePresentation(socket);

  const displayStudentsCount = totalStudentsOnline !== undefined ? totalStudentsOnline : studentsCount;

  // Join room quando painel abre (apenas se ainda não estiver conectado)
  useEffect(() => {
    if (isVisible && isConnected && !isStarted) {
      // Não precisa fazer join novamente se já estamos conectados à sala
      console.log(`Live panel opened for room: ${roomId}`);
    }
  }, [isVisible, isConnected, roomId, isStarted]);

  // Set up event listeners
  useEffect(() => {
    if (socket) {
      onStudentJoined((data) => {
        console.log(`Student joined: ${data.userName}`);
      });

      onStudentLeft((data) => {
        console.log(`Student left: ${data.userName}`);
      });

      onAnswerUpdate((data) => {
        console.log(`New answer from ${data.userName}: ${data.value}`);
      });
    }
  }, [socket, onStudentJoined, onStudentLeft, onAnswerUpdate]);

  const handleStartPresentation = () => {
    if (socket) {
      startPresentation(roomId, presentation.id, presentation.title, presentation.slides.length);
      setIsStarted(true);
    }
  };

  const handleEndPresentation = () => {
    if (socket) {
      endPresentation(roomId);
      setIsStarted(false);
    }
  };

  const handleSlideChange = (newIndex: number) => {
    if (socket && newIndex >= 0 && newIndex < presentation.slides.length) {
      const slide = presentation.slides[newIndex];
      changeSlide(roomId, newIndex, slide.id);
      onSlideChange(newIndex);
    }
  };

  const generateJoinUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/student/login?room=${roomId}`;
  };

  const copyJoinUrl = async () => {
    try {
      await navigator.clipboard.writeText(generateJoinUrl());
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Painel de Controle Live</h2>
                <p className="text-blue-100 text-sm">{presentation.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection Status */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status da Conexão</p>
                  <p className={`text-lg font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Room Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-600">Código da Sala</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{roomId}</p>
                </div>
              </div>
            </div>

            {/* Slide Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-600">Slide Atual</p>
                  <p className="text-lg font-semibold text-gray-900">{currentSlideIndex + 1} / {presentation.slides.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Estatísticas em Tempo Real
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{displayStudentsCount}</div>
                <div className="text-sm text-gray-600">Estudantes Online</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{responses.length}</div>
                <div className="text-sm text-gray-600">Respostas Recebidas</div>
              </div>
            </div>
          </div>

          {/* Share Link */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Compartilhar com Estudantes
            </h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={generateJoinUrl()}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
                />
                <button
                  onClick={copyJoinUrl}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copiar</span>
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sincronização automática ativa - estudantes veem o slide atual automaticamente</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 bg-green-50 p-2 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Sessão criada automaticamente - estudantes podem fazer login com matrícula</span>
                </div>
              </div>
            </div>
          </div>

          {/* Presentation Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Controle da Apresentação
            </h3>
            
            <div className="space-y-4">
              {!isStarted ? (
                <button
                  onClick={handleStartPresentation}
                  disabled={!isConnected}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1" />
                  </svg>
                  <span>Iniciar Apresentação Formal</span>
                </button>
              ) : (
                <button
                  onClick={handleEndPresentation}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span>Finalizar Apresentação</span>
                </button>
              )}

              {/* Manual Navigation */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Navegação Manual</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSlideChange(currentSlideIndex - 1)}
                    disabled={currentSlideIndex === 0}
                    className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg disabled:bg-gray-50 disabled:text-gray-400 hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Anterior</span>
                  </button>
                  <button
                    onClick={() => handleSlideChange(currentSlideIndex + 1)}
                    disabled={currentSlideIndex >= presentation.slides.length - 1}
                    className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg disabled:bg-gray-50 disabled:text-gray-400 hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Próximo</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Slide Selector */}
                <select
                  value={currentSlideIndex}
                  onChange={(e) => handleSlideChange(Number(e.target.value))}
                  className="w-full mt-3 py-2 px-3 border border-gray-300 rounded-lg bg-white"
                >
                  {presentation.slides.map((slide, index) => (
                    <option key={slide.id} value={index}>
                      Slide {index + 1}: {slide.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recent Responses */}
          {responses.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                Últimas Respostas
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {responses.slice(-5).map((response, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{response.userName}</p>
                      <p className="text-sm text-gray-600">{response.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Como usar o Painel Live
            </h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span><strong>Sincronização automática:</strong> Estudantes veem automaticamente o slide que você está editando</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span><strong>Compartilhe o link:</strong> Estudantes fazem login com matrícula e código da sala já preenchido</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1" />
                </svg>
                <span><strong>"Iniciar Apresentação":</strong> Opcional para sessões formais</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span><strong>Controles manuais:</strong> Use apenas se quiser sobrescrever a sincronização</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 