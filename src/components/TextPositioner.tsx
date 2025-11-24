import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface TextPositionerProps {
  pdfFile: File;
  pageIndex: number;
  onConfirm: (text: string, x: number, y: number, fontSize: number, color: { r: number; g: number; b: number }, fontFamily: string) => void;
  onCancel: () => void;
}

export const TextPositioner: React.FC<TextPositionerProps> = ({
  pdfFile,
  pageIndex,
  onConfirm,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('サンプルテキスト');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState({ r: 0, g: 0, b: 0 });
  const [fontFamily, setFontFamily] = useState('NotoSansJP-Regular.ttf');
  const [pdfPageSize, setPdfPageSize] = useState({ width: 0, height: 0 });
  const [pdfImageUrl, setPdfImageUrl] = useState<string>('');
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const loadAndRenderPDF = async () => {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageIndex + 1);

      const viewport = page.getViewport({ scale: 1 });
      setPdfPageSize({ width: viewport.width, height: viewport.height });

      // プレビュー用にスケール調整
      const displayScale = Math.min(400 / viewport.width, 500 / viewport.height);
      const scaledViewport = page.getViewport({ scale: displayScale });

      setDisplaySize({ width: scaledViewport.width, height: scaledViewport.height });

      // Canvas を使って PDF を画像に変換
      const canvas = document.createElement('canvas');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const context = canvas.getContext('2d');
      if (!context) return;

      await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

      // Canvas を画像 URL に変換
      const imageUrl = canvas.toDataURL();
      setPdfImageUrl(imageUrl);
    };

    loadAndRenderPDF();

    // クリーンアップ
    return () => {
      if (pdfImageUrl) {
        URL.revokeObjectURL(pdfImageUrl);
      }
    };
  }, [pdfFile, pageIndex]);

  const handleConfirm = () => {
    onConfirm(text, textPosition.x, textPosition.y, fontSize, textColor, fontFamily);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '900px', maxHeight: '90%', overflow: 'auto' }}>
        <h3>テキストの位置とスタイルを調整</h3>
        <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
          PDFページサイズ: {Math.round(pdfPageSize.width)} x {Math.round(pdfPageSize.height)} pt
        </p>

        {/* プレビュー表示 */}
        <div style={{ marginBottom: '20px' }}>
          <h4>プレビュー</h4>
          {pdfImageUrl ? (
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                display: 'inline-block',
                border: '2px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              {/* PDF画像 */}
              <img
                src={pdfImageUrl}
                alt="PDF Preview"
                style={{
                  display: 'block',
                  width: displaySize.width,
                  height: displaySize.height
                }}
              />

              {/* テキスト位置のオーバーレイ（SVG） */}
              {pdfPageSize.width > 0 && (
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                  viewBox={`0 0 ${pdfPageSize.width} ${pdfPageSize.height}`}
                >
                  {/* Y軸を反転して描画 */}
                  <g transform={`scale(1, -1) translate(0, -${pdfPageSize.height})`}>
                    {/* テキストプレビュー */}
                    <text
                      x={textPosition.x}
                      y={textPosition.y}
                      fontSize={fontSize}
                      fill={`rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`}
                      fontFamily="sans-serif"
                      transform={`scale(1, -1) translate(0, ${-2 * textPosition.y})`}
                    >
                      {text}
                    </text>
                    {/* 座標ラベル */}
                    <text
                      x={textPosition.x + 5}
                      y={textPosition.y - fontSize - 5}
                      fill="#0087F7"
                      fontSize="12"
                      fontWeight="bold"
                      transform={`scale(1, -1) translate(0, ${-2 * (textPosition.y - fontSize - 5)})`}
                    >
                      ({Math.round(textPosition.x)}, {Math.round(textPosition.y)})
                    </text>
                  </g>
                </svg>
              )}
            </div>
          ) : (
            <div style={{ padding: '40px', color: '#999' }}>読み込み中...</div>
          )}
        </div>

        {/* テキスト内容 */}
        <div style={{ marginBottom: '20px' }}>
          <h4>テキスト内容</h4>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px',
              fontSize: '14px',
              fontFamily: 'sans-serif',
              resize: 'vertical'
            }}
            placeholder="追加するテキストを入力..."
          />
        </div>

        {/* 位置設定 */}
        <div style={{ marginBottom: '20px' }}>
          <h4>位置設定 (PDF座標系)</h4>
          <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '10px' }}>
            ※PDFの座標は左下が原点(0,0)です
          </p>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ minWidth: '80px' }}>X座標 (左):</label>
              <input
                type="number"
                value={Math.round(textPosition.x)}
                onChange={(e) => setTextPosition({ ...textPosition, x: parseInt(e.target.value) || 0 })}
                style={{ padding: '5px', width: '100px' }}
              />
              <span>pt</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, pdfPageSize.width)}
              value={textPosition.x}
              onChange={(e) => setTextPosition({ ...textPosition, x: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ minWidth: '80px' }}>Y座標 (下):</label>
              <input
                type="number"
                value={Math.round(textPosition.y)}
                onChange={(e) => setTextPosition({ ...textPosition, y: parseInt(e.target.value) || 0 })}
                style={{ padding: '5px', width: '100px' }}
              />
              <span>pt</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, pdfPageSize.height)}
              value={textPosition.y}
              onChange={(e) => setTextPosition({ ...textPosition, y: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
        </div>

        {/* スタイル設定 */}
        <div style={{ marginBottom: '20px' }}>
          <h4>スタイル設定</h4>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ minWidth: '100px' }}>フォント:</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                style={{ padding: '8px', fontSize: '14px', flex: 1, maxWidth: '300px' }}
              >
                <option value="NotoSansJP-Regular.ttf">Noto Sans JP（ゴシック体）</option>
                <option value="NotoSerifJP-Regular.ttf">Noto Serif JP（明朝体）</option>
                <option value="MPLUSRounded1c-Regular.ttf">M PLUS Rounded 1c（丸ゴシック体）</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ minWidth: '100px' }}>フォントサイズ:</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                style={{ padding: '5px', width: '100px' }}
                min={8}
                max={72}
              />
              <span>pt</span>
            </div>
            <input
              type="range"
              min={8}
              max={72}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ minWidth: '100px' }}>テキスト色:</label>
            <input
              type="color"
              value={`#${textColor.r.toString(16).padStart(2, '0')}${textColor.g.toString(16).padStart(2, '0')}${textColor.b.toString(16).padStart(2, '0')}`}
              onChange={(e) => {
                const hex = e.target.value.substring(1);
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                setTextColor({ r, g, b });
              }}
              style={{ width: '60px', height: '40px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              RGB({textColor.r}, {textColor.g}, {textColor.b})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', backgroundColor: '#ccc' }}>
            キャンセル
          </button>
          <button onClick={handleConfirm} style={{ padding: '10px 20px' }}>
            確定
          </button>
        </div>
      </div>
    </div>
  );
};
