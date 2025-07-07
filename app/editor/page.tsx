'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { generateId } from '../shared/utils';

interface PresentationSummary {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  slidesCount: number;
  hasInteractiveElements: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function EditorPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [presentations, setPresentations] = useState<PresentationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/slides');
      const data = await response.json();
      
      if (data.success) {
        setPresentations(data.data);
      } else {
        setError(data.error || 'Erro ao carregar apresentações');
      }
    } catch (err) {
      setError('Erro ao carregar apresentações');
    } finally {
      setLoading(false);
    }
  };

  const createNewPresentation = async () => {
    try {
      const newPresentation = {
        id: generateId(),
        title: 'Nova Apresentação',
        description: '',
        slides: [
          {
            id: generateId(),
            title: 'Slide 1',
            elements: [],
            backgroundColor: '#ffffff',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch('/api/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPresentation),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push(`/editor/${data.data.id}`);
      } else {
        setError(data.error || 'Erro ao criar apresentação');
      }
    } catch (err) {
      setError('Erro ao criar apresentação');
    }
  };

  const deletePresentation = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta apresentação?')) {
      return;
    }

    try {
      const response = await fetch(`/api/slides?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setPresentations(prev => prev.filter(p => p.id !== id));
      } else {
        setError(data.error || 'Erro ao excluir apresentação');
      }
    } catch (err) {
      setError('Erro ao excluir apresentação');
    }
  };

  const duplicatePresentation = async (id: string) => {
    try {
      const response = await fetch(`/api/slides?id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        const original = data.data;
        const duplicate = {
          ...original,
          id: generateId(),
          title: `${original.title} - Cópia`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const createResponse = await fetch('/api/slides', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(duplicate),
        });

        const createData = await createResponse.json();
        
        if (createData.success) {
          loadPresentations();
        } else {
          setError(createData.error || 'Erro ao duplicar apresentação');
        }
      }
    } catch (err) {
      setError('Erro ao duplicar apresentação');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando apresentações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Minhas Apresentações
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Olá, {session?.user?.name || 'Professor'}! Gerencie suas apresentações interativas
              </p>
            </div>
            <button
              onClick={createNewPresentation}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nova Apresentação</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {presentations.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma apresentação criada
            </h3>
            <p className="text-gray-600 mb-6">
              Comece criando sua primeira apresentação interativa
            </p>
            <button
              onClick={createNewPresentation}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Criar Primeira Apresentação
            </button>
          </div>
        ) : (
          // Presentations grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations.map((presentation) => (
              <div
                key={presentation.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-lg flex items-center justify-center">
                  {presentation.thumbnail ? (
                    <img
                      src={presentation.thumbnail}
                      alt={presentation.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {presentation.title}
                    </h3>
                    {presentation.hasInteractiveElements && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Interativo
                      </span>
                    )}
                  </div>

                  {presentation.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {presentation.description}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{presentation.slidesCount} slides</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(presentation.updatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/editor/${presentation.id}`)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => duplicatePresentation(presentation.id)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                      title="Duplicar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deletePresentation(presentation.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 