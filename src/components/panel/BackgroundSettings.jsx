import useEditorStore from '../../store/useEditorStore';

export default function BackgroundSettings() {
  const { ratio, setRatio, image, setImage, imageFilters, setImageFilter, setErrorMessage, saveHistory } = useEditorStore();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setErrorMessage('배경은 PNG 또는 JPEG만 가능합니다.');
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <div className="control-group">
        <label>배경 이미지</label>
        <label className="file-upload-label">
          파일 선택
          <input type="file" className="file-upload-input" accept="image/png, image/jpeg" onChange={handleImageUpload} />
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
                  onMouseDown={() => saveHistory()} 
                  onChange={(e) => setImageFilter(filter, Number(e.target.value))} 
                  style={{ flex: 1, margin: 0 }} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="control-group">
        <label>화면 비율</label>
        <select className="control-input" value={ratio} onChange={(e) => setRatio(e.target.value)}>
          <option value="1:1">1:1 (정방형)</option>
          <option value="4:5">4:5 (인스타그램)</option>
          <option value="9:16">9:16 (스토리/쇼츠)</option>
        </select>
      </div>
      <hr className="section-divider" />
    </>
  );
}
