import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusherServer";
import { addMessage, getBotResponse, submitVote, getOrCreateRoom } from "@/lib/gameStore";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, roomId, playerId, text, suspectId, botId } = body;

  if (action === "send-message") {
    const msg = addMessage(roomId, playerId, text);
    if (!msg) return NextResponse.json({ error: "Cannot send message" }, { status: 400 });

    await pusherServer.trigger(`room-${roomId}`, "new-message", msg);

    // If opponent is a bot, generate a delayed bot response
    if (botId) {
      setTimeout(async () => {
        const room = getOrCreateRoom(roomId);
        if (room?.phase === "chat") {
          const botMsg = getBotResponse(roomId, botId);
          await pusherServer.trigger(`room-${roomId}`, "new-message", botMsg);
        }
      }, 1200 + Math.random() * 1500);
    }

    return NextResponse.json({ success: true, message: msg });
  }

  if (action === "start-voting") {
    await pusherServer.trigger(`room-${roomId}`, "phase-change", {
      phase: "voting",
    });
    return NextResponse.json({ success: true });
  }

  if (action === "submit-vote") {
    const result = submitVote(roomId, playerId, suspectId);
    if (!result) return NextResponse.json({ error: "Vote failed" }, { status: 400 });

    await pusherServer.trigger(`room-${roomId}`, "game-result", {
      ...result,
      suspectId,
    });

    return NextResponse.json({ success: true, result });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
