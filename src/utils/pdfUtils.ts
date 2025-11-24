import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.jsのworkerを設定
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * PDFファイルからサムネイルを生成
 */
export async function generateThumbnails(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const thumbnails: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 0.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    thumbnails.push(canvas.toDataURL());
  }

  return thumbnails;
}

/**
 * 複数のPDFを結合
 */
export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * PDFのページを並び替え
 */
export async function reorderPages(file: File, pageOrder: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  const pages = await newPdf.copyPages(pdf, pageOrder);
  pages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * PDFに画像を追加
 */
export async function addImageToPDF(
  pdfFile: File,
  imageFile: File,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const imageArrayBuffer = await imageFile.arrayBuffer();
  const imageType = imageFile.type;

  let image;
  if (imageType === 'image/png') {
    image = await pdfDoc.embedPng(imageArrayBuffer);
  } else if (imageType === 'image/jpeg' || imageType === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageArrayBuffer);
  } else {
    throw new Error('Unsupported image type. Use PNG or JPEG.');
  }

  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];

  page.drawImage(image, {
    x,
    y,
    width,
    height,
  });

  return await pdfDoc.save();
}

/**
 * PDFにテキストを追加
 */
export async function addTextToPDF(
  pdfFile: File,
  text: string,
  pageIndex: number,
  x: number,
  y: number,
  fontSize: number,
  color: { r: number; g: number; b: number },
  fontFamily: string = 'NotoSansJP-Regular.ttf'
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // fontkitを登録（カスタムフォントを埋め込むために必要）
  pdfDoc.registerFontkit(fontkit);

  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];

  // 日本語フォントを読み込み
  let font;
  try {
    // 選択されたフォントを読み込み
    const fontUrl = `/${fontFamily}`;
    console.log('フォントを読み込み中:', fontUrl);

    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      throw new Error(`フォントの読み込みに失敗: ${fontResponse.status}`);
    }

    const fontBytes = await fontResponse.arrayBuffer();
    console.log('フォントサイズ:', fontBytes.byteLength, 'bytes');

    font = await pdfDoc.embedFont(fontBytes);
    console.log('日本語フォントの読み込みに成功');
  } catch (error) {
    console.error('日本語フォントの読み込みに失敗:', error);
    throw new Error(`日本語フォントの読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }

  // 複数行のテキストを処理
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.2;

  lines.forEach((line, index) => {
    if (line.trim()) { // 空行をスキップ
      page.drawText(line, {
        x,
        y: y - (index * lineHeight),
        size: fontSize,
        font,
        color: rgb(color.r / 255, color.g / 255, color.b / 255),
      });
    }
  });

  return await pdfDoc.save();
}

/**
 * PDFをダウンロード
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
