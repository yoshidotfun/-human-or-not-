import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createRoom, enqueuePlayer } from "@/lib/gameStore";
import { pusherServer } from "@/lib/pusherServer";
import type { Player } from "@/types/game";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { worldVerified, nullifierHash } = body as {
    worldVerified: boolean;
    nullifierHash?: string;
  };

  const playerId = uuidv4();
  const newPlayer: Player = {
    id: playerId,
    role: "human",
    worldVerified,
    nullifierHash,
    score: 0,
  };

  // Try to match with another waiting human, else vs bot
  const opponent = enqueuePlayer(newPlayer);

  if (opponent) {
    // Human vs Human match
    const room = createRoom(opponent, false);
    room.players.push(newPlayer);
    room.phase = "chat";

    // Randomly assign display labels so neither knows who's who
    const labels = Math.random() > 0.5
      ? { [opponent.id]: "A", [playerId]: "B" }
      : { [opponent.id]: "B", [playerId]: "A" };

    await pusherServer.trigger(`room-${room.id}`, "match-found", {
      roomId: room.id,
      labels,
    });

    return NextResponse.json({
      roomId: room.id,
      playerId,
      label: labels[playerId],
    });
  } else {
    // vs Bot — instant match
    const room = createRoom(newPlayer, true);
    const botPlayer = room.players.find((p) => p.role === "bot")!;

    const labels = Math.random() > 0.5
      ? { [playerId]: "A", [botPlayer.id]: "B" }
      : { [playerId]: "B", [botPlayer.id]: "A" };

    return NextResponse.json({
      roomId: room.id,
      playerId,
      label: labels[playerId],
      botId: botPlayer.id,
      botLabel: labels[botPlayer.id],
    });
  }
}
