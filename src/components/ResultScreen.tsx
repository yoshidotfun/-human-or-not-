"use client";

interface Props {
  correct: boolean;
  worldVerified: boolean;
  onPlayAgain: () => void;
}

export default function ResultScreen({ correct, worldVerified, onPlayAgain }: Props) {
  const bonus = worldVerified && correct ? 50 : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="text-7xl">{correct ? "🎉" : "😅"}</div>

      <h2 className="text-3xl font-bold text-white">
        {correct ? "正解！人間を見破った！" : "不正解…騙されました"}
      </h2>

      <div className="bg-gray-800 rounded-2xl px-8 py-6 space-y-2 w-full max-w-sm">
        <p className="text-gray-400 text-sm">獲得ポイント</p>
        <p className="text-4xl font-bold text-yellow-400">
          {correct ? 100 + bonus : 0} pts
        </p>
        {worldVerified && correct && (
          <p className="text-green-400 text-sm">
            World ID認証ボーナス +50pts
          </p>
        )}
      </div>

      {worldVerified ? (
        <div className="flex items-center gap-2 bg-green-900/40 border border-green-600 rounded-full px-4 py-2">
          <span className="text-green-400 text-sm font-medium">
            ✓ World ID認証済み — あなたは本物の人間です
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-full px-4 py-2">
          <span className="text-gray-400 text-sm">
            World IDで認証するとボーナスポイントがもらえます
          </span>
        </div>
      )}

      <button
        onClick={onPlayAgain}
        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold text-lg transition-colors"
      >
        もう一度プレイ
      </button>
    </div>
  );
}
