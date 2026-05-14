import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // すでにログイン済みならホームへ
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const { error } =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);

    if (error) {
      setMessage({ text: "メールアドレスまたはパスワードが正しくありません", ok: false });
    } else if (mode === "signup") {
      setMessage({ text: "確認メールを送信しました。メールをご確認ください。", ok: true });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Nyarte</h1>
          <p className="text-gray-400 text-sm mt-2">猫の健康記録アプリ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {mode === "login" ? "ログイン" : "アカウント登録"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">メールアドレス</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">パスワード（6文字以上）</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {message && (
              <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-500"}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50 mt-1"
            >
              {loading ? "処理中…" : mode === "login" ? "ログイン" : "登録する"}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(null); }}
            className="w-full text-sm text-orange-500 text-center pt-1"
          >
            {mode === "login"
              ? "アカウントをお持ちでない方はこちら →"
              : "ログインはこちら →"}
          </button>
        </div>
      </div>
    </div>
  );
}
