const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function fitCrop(width, height, ratio = 0) {
  const cropWidth = ratio ? Math.min(width, height * ratio) : width;
  const cropHeight = ratio ? cropWidth / ratio : height;
  const w = Math.max(1, Math.floor(cropWidth)), h = Math.max(1, Math.floor(cropHeight));
  return { x: Math.floor((width - w) / 2), y: Math.floor((height - h) / 2), width: w, height: h };
}

export function moveCrop(rect, dx, dy, width, height) {
  return { ...rect, x: clamp(Math.round(rect.x + dx), 0, width - rect.width), y: clamp(Math.round(rect.y + dy), 0, height - rect.height) };
}

export function resizeCrop(rect, handle, dx, dy, width, height, ratio = 0) {
  const west = handle.includes('w'), north = handle.includes('n');
  const horizontal = west || handle.includes('e'), vertical = north || handle.includes('s');
  const anchorX = west ? rect.x + rect.width : rect.x;
  const anchorY = north ? rect.y + rect.height : rect.y;
  let w = horizontal ? rect.width + (west ? -dx : dx) : rect.width;
  let h = vertical ? rect.height + (north ? -dy : dy) : rect.height;
  const maxWidth = horizontal ? west ? anchorX : width - anchorX : Math.min(rect.x + rect.width / 2, width - rect.x - rect.width / 2) * 2;
  const maxHeight = vertical ? north ? anchorY : height - anchorY : Math.min(rect.y + rect.height / 2, height - rect.y - rect.height / 2) * 2;
  if (ratio) {
    if (horizontal && (!vertical || Math.abs(dx) >= Math.abs(dy) * ratio)) h = w / ratio;
    else w = h * ratio;
    const factor = Math.min(1, maxWidth / Math.max(1, w), maxHeight / Math.max(1, h));
    w *= factor; h *= factor;
  }
  w = clamp(Math.round(w), 1, Math.max(1, Math.floor(maxWidth)));
  h = clamp(Math.round(h), 1, Math.max(1, Math.floor(maxHeight)));
  const x = horizontal ? west ? anchorX - w : anchorX : rect.x + (rect.width - w) / 2;
  const y = vertical ? north ? anchorY - h : anchorY : rect.y + (rect.height - h) / 2;
  return { x: clamp(Math.round(x), 0, width - w), y: clamp(Math.round(y), 0, height - h), width: w, height: h };
}

export function drawCrop(start, end, width, height, ratio = 0) {
  const west = end.x < start.x, north = end.y < start.y;
  const initial = { x: west ? start.x - 1 : start.x, y: north ? start.y - 1 : start.y, width: 1, height: 1 };
  return resizeCrop(initial, `${north ? 'n' : 's'}${west ? 'w' : 'e'}`, (west ? 1 : -1) + end.x - start.x, (north ? 1 : -1) + end.y - start.y, width, height, ratio);
}

export function isValidCrop(rect, width, height) {
  return rect && [rect.x, rect.y, rect.width, rect.height].every(Number.isInteger) && rect.x >= 0 && rect.y >= 0 && rect.width >= 1 && rect.height >= 1 && rect.x + rect.width <= width && rect.y + rect.height <= height;
}
