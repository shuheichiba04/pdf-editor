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
      downloadPDF(mergedPdfBytes, 'merged.pdf');
      alert('PDFの結合が完了しました');
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
        ? new File([editedPdfBytes], currentFile.name, { type: 'application/pdf' })
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
        ? new File([editedPdfBytes], currentFile.name, { type: 'application/pdf' })
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
    ? new File([editedPdfBytes], currentFile.name, { type: 'application/pdf' })
    : currentFile;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>PDFエディタ</h1>

      <div style={{ marginBottom: '20px' }}>
        <FileUploader onFilesSelected={handleFilesSelected} />
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>読み込み済みファイル ({selectedFiles.length})</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  border: currentFile === file ? '2px solid #0087F7' : '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: currentFile === file ? '#e3f2fd' : 'white',
                }}
                onClick={() => setCurrentFile(file)}
              >
                <div>{file.name}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  style={{ marginTop: '5px', padding: '4px 8px', fontSize: '0.8em' }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleMergePDFs}
          disabled={selectedFiles.length < 2}
          style={{ padding: '10px 20px', fontSize: '1em' }}
        >
          PDFを結合
        </button>
        <button
          onClick={handleAddImage}
          disabled={!currentFile}
          style={{ padding: '10px 20px', fontSize: '1em' }}
        >
          画像を追加
        </button>
        <button
          onClick={handleAddText}
          disabled={!currentFile}
          style={{ padding: '10px 20px', fontSize: '1em' }}
        >
          テキストを追加
        </button>
        <button
          onClick={handleExportPDF}
          disabled={!editedPdfBytes}
          style={{ padding: '10px 20px', fontSize: '1em', backgroundColor: editedPdfBytes ? '#28a745' : '#ccc' }}
        >
          編集済みPDFをエクスポート
        </button>
        <button
          onClick={handleResetEdits}
          disabled={!editedPdfBytes}
          style={{ padding: '10px 20px', fontSize: '1em', backgroundColor: editedPdfBytes ? '#dc3545' : '#ccc' }}
        >
          編集をリセット
        </button>
      </div>

      {editedPdfBytes && (
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', color: '#155724' }}>
          ✅ 編集中: 変更が保存されています（エクスポートボタンでダウンロードできます）
        </div>
      )}

      <div>
        <h3>プレビュー</h3>
        <PDFViewer
          file={previewFile}
          currentPage={currentPageIndex + 1}
          onPageChange={(pageNumber) => setCurrentPageIndex(pageNumber - 1)}
        />
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
