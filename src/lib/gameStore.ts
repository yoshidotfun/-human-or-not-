/**
 * In-memory store for active game rooms.
 * In production, replace with Redis or a database.
 */

import { v4 as uuidv4 } from "uuid";
import type { GameRoom, Player, ChatMessage, PlayerRole } from "@/types/game";

const rooms = new Map<string, GameRoom>();
const waitingQueue: Player[] = []; // humans waiting for a match

// Bot response pool
const BOT_RESPONSES = [
  "面白いですね！",
  "そうですか〜",
  "なるほどなるほど",
  "私も同じこと思ってました",
  "ちょっとわからないけど…",
  "どういう意味ですか？",
  "そうかもしれませんね",
  "うーん、難しいですね",
  "それは本当ですか？",
  "私はよくここに来ます",
];

export function getOrCreateRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId);
}

export function createRoom(humanPlayer: Player, vsBot: boolean): GameRoom {
  const roomId = uuidv4();

  const botPlayer: Player = {
    id: uuidv4(),
    role: "bot",
    worldVerified: false,
    score: 0,
  };

  const room: GameRoom = {
    id: roomId,
    phase: "chat",
    players: vsBot ? [humanPlayer, botPlayer] : [humanPlayer],
    messages: [],
    roundTimeLeft: 60,
  };

  rooms.set(roomId, room);
  return room;
}

export function addPlayerToRoom(roomId: string, player: Player): GameRoom | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.players.push(player);
  if (room.players.length === 2) {
    room.phase = "chat";
  }
  return room;
}

export function addMessage(
  roomId: string,
  senderId: string,
  text: string
): ChatMessage | null {
  const room = rooms.get(roomId);
  if (!room || room.phase !== "chat") return null;

  const msg: ChatMessage = {
    id: uuidv4(),
    senderId,
    text,
    timestamp: Date.now(),
  };
  room.messages.push(msg);
  return msg;
}

export function getBotResponse(roomId: string, botId: string): ChatMessage {
  const room = rooms.get(roomId)!;
  const text = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
  const msg: ChatMessage = {
    id: uuidv4(),
    senderId: botId,
    text,
    timestamp: Date.now(),
  };
  room.messages.push(msg);
  return msg;
}

export function submitVote(
  roomId: string,
  voterId: string,
  suspectId: string
): { correct: boolean; humanWon: boolean } | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.phase = "result";
  const suspect = room.players.find((p) => p.id === suspectId);
  if (!suspect) return null;

  const correct = suspect.role === "bot";
  const humanWon = correct;

  room.result = { correctGuess: correct, humanWon };

  // Update scores
  room.players.forEach((p) => {
    if (p.role === "human") {
      if (correct) p.score += 100;
    }
  });

  return { correct, humanWon };
}

export function enqueuePlayer(player: Player): Player | null {
  if (waitingQueue.length > 0) {
    return waitingQueue.shift()!;
  }
  waitingQueue.push(player);
  return null;
}

export function getAllRooms() {
  return rooms;
}
