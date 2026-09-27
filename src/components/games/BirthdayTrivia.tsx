import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { launchConfetti } from '../ui/confetti.js';
import type { QuizQuestion } from '../../types/schema.js';

interface TriviaProps {
  birthdayName: string;
  customQuestions?: QuizQuestion[];
  onComplete?: () => void;
}

export const BirthdayTrivia: React.FC<TriviaProps> = ({
  birthdayName,
  customQuestions,
  onComplete
}) => {
  const questions: QuizQuestion[] = customQuestions && customQuestions.length > 0 ? customQuestions : [
    {
      question: `What makes ${birthdayName} completely irreplaceable?`,
      options: [
        'Their infectious laugh that cures bad days',
        'Their superpower of being an incredible listener',
        'Their uncanny ability to always be right',
        'All of the above, obviously!'
      ],
      correctIndex: 3,
      explanation: 'Without question, every single wonderful trait makes them who they are!'
    },
    {
      question: `What is the #1 mandatory rule for celebrating ${birthdayName} today?`,
      options: [
        'Extra cake, zero chores',
        'Accepting all compliments unconditionally',
        'Receiving royal treatment all day long',
        'Every single one of these!'
      ],
      correctIndex: 3,
      explanation: 'Today is strictly dedicated to celebrating their existence.'
    },
    {
      question: `How many years of awesomeness are locked in for the future?`,
      options: [
        'At least 50 more years',
        'An infinite amount',
        'Too many to count',
        'All of eternity'
      ],
      correctIndex: 1,
      explanation: 'Their light only shines brighter with every trip around the sun.'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      setScore(prev => prev + 1);
      launchConfetti();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      launchConfetti(undefined, undefined, 'star');
      if (onComplete) onComplete();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-slate-900/90 border border-indigo-500/30 rounded-3xl shadow-2xl backdrop-blur-md text-white select-none">
      {!isFinished ? (
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b border-indigo-500/20 pb-3">
            <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> Trivia Challenge
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Question Text */}
          <h3 className="text-lg font-bold text-white mb-6 leading-snug">
            {currentQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnStyle = 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-200';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold';
                } else if (isSelected) {
                  btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-200';
                } else {
                  btnStyle = 'border-white/5 bg-transparent text-zinc-500 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{option}</span>
                  {isAnswered && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {isAnswered && (
            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center animate-fadeIn">
              <span className="text-xs text-indigo-300 italic">
                {currentQ.explanation}
              </span>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-tr from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-slate-950 shadow-lg">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            Trivia Master Certified!
          </h3>
          <p className="text-zinc-300 text-sm mb-6">
            You scored {score} / {questions.length}! Nobody knows and loves {birthdayName} quite like you do.
          </p>
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Play Again
          </button>
        </div>
      )}
    </div>
  );
};
