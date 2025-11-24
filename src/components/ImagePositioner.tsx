import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface ImagePositionerProps {
  pdfFile: File;
  imageFile: File;
  pageIndex: number;
  onConfirm: (x: number, y: number, width: number, height: number) => void;
  onCancel: () => void;
}

export const ImagePositioner: React.FC<ImagePositionerProps> = ({
  pdfFile,
  imageFile,
  pageIndex,
  onConfirm,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 });
  const [pdfPageSize, setPdfPageSize] = useState({ width: 0, height: 0 });
  const [pdfImageUrl, setPdfImageUrl] = useState<string>('');
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale] = useState(100); // 画像の倍率（パーセント）

  useEffect(() => {
    const loadImage = async () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setImageNaturalSize({ width: img.width, height: img.height });
          setImageSize({ width: img.width, height: img.height });
        };
        img.src = result;
      };
      reader.readAsDataURL(imageFile);
    };

    loadImage();
  }, [imageFile]);

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
    // 入力された座標とサイズをそのまま使用
    onConfirm(imagePosition.x, imagePosition.y, imageSize.width, imageSize.height);
  };

  const handleResetSize = () => {
    setImageSize({ width: imageNaturalSize.width, height: imageNaturalSize.height });
    setImageScale(100);
  };

  // 倍率変更時に画像サイズを更新
  const handleScaleChange = (newScale: number) => {
    setImageScale(newScale);
    const newWidth = (imageNaturalSize.width * newScale) / 100;
    const newHeight = (imageNaturalSize.height * newScale) / 100;
    setImageSize({ width: newWidth, height: newHeight });
  };

  // 画像サイズ直接変更時に倍率を更新
  const handleSizeChange = (width: number, height: number) => {
    setImageSize({ width, height });
    // アスペクト比を保った倍率を計算
    const scaleFromWidth = (width / imageNaturalSize.width) * 100;
    setImageScale(Math.round(scaleFromWidth));
  };

  // PDF座標をCanvas座標に変換（Y軸反転）
  const getCanvasY = (pdfY: number) => {
    return pdfPageSize.height - pdfY - imageSize.height;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '900px', maxHeight: '90%', overflow: 'auto' }}>
        <h3>画像の位置とサイズを調整</h3>
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

              {/* 画像位置のオーバーレイ（SVG） */}
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
                    {/* 画像位置の矩形 */}
                    <rect
                      x={imagePosition.x}
                      y={imagePosition.y}
                      width={imageSize.width}
                      height={imageSize.height}
                      fill="rgba(0, 135, 247, 0.3)"
                      stroke="#0087F7"
                      strokeWidth="2"
                    />
                    {/* 座標ラベル */}
                    <text
                      x={imagePosition.x + 5}
                      y={imagePosition.y + imageSize.height - 5}
                      fill="#0087F7"
                      fontSize="12"
                      fontWeight="bold"
                      transform={`scale(1, -1) translate(0, ${-2 * (imagePosition.y + imageSize.height - 5)})`}
                    >
                      ({Math.round(imagePosition.x)}, {Math.round(imagePosition.y)})
                    </text>
                  </g>
                </svg>
              )}
            </div>
          ) : (
            <div style={{ padding: '40px', color: '#999' }}>読み込み中...</div>
          )}
        </div>

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
                value={Math.round(imagePosition.x)}
                onChange={(e) => setImagePosition({ ...imagePosition, x: parseInt(e.target.value) || 0 })}
                style={{ padding: '5px', width: '100px' }}
              />
              <span>pt</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, pdfPageSize.width - imageSize.width)}
              value={imagePosition.x}
              onChange={(e) => setImagePosition({ ...imagePosition, x: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ minWidth: '80px' }}>Y座標 (下):</label>
              <input
                type="number"
                value={Math.round(imagePosition.y)}
                onChange={(e) => setImagePosition({ ...imagePosition, y: parseInt(e.target.value) || 0 })}
                style={{ padding: '5px', width: '100px' }}
              />
              <span>pt</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, pdfPageSize.height - imageSize.height)}
              value={imagePosition.y}
              onChange={(e) => setImagePosition({ ...imagePosition, y: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4>サイズ調整</h4>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ minWidth: '80px' }}>倍率:</label>
              <input
                type="number"
                value={Math.round(imageScale)}
                onChange={(e) => handleScaleChange(parseInt(e.target.value) || 100)}
                style={{ padding: '5px', width: '100px' }}
              />
              <span>%</span>
            </div>
            <input
              type="range"
              min={10}
              max={300}
              step={5}
              value={imageScale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ minWidth: '80px' }}>幅:</label>
            <input
              type="number"
              value={Math.round(imageSize.width)}
              onChange={(e) => handleSizeChange(parseInt(e.target.value) || 0, (parseInt(e.target.value) || 0) * (imageNaturalSize.height / imageNaturalSize.width))}
              style={{ padding: '5px', width: '100px' }}
            />
            <span>pt</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ minWidth: '80px' }}>高さ:</label>
            <input
              type="number"
              value={Math.round(imageSize.height)}
              onChange={(e) => handleSizeChange((parseInt(e.target.value) || 0) * (imageNaturalSize.width / imageNaturalSize.height), parseInt(e.target.value) || 0)}
              style={{ padding: '5px', width: '100px' }}
            />
            <span>pt</span>
          </div>
          <button onClick={handleResetSize} style={{ padding: '8px 16px', marginRight: '10px' }}>
            元のサイズに戻す (100%)
          </button>
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
