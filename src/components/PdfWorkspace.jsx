import { useRef, useState } from 'react';
import { readImage } from '../lib/imageTools';

export default function PdfWorkspace() {
  const [items, setItems] = useState([]);
  const [format, setFormat] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState(12);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const loading = useRef(false);
  const addFiles = async files => {
    if (loading.current) return;
    loading.current = true; setBusy(true); setMessage('');
    const added = []; const errors = [];
    try {
      for (const file of Array.from(files).slice(0, 20 - items.length)) {
        try {
          const image = await readImage(file);
          const preview = document.createElement('canvas');
          const ratio = Math.min(240 / image.width, 240 / image.height, 1);
          preview.width = Math.round(image.width * ratio); preview.height = Math.round(image.height * ratio);
          preview.getContext('2d').drawImage(image, 0, 0, preview.width, preview.height);
          added.push({ id: crypto.randomUUID(), file, name: file.name, width: image.width, height: image.height, thumbnail: preview.toDataURL('image/jpeg', 0.8) });
        } catch (error) { errors.push(`${file.name}: ${error.message}`); }
      }
      setItems(previous => [...previous, ...added]);
      if (files.length > 20 - items.length) errors.push('한 문서에 최대 20장까지 넣을 수 있습니다.');
      setMessage(errors.join(' '));
    } finally { loading.current = false; setBusy(false); }
  };
  const move = (index, offset) => setItems(previous => {
    const next = [...previous];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    return next;
  });
  const exportPdf = async () => {
    setBusy(true); setMessage('');
    try {
      const { jsPDF } = await import('jspdf');
      let pdf;
      for (const item of items) {
        const image = await readImage(item.file);
        const page = format === 'original' ? [image.width * 0.75, image.height * 0.75] : orientation === 'portrait' ? [595.28, 841.89] : [841.89, 595.28];
        const direction = page[0] > page[1] ? 'landscape' : 'portrait';
        if (!pdf) pdf = new jsPDF({ unit: 'pt', format: page, orientation: direction });
        else pdf.addPage(page, direction);
        const inset = format === 'original' ? 0 : margin * 72 / 25.4;
        const scale = Math.min((page[0] - inset * 2) / image.width, (page[1] - inset * 2) / image.height);
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0);
        pdf.addImage(canvas, 'PNG', (page[0] - image.width * scale) / 2, (page[1] - image.height * scale) / 2, image.width * scale, image.height * scale, undefined, 'FAST');
        canvas.width = 0; canvas.height = 0;
      }
      pdf.save('Image-Studio.pdf'); setMessage(`${items.length}페이지 PDF를 저장했습니다.`);
    } catch (error) { setMessage(error.message || 'PDF를 만들지 못했습니다. 이미지 수를 줄여 주세요.'); }
    finally { setBusy(false); }
  };
  return <main className="pdf-workspace"><section className="pdf-content"><span className="eyebrow">IMAGE TO DOCUMENT</span><h1>이미지에서 문서로.</h1><p className="muted">페이지 순서를 정하고, 하나의 PDF로 저장하세요.</p>
    <label className={`pdf-dropzone${busy ? ' is-busy' : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) addFiles(e.dataTransfer.files); }}><span className="upload-symbol">↥</span><strong>{busy ? '이미지 처리 중…' : '이미지를 놓거나 파일을 선택하세요'}</strong><span>PNG, JPG, WebP · 파일당 30MB · 최대 20장</span><input aria-label="PDF 이미지 추가" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy || items.length >= 20} onChange={e => { addFiles(e.target.files); e.target.value = ''; }} /></label>
    <div className="section-heading"><h2>페이지 <small>{String(items.length).padStart(2, '0')}</small></h2><span>화살표로 순서를 바꿀 수 있습니다</span></div>
    {!items.length ? <div className="pdf-empty"><span>01</span><p>첫 번째 페이지를 기다리고 있어요.</p></div> : <ol className="pdf-pages">{items.map((item, index) => <li key={item.id}><div className="pdf-thumbnail"><span>{String(index + 1).padStart(2, '0')}</span><img src={item.thumbnail} alt={item.name} /></div><strong title={item.name}>{item.name}</strong><small>{item.width} × {item.height} px</small><div><button aria-label={`${index + 1}페이지 앞으로`} className="action-sm-btn" disabled={busy || index === 0} onClick={() => move(index, -1)}>←</button><button aria-label={`${index + 1}페이지 뒤로`} className="action-sm-btn" disabled={busy || index === items.length - 1} onClick={() => move(index, 1)}>→</button><button aria-label={`${index + 1}페이지 삭제`} className="action-sm-btn delete" disabled={busy} onClick={() => setItems(items.filter(i => i.id !== item.id))}>삭제</button></div></li>)}</ol>}
  </section><aside className="pdf-settings"><span className="eyebrow">EXPORT SETTINGS</span><h2>문서 설정</h2><label className="control-group">페이지 크기<select aria-label="페이지 크기" className="control-input" value={format} onChange={e => setFormat(e.target.value)}><option value="a4">A4 · 210 × 297 mm</option><option value="original">이미지 원본 비율 · 여백 없음</option></select></label>{format === 'a4' && <><label className="control-group">방향<select aria-label="페이지 방향" className="control-input" value={orientation} onChange={e => setOrientation(e.target.value)}><option value="portrait">세로</option><option value="landscape">가로</option></select></label><label className="control-group">여백<select aria-label="페이지 여백" className="control-input" value={margin} onChange={e => setMargin(Number(e.target.value))}><option value={0}>없음</option><option value={12}>12 mm</option><option value={20}>20 mm</option></select></label></>}<div className="pdf-summary"><span>전체 페이지</span><strong>{items.length}장</strong></div><button className="primary-button" disabled={!items.length || busy} onClick={exportPdf}>{busy ? '처리 중…' : 'PDF 다운로드'} <span>↓</span></button><p className="help-text">이미지 비율을 유지해 페이지 중앙에 배치합니다. 파일은 서버로 업로드되지 않습니다.</p><p className="feedback" role="status">{message}</p></aside></main>;
}
