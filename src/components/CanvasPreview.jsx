import { useRef, useEffect } from 'react';
import useEditorStore from '../store/useEditorStore';

function CanvasPreview() {
  const canvasRef = useRef(null);
  const { image, text, ratio, textPos, textSize, textColor } = useEditorStore();

  const getCanvasDimensions = () => {
    const baseWidth = 600;
    if (ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    if (ratio === '9:16') return { width: baseWidth, height: baseWidth * (16 / 9) };
    return { width: baseWidth, height: baseWidth };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasDimensions();
    
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);

    if (image) {
      const imgRatio = image.width / image.height;
      const canvasRatio = width / height;
      let drawWidth = width, drawHeight = height, offsetX = 0, offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      }
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }

    ctx.font = `bold ${textSize}px sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    const maxTextWidth = width - textPos.x - 20; 
    const paragraphs = text.split('\n');
    const finalLines = [];

    paragraphs.forEach(paragraph => {
      let currentLine = '';
      const chars = paragraph.split(''); 
      
      for (let i = 0; i < chars.length; i++) {
        const testLine = currentLine + chars[i];
        const metrics = ctx.measureText(testLine); 
        
        if (metrics.width > maxTextWidth && currentLine.length > 0) {
          finalLines.push(currentLine);
          currentLine = chars[i]; 
        } else {
          currentLine = testLine;
        }
      }
      finalLines.push(currentLine); 
    });

    finalLines.forEach((line, index) => {
      ctx.fillText(line, textPos.x, textPos.y + (index * (textSize * 1.2)));
    });

    ctx.shadowColor = 'transparent';
  }, [image, text, ratio, textPos, textSize, textColor]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `result-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="preview-panel">
      <div className="canvas-container">
        <canvas ref={canvasRef} />
      </div>
      <button className="action-btn" onClick={downloadImage}>이미지 내려받기</button>
    </div>
  );
}

export default CanvasPreview;