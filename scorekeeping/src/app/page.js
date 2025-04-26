"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "./lib/supabase";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-purple-100");
  const [scoreInputs, setScoreInputs] = useState({});
  const [sounds, setSounds] = useState({ positive: null, negative: null, reset: null });
  const [supabase, setSupabase] = useState(null);

  // Initialize Supabase client
  useEffect(() => {
    const client = createSupabaseClient();
    setSupabase(client);
  }, []);

  // Fetch players & subscribe to changes via Supabase v2 real-time channels
  useEffect(() => {
    if (!supabase) return; // Don't run if supabase isn't initialized

    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) console.error("Error fetching players:", error);
      else {
        setPlayers(data);
        const inputs = {};
        data.forEach((p) => (inputs[p.id] = ""));
        setScoreInputs(inputs);
      }
    };

    // Initial fetch
    fetchPlayers();

    // Set up polling every 2 seconds
    const pollInterval = setInterval(fetchPlayers, 2000);

    // Set up a real-time channel for INSERT, UPDATE, DELETE
    const playersChannel = supabase
      .channel("public:players")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "players",
          filter: "*"
        },
        (payload) => {
          console.log("Received update:", payload);
          fetchPlayers(); // Force a refresh when we get a real-time update
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(playersChannel);
    };
  }, [supabase]);

  // Load sounds once
  useEffect(() => {
    const positive = new Audio("/sounds/positive.mp3");
    const negative = new Audio("/sounds/negative.mp3");
    const reset = new Audio("/sounds/reset.mp3");
    [positive, negative, reset].forEach((audio) => {
      audio.volume = 0.5;
      audio.load();
    });
    setSounds({ positive, negative, reset });
    return () => {
      [positive, negative, reset].forEach((audio) => audio.pause());
    };
  }, []);

  const playSound = (type) => {
    const sound = sounds[type];
    if (sound) sound.play().catch((e) => console.error(e));
  };

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

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return;
    const { data, error } = await supabase
      .from("players")
      .insert({ name: newPlayerName.trim(), color_class: selectedColor })
      .select()
      .single();
    
    if (error) {
      console.error("Error adding player:", error);
      return;
    }
    
    // Update local state immediately
    setPlayers(prev => [data, ...prev]);
    setScoreInputs(prev => ({ ...prev, [data.id]: "" }));
    setNewPlayerName("");
  };

  const updateScore = async (id) => {
    const delta = parseInt(scoreInputs[id], 10);
    if (isNaN(delta)) return;
    
    const player = players.find((p) => p.id === id);
    const newScore = player.score + delta;
    const timestamp = new Date();
    const newHistory = [
      { id: Date.now(), value: delta, timestamp, isReset: false },
      ...(player.history || [])
    ];
    
    // Update local state immediately
    setPlayers(prev => prev.map(p => 
      p.id === id 
        ? { 
            ...p, 
            score: newScore, 
            updated_at: timestamp,
            history: newHistory
          }
        : p
    ));
    
    // Update database
    const { error } = await supabase
      .from("players")
      .update({ 
        score: newScore, 
        updated_at: timestamp,
        history: newHistory
      })
      .eq("id", id);
      
    if (error) {
      console.error("Error updating score:", error.message);
      // Revert local state if database update fails
      setPlayers(prev => prev.map(p => 
        p.id === id 
          ? { ...p, score: player.score, history: player.history }
          : p
      ));
      return;
    }
    
    setScoreInputs((prev) => ({ ...prev, [id]: "" }));

    if (delta > 0) playSound("positive");
    else if (delta < 0) playSound("negative");
  };

  const removePlayer = async (id) => {
    // Update local state immediately
    setPlayers(prev => prev.filter(p => p.id !== id));
    setScoreInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[id];
      return newInputs;
    });

    // Update database
    const { error } = await supabase.from("players").delete().eq("id", id);
    
    if (error) {
      console.error("Error removing player:", error);
      // Revert local state if database update fails
      setPlayers(prev => [...prev, players.find(p => p.id === id)]);
      setScoreInputs(prev => ({ ...prev, [id]: "" }));
    }
  };

  const resetAllScores = async () => {
    try {
      const timestamp = new Date();
      const newHistory = players.map(p => ({
        id: Date.now(),
        value: 0,
        timestamp,
        isReset: true
      }));
      
      // Update local state immediately
      setPlayers(prev => prev.map(p => ({
        ...p,
        score: 0,
        updated_at: timestamp,
        history: [
          { id: Date.now(), value: 0, timestamp, isReset: true },
          ...(p.history || [])
        ]
      })));

      // Update database
      const { data, error } = await supabase
        .from("players")
        .update({ 
          score: 0, 
          updated_at: timestamp,
          history: newHistory
        })
        .gte('id', '00000000-0000-0000-0000-000000000000')
        .select();
      
      if (error) {
        console.error("Error resetting scores:", error.message);
        // Revert local state if database update fails
        setPlayers(prev => prev.map(p => ({
          ...p,
          score: p.score,
          updated_at: p.updated_at,
          history: p.history
        })));
        return;
      }

      // Update local state with the data from the database
      if (data) {
        setPlayers(data);
      }
      
      playSound("reset");
    } catch (err) {
      console.error("Unexpected error in resetAllScores:", err);
      // Revert local state on unexpected errors
      setPlayers(prev => prev.map(p => ({
        ...p,
        score: p.score,
        updated_at: p.updated_at,
        history: p.history
      })));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPlayer();
    }
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-purple-50 p-4 sm:p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
        <h1 className="text-purple-800 font-bold mb-4 text-center text-2xl sm:text-3xl">
          ✨ Score Tracker ✨
        </h1>

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
              {colorOptions.map((c) => <option key={c.class} value={c.class}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex justify-center">
            <button
              onClick={addPlayer}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition shadow-sm"
            >➕ Add Player</button>
          </div>
          <div className="flex justify-center items-center gap-2">
            <span className="text-purple-800">Preview:</span>
            <div className={`w-12 h-6 rounded-md border border-purple-200 ${selectedColor}`}></div>
          </div>
        </div>

        {players.length > 0 ? (
          <>
            <div className="mb-4 flex justify-center">
              <button
                onClick={resetAllScores}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition shadow-sm"
              >🔄 Reset All Scores</button>
            </div>
            <ul className="space-y-4 mb-6">
              {players.map((player) => (
                <li key={player.id} className={`rounded-lg shadow-sm border border-purple-200 ${player.color_class} overflow-hidden`}>
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4">
                    <div className="flex-grow">
                      <p className="font-semibold text-lg text-purple-800">{player.name}</p>
                      <p className="text-purple-700">Score: {player.score}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                      <input
                        type="text"
                        value={scoreInputs[player.id] || ""}
                        onChange={(e) => setScoreInputs(prev => ({ ...prev, [player.id]: e.target.value }))}
                        placeholder="+ / -"
                        className="w-20 px-2 py-1 border-2 border-purple-200 rounded-md text-center bg-white text-purple-800"
                      />
                      <button onClick={() => updateScore(player.id)} className="px-3 py-1 bg-purple-400 text-white rounded-md hover:bg-purple-500 transition">Apply</button>
                      <button onClick={() => removePlayer(player.id)} className="px-3 py-1 bg-pink-400 text-white rounded-md hover:bg-pink-500 transition">Remove</button>
                    </div>
                  </div>
                <div className="bg-white bg-opacity-50 border-t border-purple-100 p-2">
                  {player.history && player.history.length > 0 ? (
                    <div className="overflow-x-auto flex space-x-2 py-1 px-2">
                      {player.history.map(entry => (
                        <div key={entry.id} className={`flex-shrink-0 px-2 py-1 rounded-md text-xs whitespace-nowrap ${entry.isReset ? "bg-yellow-100 text-yellow-800" : entry.value > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          <div className="font-medium">{entry.isReset ? "Reset" : (entry.value > 0 ? `+${entry.value}` : entry.value)}</div>
                          <div className="text-xs opacity-75">{formatTime(entry.timestamp)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-1 text-purple-400 text-xs">No history yet</div>
                  )}
                </div></li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-center py-8 text-purple-400">✨ Add players to start tracking scores! ✨</div>
        )}
      </div>
    </div>
  );
}