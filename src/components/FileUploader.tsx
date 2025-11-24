import React from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFilesSelected,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: '2px dashed #0087F7',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#e3f2fd' : '#f5f5f5',
        transition: 'background-color 0.3s',
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>ファイルをここにドロップ...</p>
      ) : (
        <div>
          <p>PDFファイルをドラッグ&ドロップ、またはクリックして選択</p>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            {multiple ? '複数ファイル選択可能' : '単一ファイルのみ'}
          </p>
        </div>
      )}
    </div>
  );
};
