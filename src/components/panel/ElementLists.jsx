import useEditorStore from '../../store/useEditorStore';

export default function ElementLists() {
  const { 
    layers, addLayer, deleteLayer, selectedLayerIds, 
    stickers, addSticker, deleteSticker, selectedStickerIds, 
    shapes, addShape, deleteShape, selectedShapeIds, 
    selectItem 
  } = useEditorStore();

  const handleStickerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => addSticker(event.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const renderList = (title, items, type, onAdd, selectedIds, onDelete, addBtnLabel) => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          {type === 'shape' ? (
            <>
              <button className="action-sm-btn" onClick={() => onAdd('rect')}>+ 사각</button>
              <button className="action-sm-btn" onClick={() => onAdd('circle')}>+ 원형</button>
              <button className="action-sm-btn" onClick={() => onAdd('line')}>+ 선</button>
            </>
          ) : type === 'sticker' ? (
            <label className="action-sm-btn" style={{ cursor: 'pointer', margin: 0 }}>
              {addBtnLabel}
              <input type="file" accept="image/png, image/jpeg, image/svg+xml" style={{ display: 'none' }} onChange={handleStickerUpload} />
            </label>
          ) : (
            <button className="action-sm-btn" onClick={onAdd}>{addBtnLabel}</button>
          )}
        </div>
      </div>
      <ul className="template-list" style={{ marginBottom: '24px' }}>
        {items.map((item, index) => (
          <li key={item.id} className="template-item" 
            style={{ 
              borderColor: selectedIds.includes(item.id) ? 'var(--text-secondary)' : 'var(--border-base)', 
              backgroundColor: selectedIds.includes(item.id) ? 'var(--bg-surface-hover)' : 'transparent', 
              cursor: 'pointer' 
            }}
            onClick={(e) => selectItem(item.id, type, e.shiftKey)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
              {type === 'layer' ? (item.text.split('\n')[0] || '빈 텍스트') : 
               type === 'shape' ? (`${item.type === 'rect' ? '사각형' : item.type === 'circle' ? '원형' : '선'} ${index + 1}`) : 
               `이미지 ${index + 1}`}
            </span>
            <button className="action-sm-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>삭제</button>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <>
      {renderList('기본 도형', shapes, 'shape', addShape, selectedShapeIds, deleteShape, '추가')}
      {renderList('텍스트 레이어', layers, 'layer', addLayer, selectedLayerIds, deleteLayer, '추가')}
      {renderList('에셋 (로고/아이콘)', stickers, 'sticker', null, selectedStickerIds, deleteSticker, '추가')}
    </>
  );
}