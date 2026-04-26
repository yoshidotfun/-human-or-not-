"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import type { ChatMessage } from "@/types/game";

interface Props {
  roomId: string;
  playerId: string;
  botId?: string;
  playerLabel: string;
  opponentLabel: string;
  onTimeUp: () => void;
  onVoteSubmit: (suspectId: string) => void;
  phase: "chat" | "voting";
  allPlayerIds: string[]; // [playerId, opponentId]
}

const CHAT_DURATION = 60; // seconds

export default function ChatRoom({
  roomId,
  playerId,
  botId,
  playerLabel,
  opponentLabel,
  onTimeUp,
  onVoteSubmit,
  phase,
  allPlayerIds,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [timeLeft, setTimeLeft] = useState(CHAT_DURATION);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pusher subscription
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`room-${roomId}`);

    channel.bind("new-message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    channel.bind("phase-change", ({ phase: newPhase }: { phase: string }) => {
      if (newPhase === "voting") onTimeUp();
    });

    return () => {
      channel.unbind_all();
      pusher.disconnect();
    };
  }, [roomId, onTimeUp]);

  // Countdown timer
  useEffect(() => {
    if (phase !== "chat") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          // Trigger voting phase
          fetch("/api/pusher", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start-voting", roomId }),
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, roomId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText("");
    setIsSending(true);

    await fetch("/api/pusher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-message",
        roomId,
        playerId,
        text,
        botId,
      }),
    });
    setIsSending(false);
  };

  const opponentId = allPlayerIds.find((id) => id !== playerId) ?? "";

  const timerColor =
    timeLeft > 30 ? "text-green-400" : timeLeft > 10 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-700">
        <span className="text-sm text-gray-400">
          あなた: <span className="font-bold text-white">プレイヤー{playerLabel}</span>
        </span>
        {phase === "chat" && (
          <span className={`font-mono text-xl font-bold ${timerColor}`}>
            {timeLeft}s
          </span>
        )}
        <span className="text-sm text-gray-400">
          相手: <span className="font-bold text-white">プレイヤー{opponentLabel}</span>
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-8">
            チャットを開始してください。相手が人間かBotか見極めよう！
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === playerId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                  isMine
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-700 text-gray-100 rounded-bl-sm"
                }`}
              >
                {!isMine && (
                  <p className="text-xs text-gray-400 mb-1">
                    プレイヤー{opponentLabel}
                  </p>
                )}
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input or Voting */}
      {phase === "chat" ? (
        <div className="p-4 bg-gray-900 border-t border-gray-700 flex gap-2">
          <input
            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="メッセージを入力..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            maxLength={200}
          />
          <button
            onClick={sendMessage}
            disabled={isSending || !inputText.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-full px-4 py-2 text-sm font-bold transition-colors"
          >
            送信
          </button>
        </div>
      ) : (
        <div className="p-6 bg-gray-900 border-t border-gray-700">
          <p className="text-center text-white font-bold text-lg mb-4">
            どちらが Bot ですか？
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onVoteSubmit(opponentId)}
              className="flex-1 max-w-[160px] bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-colors"
            >
              プレイヤー{opponentLabel} が Bot
            </button>
            <button
              onClick={() => onVoteSubmit(playerId)}
              className="flex-1 max-w-[160px] bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-colors"
            >
              自分（{playerLabel}）が Bot
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
