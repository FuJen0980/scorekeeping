"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-purple-100");
  const [scoreInputs, setScoreInputs] = useState({});
  const [audioContext, setAudioContext] = useState(null);
  
  // Initialize the Audio Context when the component mounts
  useEffect(() => {
    // Create audio context on component mount
    // We need to do this in useEffect because AudioContext needs the browser environment
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);
    
    // Clean up function
    return () => {
      if (context) {
        context.close();
      }
    };
  }, []);
  
  // Function to play a positive score sound (happy upward tone)
  const playPositiveSound = () => {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };
  
  // Function to play a negative score sound (sad downward tone)
  const playNegativeSound = () => {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(250, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.4);
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
        colorClass: selectedColor 
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
      playPositiveSound();
    } else if (value < 0) {
      playNegativeSound();
    }

    // Update score and then sort by highest score
    setPlayers((prev) => {
      const updatedPlayers = prev.map((p) => 
        p.id === id ? { ...p, score: p.score + value } : p
      );
      
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPlayer();
    }
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
          <ul className="space-y-4">
            {players.map((player) => (
              <li
                key={player.id}
                className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg shadow-sm border border-purple-200 ${player.colorClass}`}
              >
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
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-purple-400">
            ✨ Add players to start tracking scores! ✨
          </div>
        )}
      </div>
    </div>
  );
}