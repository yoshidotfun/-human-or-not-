export type PlayerRole = "human" | "bot";
export type GamePhase = "lobby" | "chat" | "voting" | "result";

export interface Player {
  id: string;
  role: PlayerRole;
  worldVerified: boolean;
  nullifierHash?: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  phase: GamePhase;
  players: Player[];
  messages: ChatMessage[];
  roundTimeLeft: number;
  humanVote?: "playerA" | "playerB"; // which player the voter thinks is human
  result?: {
    correctGuess: boolean;
    humanWon: boolean;
  };
}

export interface MatchResponse {
  roomId: string;
  playerId: string;
  role: PlayerRole;
  opponentIsBot: boolean; // server-only, not sent to client during chat phase
}
