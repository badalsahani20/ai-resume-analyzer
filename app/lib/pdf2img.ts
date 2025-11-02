export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    console.log("🔄 Starting PDF conversion for:", file.name);

    // Import PDF.js
    const PDFJS = await import('pdfjs-dist');
    const pdfjsLib = PDFJS.default || PDFJS;
    
    // ⭐⭐ IMPORTANT: Use the local worker file you just copied ⭐⭐
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
    
    console.log("✅ PDF.js initialized with local worker");

    const arrayBuffer = await file.arrayBuffer();
    console.log("📄 PDF loaded into array buffer");

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    console.log("✅ PDF document loaded, pages:", pdf.numPages);

    const page = await pdf.getPage(1);
    console.log("✅ Page 1 loaded");

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Could not create canvas context");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    console.log("🎨 Rendering page to canvas...");
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    console.log("✅ Page rendered successfully");

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const imageFile = new File([blob], `${file.name.replace(/\.pdf$/i, '')}.png`, {
            type: "image/png",
          });
          
          console.log("✅ PDF converted to image successfully");
          resolve({
            imageUrl: URL.createObjectURL(blob),
            file: imageFile,
          });
        } else {
          resolve({
            imageUrl: "",
            file: null,
            error: "Failed to create image blob",
          });
        }
      }, "image/png", 0.9);
    });
  } catch (err) {
    console.error("PDF conversion error:", err);
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err}`,
    };
  }
}