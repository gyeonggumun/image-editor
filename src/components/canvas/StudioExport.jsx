import { useState } from 'react';
import useEditorStore from '../../store/useEditorStore';
import { downloadBlob, validateDimensions } from '../../lib/imageTools';

export default function StudioExport({ renderCanvas }) {
  const { canvasWidth, canvasHeight, imageName } = useEditorStore();
  const [format, setFormat] = useState('png');
  const [scale, setScale] = useState(1);
  const [quality, setQuality] = useState(95);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const width = canvasWidth * scale, height = canvasHeight * scale;
  const valid = validateDimensions(width, height);
  const save = async () => {
    setBusy(true); setMessage('');
    try {
      const canvas = await renderCanvas(scale);
      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: width > height ? 'landscape' : 'portrait', unit: 'px', format: [width, height], hotfixes: ['px_scaling'] });
        pdf.addImage(canvas, 'PNG', 0, 0, width, height);
        pdf.save(`${imageName}.pdf`);
      } else {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`, quality / 100));
        downloadBlob(blob, `${imageName}.${format === 'jpeg' ? 'jpg' : format}`);
      }
      setMessage('파일을 저장했습니다.');
    } catch (error) { setMessage(error.message || '저장에 실패했습니다. 크기를 줄여 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };
  return <div className="export-bar"><div className="export-options"><label>파일 형식<select aria-label="파일 형식" value={format} onChange={e => setFormat(e.target.value)}><option value="png">PNG</option><option value="jpeg">JPG</option><option value="webp">WebP</option><option value="pdf">PDF</option></select></label><label>출력 배율<select aria-label="출력 배율" value={scale} onChange={e => setScale(Number(e.target.value))}>{[1, 2, 4].map(n => <option key={n} value={n}>{n}×</option>)}</select></label>{['jpeg', 'webp'].includes(format) && <label>품질<input aria-label="저장 품질" type="number" min={1} max={100} value={quality} onChange={e => setQuality(Math.max(1, Math.min(100, Number(e.target.value))))} /></label>}<span className="export-size">{width.toLocaleString()} × {height.toLocaleString()} px</span></div><button className="primary-button" disabled={busy || !valid} onClick={save}>{busy ? '파일 만드는 중…' : '내보내기'} <span>↓</span></button><div className="export-feedback" role="status">{!valid ? '출력은 한 변 8,192px, 총 1,600만 픽셀까지 가능합니다. 배율이나 문서 크기를 줄여 주세요.' : message}</div></div>;
}
