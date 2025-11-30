import React from "react";

// Now accepting "players" object as a prop
const BrasovMap = ({
  territories,
  onTerritoryClick,
  players,
  currentPlayerId,
}) => {
  // Coloring logic: Retrieve owner color from players list
  const getFillColor = (territoryId) => {
    const ownerId = territories[territoryId]?.owner;

    if (ownerId && players[ownerId]) {
      return players[ownerId].color; // Player's specific color
    }

    return "#e2e8f0"; // Grey (Neutral)
  };

  // Styling logic: Highlight territories owned by the current player
  const getPathClass = (territoryId) => {
    const ownerId = territories[territoryId]?.owner;
    const isMine = ownerId === currentPlayerId;

    let base =
      "cursor-pointer transition-all duration-300 hover:brightness-110 ";

    if (isMine) {
      // Add thicker white stroke for my territories
      return base + "stroke-white stroke-[3px] z-10 relative";
    } else {
      return base + "stroke-slate-400 stroke-1 hover:stroke-2";
    }
  };

  const textClass =
    "fill-slate-900 font-extrabold text-[11px] pointer-events-none select-none uppercase drop-shadow-md";

  // Zone Definitions (Brașov Neighborhoods)
  const zones = [
    {
      id: "stupini",
      name: "Stupini",
      d: "M 150 20 L 450 20 L 460 150 L 320 180 L 150 140 Z",
      textX: 300,
      textY: 90,
    },
    {
      id: "bartolomeu_nord",
      name: "Bartolomeu N.",
      d: "M 150 140 L 320 180 L 280 240 L 100 200 Z",
      textX: 210,
      textY: 190,
    },
    {
      id: "bartolomeu",
      name: "Bartolomeu",
      d: "M 60 200 L 100 200 L 280 240 L 260 320 L 200 350 L 50 280 Z",
      textX: 160,
      textY: 270,
    },
    {
      id: "tractorul",
      name: "Tractorul",
      d: "M 320 180 L 460 150 L 500 220 L 400 280 L 300 240 Z",
      textX: 400,
      textY: 210,
    },
    {
      id: "triaj",
      name: "Triaj",
      d: "M 460 150 L 580 140 L 600 250 L 500 220 Z",
      textX: 535,
      textY: 190,
    },
    {
      id: "centrul_nou",
      name: "Centrul Civic",
      d: "M 280 240 L 300 240 L 400 280 L 380 330 L 260 320 Z",
      textX: 325,
      textY: 290,
    },
    {
      id: "florilor",
      name: "Florilor",
      d: "M 400 280 L 500 220 L 510 290 L 420 310 Z",
      textX: 460,
      textY: 275,
    },
    {
      id: "est_zizin",
      name: "Zizin",
      d: "M 500 220 L 600 250 L 580 380 L 510 290 Z",
      textX: 550,
      textY: 300,
    },
    {
      id: "centrul_vechi",
      name: "Centrul Vechi",
      d: "M 260 320 L 380 330 L 360 380 L 250 380 Z",
      textX: 315,
      textY: 355,
    },
    {
      id: "schei",
      name: "Schei",
      d: "M 200 350 L 260 320 L 250 380 L 240 450 L 150 420 Z",
      textX: 210,
      textY: 400,
    },
    {
      id: "astra",
      name: "Astra",
      d: "M 380 330 L 420 310 L 510 290 L 580 380 L 450 450 L 360 380 Z",
      textX: 460,
      textY: 370,
    },
    {
      id: "valea_cetatii",
      name: "Racadau",
      d: "M 360 380 L 450 450 L 400 520 L 300 480 Z",
      textX: 380,
      textY: 460,
    },
    {
      id: "noua",
      name: "Noua",
      d: "M 450 450 L 580 380 L 620 550 L 480 580 Z",
      textX: 540,
      textY: 480,
    },
    {
      id: "poiana",
      name: "Poiana Brasov",
      d: "M 150 420 L 240 450 L 220 580 L 80 550 Z",
      textX: 170,
      textY: 510,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
      <div className="relative w-full aspect-[4/3] bg-blue-100/50 rounded-3xl shadow-2xl overflow-hidden border-4 border-slate-600/50 backdrop-blur-sm">
        <svg
          viewBox="0 0 650 600"
          className="w-full h-full drop-shadow-lg absolute top-0 left-0"
        >
          <defs>
            <filter id="inner-shadow">
              <feOffset dx="0" dy="1" />
              <feGaussianBlur stdDeviation="1" result="offset-blur" />
              <feComposite
                operator="out"
                in="SourceGraphic"
                in2="offset-blur"
                result="inverse"
              />
              <feFlood floodColor="black" floodOpacity="0.2" result="color" />
              <feComposite
                operator="in"
                in="color"
                in2="inverse"
                result="shadow"
              />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
          </defs>

          {zones.map((zone) => (
            <g
              key={zone.id}
              onClick={() => onTerritoryClick(zone.id)}
              className="group"
            >
              <path
                d={zone.d}
                fill={getFillColor(zone.id)}
                className={getPathClass(zone.id)}
                filter="url(#inner-shadow)"
              />
              {/* Text Shadow Layer */}
              <text
                x={zone.textX}
                y={zone.textY}
                textAnchor="middle"
                className={textClass}
                stroke="white"
                strokeWidth="3"
                opacity="0.8"
              >
                {zone.name}
              </text>
              {/* Main Text Layer */}
              <text
                x={zone.textX}
                y={zone.textY}
                textAnchor="middle"
                className={textClass}
              >
                {zone.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default BrasovMap;
