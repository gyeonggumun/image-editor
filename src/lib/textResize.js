export function resizeTextLayer(layer, bounds, handle, dx, dy, canvasWidth) {
  const fromLeft = handle.includes('w');
  const fromTop = handle.includes('n');
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const textWidth = Math.max(layer.size, layer.textWidth || (canvasWidth - layer.x - 20));
  const requestedScale = 1 + ((fromLeft ? -dx : dx) * width + (fromTop ? -dy : dy) * height) / (width * width + height * height);
  const size = Math.max(1, Math.min(1000, Math.round(layer.size * requestedScale * 10) / 10));
  const scale = size / layer.size;
  return {
    size,
    x: fromLeft ? layer.x + width * (1 - scale) : layer.x,
    y: fromTop ? layer.y + height * (1 - scale) : layer.y,
    textWidth: textWidth * scale,
    letterSpacing: (layer.letterSpacing || 0) * scale
  };
}
