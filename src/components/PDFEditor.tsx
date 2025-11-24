import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { PDFViewer } from './PDFViewer';
import { ImagePositioner } from './ImagePositioner';
import { TextPositioner } from './TextPositioner';
import { mergePDFs, downloadPDF, addImageToPDF, addTextToPDF } from '../utils/pdfUtils';

export const PDFEditor: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [editedPdfBytes, setEditedPdfBytes] = useState<Uint8Array | null>(null); // 編集中のPDFバイト列
  const [showImagePositioner, setShowImagePositioner] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showTextPositioner, setShowTextPositioner] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    if (files.length > 0 && !currentFile) {
      setCurrentFile(files[0]);
    }
  };

  const handleMergePDFs = async () => {
    if (selectedFiles.length < 2) {
      alert('結合するには2つ以上のPDFファイルが必要です');
      return;
    }

    try {
      const mergedPdfBytes = await mergePDFs(selectedFiles);

      // 編集結果をステートに保存（ダウンロードはしない）
      setEditedPdfBytes(mergedPdfBytes);

      // 結合後のPDFを新しいFileオブジェクトとして設定
      const mergedFile = new File([new Uint8Array(mergedPdfBytes)], 'merged.pdf', { type: 'application/pdf' });
      setCurrentFile(mergedFile);

      // selectedFilesを結合後のファイルに置き換え
      setSelectedFiles([mergedFile]);

      // ページインデックスをリセット
      setCurrentPageIndex(0);

      alert('PDFの結合が完了しました（エクスポートボタンでダウンロードできます）');
    } catch (error) {
      console.error('PDF結合エラー:', error);
      alert('PDF結合に失敗しました');
    }
  };

  const handleAddImage = async () => {
    if (!currentFile) {
      alert('PDFファイルを選択してください');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg';
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const imageFile = target.files?.[0];
      if (!imageFile) return;

      setSelectedImage(imageFile);
      setShowImagePositioner(true);
    };
    input.click();
  };

  const handleImagePositionConfirm = async (x: number, y: number, width: number, height: number) => {
    if (!currentFile || !selectedImage) return;

    try {
      // 編集中のPDFがあればそれを使用、なければ元ファイルを使用
      const sourceFile = editedPdfBytes
        ? new File([new Uint8Array(editedPdfBytes)], currentFile.name, { type: 'application/pdf' })
        : currentFile;

      const pdfWithImage = await addImageToPDF(
        sourceFile,
        selectedImage,
        currentPageIndex,
        x,
        y,
        width,
        height
      );

      // 編集結果をステートに保存（ダウンロードはしない）
      setEditedPdfBytes(pdfWithImage);
      alert('画像の追加が完了しました');
      setShowImagePositioner(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('画像追加エラー:', error);
      alert('画像の追加に失敗しました');
    }
  };

  const handleImagePositionCancel = () => {
    setShowImagePositioner(false);
    setSelectedImage(null);
  };

  const handleAddText = () => {
    if (!currentFile) {
      alert('PDFファイルを選択してください');
      return;
    }
    setShowTextPositioner(true);
  };

  const handleTextPositionConfirm = async (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: { r: number; g: number; b: number },
    fontFamily: string
  ) => {
    if (!currentFile) return;

    try {
      // 編集中のPDFがあればそれを使用、なければ元ファイルを使用
      const sourceFile = editedPdfBytes
        ? new File([new Uint8Array(editedPdfBytes)], currentFile.name, { type: 'application/pdf' })
        : currentFile;

      const pdfWithText = await addTextToPDF(
        sourceFile,
        text,
        currentPageIndex,
        x,
        y,
        fontSize,
        color,
        fontFamily
      );

      // 編集結果をステートに保存（ダウンロードはしない）
      setEditedPdfBytes(pdfWithText);
      alert('テキストの追加が完了しました');
      setShowTextPositioner(false);
    } catch (error) {
      console.error('テキスト追加エラー:', error);
      alert('テキストの追加に失敗しました');
    }
  };

  const handleTextPositionCancel = () => {
    setShowTextPositioner(false);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (currentFile === selectedFiles[index]) {
      setCurrentFile(newFiles[0] || null);
      setEditedPdfBytes(null); // 編集中のPDFもリセット
    }
  };

  const handleExportPDF = () => {
    if (!editedPdfBytes) {
      alert('編集内容がありません');
      return;
    }
    downloadPDF(editedPdfBytes, 'edited.pdf');
    alert('PDFのエクスポートが完了しました');
  };

  const handleResetEdits = () => {
    if (!editedPdfBytes) return;
    if (confirm('編集内容をリセットしますか？')) {
      setEditedPdfBytes(null);
      setCurrentPageIndex(0);
    }
  };

  // プレビュー用のファイル: 編集中のPDFがあればそれを使用、なければ元ファイル
  const previewFile = editedPdfBytes && currentFile
    ? new File([new Uint8Array(editedPdfBytes)], currentFile.name, { type: 'application/pdf' })
    : currentFile;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          📄 Vibe coded PDF Editor
        </h1>
        <p className="app-subtitle">PDFの結合・画像追加・テキスト追加が簡単にできます</p>
      </header>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <FileUploader onFilesSelected={handleFilesSelected} />
        </div>

        {selectedFiles.length > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📁 読み込み済みファイル <span className="badge">{selectedFiles.length}</span>
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    padding: '0.75rem 1rem',
                    border: `2px solid ${currentFile === file ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: currentFile === file ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setCurrentFile(file)}
                >
                  <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{file.name}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="btn-danger"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    🗑️ 削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleMergePDFs}
              disabled={selectedFiles.length < 2}
              className="btn"
            >
              🔗 PDFを結合
            </button>
            <button
              onClick={handleAddImage}
              disabled={!currentFile}
              className="btn"
            >
              🖼️ 画像を追加
            </button>
            <button
              onClick={handleAddText}
              disabled={!currentFile}
              className="btn"
            >
              ✏️ テキストを追加
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!editedPdfBytes}
              className="btn-success"
            >
              💾 エクスポート
            </button>
            <button
              onClick={handleResetEdits}
              disabled={!editedPdfBytes}
              className="btn-danger"
            >
              🔄 リセット
            </button>
          </div>
        </div>

        {editedPdfBytes && (
          <div className="card" style={{
            marginBottom: '1.5rem',
            background: 'var(--color-success-light)',
            border: '2px solid var(--color-success)',
            color: 'var(--color-success-dark)'
          }}>
            ✅ 編集中: 変更が保存されています（エクスポートボタンでダウンロードできます）
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>
            プレビュー
          </h3>
          <PDFViewer
            file={previewFile}
            currentPage={currentPageIndex + 1}
            onPageChange={(pageNumber) => setCurrentPageIndex(pageNumber - 1)}
          />
        </div>
      </div>

      {showImagePositioner && previewFile && selectedImage && (
        <ImagePositioner
          pdfFile={previewFile}
          imageFile={selectedImage}
          pageIndex={currentPageIndex}
          onConfirm={handleImagePositionConfirm}
          onCancel={handleImagePositionCancel}
        />
      )}

      {showTextPositioner && previewFile && (
        <TextPositioner
          pdfFile={previewFile}
          pageIndex={currentPageIndex}
          onConfirm={handleTextPositionConfirm}
          onCancel={handleTextPositionCancel}
        />
      )}
    </div>
  );
};
