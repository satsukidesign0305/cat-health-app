# Nyarte 🐱

猫の健康状態を記録・管理するWebアプリです。

**本番URL：** https://cat-health-app-coral.vercel.app

---

## 機能

### 毎日の記録
- おしっこ・うんちの回数と状態メモ
- 体重
- 投薬管理（投与済みチェック付き）
- 健康イベント（嘔吐・下痢・通院・その他）
- 全体メモ

### 猫の管理
- 複数の猫を登録・切り替え
- プロフィール：名前・品種・誕生日・性別・写真
- かかりつけ医（病院名・電話番号・住所）
- 既往歴（時期と内容を1件ずつ登録）
- アレルギー・注意事項
- 食事（食品名と量を1件ずつ登録）

### 印刷・PDF出力
- **プロフィール印刷**：猫の管理ページからA4縦で出力
- **体調記録印刷**：月を選択してA4横で出力
- 白黒印刷に最適化（病院への持参を想定）

### その他
- メールアドレス・パスワード認証（Supabase Auth）
- クロスデバイス同期（スマホ・PC どこからでもアクセス可）
- PWA対応（ホーム画面に追加可能）

---

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | React + Vite + TypeScript |
| スタイリング | Tailwind CSS |
| ルーティング | React Router v7 |
| 認証・DB | Supabase（PostgreSQL + RLS） |
| PWA | vite-plugin-pwa |
| ホスティング | Vercel |

---

## 開発環境のセットアップ

### 必要なもの
- Node.js 18以上
- Supabaseアカウント

### 手順

```bash
# リポジトリをクローン
git clone https://github.com/satsukidesign0305/cat-health-app.git
cd cat-health-app

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local に Supabase の URL と anon key を記入

# 開発サーバーを起動
npm run dev
```

### 環境変数

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase テーブルのセットアップ

Supabase の SQL Editor で以下を実行してください。

```sql
-- 猫テーブル
create table if not exists cats (
  id uuid primary key,
  user_id uuid references auth.users not null,
  name text not null,
  breed text,
  birth_date date,
  sex text,
  photo_url text,
  color text,
  vet_name text,
  vet_phone text,
  vet_address text,
  medical_history jsonb default '[]',
  allergies text,
  food_notes jsonb default '[]',
  created_at timestamptz default now()
);
alter table cats enable row level security;
create policy "自分の猫のみ" on cats
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 記録テーブル
create table if not exists daily_records (
  id uuid primary key,
  cat_id uuid references cats(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  date date not null,
  urine_count int default 0,
  urine_note text,
  poop_count int default 0,
  poop_note text,
  weight numeric,
  medications jsonb default '[]',
  events jsonb default '[]',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table daily_records enable row level security;
create policy "自分の記録のみ" on daily_records
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

## デプロイ

Vercel にデプロイ済みです。`main` ブランチへのプッシュで自動デプロイされます。

Vercel の環境変数に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定してください。
