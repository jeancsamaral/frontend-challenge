'use client';

import React, { useState } from 'react';
import { InteractiveElement } from '../../shared/types';

interface QuestionFormProps {
  question: InteractiveElement;
  onSubmit: (response: any) => void;
  loading: boolean;
  error: string | null;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onSubmit,
  loading,
  error,
}) => {
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (response !== null) {
      onSubmit(response);
    }
  };

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Choose your answer:</h3>
      </div>
      {question.options?.map((option, index) => (
        <label
          key={index}
          className={`
            block p-3 rounded-lg border cursor-pointer transition-colors
            ${
              response === index
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center">
            <input
              type="radio"
              name="multiple-choice"
              value={index}
              checked={response === index}
              onChange={(e) => setResponse(parseInt(e.target.value))}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className={`
                  w-6 h-6 rounded-md flex items-center justify-center text-sm font-medium
                  ${
                    response === index
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className={`font-medium ${response === index ? 'text-gray-900' : 'text-gray-700'}`}>
                  {option}
                </span>
              </div>
            </div>
          </div>
        </label>
      ))}
    </div>
  );

  const renderWordCloud = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Share your thoughts:</h3>
        <p className="text-xs text-gray-500">Enter words or phrases separated by commas</p>
      </div>
      <div className="relative">
        <textarea
          value={response || ''}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="creativity, innovation, teamwork, collaboration..."
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          rows={4}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {(response || '').length}/200
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Separate multiple words with commas for the best visualization.
        </p>
      </div>
    </div>
  );

  const renderLivePoll = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Your response:</h3>
        <p className="text-xs text-gray-500">Share your thoughts and opinions</p>
      </div>
      <div className="relative">
        <textarea
          value={response || ''}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type your response here..."
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          rows={5}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {(response || '').length}/500
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-sm text-gray-700">
          <strong>Your voice matters!</strong> Share your honest thoughts and opinions.
        </p>
      </div>
    </div>
  );

  const renderQuestionForm = () => {
    switch (question.interactionType) {
      case 'multiple-choice':
        return renderMultipleChoice();
      case 'word-cloud':
        return renderWordCloud();
      case 'live-poll':
        return renderLivePoll();
      default:
        return null;
    }
  };

  const isResponseValid = () => {
    switch (question.interactionType) {
      case 'multiple-choice':
        return response !== null && response >= 0;
      case 'word-cloud':
      case 'live-poll':
        return response && response.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700">
                {question.interactionType.replace('-', ' ').toUpperCase()}
              </div>
              <span className="text-sm text-gray-500">
                Question {question.id}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">LIVE</span>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 leading-tight">
              {question.question}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              {renderQuestionForm()}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || !isResponseValid()}
                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Response'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm; 