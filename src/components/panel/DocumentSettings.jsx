import { useState } from 'react';
import useEditorStore from '../../store/useEditorStore';
import NumberField from '../NumberField';
import { DEFAULT_FILTERS } from '../../lib/imageTools';

export default function DocumentSettings({ mode }) {
  const store = useEditorStore();
  const [locked, setLocked] = useState(true);
  const [scaleContent, setScaleContent] = useState(true);
  const resize = (axis, value) => {
    const ratio = store.canvasWidth / store.canvasHeight;
    const width = axis === 'width' ? Math.round(value) : locked ? Math.max(1, Math.round(value * ratio)) : store.canvasWidth;
    const height = axis === 'height' ? Math.round(value) : locked ? Math.max(1, Math.round(value / ratio)) : store.canvasHeight;
    store.resizeCanvas(width, height, scaleContent);
  };
  return <section className="document-settings">
    <div className="section-label"><h3>문서 크기</h3><span>PIXELS</span></div>
    <div className="field-row"><NumberField label="너비" value={store.canvasWidth} min={1} onChange={v => resize('width', v)} /><NumberField label="높이" value={store.canvasHeight} min={1} onChange={v => resize('height', v)} /></div>
    <label className="check-row"><input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)} />가로세로 비율 유지</label>
    <label className="check-row"><input type="checkbox" checked={scaleContent} onChange={e => setScaleContent(e.target.checked)} />텍스트·도형도 함께 조절</label>
    <div className="preset-row">{[['정방형', 1080, 1080], ['피드', 1080, 1350], ['스토리', 1080, 1920], ['가로형', 1920, 1080]].map(([name, w, h]) => <button key={name} className="preset-button" onClick={() => store.resizeCanvas(w, h, scaleContent)}>{name}<small>{w} × {h}</small></button>)}</div>
    {store.image && <><button className="text-button" onClick={() => store.resizeCanvas(store.image.naturalWidth, store.image.naturalHeight, scaleContent)}>원본 크기로 복원 ↗</button><label className="control-group">이미지 배치<select aria-label="이미지 배치" className="control-input" value={store.imageFit} onChange={e => store.setImageFit(e.target.value)}><option value="contain">전체 맞춤 · 여백 유지</option><option value="cover">꽉 채우기 · 일부 잘림</option><option value="stretch">늘이기 · 비율 변경</option></select></label></>}
    {mode === 'enhance' && <div className="enhance-panel"><div className="section-label"><h3>디테일 보정</h3><button className="text-button" disabled={!store.image} onClick={() => { store.saveHistory(); store.setImageFilters(DEFAULT_FILTERS); }}>초기화</button></div>
      <button className="secondary-btn" disabled={!store.image} onClick={() => { store.saveHistory(); store.setImageFilters({ ...DEFAULT_FILTERS, contrast: 108, saturation: 108, sharpness: 25 }); }}>자연스럽게 보정</button>
      {[['sharpness', '선명도', 0, 100], ['saturation', '채도', 0, 200]].map(([key, label, min, max]) => <label className="slider-field" key={key}><span>{label}<output>{store.imageFilters[key] ?? DEFAULT_FILTERS[key]}</output></span><input aria-label={label} type="range" min={min} max={max} disabled={!store.image} value={store.imageFilters[key] ?? DEFAULT_FILTERS[key]} onPointerDown={store.saveHistory} onKeyDown={e => { if (!e.repeat) store.saveHistory(); }} onChange={e => store.setImageFilter(key, Number(e.target.value))} /></label>)}
      <p className="help-text">내보내기에서 2×, 4× 확대를 선택하세요. 보간과 선명도 보정으로 이미지를 다듬으며, 원본에 없는 디테일을 복원하지는 않습니다.</p>
    </div>}
  </section>;
}
