import { useEffect, useRef, useState } from 'react';
import NumberField from './NumberField';
import { downloadBlob, readImage, validateDimensions } from '../lib/imageTools';
import { drawLogo } from '../lib/logoTools';

const PRESETS = [
  ['작은 아이콘', 32, 32], ['아이콘', 64, 64], ['작은 로고', 128, 128],
  ['기본 로고', 256, 256], ['큰 로고', 512, 512], ['고해상도', 1024, 1024],
  ['가로 로고', 600, 240], ['큰 가로 로고', 1200, 480]
];

export default function LogoWorkspace() {
  const [image, setImage] = useState(null);
  const [name, setName] = useState('logo');
  const [dimensions, setDimensions] = useState({ width: 512, height: 512 });
  const [locked, setLocked] = useState(true);
  const [padding, setPadding] = useState(10);
  const [transparent, setTransparent] = useState(true);
  const [color, setColor] = useState('#ffffff');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canvasRef = useRef(null);
  const uploading = useRef(false);
  const { width, height } = dimensions;

  useEffect(() => {
    if (image && canvasRef.current) drawLogo(canvasRef.current, image, width, height, padding, transparent ? 'transparent' : color);
  }, [image, width, height, padding, transparent, color]);

  const upload = async file => {
    if (!file || uploading.current) return;
    uploading.current = true; setBusy(true); setMessage('');
    try {
      const loaded = await readImage(file);
      setImage(loaded); setName(file.name.replace(/\.[^.]+$/, '') || 'logo');
    } catch (error) { setMessage(error.message); }
    finally { uploading.current = false; setBusy(false); }
  };

  const resize = (axis, value) => {
    const next = { ...dimensions, [axis]: Math.round(value) };
    if (locked) {
      if (axis === 'width') next.height = Math.max(1, Math.round(next.width * height / width));
      else next.width = Math.max(1, Math.round(next.height * width / height));
    }
    if (!validateDimensions(next.width, next.height)) {
      setMessage('크기는 한 변 8,192px, 총 1,600만 픽셀까지 가능합니다.');
      return;
    }
    setDimensions(next); setMessage('');
  };

  const save = async () => {
    if (!canvasRef.current || busy) return;
    setBusy(true); setMessage('');
    try {
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'));
      downloadBlob(blob, `${name}-logo-${width}x${height}.png`);
      setMessage(`${width} × ${height}px PNG를 저장했습니다.`);
    } catch (error) { setMessage(error.message || '저장하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };

  return <main className="pdf-workspace logo-workspace">
    <section className="pdf-content">
      <span className="eyebrow">LOGO SIZE STUDIO</span>
      <h1>작은 크기에도, 또렷한 인상.</h1>
      <p className="muted">로고를 불러오고 필요한 크기를 고르세요. 비율을 유지해 가운데에 배치합니다.</p>
      <label className="pdf-dropzone logo-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) upload(e.dataTransfer.files[0]); }}>
        <span className="upload-symbol">↥</span>
        <strong>{busy ? '파일 처리 중…' : image ? '다른 로고로 교체하기' : '로고를 놓거나 파일을 선택하세요'}</strong>
        <span>PNG, JPG, WebP · 최대 30MB</span>
        <input aria-label="로고 이미지 불러오기" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { upload(e.target.files[0]); e.target.value = ''; }} />
      </label>
      <div className="section-heading"><h2>로고 미리보기</h2><span>{width} × {height} PX / PNG</span></div>
      <div className="logo-preview">
        {image ? <canvas ref={canvasRef} aria-label="로고 미리보기 캔버스" /> : <div className="logo-empty"><span aria-hidden="true">Lg.</span><p>이곳에 나만의 로고가 들어갑니다.</p></div>}
      </div>
      <div className="logo-preview-note"><span>{image ? `원본 ${image.naturalWidth} × ${image.naturalHeight}px` : '체크무늬는 투명 영역을 나타냅니다.'}</span><span>미리보기는 화면에 맞춰 표시됩니다.</span></div>
    </section>
    <aside className="pdf-settings logo-settings">
      <span className="eyebrow">SIZE & SPACING</span><h2>로고 크기 만들기</h2>
      <div className="section-label"><h3>빠른 크기 선택</h3><span>PIXELS</span></div>
      <div className="preset-row logo-presets">{PRESETS.map(([label, w, h]) => <button key={label} className={`preset-button${width === w && height === h ? ' is-selected' : ''}`} aria-pressed={width === w && height === h} disabled={busy} onClick={() => { setDimensions({ width: w, height: h }); setMessage(''); }}>{label}<small>{w} × {h}</small></button>)}</div>
      <div className="section-label"><h3>직접 입력</h3></div>
      <div className="field-row"><NumberField label="로고 너비" min={1} value={width} onChange={value => resize('width', value)} /><NumberField label="로고 높이" min={1} value={height} onChange={value => resize('height', value)} /></div>
      <label className="check-row"><input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)} />출력 크기 비율 유지</label>
      <label className="slider-field logo-spacing"><span>로고 바깥 여백<output>{padding}%</output></span><input aria-label="로고 바깥 여백" type="range" min={0} max={40} value={padding} onChange={e => setPadding(Number(e.target.value))} /></label>
      <label className="check-row"><input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)} />투명 배경으로 저장</label>
      {!transparent && <label className="logo-color">배경색<input aria-label="로고 배경색" type="color" value={color} onChange={e => setColor(e.target.value)} /></label>}
      <p className="help-text">로고가 잘리거나 찌그러지지 않게 맞춥니다. {transparent ? '이미지 바깥 여백과 원본의 투명 영역을 투명하게 저장합니다. 원본 배경색은 유지됩니다.' : '선택한 배경색으로 여백과 투명 영역을 채웁니다.'}</p>
      <div className="pdf-summary"><span>출력 크기</span><strong>{width} × {height}px</strong></div>
      <button className="primary-button" disabled={!image || busy} onClick={save}>{busy ? '처리 중…' : '로고 PNG 다운로드'} <span>↓</span></button>
      <p className="feedback" role="status">{message}</p>
    </aside>
  </main>;
}
