export async function processImageFile(
  file: File,
  size = 64,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };

    reader.onerror = reject;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject();

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      const dataUrl = canvas.toDataURL('image/webp', quality);
      resolve(dataUrl);
    };

    img.onerror = reject;

    reader.readAsDataURL(file);
  });
}
