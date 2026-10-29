#!/usr/bin/env bash
# 案件固有の情報が含まれていないかを検査する。
#   scripts/check-confidential.sh          ステージ済みの変更を検査（pre-commit から呼ぶ）
#   scripts/check-confidential.sh --all    追跡中の全ファイルを検査
#
# 検査するもの
#   1. .confidential-terms に書いた語（クライアント名・案件名など。大文字小文字を区別しない）
#   2. メールアドレス
#   3. ユーザー名を含む絶対パス（/Users/xxx, /home/xxx, C:\Users\xxx）
# 見つかったら終了コード 1 を返す。
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

terms_file=".confidential-terms"
mode="staged"
[[ "${1:-}" == "--all" ]] && mode="all"

# 検査対象から外すファイル（この仕組み自体の説明・雛形）
exclude=(
  ':!scripts/check-confidential.sh'
  ':!.confidential-terms.example'
)

if [[ "$mode" == "staged" ]]; then
  files=$(git diff --cached --name-only --diff-filter=ACMR -- . "${exclude[@]}")
else
  files=$(git ls-files -- . "${exclude[@]}")
fi
[[ -z "$files" ]] && exit 0

found=0

# 検査対象の内容を grep する。staged モードではインデックス上の内容を見る。
scan() { # $1: grep のオプション, $2: パターン, $3: 見出し
  local hits
  if [[ "$mode" == "staged" ]]; then
    hits=$(git grep --cached -n -I $1 -e "$2" -- $files || true)
  else
    hits=$(git grep -n -I $1 -e "$2" -- $files || true)
  fi
  if [[ -n "$hits" ]]; then
    echo "✖ $3"
    echo "$hits" | sed 's/^/    /'
    found=1
  fi
}

if [[ -f "$terms_file" ]]; then
  while IFS= read -r term || [[ -n "$term" ]]; do
    term="${term%%#*}"                       # コメントを除く
    term="$(echo "$term" | xargs)"           # 前後の空白を除く
    [[ -z "$term" ]] && continue
    scan "-i -F" "$term" "禁止語「${term}」が含まれています"
  done < "$terms_file"
else
  echo "⚠ $terms_file がありません。.confidential-terms.example をコピーして、取り込み元の固有名を書いてください。" >&2
fi

scan "-E" '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' "メールアドレスが含まれています"
scan "-E" '(/Users/|/home/|[A-Za-z]:\\Users\\)[A-Za-z0-9._-]+' "ユーザー名を含む絶対パスが含まれています"

if [[ "$found" -ne 0 ]]; then
  echo
  echo "案件固有の情報は {prefix} などに置き換えてください。誤検知のときはユーザーに確認してから対応してください。"
  exit 1
fi
