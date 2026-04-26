"use client";

import { useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

interface Props {
  onVerified: (address: string) => void;
  onSkip: () => void;
}

export default function WorldVerifyButton({ onVerified, onSkip }: Props) {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const nonce = crypto.randomUUID().replace(/-/g, "");

      const result = await MiniKit.walletAuth({
        nonce,
        statement: "Human or Not? ゲームに人間として参加します",
      });

      // result.data contains WalletAuthResult: { address, message, signature }
      const { address, message, signature } = result.data;

      if (!address) throw new Error("ウォレットアドレスが取得できませんでした");

      // Verify SIWE signature on server
      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature, nonce }),
      });
      const data = await verifyRes.json();

      if (data.success) {
        onVerified(address);
      } else {
        alert("認証検証に失敗しました: " + (data.error ?? "Unknown error"));
      }
    } catch (e: unknown) {
      console.error(e);
      alert(e instanceof Error ? e.message : "認証中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        onClick={handleVerify}
        disabled={loading}
        className="flex items-center justify-center gap-3 bg-black text-white w-full max-w-xs px-6 py-3 rounded-full font-bold text-base hover:bg-gray-800 disabled:opacity-60 transition-colors"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-xl">🌐</span>
        )}
        World IDで認証する（人間として参加）
      </button>

      <button
        onClick={onSkip}
        disabled={loading}
        className="text-sm text-gray-500 underline hover:text-gray-300 transition-colors"
      >
        認証なしでBot役として参加する
      </button>
    </div>
  );
}
