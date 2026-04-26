"use client";

import { useState } from "react";
import WorldVerifyButton from "@/components/WorldVerifyButton";
import { GameView } from "./game/page";

type AppState = "home" | "matching" | "playing";

interface MatchData {
  roomId: string;
  playerId: string;
  label: string;
  botId?: string;
  botLabel?: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("home");
  const [worldVerified, setWorldVerified] = useState(false);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startMatch = async (verified: boolean, hash?: string) => {
    setAppState("matching");
    setError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldVerified: verified, nullifierHash: hash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "マッチングに失敗しました");
      setMatchData(data);
      setAppState("playing");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setAppState("home");
    }
  };

  const handleVerified = async (hash: string) => {
    setWorldVerified(true);
    await startMatch(true, hash);
  };

  const handleSkip = async () => {
    setWorldVerified(false);
    await startMatch(false);
  };

  const handleReset = () => {
    setAppState("home");
    setMatchData(null);
  };

  if (appState === "playing" && matchData) {
    return (
      <GameView
        matchData={matchData}
        worldVerified={worldVerified}
        onReset={handleReset}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      {appState === "matching" ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300">対戦相手を探しています...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 max-w-md w-full">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="text-6xl mb-4">🤖 vs 👤</div>
            <h1 className="text-4xl font-black tracking-tight">Human or Not?</h1>
            <p className="text-gray-400 text-lg">
              チャット相手は人間？それともBot？
            </p>
          </div>

          {/* How to play */}
          <div className="bg-gray-900 rounded-2xl p-6 w-full space-y-3 text-sm text-gray-300">
            <h2 className="text-white font-bold text-base">遊び方</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>World IDで認証（人間として参加）またはスキップ（Bot役）</li>
              <li>60秒間、相手とチャット</li>
              <li>相手が人間かBotかを投票する</li>
              <li>正解すれば100pt！World ID認証者はボーナスあり</li>
            </ol>
          </div>

          {/* World ID */}
          <div className="w-full flex flex-col items-center gap-2">
            <WorldVerifyButton onVerified={handleVerified} onSkip={handleSkip} />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <p className="text-xs text-gray-600 text-center">
            World IDによるProof of Personhoodで<br />Sybil攻撃を防ぎます
          </p>
        </div>
      )}
    </main>
  );
}
