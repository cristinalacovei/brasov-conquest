import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const TriviaModal = ({ data, onAnswer }) => {
  if (!data) return null;
  const { category, question, options } = data;
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    setTimeLeft(15);
  }, [data]);

  useEffect(() => {
    if (timeLeft === 0) {
      const randomIndex = Math.floor(Math.random() * options.length);
      onAnswer(randomIndex);
      return;
    }
    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, onAnswer, options.length]);

  const progressPercentage = (timeLeft / 15) * 100;
  const timerColor =
    timeLeft <= 5
      ? "text-red-500 border-red-500/50 bg-red-900/20"
      : "text-yellow-400 border-yellow-500/30 bg-slate-900/50";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border-2 border-yellow-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col items-center">
        <div className="absolute -top-5 bg-yellow-500 text-slate-900 px-6 py-1 rounded-full font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.6)] text-sm md:text-base">
          {category || "Cultură Generală"}
        </div>
        <div
          className={`absolute top-4 right-4 flex items-center gap-2 font-mono text-xl font-bold px-3 py-1 rounded-lg border transition-colors duration-300 ${timerColor}`}
        >
          <Clock size={18} /> <span>{timeLeft}s</span>
        </div>
        <h3 className="text-xl md:text-2xl text-white font-bold text-center mt-8 mb-8 leading-relaxed">
          {question}
        </h3>
        <div className="grid grid-cols-1 gap-3 w-full">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              className="w-full p-4 bg-slate-700 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left border border-slate-600 hover:border-blue-400 shadow-md group"
            >
              <span className="opacity-50 mr-3 font-mono text-yellow-400 group-hover:text-white transition-colors">
                {index + 1}.
              </span>{" "}
              {option}
            </button>
          ))}
        </div>
        <div className="mt-8 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-red-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-500 mt-2 font-mono">Timpul trece...</p>
      </div>
    </div>
  );
};

export default TriviaModal;
