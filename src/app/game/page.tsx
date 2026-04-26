"use client";

import { useState } from "react";
import ChatRoom from "@/components/ChatRoom";
import ResultScreen from "@/components/ResultScreen";

type GameState = "chat" | "voting" | "result";

interface MatchData {
  roomId: string;
  playerId: string;
  label: string;
  botId?: string;
  botLabel?: string;
}

interface GamePageProps {
  matchData: MatchData;
  worldVerified: boolean;
  onReset: () => void;
}

export default function GamePage() {
  // This component is rendered from the parent page which passes props via state
  // For standalone routing we redirect through the home page
  return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
      <p>ゲームを始めるには<a href="/" className="text-blue-400 underline">トップページ</a>へ</p>
    </div>
  );
}

// Internal component used by the main page
export function GameView({
  matchData,
  worldVerified,
  onReset,
}: GamePageProps) {
  const [phase, setPhase] = useState<GameState>("chat");
  const [result, setResult] = useState<{ correct: boolean } | null>(null);

  const opponentLabel = matchData.label === "A" ? "B" : "A";

  // Derive all player IDs: our ID + opponent
  // For bot games botId is known; for human games we show by label
  const opponentId = matchData.botId ?? `opponent-${matchData.roomId}`;
  const allPlayerIds = [matchData.playerId, opponentId];

  const handleVote = async (suspectId: string) => {
    const res = await fetch("/api/pusher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit-vote",
        roomId: matchData.roomId,
        playerId: matchData.playerId,
        suspectId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setResult({ correct: data.result.correct });
      setPhase("result");
    }
  };

  if (phase === "result" && result) {
    return (
      <ResultScreen
        correct={result.correct}
        worldVerified={worldVerified}
        onPlayAgain={onReset}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col">
      <ChatRoom
        roomId={matchData.roomId}
        playerId={matchData.playerId}
        botId={matchData.botId}
        playerLabel={matchData.label}
        opponentLabel={opponentLabel}
        phase={phase === "chat" ? "chat" : "voting"}
        onTimeUp={() => setPhase("voting")}
        onVoteSubmit={handleVote}
        allPlayerIds={allPlayerIds}
      />
    </div>
  );
}
