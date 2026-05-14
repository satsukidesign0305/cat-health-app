import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function Account() {
  const { user } = useAuth();

  // メール変更フォームの状態
  const [newEmail, setNewEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [emailSaving, setEmailSaving] = useState(false);

  // パスワード変更フォームの状態
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function handleEmailChange() {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    setEmailStatus(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setEmailStatus({ ok: false, msg: `変更に失敗しました：${error.message}` });
    } else {
      setEmailStatus({ ok: true, msg: "確認メールを送信しました。新しいメールアドレスのリンクをクリックして変更を完了してください。" });
      setNewEmail("");
    }
    setEmailSaving(false);
  }

  async function handlePasswordChange() {
    if (newPassword.length < 6) {
      setPasswordStatus({ ok: false, msg: "パスワードは6文字以上で入力してください" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ ok: false, msg: "パスワードが一致しません" });
      return;
    }
    setPasswordSaving(true);
    setPasswordStatus(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus({ ok: false, msg: `変更に失敗しました：${error.message}` });
    } else {
      setPasswordStatus({ ok: true, msg: "パスワードを変更しました" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <header className="bg-orange-500 text-white px-4 py-4 flex items-center gap-3">
        <Link to="/" className="p-1"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">アカウント設定</h1>
      </header>

      <main className="p-4 space-y-4">
        {/* 現在のアカウント情報 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">現在のログインID（メールアドレス）</p>
          <p className="font-semibold text-gray-700">{user?.email}</p>
        </div>

        {/* メールアドレス変更 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-700">メールアドレスを変更</h2>
          <div>
            <label className="text-xs text-gray-400">新しいメールアドレス</label>
            <input
              type="email"
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              placeholder="new@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          {emailStatus && (
            <p className={`text-xs ${emailStatus.ok ? "text-green-600" : "text-red-500"}`}>
              {emailStatus.msg}
            </p>
          )}
          <button
            onClick={handleEmailChange}
            disabled={!newEmail.trim() || emailSaving}
            className="w-full bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            {emailSaving ? "送信中…" : "確認メールを送信"}
          </button>
        </div>

        {/* パスワード変更 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-700">パスワードを変更</h2>
          <div>
            <label className="text-xs text-gray-400">新しいパスワード（6文字以上）</label>
            <input
              type="password"
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">新しいパスワード（確認）</label>
            <input
              type="password"
              className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {passwordStatus && (
            <p className={`text-xs ${passwordStatus.ok ? "text-green-600" : "text-red-500"}`}>
              {passwordStatus.msg}
            </p>
          )}
          <button
            onClick={handlePasswordChange}
            disabled={!newPassword || !confirmPassword || passwordSaving}
            className="w-full bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            {passwordSaving ? "変更中…" : "パスワードを変更"}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
