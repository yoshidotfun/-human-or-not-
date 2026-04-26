import { NextRequest, NextResponse } from "next/server";

/**
 * Verifies a World App SIWE (Sign-In With Ethereum) wallet auth payload.
 *
 * In production:
 * 1. Reconstruct the SIWE message from `message`
 * 2. Recover signer address from `signature`
 * 3. Ensure recovered address === address
 * 4. Store and expire nonces to prevent replay attacks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, message, signature, nonce } = body as {
      address: string;
      message: string;
      signature: string;
      nonce: string;
    };

    if (!address || !message || !signature || !nonce) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic Ethereum address validation
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, error: "Invalid address format" },
        { status: 400 }
      );
    }

    // TODO: production — verify SIWE signature with viem:
    // const { createPublicClient, http } = await import('viem')
    // const { worldchain } = await import('viem/chains')
    // const recovered = await verifyMessage({ address, message, signature })
    // if (!recovered) return error

    return NextResponse.json({ success: true, address });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
