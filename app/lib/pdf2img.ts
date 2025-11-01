export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
  if (typeof window === 'undefined') {
    return {
      imageUrl: '',
      file: null,
      error: 'PDF conversion only available in browser'
    };
  }

  try {
    console.log("🔄 Starting PDF conversion (no worker):", file.name);

    // Import the specific build that works without workers
    const { default: pdfjsLib } = await import('pdfjs-dist/build/pdf.min.js');

    // Disable worker completely to avoid version issues
    // This will be slower for large PDFs but more reliable
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log("✅ PDF document loaded, pages:", pdf.numPages);

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) throw new Error('Could not create canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    return new Promise<PdfConversionResult>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const imageFile = new File([blob], `${file.name.replace(/\.pdf$/i, '')}.png`, { type: 'image/png' });
          resolve({
            imageUrl: URL.createObjectURL(blob),
            file: imageFile,
          });
        } else {
          resolve({ imageUrl: "", file: null, error: "Failed to create image blob" });
        }
      }, 'image/png', 0.9);
    });

  } catch (error) {
    console.error('PDF conversion error:', error);
    return {
      imageUrl: '',
      file: null,
      error: error instanceof Error ? error.message : 'Failed to convert PDF to image'
    };
  }
}