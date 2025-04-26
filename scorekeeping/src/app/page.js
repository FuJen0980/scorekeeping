"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-purple-100");
  const [scoreInputs, setScoreInputs] = useState({});
  const [sounds, setSounds] = useState({
    positive: null,
    negative: null,
    reset: null
  });
  
  // Load sounds when component mounts
  useEffect(() => {
    // Create Audio objects for each sound type
    const positiveSound = new Audio("/sounds/positive.mp3");
    const negativeSound = new Audio("/sounds/negative.mp3");
    const resetSound = new Audio("/sounds/reset.mp3");
    
    // Set the volume
    positiveSound.volume = 0.5;
    negativeSound.volume = 0.5;
    resetSound.volume = 0.5;
    
    // Store Audio objects in state
    setSounds({
      positive: positiveSound,
      negative: negativeSound,
      reset: resetSound
    });
    
    // Preload the sounds
    positiveSound.load();
    negativeSound.load();
    resetSound.load();
    
    // Cleanup function
    return () => {
      positiveSound.pause();
      negativeSound.pause();
      resetSound.pause();
    };
  }, []);
  
  // Function to play a sound
  const playSound = (type) => {
    const sources = {
      positive: "/sounds/positive.mp3",
      negative: "/sounds/negative.mp3",
      reset: "/sounds/reset.mp3",
    };
  
    const src = sources[type];
    if (!src) return;
  
    const sound = new Audio(src);
    sound.volume = 0.5;
    sound.play().catch((err) => {
      console.error(`Error playing ${type} sound:`, err);
    });
  };

  // Array of cute pastel background color options
  const colorOptions = [
    { class: "bg-purple-50", label: "Lavender" },
    { class: "bg-purple-100", label: "Light Purple" },
    { class: "bg-pink-50", label: "Baby Pink" },
    { class: "bg-pink-100", label: "Blush" },
    { class: "bg-indigo-50", label: "Periwinkle" },
    { class: "bg-blue-50", label: "Sky Blue" },
    { class: "bg-yellow-50", label: "Cream" },
    { class: "bg-green-50", label: "Mint" },
    { class: "bg-red-50", label: "Peach" },
    { class: "bg-orange-50", label: "Apricot" }
  ];

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const id = Date.now();
    
    setPlayers([
      ...players,
      { 
        id, 
        name: newPlayerName.trim(), 
        score: 0,
        colorClass: selectedColor,
        history: [] // Initialize empty history array for each player
      },
    ]);
    setScoreInputs({ ...scoreInputs, [id]: "" });
    setNewPlayerName("");
  };

  const updateScore = (id) => {
    const input = scoreInputs[id];
    const value = parseInt(input, 10);
    if (isNaN(value)) return;

    // Play appropriate sound based on score value
    if (value > 0) {
      playSound('positive');
    } else if (value < 0) {
      playSound('negative');
    }

    // Update score and add to player's history
    setPlayers((prev) => {
      const updatedPlayers = prev.map((p) => {
        if (p.id === id) {
          const newScore = p.score + value;
          const historyEntry = {
            id: Date.now(),
            value: value,
            newTotal: newScore,
            timestamp: new Date()
          };
          return { 
            ...p, 
            score: newScore,
            history: [historyEntry, ...p.history].slice(0, 30) // Keep most recent 30 entries
          };
        }
        return p;
      });
      
      // Sort players by score in descending order
      return [...updatedPlayers].sort((a, b) => b.score - a.score);
    });
    
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

  const resetAllScores = () => {
    // Play the reset sound
    playSound('reset');
    
    // Reset all player scores to 0 but maintain their other properties
    setPlayers(players.map(player => {
      // Only add a history entry if score wasn't already 0
      let updatedHistory = player.history;
      if (player.score !== 0) {
        const historyEntry = {
          id: Date.now(),
          value: -player.score, // Negative of current score to reset to 0
          newTotal: 0,
          timestamp: new Date(),
          isReset: true
        };
        updatedHistory = [historyEntry, ...player.history].slice(0, 30);
      }
      
      return { 
        ...player, 
        score: 0,
        history: updatedHistory
      };
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPlayer();
    }
  };

  // Format timestamp for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-purple-50 p-4 sm:p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
        <h1 className="text-purple-800 font-bold mb-4 text-center text-2xl sm:text-3xl">✨ Score Tracker ✨</h1>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter player name"
              className="flex-grow px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-800 placeholder-purple-300"
            />
            
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-800"
            >
              {colorOptions.map((color) => (
                <option key={color.class} value={color.class}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={addPlayer}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition shadow-sm"
            >
              ➕ Add Player
            </button>
          </div>
          
          <div className="flex justify-center items-center gap-2">
            <span className="text-purple-800">Preview: </span>
            <div className={`w-12 h-6 rounded-md border border-purple-200 ${selectedColor}`}></div>
          </div>
        </div>

        {players.length > 0 ? (
          <>
            <div className="mb-4 flex justify-center">
              <button
                onClick={resetAllScores}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition shadow-sm"
              >
                🔄 Reset All Scores
              </button>
            </div>
            <ul className="space-y-4 mb-6">
              {players.map((player) => (
                <li
                  key={player.id}
                  className={`rounded-lg shadow-sm border border-purple-200 ${player.colorClass} overflow-hidden`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4">
                    <div className="flex-grow">
                      <p className="font-semibold text-lg text-purple-800">{player.name}</p>
                      <p className="text-purple-700">Score: {player.score}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      <input
                        type="text"
                        value={scoreInputs[player.id] || ""}
                        onChange={(e) =>
                          handleInputChange(player.id, e.target.value)
                        }
                        placeholder="+ / -"
                        className="w-20 px-2 py-1 border-2 border-purple-200 rounded-md text-center bg-white text-purple-800"
                      />
                      <button
                        onClick={() => updateScore(player.id)}
                        className="px-3 py-1 bg-purple-400 text-white rounded-md hover:bg-purple-500 transition"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="px-3 py-1 bg-pink-400 text-white rounded-md hover:bg-pink-500 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  {/* Player history section - always visible */}
                  <div className="bg-white bg-opacity-50 border-t border-purple-100 p-2">
                    {player.history.length > 0 ? (
                      <div className="overflow-x-auto">
                        <div className="flex space-x-2 py-1 px-2">
                          {player.history.map((entry) => (
                            <div 
                              key={entry.id}
                              className={`flex-shrink-0 px-2 py-1 rounded-md text-xs whitespace-nowrap ${
                                entry.isReset
                                  ? "bg-yellow-100 text-yellow-800"
                                  : entry.value > 0
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              <div className="font-medium">
                                {entry.isReset ? "Reset" : entry.value > 0 ? "+" + entry.value : entry.value}
                              </div>
                              <div className="text-xs opacity-75">
                                {formatTime(entry.timestamp)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-1 text-purple-400 text-xs">
                        No history yet
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-center py-8 text-purple-400">
            ✨ Add players to start tracking scores! ✨
          </div>
        )}
      </div>
    </div>
  );
}