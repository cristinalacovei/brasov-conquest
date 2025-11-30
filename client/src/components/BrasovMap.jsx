import React from "react";

const BrasovMap = ({
  territories,
  onTerritoryClick,
  players,
  currentPlayerId,
}) => {
  const getFillColor = (territoryId) => {
    const ownerId = territories[territoryId]?.owner;
    if (ownerId && players[ownerId]) return players[ownerId].color;
    return "#cbd5e1";
  };

  const getPathClass = (territoryId) => {
    const ownerId = territories[territoryId]?.owner;
    const isMine = ownerId === currentPlayerId;
    let base = "cursor-pointer transition-all duration-300 ";
    if (isMine)
      return (
        base +
        "stroke-white stroke-[2px] z-10 relative drop-shadow-md brightness-110"
      );
    else
      return (
        base +
        "stroke-slate-500/50 stroke-1 hover:brightness-95 hover:stroke-slate-600"
      );
  };

  const zones = [
    {
      id: "stupini",
      name: "Stupini",
      d: "M 100 20 L 500 20 L 520 120 L 300 150 L 80 100 Z",
      textX: 300,
      textY: 80,
    },
    {
      id: "bartolomeu_nord",
      name: "Bartolomeu N.",
      d: "M 80 100 L 300 150 L 280 200 L 60 180 Z",
      textX: 170,
      textY: 160,
    },
    {
      id: "bartolomeu",
      name: "Bartolomeu",
      d: "M 60 180 L 280 200 L 260 260 L 40 240 Z",
      textX: 150,
      textY: 230,
    },
    {
      id: "tractorul",
      name: "Tractorul",
      d: "M 300 150 L 520 120 L 540 220 L 320 240 L 280 200 Z",
      textX: 420,
      textY: 180,
    },
    {
      id: "triaj",
      name: "Triaj",
      d: "M 520 120 L 620 110 L 640 250 L 540 220 Z",
      textX: 580,
      textY: 180,
    },
    {
      id: "centrul_nou",
      name: "Centrul Civic",
      d: "M 280 200 L 320 240 L 400 230 L 380 290 L 260 260 Z",
      textX: 330,
      textY: 250,
    },
    {
      id: "florilor",
      name: "Florilor",
      d: "M 320 240 L 540 220 L 530 280 L 400 230 Z",
      textX: 450,
      textY: 250,
    },
    {
      id: "est_zizin",
      name: "Zizin",
      d: "M 540 220 L 640 250 L 600 350 L 530 280 Z",
      textX: 580,
      textY: 290,
    },
    {
      id: "centrul_vechi",
      name: "Centrul Vechi",
      d: "M 260 260 L 380 290 L 350 340 L 220 320 Z",
      textX: 300,
      textY: 310,
    },
    {
      id: "schei",
      name: "Schei",
      d: "M 220 320 L 350 340 L 320 400 L 150 380 Z",
      textX: 250,
      textY: 370,
    },
    {
      id: "astra",
      name: "Astra",
      d: "M 380 290 L 530 280 L 600 350 L 450 400 L 350 340 Z",
      textX: 470,
      textY: 330,
    },
    {
      id: "valea_cetatii",
      name: "Racadau",
      d: "M 350 340 L 450 400 L 400 480 L 320 400 Z",
      textX: 380,
      textY: 410,
    },
    {
      id: "noua",
      name: "Noua",
      d: "M 450 400 L 600 350 L 620 500 L 480 520 Z",
      textX: 540,
      textY: 450,
    },
    {
      id: "poiana",
      name: "Poiana Brasov",
      d: "M 150 380 L 320 400 L 300 550 L 50 500 Z",
      textX: 180,
      textY: 460,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col items-center">
      <div className="relative w-full aspect-[4/3] bg-[#a8c6fa] rounded-3xl shadow-2xl overflow-hidden border-4 border-slate-700 backdrop-blur-sm">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
        <svg
          viewBox="0 0 700 600"
          className="w-full h-full drop-shadow-2xl absolute top-0 left-0"
        >
          <defs>
            <filter id="rough-map">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015"
                numOctaves="4"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="15"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feComposite operator="in" in2="SourceGraphic" />
            </filter>
            <filter id="text-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.8" />
            </filter>
          </defs>
          <g filter="url(#rough-map)">
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
                  strokeLinejoin="round"
                />
              </g>
            ))}
          </g>
          {zones.map((zone) => (
            <g
              key={`text-${zone.id}`}
              className="pointer-events-none select-none"
            >
              <text
                x={zone.textX}
                y={zone.textY}
                textAnchor="middle"
                className="fill-slate-900 font-extrabold text-[10px] md:text-[12px] uppercase tracking-wide opacity-90"
                filter="url(#text-shadow)"
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
