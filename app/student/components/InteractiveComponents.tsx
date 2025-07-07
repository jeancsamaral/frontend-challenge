'use client';

import React, { useState, useEffect } from 'react';

// Custom UI Components (shadcn/ui style)
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled, 
  className = '', 
  size = 'default' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  className?: string;
  size?: 'default' | 'lg';
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${
      size === 'lg' ? 'h-11 px-8' : 'h-10 px-4 py-2'
    } ${className}`}
  >
    {children}
  </button>
);

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
    {children}
  </div>
);

const RadioGroup = ({ 
  value, 
  onValueChange, 
  children, 
  className = '' 
}: { 
  value: string; 
  onValueChange: (value: string) => void; 
  children: React.ReactNode; 
  className?: string;
}) => (
  <div className={`grid gap-2 ${className}`}>
    {children}
  </div>
);

const RadioGroupItem = ({ 
  value, 
  id, 
  className = '' 
}: { 
  value: string; 
  id: string; 
  className?: string;
}) => (
  <input
    type="radio"
    value={value}
    id={id}
    name="radio-group"
    className={`aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

const Label = ({ 
  htmlFor, 
  children, 
  className = '' 
}: { 
  htmlFor: string; 
  children: React.ReactNode; 
  className?: string;
}) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);

// Icons (lucide-react style)
const Users = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const Clock = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircle2 = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MessageCircle = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const TrendingUp = ({ className = '' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

// Interactive Components
interface MultipleChoiceProps {
  question: string;
  options: string[];
  onAnswer: (value: string) => void;
  disabled?: boolean;
  selectedAnswer?: string;
}

export function MultipleChoice({ question, options, onAnswer, disabled, selectedAnswer }: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string>(selectedAnswer || "");
  const [hasVoted, setHasVoted] = useState(!!selectedAnswer || !!disabled);
  const [responses] = useState(Math.floor(Math.random() * 20) + 5); // Mock responses

  // 🎯 NOVA: Sincronizar estado quando resposta vem do banco de dados
  useEffect(() => {
    if (selectedAnswer) {
      setSelectedOption(selectedAnswer);
      setHasVoted(true);
    }
    if (disabled) {
      setHasVoted(true);
    }
  }, [selectedAnswer, disabled]);

  const handleVote = () => {
    if (selectedOption && !disabled && !hasVoted) {
      setHasVoted(true);
      onAnswer(selectedOption);
    }
  };

  const handleOptionChange = (optionValue: string) => {
    if (!hasVoted && !disabled) {
      setSelectedOption(optionValue);
    }
  };

  return (
    <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
              <Clock className="w-3 h-3 mr-1" />
              AO VIVO
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{responses} respostas</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {question}
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Escolha a opção que melhor representa sua resposta.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {!hasVoted ? (
          <>
            <RadioGroup value={selectedOption} onValueChange={handleOptionChange} className="space-y-4">
        {options.map((option, index) => (
                <div key={index} className="relative">
                  <Label
                    htmlFor={`option-${index}`}
                    className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all duration-300 ${
                      disabled || hasVoted 
                        ? 'cursor-not-allowed opacity-75' 
                        : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
                    } ${
                      selectedOption === option
                        ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
          >
                    <div className="flex items-center gap-3 w-full">
                      <input
                        type="radio"
                        id={`option-${index}`}
                        name="multiple-choice"
                        value={option}
                        checked={selectedOption === option}
                        onChange={() => handleOptionChange(option)}
                        disabled={disabled || hasVoted}
                        className={`w-4 h-4 ${disabled || hasVoted ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-blue-600 bg-gray-100'} border-gray-300 focus:ring-blue-500 focus:ring-2`}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              selectedOption === option ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <h3 className="text-lg font-semibold text-slate-900">{option}</h3>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleVote}
                disabled={!selectedOption || disabled}
                size="lg"
                className="px-12 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Voto
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">
                {disabled ? "Resposta já enviada!" : "Voto registrado com sucesso!"}
              </h3>
              <p className="text-slate-600">
                {disabled 
                  ? "Sua resposta foi carregada do banco de dados e será preservada durante a apresentação."
                  : "Obrigado por participar da nossa pesquisa."
                }
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-slate-900">Sua resposta:</h4>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700 font-medium">{selectedOption}</p>
              </div>
      </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}

interface WordCloudInputProps {
  question: string;
  onAnswer: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function WordCloudInput({ question, onAnswer, disabled, placeholder }: WordCloudInputProps) {
  const [input, setInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(!!disabled);
  const [responses] = useState(Math.floor(Math.random() * 15) + 8); // Mock responses

  // 🎯 NOVA: Sincronizar estado quando resposta já foi enviada
  useEffect(() => {
    if (disabled) {
      setHasSubmitted(true);
    }
  }, [disabled]);

  const handleSubmit = () => {
    if (!input.trim() || disabled || hasSubmitted) return;
    
    onAnswer(input.trim());
    setHasSubmitted(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
              <MessageCircle className="w-3 h-3 mr-1" />
              NUVEM DE PALAVRAS
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{responses} respostas</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {question}
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Compartilhe sua palavra ou frase. Seja criativo!
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {!hasSubmitted ? (
          <>
      <div className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || "Digite sua resposta..."}
                disabled={disabled}
                className="w-full p-6 border-2 border-slate-200 rounded-2xl resize-none h-32 focus:border-blue-500 focus:outline-none transition-all duration-300 text-lg placeholder-slate-400"
          maxLength={200}
        />
        
        <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">
            {input.length}/200 caracteres
          </span>
              </div>
            </div>
          
            <div className="flex justify-center pt-4">
              <Button
            onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                size="lg"
                className="px-12 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Resposta
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">
                {disabled ? "Resposta já enviada!" : "Resposta enviada com sucesso!"}
              </h3>
              <p className="text-slate-600">
                {disabled
                  ? "Sua resposta foi carregada do banco de dados e será preservada."
                  : "Sua contribuição foi adicionada à nuvem de palavras."
                }
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-slate-900">Sua contribuição:</h4>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-700 font-medium text-lg">"{input}"</p>
        </div>
      </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}

interface LivePollProps {
  question: string;
  onAnswer: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function LivePoll({ 
  question, 
  onAnswer, 
  disabled, 
  min = 1, 
  max = 10, 
  step = 1,
  unit = '' 
}: LivePollProps) {
  const [value, setValue] = useState<number>(Math.floor((min + max) / 2));
  const [hasSubmitted, setHasSubmitted] = useState(!!disabled);
  const [responses] = useState(Math.floor(Math.random() * 25) + 10); // Mock responses
  const [isHovering, setIsHovering] = useState(false);

  // 🎯 NOVA: Sincronizar estado quando resposta já foi enviada
  useEffect(() => {
    if (disabled) {
      setHasSubmitted(true);
    }
  }, [disabled]);

  const handleSubmit = () => {
    if (disabled || hasSubmitted) return;
    onAnswer(value);
    setHasSubmitted(true);
  };

  // Calcular porcentagem para o slider
  const percentage = ((value - min) / (max - min)) * 100;

  // Determinar cor baseada no valor
  const getValueColor = (val: number) => {
    const normalizedValue = (val - min) / (max - min);
    if (normalizedValue < 0.33) return 'from-red-500 to-orange-500';
    if (normalizedValue < 0.66) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <Card className="w-full shadow-2xl border-0 bg-gradient-to-br from-white to-slate-50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="space-y-6 pb-6 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200"></div>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-3 py-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              ENQUETE AO VIVO
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-slate-600 bg-white/70 rounded-full px-3 py-1.5">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">{responses} respostas</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
            {question}
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Use o controle deslizante para definir sua resposta.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-10 p-8">
        {!hasSubmitted ? (
          <>
            {/* Display do valor atual */}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className={`inline-flex items-baseline justify-center px-8 py-6 rounded-3xl bg-gradient-to-br ${getValueColor(value)} shadow-2xl transform transition-all duration-300 ${isHovering ? 'scale-105' : 'scale-100'}`}>
                  <span className="text-7xl font-black text-white drop-shadow-lg">
                    {value}
                  </span>
                  {unit && (
                    <span className="text-2xl font-bold text-white/90 ml-2">
                      {unit}
                    </span>
                  )}
                </div>
                
                {/* Indicadores visuais ao redor */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Escala visual */}
              <div className="flex justify-center space-x-1">
                {Array.from({ length: max - min + 1 }, (_, i) => {
                  const scaleValue = min + i;
                  const isActive = scaleValue <= value;
                  return (
                    <div
                      key={scaleValue}
                      className={`w-2 h-8 rounded-full transition-all duration-300 ${
                        isActive 
                          ? `bg-gradient-to-t ${getValueColor(value)} shadow-lg` 
                          : 'bg-slate-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Slider customizado */}
            <div className="space-y-6">
              <div 
                className="relative px-4"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                {/* Track do slider */}
                <div className="relative h-4 bg-slate-200 rounded-full shadow-inner">
                  {/* Progress bar */}
                  <div 
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getValueColor(value)} rounded-full transition-all duration-300 shadow-lg`}
                    style={{ width: `${percentage}%` }}
                  />
                  
                  {/* Marcadores */}
                  {Array.from({ length: max - min + 1 }, (_, i) => {
                    const markerValue = min + i;
                    const markerPercentage = ((markerValue - min) / (max - min)) * 100;
                    return (
                      <div
                        key={markerValue}
                        className="absolute top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-sm"
                        style={{ left: `${markerPercentage}%` }}
                      />
                    );
                  })}
                </div>

                {/* Slider input */}
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  disabled={disabled}
                  className="absolute top-0 left-0 w-full h-full appearance-none bg-transparent cursor-pointer range-input"
                  style={{
                    background: 'transparent'
                  }}
                />
              </div>

              {/* Labels dos extremos */}
              <div className="flex justify-between items-center px-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-700">{min}</div>
                  <div className="text-xs text-slate-500 font-medium">{unit && `${unit} `}Mínimo</div>
                </div>
                
                <div className="text-center px-4">
                  <div className="text-sm text-slate-600 font-medium">
                    Escala de {min} a {max}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-700">{max}</div>
                  <div className="text-xs text-slate-500 font-medium">{unit && `${unit} `}Máximo</div>
                </div>
              </div>
            </div>

            {/* Botão de confirmação */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleSubmit}
                disabled={disabled}
                size="lg"
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Confirmar Resposta
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-8 py-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {disabled ? "Resposta já enviada!" : "Resposta registrada!"}
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed max-w-md mx-auto">
                {disabled
                  ? "Sua resposta foi carregada do banco de dados e será preservada durante toda a apresentação."
                  : "Obrigado pela sua participação na enquete ao vivo."
                }
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 space-y-6 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-lg">Sua resposta:</h4>
              <div className="relative">
                <div className={`inline-flex items-baseline justify-center px-6 py-4 rounded-2xl bg-gradient-to-br ${getValueColor(value)} shadow-lg`}>
                  <span className="text-4xl font-black text-white">
                    {value}
                  </span>
                  {unit && (
                    <span className="text-lg font-bold text-white/90 ml-2">
                      {unit}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Mini escala para referência */}
              <div className="flex justify-center space-x-1 opacity-60">
                {Array.from({ length: max - min + 1 }, (_, i) => {
                  const scaleValue = min + i;
                  const isActive = scaleValue <= value;
                  return (
                    <div
                      key={scaleValue}
                      className={`w-1.5 h-6 rounded-full ${
                        isActive 
                          ? `bg-gradient-to-t ${getValueColor(value)}` 
                          : 'bg-slate-300'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <style jsx>{`
        .range-input::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          border: 3px solid white;
          transition: all 0.2s ease;
        }
        
        .range-input::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }
        
        .range-input::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          border: 3px solid white;
          transition: all 0.2s ease;
        }
        
        .range-input::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }
      `}</style>
    </Card>
  );
}

interface WaitingScreenProps {
  message: string;
  isConnected: boolean;
  studentsCount?: number;
}

export function WaitingScreen({ message, isConnected, studentsCount }: WaitingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <Badge className={`font-medium ${isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                <Clock className="w-3 h-3 mr-1" />
                {isConnected ? 'CONECTADO' : 'CONECTANDO...'}
              </Badge>
          </div>
        </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          {message}
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Aguarde o professor iniciar a atividade
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isConnected ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Status da conexão:</span>
                  <span className="font-semibold text-emerald-600">🟢 Online</span>
                </div>
          {studentsCount !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Estudantes online:</span>
                    <span className="font-semibold text-blue-600">{studentsCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 