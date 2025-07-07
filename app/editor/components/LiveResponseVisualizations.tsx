'use client';

import React, { useState, useEffect } from 'react';
import { AnswerUpdateData } from '../../shared/hooks';

interface LiveResponseVisualizationsProps {
  responses: AnswerUpdateData[];
  totalStudents: number;
  interactiveType?: string;
  question?: string;
  options?: string[];
}

export function LiveResponseVisualizations({
  responses,
  totalStudents,
  interactiveType,
  question,
  options
}: LiveResponseVisualizationsProps) {
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation when responses change
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [responses.length]);

  if (!interactiveType || responses.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-blue-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Aguardando Respostas</h3>
        <p className="text-blue-600 text-sm">
          {totalStudents} estudante{totalStudents !== 1 ? 's' : ''} online • 
          {responses.length} resposta{responses.length !== 1 ? 's' : ''} recebida{responses.length !== 1 ? 's' : ''}
        </p>
        {question && (
          <div className="mt-4 p-3 bg-white rounded border">
            <p className="text-gray-700 font-medium">{question}</p>
          </div>
        )}
      </div>
    );
  }

  const renderMultipleChoiceStats = () => {
    if (!options) return null;

    const responsesByOption = options.map(option => {
      const count = responses.filter(r => r.value === option).length;
      const percentage = responses.length > 0 ? (count / responses.length) * 100 : 0;
      return { option, count, percentage };
    });

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">{question}</h4>
          <div className="space-y-3">
            {responsesByOption.map((item, index) => (
              <div key={index} className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {String.fromCharCode(65 + index)}. {item.option}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${item.percentage}%` }}
                    key={`${animationKey}-${index}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWordCloudStats = () => {
    const wordCounts = responses.reduce((acc, response) => {
      const word = response.value.toString().toLowerCase().trim();
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10 words

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">{question}</h4>
          <div className="grid grid-cols-2 gap-2">
            {sortedWords.map(([word, count], index) => (
              <div 
                key={word}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                }}
              >
                <span className="font-medium text-gray-700 truncate">{word}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLivePollStats = () => {
    const numericResponses = responses
      .map(r => Number(r.value))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b);

    if (numericResponses.length === 0) return null;

    const average = numericResponses.reduce((a, b) => a + b, 0) / numericResponses.length;
    const min = Math.min(...numericResponses);
    const max = Math.max(...numericResponses);

    // Distribution by value
    const distribution = numericResponses.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">{question}</h4>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{average.toFixed(1)}</div>
              <div className="text-xs text-blue-600">Média</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{min}</div>
              <div className="text-xs text-green-600">Mínimo</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">{max}</div>
              <div className="text-xs text-orange-600">Máximo</div>
            </div>
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Distribuição das Respostas:</h5>
            {Object.entries(distribution)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([value, count]) => {
                const percentage = (count / numericResponses.length) * 100;
                return (
                  <div key={value} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Valor {value}</span>
                      <span className="text-sm text-gray-600">{count} respostas</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                        key={`${animationKey}-${value}`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Respostas em Tempo Real</h3>
            <p className="text-blue-100 text-sm">
              {responses.length} de {totalStudents} estudantes responderam
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{responses.length}</div>
            <div className="text-xs text-blue-100">Respostas</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-blue-400 bg-opacity-50 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: totalStudents > 0 ? `${(responses.length / totalStudents) * 100}%` : '0%' 
              }}
              key={`progress-${animationKey}`}
            />
          </div>
          <p className="text-xs text-blue-100 mt-1">
            {totalStudents > 0 ? ((responses.length / totalStudents) * 100).toFixed(1) : 0}% de participação
          </p>
        </div>
      </div>

      {/* Type-specific visualizations */}
      {interactiveType === 'multiple-choice' && renderMultipleChoiceStats()}
      {interactiveType === 'word-cloud' && renderWordCloudStats()}
      {interactiveType === 'live-poll' && renderLivePollStats()}

      {/* Recent responses list */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Últimas Respostas</h4>
        <div className="max-h-32 overflow-y-auto space-y-2">
          {responses.slice(-5).reverse().map((response, index) => (
            <div 
              key={`${response.userId}-${response.timestamp}`}
              className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
              style={{
                animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
              }}
            >
              <span className="font-medium text-gray-700">{response.userName}</span>
              <span className="text-gray-600">{response.value}</span>
            </div>
          ))}
          {responses.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-2">
              Nenhuma resposta ainda
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
} 