export const DEFAULT_FILTERS = { brightness: 100, contrast: 100, grayscale: 0, blur: 0, saturation: 100, sharpness: 0 };
export const MAX_PIXELS = 16_000_000;

export function validateDimensions(width, height) {
  return Number.isInteger(width) && Number.isInteger(height) && width >= 1 && height >= 1 && width <= 8192 && height <= 8192 && width * height <= MAX_PIXELS;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지를 읽지 못했습니다. 다른 파일을 선택해 주세요.'));
    image.src = src;
  });
}

export async function readImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('PNG, JPG, WebP 이미지를 선택해 주세요.');
  if (file.size > 30 * 1024 * 1024) throw new Error('파일은 30MB 이하로 선택해 주세요.');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (!validateDimensions(image.naturalWidth, image.naturalHeight)) throw new Error('이미지는 한 변 8,192px, 총 1,600만 픽셀 이하로 선택해 주세요.');
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export function sharpenPixels(data, width, height, amount) {
  const source = new Uint8ClampedArray(data);
  const strength = amount / 100;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        data[i + c] = source[i + c] * (1 + 4 * strength) - strength * (source[i - 4 + c] + source[i + 4 + c] + source[i - width * 4 + c] + source[i + width * 4 + c]);
      }
    }
  }
  return data;
}

export function prepareImage(image, width, height, filters, fit = 'contain') {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: filters.sharpness > 0 });
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
  if (!image) return canvas;
  const scale = fit === 'cover' ? Math.max(width / image.width, height / image.height) : Math.min(width / image.width, height / image.height);
  const w = fit === 'stretch' ? width : image.width * scale;
  const h = fit === 'stretch' ? height : image.height * scale;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation ?? 100}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)`;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  ctx.filter = 'none';
  if (filters.sharpness > 0) {
    const pixels = ctx.getImageData(0, 0, width, height);
    sharpenPixels(pixels.data, width, height, filters.sharpness);
    ctx.putImageData(pixels, 0, 0);
  }
  return canvas;
}

export function downloadBlob(blob, filename) {
  if (!blob) throw new Error('파일을 만들지 못했습니다. 이미지 크기를 줄여 다시 시도해 주세요.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function textLayout(ctx, layer, canvasWidth) {
  ctx.font = `${layer.fontWeight || 400} ${layer.size}px ${layer.fontFamily || 'sans-serif'}`;
  ctx.letterSpacing = `${layer.letterSpacing || 0}px`;
  const lines = [];
  const maxWidth = Math.max(layer.size, layer.textWidth || (canvasWidth - layer.x - 20));
  for (const paragraph of layer.text.split('\n')) {
    let line = '';
    for (const char of Array.from(paragraph)) {
      if (line && ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = char; }
      else line += char;
    }
    lines.push(line);
  }
  return { lines, width: Math.max(1, ...lines.map(line => ctx.measureText(line).width)), height: lines.length * layer.size * (layer.lineHeight || 1.4) };
}
