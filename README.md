# agent-skills

制作で得た作業手順・ルール・知見をまとめた、Claude Code のプラグインのマーケットプレイス `asamiile`。

方針とルールは [AGENTS.md](AGENTS.md)、取り込みの記録は [IMPORTS.md](IMPORTS.md) を参照。

## 導入方法

### ローカルのパスから

```bash
claude plugin marketplace add /path/to/agent-skills
claude plugin install core@asamiile
claude plugin install visual-webgl@asamiile     # 必要なものだけ
claude plugin install motion-graphics@asamiile
claude plugin install web-modern@asamiile
```

ローカルのパスから追加した場合、スキルはこのディレクトリから直接読まれる。編集は次のセッションの開始時か、セッション内で `/reload-plugins` を実行したときに反映される。

### GitHub（private）から

```bash
claude plugin marketplace add <owner>/agent-skills
claude plugin install core@asamiile
```

### 確認・削除

```bash
claude plugin list                            # 導入済みのプラグイン
claude plugin details core                    # プラグインのスキル一覧
claude plugin marketplace remove asamiile     # マーケットプレイスとそのプラグインを削除
```

スキルは `/<プラグイン>:<スキル名>` で呼び出せる。Claude が説明文から判断して自動で使うこともある。

## プラグインとスキルの一覧

| プラグイン | 性質 | スキル |
| --- | --- | --- |
| `core` | 性質に関係なく使う | （まだなし） |
| `visual-webgl` | WebGL・Canvas のビジュアル制作 | （まだなし） |
| `motion-graphics` | Remotion などの動画制作 | （まだなし） |
| `web-modern` | モダン Web 開発 | （まだなし） |

## このリポジトリで作業するとき

clone したら、守秘情報の検査を有効にする。

```bash
git config core.hooksPath .githooks
cp .confidential-terms.example .confidential-terms   # 禁止語を書く（コミットされない）
```

知見の取り込みは、このリポジトリで Claude Code を開き、`/import-knowledge <取り込み元のパス>` を実行する。

変更したら検証する。

```bash
claude plugin validate .
claude plugin validate plugins/<プラグイン>
scripts/check-confidential.sh --all
```
