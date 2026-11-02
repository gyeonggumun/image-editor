import { readImage } from '../../lib/imageTools';
import useEditorStore from '../../store/useEditorStore';

export default function BackgroundSettings() {
  const { image, setImage, imageFilters, setImageFilter, setErrorMessage, saveHistory } = useEditorStore();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try { const image = await readImage(file); setImage(image, file.name); setErrorMessage(''); }
    catch (error) { setErrorMessage(error.message); }
  };

  return (
    <>
      <div className="control-group">
        <label>배경 이미지</label>
        <label className="file-upload-label">
          {image ? '이미지 교체' : '이미지 불러오기'}
          <input type="file" className="file-upload-input" aria-label="배경 이미지 불러오기" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
        </label>
      </div>

      {image && (
        <div className="control-group filter-card">
          <div className="filter-card-title">배경 이미지 필터</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['brightness', 'contrast', 'grayscale', 'blur'].map((filter) => (
              <div key={filter} style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', width: '50px', margin: 0, textTransform: 'capitalize' }}>
                  {filter === 'brightness' ? '밝기' : filter === 'contrast' ? '대비' : filter === 'grayscale' ? '흑백' : '블러'}
                </label>
                <input type="range" 
                  min="0" 
                  max={filter === 'grayscale' ? 100 : filter === 'blur' ? 20 : 200} 
                  value={imageFilters[filter]} 
                  aria-label={filter === 'brightness' ? '밝기' : filter === 'contrast' ? '대비' : filter === 'grayscale' ? '흑백' : '블러'} onPointerDown={() => saveHistory()} onKeyDown={e => { if (!e.repeat) saveHistory(); }}
                  onChange={(e) => setImageFilter(filter, Number(e.target.value))} 
                  style={{ flex: 1, margin: 0 }} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <hr className="section-divider" />
    </>
  );
}
