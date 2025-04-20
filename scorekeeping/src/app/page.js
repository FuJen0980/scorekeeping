"use client";

import { useState } from "react";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [scoreInputs, setScoreInputs] = useState({});

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const id = Date.now();
    setPlayers([
      ...players,
      { id, name: newPlayerName.trim(), score: 0 },
    ]);
    setScoreInputs({ ...scoreInputs, [id]: "" });
    setNewPlayerName("");
  };

  const updateScore = (id) => {
    const input = scoreInputs[id];
    const value = parseInt(input, 10);
    if (isNaN(value)) return;

    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, score: p.score + value } : p))
    );
    setScoreInputs({ ...scoreInputs, [id]: "" });
  };

  const handleInputChange = (id, value) => {
    setScoreInputs({ ...scoreInputs, [id]: value });
  };

  const removePlayer = (id) => {
    setPlayers(players.filter((player) => player.id !== id));
    const updatedScoreInputs = { ...scoreInputs };
    delete updatedScoreInputs[id];
    setScoreInputs(updatedScoreInputs);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-black font-bold mb-4 text-center">🎯 Scorekeeper</h1>

        <div className="flex gap-2 mb-6">
          <input
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Enter player name"
            className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button
            onClick={addPlayer}
            className="px-4 py-2 bg-blue-500 text-black rounded-md hover:bg-blue-600 transition"
          >
            Add
          </button>
        </div>

        <ul className="space-y-4">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between bg-gray-50 p-4 rounded-md shadow-sm"
            >
              <div>
                <p className="font-semibold text-lg text-black">{player.name}</p>
                <p className="text-black">Score: {player.score}</p>
              </div>

              <div className="flex items-center gap-2 text-black">
                <input
                  type="text"
                  value={scoreInputs[player.id] || ""}
                  onChange={(e) =>
                    handleInputChange(player.id, e.target.value)
                  }
                  placeholder="+ / -"
                  className="w-20 px-2 py-1 border rounded-md text-center"
                />
                <button
                  onClick={() => updateScore(player.id)}
                  className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                >
                  Apply
                </button>
                {/* Add Remove button */}
                <button
                  onClick={() => removePlayer(player.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
