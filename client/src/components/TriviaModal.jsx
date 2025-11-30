import React from "react";

const TriviaModal = ({ data, onAnswer }) => {
  if (!data) return null;

  const { category, question, options } = data;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border-2 border-yellow-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative flex flex-col items-center">
        {/* Dynamic Category Header */}
        <div className="absolute -top-5 bg-yellow-500 text-slate-900 px-6 py-1 rounded-full font-extrabold uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.6)] text-sm md:text-base">
          {category || "General Knowledge"}
        </div>

        {/* Question Display */}
        <h3 className="text-xl md:text-2xl text-white font-bold text-center mt-6 mb-8 leading-relaxed">
          {/* Direct display is preferred here as the server decodes HTML entities */}
          {question}
        </h3>

        {/* Answer Options Grid */}
        <div className="grid grid-cols-1 gap-3 w-full">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(index)}
              className="w-full p-4 bg-slate-700 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left border border-slate-600 hover:border-blue-400 shadow-md group"
            >
              <span className="opacity-50 mr-3 font-mono text-yellow-400 group-hover:text-white transition-colors">
                {index + 1}.
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* Visual Timer Bar */}
        <div className="mt-8 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-red-500 w-full animate-[width_15s_linear_forwards]"></div>
        </div>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          Time is ticking...
        </p>
      </div>
    </div>
  );
};

export default TriviaModal;
