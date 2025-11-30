// server/neighbors.js
// Lista de vecini pentru fiecare cartier
const adjacencyList = {
  stupini: ["bartolomeu_nord", "tractorul"],
  bartolomeu_nord: ["stupini", "bartolomeu", "tractorul"],
  bartolomeu: ["bartolomeu_nord", "schei", "centrul_vechi", "centrul_nou"],
  tractorul: ["stupini", "bartolomeu_nord", "triaj", "centrul_nou", "florilor"],
  triaj: ["tractorul", "est_zizin"],
  centrul_nou: [
    "bartolomeu",
    "tractorul",
    "florilor",
    "centrul_vechi",
    "astra",
  ],
  florilor: ["tractorul", "centrul_nou", "est_zizin", "astra"],
  est_zizin: ["triaj", "florilor", "astra", "noua"],
  centrul_vechi: ["bartolomeu", "centrul_nou", "schei", "astra"], // Centrul istoric leagă schei de restul
  schei: ["bartolomeu", "centrul_vechi", "poiana"],
  astra: [
    "centrul_nou",
    "florilor",
    "est_zizin",
    "centrul_vechi",
    "valea_cetatii",
    "noua",
  ],
  valea_cetatii: ["astra", "schei"],
  noua: ["est_zizin", "astra"],
  poiana: ["schei"],
};

module.exports = adjacencyList;
