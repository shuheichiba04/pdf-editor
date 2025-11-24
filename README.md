# Vibe Coded PDF-Editor

個人利用向けのWebベースPDFエディタです。

## 機能

- ✅ **PDFファイルの読み込み・プレビュー** - ドラッグ&ドロップ対応
- ✅ **複数PDFの結合** - 2つ以上のPDFを1つに結合
- ✅ **画像の追加** - PNG/JPEG画像をPDFに追加
  - 位置・サイズをスライダーで直感的に調整
  - 倍率指定（10%〜300%）またはピクセル指定
- ✅ **テキストの追加** - 日本語テキストをPDFに追加
  - 3種類のフォント対応（ゴシック体・明朝体・丸ゴシック体）
  - フォントサイズ・色・位置を自由に調整
  - 複数行テキスト対応
- ✅ **複数操作のバッチ編集** - 複数の編集操作を行ってから一括エクスポート
  - 編集内容はリアルタイムでプレビューに反映
  - 編集リセット機能
- ✅ **ページナビゲーション** - 複数ページPDFのページ切り替え
  - 編集後もページ位置を保持

## 技術スタック

- **フレームワーク**: React + TypeScript
- **ビルドツール**: Vite
- **PDFライブラリ**:
  - `pdf-lib`: PDF編集・結合・テキスト追加
  - `@pdf-lib/fontkit`: 日本語フォント埋め込み
  - `pdfjs-dist`: PDF表示・レンダリング
- **UI/UX**:
  - `react-dropzone`: ファイルアップロード

## セットアップ

### 初回セットアップ（Node.jsのインストールから）

1. **Node.jsのインストール**
   - [Node.js公式サイト](https://nodejs.org/)から最新のLTS版をダウンロードしてインストール
   - インストール確認（ターミナルで以下を実行）:
     ```bash
     node --version
     npm --version
     ```

2. **プロジェクトフォルダの準備**
   - このフォルダ（`pdf-editor`）をお好きな場所に配置

3. **依存関係のインストール**
   - ターミナル（またはコマンドプロンプト）でプロジェクトフォルダに移動:
     ```bash
     cd /path/to/pdf-editor
     ```
   - 依存パッケージをインストール:
     ```bash
     npm install
     ```
   - 初回は数分かかる場合があります

4. **フォントファイルの確認**
   - `public/` ディレクトリに以下のフォントファイルがあることを確認:
     - `NotoSansJP-Regular.ttf`
     - `NotoSerifJP-Regular.ttf`
     - `MPLUSRounded1c-Regular.ttf`
   - ない場合は、後述の「フォント管理」セクションを参照してダウンロード

5. **アプリケーションの起動**
   ```bash
   npm run dev
   ```
   - ブラウザが自動で開かない場合は、表示されたURL（通常 `http://localhost:5173`）をブラウザで開く

### 2回目以降の起動

プロジェクトフォルダで以下のコマンドを実行するだけ:
```bash
npm run dev
```

### ビルド（配布用）

本番環境用にビルドする場合:
```bash
npm run build
```
- `dist/` フォルダに静的ファイルが生成されます

## 使い方

1. **アプリケーションを開く**
   - ブラウザで http://localhost:5173 を開く

2. **PDFファイルの読み込み**
   - PDFファイルをドラッグ&ドロップまたはクリックして選択
   - 複数ファイルを読み込み可能（リストから切り替え可能）

3. **編集機能を使用**
   - **PDF結合**: 複数ファイルを選択して「PDFを結合」→ 即座にダウンロード
   - **画像追加**:
     1. 「画像を追加」をクリック
     2. 画像ファイル（PNG/JPEG）を選択
     3. 位置・サイズをスライダーで調整
     4. 「確定」をクリック
   - **テキスト追加**:
     1. 「テキストを追加」をクリック
     2. テキスト内容を入力
     3. フォント・サイズ・色・位置を調整
     4. 「確定」をクリック

4. **編集結果の確認とエクスポート**
   - 編集を行うと、プレビューに即座に反映されます
   - 緑色のバナー「✅ 編集中」が表示されます
   - **複数の編集操作を続けて実行可能**（画像追加→テキスト追加など）
   - 編集完了後、「**編集済みPDFをエクスポート**」ボタンでダウンロード
   - やり直したい場合は「**編集をリセット**」ボタンで元に戻す

5. **ページナビゲーション**
   - 複数ページのPDFは「前のページ」「次のページ」ボタンで切り替え
   - 画像・テキスト追加は現在表示中のページに反映されます

## プロジェクト構造

```
pdf-editor/
├── public/                      # 静的ファイル
│   ├── NotoSansJP-Regular.ttf   # ゴシック体フォント
│   ├── NotoSerifJP-Regular.ttf  # 明朝体フォント
│   └── MPLUSRounded1c-Regular.ttf # 丸ゴシック体フォント
├── src/
│   ├── components/              # Reactコンポーネント
│   │   ├── FileUploader.tsx     # ファイルアップロード
│   │   ├── PDFViewer.tsx        # PDFプレビュー表示
│   │   ├── PDFEditor.tsx        # メインエディタ
│   │   ├── ImagePositioner.tsx  # 画像位置調整
│   │   └── TextPositioner.tsx   # テキスト位置調整
│   ├── utils/
│   │   └── pdfUtils.ts          # PDF操作関数
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## フォント管理

### フォントファイルの格納場所

日本語フォントは `public/` ディレクトリに配置されています:
- `public/NotoSansJP-Regular.ttf` - ゴシック体
- `public/NotoSerifJP-Regular.ttf` - 明朝体
- `public/MPLUSRounded1c-Regular.ttf` - 丸ゴシック体

### 新しいフォントの追加方法

1. **フォントファイルの準備**
   - TTFまたはOTFフォーマットのフォントファイルを用意
   - Google Fontsなどから日本語対応フォントをダウンロード可能

2. **フォントファイルの配置**
   ```bash
   # publicディレクトリにコピー
   cp /path/to/your-font.ttf public/YourFont-Regular.ttf
   ```

3. **コードの更新**
   - `src/components/TextPositioner.tsx` の選択肢に追加:
   ```tsx
   <option value="YourFont-Regular.ttf">あなたのフォント名</option>
   ```

4. **動作確認**
   ```bash
   npm run dev
   ```
   ブラウザでテキスト追加機能を試し、新しいフォントが選択できることを確認

### フォントファイルのダウンロード例

```bash
# Google Fontsから直接ダウンロード（例：Noto Sans JP）
cd public
curl -L "https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf" -o NotoSansJP-Regular.ttf
```

## ライセンス

すべてオープンソースライブラリを使用しています。

### 使用フォント
- **Noto Sans JP** / **Noto Serif JP**: [SIL Open Font License](https://scripts.sil.org/OFL)
- **M PLUS Rounded 1c**: [SIL Open Font License](https://scripts.sil.org/OFL)
