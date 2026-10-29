# agent-skills

これまでの制作物で得た作業手順・ルール・知見を Claude Code のプラグイン・スキルとしてまとめ、今後のプロジェクトで使い回すためのリポジトリ。
リポジトリを1つずつ指定して、そこから知見を取り込んでいく。取り込みの手順は `.claude/skills/import-knowledge/SKILL.md` にある。

## 方針

### 構成

- プラグインのマーケットプレイスとして構成する。マーケットプレイス名は `asamiile`（`.claude-plugin/marketplace.json`）
- 性質ごとにプラグインを分ける。スキルは作業の手順の単位にする（1スキル＝1手順）

| プラグイン | 性質 |
| --- | --- |
| `core` | 性質に関係なく使う |
| `visual-webgl` | WebGL・Canvas のビジュアル制作 |
| `motion-graphics` | Remotion などの動画制作 |
| `web-modern` | モダン Web 開発 |

```text
.claude-plugin/marketplace.json   マーケットプレイスの定義
plugins/<プラグイン>/
  .claude-plugin/plugin.json      プラグインの定義
  skills/<スキル名>/SKILL.md       手順
  skills/<スキル名>/references/    教訓・判断の記録、道具ごとの方法
templates/<プラグイン>/            AGENTS.md の雛形、土台のコード
IMPORTS.md                        取り込みの記録
```

### 置き場所の決め方

- 迷ったら「別の性質のリポジトリでも役に立つか」で判断する。最初は性質別のプラグインに置き、2つ目の性質で必要になったら `core` に移す
- 手順は共通で道具だけが違うものは、手順を `core` のスキルに、道具ごとの方法を各プラグインの `references/` に置く
- 種類ごとの置き場所

| 種類 | 置き場所 |
| --- | --- |
| 手順 | スキル（`SKILL.md`） |
| 常に守らせるルール・構成 | `templates/` の AGENTS.md の雛形 |
| 土台のコード | `templates/` |
| 教訓・判断の記録 | スキルの `references/` |

### スキルの書き方

- 公式ドキュメントの最新の仕様に従う。推測で書かない
- `description` には「何をするか」と「いつ使うか」を書き、主な用途を先頭に置く。ユーザーが実際に言いそうな言い回しを入れる（`when_to_use` と合わせて 1,536 文字で切られる）
- `SKILL.md` は 500 行未満にする。詳しい内容は `references/` に分け、本文からリンクする
- 変更したら `claude plugin validate .` と `claude plugin validate plugins/<プラグイン>` を通す

### 取り込みの記録

- どのリポジトリから何を取り込んだかを `IMPORTS.md` に残す
- 取り込み元は、案件名・クライアント名が分からない呼び名で書く

## 守ること

- リポジトリは公開しない。GitHub に置く場合は private にする。push する前にユーザーに確認する
- 案件固有の情報を持ち込まない。クライアント名（カナ・英字とも）・提供素材・デザインの数値・案件固有のクラス名などは `{prefix}` などに置き換える
- 元のリポジトリからは、汎用化した知見だけを取り出す。ファイルをそのままコピーしない
- 外部のライブラリを追加する前と、コミットする前にユーザーに確認する
- 迷う点は推測で進めずにユーザーに確認する

### 守秘情報の検査

案件固有の情報が紛れ込まないように、次の仕組みを使う。

- `.confidential-terms`：取り込み元の固有名（クライアント名・案件名・接頭辞など）を書く禁止語リスト。`.gitignore` 済みで、コミットしない。雛形は `.confidential-terms.example`
- `scripts/check-confidential.sh`：禁止語・メールアドレス・ユーザー名を含む絶対パスを検査する。`--all` で追跡中の全ファイルを検査する
- `.githooks/pre-commit`：コミットのたびに上の検査を実行する。clone したら `git config core.hooksPath .githooks` を実行して有効にする
- 検査で見つかったものは、`--no-verify` で回避せず、置き換えるかユーザーに確認する
- 取り込み元を読む前に `.confidential-terms` を更新する（手順は `import-knowledge` スキル）
