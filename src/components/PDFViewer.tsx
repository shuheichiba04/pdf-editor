import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PDFViewerProps {
  file: File | null;
  currentPage?: number; // 外部から制御されるページ番号（1-based）
  onPageChange?: (pageNumber: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, currentPage: externalPage, onPageChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalPage, setInternalPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  // 外部から制御される場合はそれを使用、そうでなければ内部状態を使用
  const currentPage = externalPage !== undefined ? externalPage : internalPage;

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      // ページをリセットしない
    };

    loadPDF();
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      // ページが変更されたことを親コンポーネントに通知
      if (onPageChange) {
        onPageChange(currentPage);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, onPageChange]);

  if (!file) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>PDFファイルを選択してください</div>;
  }

  const handlePageChange = (newPage: number) => {
    if (externalPage !== undefined) {
      // 外部制御の場合は親コンポーネントに通知
      if (onPageChange) {
        onPageChange(newPage);
      }
    } else {
      // 内部制御の場合は内部状態を更新
      setInternalPage(newPage);
      if (onPageChange) {
        onPageChange(newPage);
      }
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', border: '1px solid #ddd' }} />
      {totalPages > 0 && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            前のページ
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            style={{ marginLeft: '10px', padding: '8px 16px' }}
          >
            次のページ
          </button>
        </div>
      )}
    </div>
  );
};
