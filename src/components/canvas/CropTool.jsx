import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useEditorStore from '../../store/useEditorStore';
import NumberField from '../NumberField';
import { DEFAULT_FILTERS, loadImage, prepareImage } from '../../lib/imageTools';
import { drawCrop, fitCrop, moveCrop, resizeCrop } from '../../lib/cropTools';

const RATIOS = [['자유 비율', 0], ['정사각형 1:1', 1], ['세로 4:5', 4 / 5], ['가로 16:9', 16 / 9], ['세로 9:16', 9 / 16]];

export default function CropTool({ canvasRef, stageRef, zoom, onComplete }) {
  const store = useEditorStore();
  const { image, canvasWidth: width, canvasHeight: height } = store;
  const [session, setSession] = useState(null);
  const [rect, setRect] = useState(() => fitCrop(width, height));
  const [ratio, setRatio] = useState(0);
  const [busy, setBusy] = useState(false);
  const [drawing, setDrawing] = useState(true);
  const [message, setMessage] = useState('');
  const dragRef = useRef(null);
  const active = Boolean(session && session.image === image && session.width === width && session.height === height);
  const units = width / (canvasRef.current?.clientWidth || width) / zoom;

  const cancel = () => { if (!busy) { setSession(null); dragRef.current = null; setMessage(''); } };
  const start = () => {
    store.clearSelection(); store.setMaskMode(false);
    setRect(fitCrop(width, height, ratio)); setDrawing(true); setMessage('');
    setSession({ image, width, height });
  };

  const apply = async () => {
    if (!active || busy) return;
    const before = useEditorStore.getState();
    setBusy(true); setMessage('');
    try {
      const source = prepareImage(before.image, width, height, DEFAULT_FILTERS, before.imageFit);
      const crop = document.createElement('canvas');
      crop.width = rect.width; crop.height = rect.height;
      crop.getContext('2d').drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
      const cropped = await loadImage(crop.toDataURL('image/png'));
      const current = useEditorStore.getState();
      const changed = ['image', 'canvasWidth', 'canvasHeight', 'imageFit', 'imageFilters', 'layers', 'shapes', 'stickers'].some(key => current[key] !== before[key]);
      if (changed) throw new Error('작업이 변경되었습니다. 영역을 다시 선택해 주세요.');
      if (!current.cropCanvas(cropped, rect)) throw new Error('자르기 영역을 다시 선택해 주세요.');
      setSession(null); dragRef.current = null; onComplete();
    } catch (error) { setMessage(error.message || '자르기에 실패했습니다. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = event => {
      if (event.isComposing) return;
      if (event.key === 'Escape') { event.preventDefault(); cancel(); return; }
      if (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(event.target.tagName)) return;
      if (event.key === 'Enter') { event.preventDefault(); apply(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const point = event => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(width, Math.round((event.clientX - bounds.left) * width / bounds.width))), y: Math.max(0, Math.min(height, Math.round((event.clientY - bounds.top) * height / bounds.height))) };
  };
  const pointerDown = event => {
    if (busy || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event), targetAction = event.target.dataset.cropAction;
    const action = drawing && (!targetAction || targetAction === 'move') ? 'draw' : targetAction || 'draw';
    dragRef.current = { start, action, rect };
    setDrawing(false);
    if (action === 'draw') setRect(drawCrop(start, start, width, height, ratio));
  };
  const pointerMove = event => {
    const drag = dragRef.current;
    if (!drag || busy) return;
    const end = point(event), dx = end.x - drag.start.x, dy = end.y - drag.start.y;
    if (drag.action === 'draw') setRect(drawCrop(drag.start, end, width, height, ratio));
    else if (drag.action === 'move') setRect(moveCrop(drag.rect, dx, dy, width, height));
    else setRect(resizeCrop(drag.rect, drag.action, dx, dy, width, height, ratio));
  };
  const pointerUp = event => {
    if (dragRef.current) pointerMove(event);
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const changeNumber = (key, value) => {
    if (key === 'x' || key === 'y') setRect(moveCrop(rect, key === 'x' ? value - rect.x : 0, key === 'y' ? value - rect.y : 0, width, height));
    else setRect(resizeCrop(rect, key === 'width' ? 'e' : 's', key === 'width' ? value - rect.width : 0, key === 'height' ? value - rect.height : 0, width, height, ratio));
  };
  const handles = { nw: [rect.x, rect.y], n: [rect.x + rect.width / 2, rect.y], ne: [rect.x + rect.width, rect.y], e: [rect.x + rect.width, rect.y + rect.height / 2], se: [rect.x + rect.width, rect.y + rect.height], s: [rect.x + rect.width / 2, rect.y + rect.height], sw: [rect.x, rect.y + rect.height], w: [rect.x, rect.y + rect.height / 2] };

  return <div className={`crop-tool${active ? ' is-active' : ''}`}>
    {!active ? <button className="secondary-btn crop-start" onClick={start}>이미지 자르기 <span aria-hidden="true">⌗</span></button> : <>
      <div className="crop-toolbar"><strong>이미지 자르기</strong><select aria-label="자르기 비율" className="control-input" value={ratio} disabled={busy} onChange={event => { const next = Number(event.target.value); setRatio(next); setRect(fitCrop(width, height, next)); setDrawing(false); }}>{RATIOS.map(([label, value]) => <option key={label} value={value}>{label}</option>)}</select><button className="action-sm-btn" aria-pressed={drawing} disabled={busy} onClick={() => setDrawing(true)}>영역 다시 그리기</button><button className="action-sm-btn" disabled={busy} onClick={() => { setRect(fitCrop(width, height, ratio)); setDrawing(false); }}>선택 초기화</button><button className="secondary-btn" disabled={busy} onClick={cancel}>취소</button><button className="primary-button" disabled={busy} onClick={apply}>{busy ? '적용 중…' : '자르기 적용'}</button></div>
      <fieldset className="crop-numbers" disabled={busy}>{[['x', 'X 위치', 0, width - 1], ['y', 'Y 위치', 0, height - 1], ['width', '너비', 1, width], ['height', '높이', 1, height]].map(([key, label, min, max]) => <NumberField key={key} label={`자르기 ${label}`} value={rect[key]} min={min} max={max} onChange={value => changeNumber(key, value)} />)}</fieldset>
      <p className="help-text">{drawing ? '이미지 위를 드래그해 자를 영역을 지정하세요.' : '박스를 드래그해 이동하고 손잡이로 크기를 조절하세요.'} 영역 밖은 잘리고, 텍스트와 도형은 계속 편집할 수 있습니다.</p>
      {stageRef.current && createPortal(<svg className="crop-overlay" aria-label="이미지 자르기 영역" viewBox={`0 0 ${width} ${height}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={event => { if (dragRef.current) setRect(dragRef.current.rect); dragRef.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}>
        <g fill="rgba(20, 28, 20, 0.58)" pointerEvents="none"><rect width={width} height={rect.y} /><rect y={rect.y + rect.height} width={width} height={height - rect.y - rect.height} /><rect y={rect.y} width={rect.x} height={rect.height} /><rect x={rect.x + rect.width} y={rect.y} width={width - rect.x - rect.width} height={rect.height} /></g>
        <rect data-crop-action="move" x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="transparent" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ cursor: drawing ? 'crosshair' : 'move' }} />
        <g stroke="#fff" strokeWidth="0.5" opacity="0.65" pointerEvents="none" vectorEffect="non-scaling-stroke">{[1, 2].map(n => <g key={n}><line x1={rect.x + rect.width * n / 3} y1={rect.y} x2={rect.x + rect.width * n / 3} y2={rect.y + rect.height} vectorEffect="non-scaling-stroke" /><line x1={rect.x} y1={rect.y + rect.height * n / 3} x2={rect.x + rect.width} y2={rect.y + rect.height * n / 3} vectorEffect="non-scaling-stroke" /></g>)}</g>
        {Object.entries(handles).map(([handle, [x, y]]) => <rect key={handle} data-crop-action={handle} x={x - 5 * units} y={y - 5 * units} width={10 * units} height={10 * units} fill="#fff" stroke="#405b42" strokeWidth="1" vectorEffect="non-scaling-stroke" style={{ cursor: ['nw', 'se'].includes(handle) ? 'nwse-resize' : ['ne', 'sw'].includes(handle) ? 'nesw-resize' : ['n', 's'].includes(handle) ? 'ns-resize' : 'ew-resize' }} />)}
      </svg>, stageRef.current)}
    </>}
    {message && <p className="feedback" role="status">{message}</p>}
  </div>;
}
