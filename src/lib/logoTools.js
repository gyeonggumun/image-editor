import { validateDimensions } from './imageTools.js';

export function getLogoPlacement(imageWidth, imageHeight, width, height, padding = 10) {
  if (!validateDimensions(width, height) || !Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0 || !Number.isFinite(padding) || padding < 0 || padding > 40) {
    throw new Error('크기는 1~8,192px, 총 1,600만 픽셀 이내로 입력해 주세요.');
  }
  const inset = Math.min(width, height) * padding / 100;
  const scale = Math.min((width - inset * 2) / imageWidth, (height - inset * 2) / imageHeight);
  const drawWidth = imageWidth * scale, drawHeight = imageHeight * scale;
  return { x: (width - drawWidth) / 2, y: (height - drawHeight) / 2, width: drawWidth, height: drawHeight };
}

export function drawLogo(canvas, image, width, height, padding, background) {
  const placement = getLogoPlacement(image.naturalWidth, image.naturalHeight, width, height, padding);
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (background !== 'transparent') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, placement.x, placement.y, placement.width, placement.height);
}
