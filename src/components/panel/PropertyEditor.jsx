import NumberField from '../NumberField';
import useEditorStore from '../../store/useEditorStore';

export default function PropertyEditor() {
  const { 
    layers, updateLayer, reorderLayer, 
    stickers, updateSticker, reorderSticker, 
    shapes, updateShape, reorderShape,
    selectedLayerIds, selectedStickerIds, selectedShapeIds, saveHistory
  } = useEditorStore();

  const isMultiSelected = selectedLayerIds.length + selectedStickerIds.length + selectedShapeIds.length > 1;
  const isNoneSelected = selectedLayerIds.length + selectedStickerIds.length + selectedShapeIds.length === 0;

  const activeLayer = !isMultiSelected && selectedLayerIds.length === 1 ? layers.find(l => l.id === selectedLayerIds[0]) : null;
  const activeSticker = !isMultiSelected && selectedStickerIds.length === 1 ? stickers.find(s => s.id === selectedStickerIds[0]) : null;
  const activeShape = !isMultiSelected && selectedShapeIds.length === 1 ? shapes.find(s => s.id === selectedShapeIds[0]) : null;

  const currentGradientColors = activeLayer?.gradientColors || [activeLayer?.color, activeLayer?.color2 || '#a1a1aa'];
  const handleGradientChange = (index, newColor) => {
    const updated = [...currentGradientColors];
    updated[index] = newColor;
    updateLayer(activeLayer.id, { gradientColors: updated });
  };

  if (isNoneSelected) return <div className="empty-state">편집할 대상을 선택해주세요</div>;

  return (
    <div className="property-editor" onFocusCapture={() => saveHistory()}>
      {isMultiSelected ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' }}>다중 선택 상태입니다.<br/>드래그하거나 방향키로 이동하세요.</div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>속성 편집</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="action-sm-btn" onClick={() => activeLayer ? reorderLayer(activeLayer.id, 'down') : activeShape ? reorderShape(activeShape.id, 'down') : reorderSticker(activeSticker.id, 'down')}>뒤로</button>
              <button className="action-sm-btn" onClick={() => activeLayer ? reorderLayer(activeLayer.id, 'up') : activeShape ? reorderShape(activeShape.id, 'up') : reorderSticker(activeSticker.id, 'up')}>앞으로</button>
            </div>
          </div>

          {(activeLayer || activeShape || activeSticker) && <div className="field-row">{['x', 'y'].map(axis => {
            const item = activeLayer || activeShape || activeSticker;
            const update = activeLayer ? updateLayer : activeShape ? updateShape : updateSticker;
            return <NumberField key={axis} label={`${axis.toUpperCase()} 위치`} min={-8192} step={0.5} value={Math.round(item[axis] * 10) / 10} onChange={value => update(item.id, { [axis]: value })} />;
          })}</div>}
          {activeLayer && <><div className="field-row"><NumberField label="자간" min={-10} max={100} step={0.1} value={activeLayer.letterSpacing || 0} onChange={letterSpacing => updateLayer(activeLayer.id, { letterSpacing })} /><NumberField label="행간" min={0.5} max={5} step={0.1} suffix="배" value={activeLayer.lineHeight || 1.4} onChange={lineHeight => updateLayer(activeLayer.id, { lineHeight })} /></div><label className="control-group">글자 굵기<select aria-label="글자 굵기" className="control-input" value={activeLayer.fontWeight || 400} onChange={e => updateLayer(activeLayer.id, { fontWeight: Number(e.target.value) })}><option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={700}>Bold</option></select></label><NumberField label="텍스트 영역 너비" min={1} value={activeLayer.textWidth || 400} onChange={textWidth => updateLayer(activeLayer.id, { textWidth })} /></>}

          {activeShape && (
            <>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="control-group" style={{ flex: 1 }}>
                  <NumberField label="도형 너비" min={1} step={0.5} value={activeShape.width} onChange={width => updateShape(activeShape.id, { width })} />
                  <input type="range" min="10" max="600" value={activeShape.width} onChange={(e) => updateShape(activeShape.id, { width: Number(e.target.value) })} />
                </div>
                {activeShape.type !== 'line' && (
                  <div className="control-group" style={{ flex: 1 }}>
                    <NumberField label="도형 높이" min={1} step={0.5} value={activeShape.height} onChange={height => updateShape(activeShape.id, { height })} />
                    <input type="range" min="10" max="600" value={activeShape.height} onChange={(e) => updateShape(activeShape.id, { height: Number(e.target.value) })} />
                  </div>
                )}
              </div>

              {activeShape.type === 'rect' && (
                <div className="control-group">
                  <label>모서리 둥글기: {activeShape.borderRadius || 0}px</label>
                  <input type="range" min="0" max="100" value={activeShape.borderRadius || 0} onChange={(e) => updateShape(activeShape.id, { borderRadius: Number(e.target.value) })} />
                </div>
              )}

              {activeShape.type !== 'line' && (
                <div className="control-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                  <input type="checkbox" id="fill-toggle" checked={activeShape.hasFill ?? true} onChange={(e) => updateShape(activeShape.id, { hasFill: e.target.checked })} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  <label htmlFor="fill-toggle" style={{ cursor: 'pointer', margin: 0 }}>배경 채우기</label>
                  
                  <input type="color" className="control-input" disabled={!(activeShape.hasFill ?? true)} style={{ padding: '0', height: '24px', width: '40px', border: 'none', marginLeft: 'auto' }} value={activeShape.fill} onChange={(e) => updateShape(activeShape.id, { fill: e.target.value })} />
                </div>
              )}

              <div className="control-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                {activeShape.type !== 'line' && (
                  <>
                    <input type="checkbox" id="stroke-toggle" checked={activeShape.hasStroke || false} onChange={(e) => updateShape(activeShape.id, { hasStroke: e.target.checked })} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
                    <label htmlFor="stroke-toggle" style={{ cursor: 'pointer', margin: 0 }}>테두리 선</label>
                  </>
                )}
                {activeShape.type === 'line' && <label style={{ margin: 0 }}>선 색상/두께</label>}
                <input type="color" className="control-input" disabled={activeShape.type !== 'line' && !activeShape.hasStroke} style={{ padding: '0', height: '24px', width: '40px', border: 'none', marginLeft: 'auto' }} value={activeShape.strokeColor || '#18181b'} onChange={(e) => updateShape(activeShape.id, { strokeColor: e.target.value })} />
              </div>

              {(activeShape.hasStroke || activeShape.type === 'line') && (
                <div className="control-group">
                  <label>선 두께: {activeShape.type === 'line' ? activeShape.height : (activeShape.strokeWidth || 2)}px</label>
                  <input type="range" min="1" max="20" value={activeShape.type === 'line' ? activeShape.height : (activeShape.strokeWidth || 2)} onChange={(e) => updateShape(activeShape.id, activeShape.type === 'line' ? { height: Number(e.target.value) } : { strokeWidth: Number(e.target.value) })} />
                </div>
              )}

              <div className="control-group">
                <label>전체 불투명도: {Math.round((activeShape.opacity ?? 1) * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05" value={activeShape.opacity ?? 1} onChange={(e) => updateShape(activeShape.id, { opacity: Number(e.target.value) })} />
              </div>
            </>
          )}

          {activeLayer && (
            <>
              <div className="control-group">
                <label>문구</label>
                <textarea aria-label="문구" className="control-input" rows="3" value={activeLayer.text} onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="control-group" style={{ flex: 1 }}>
                  <label>글꼴</label>
                  <select className="control-input" value={activeLayer.fontFamily || 'sans-serif'} onChange={(e) => updateLayer(activeLayer.id, { fontFamily: e.target.value })}>
                    <option value="sans-serif">기본 (고딕)</option>
                    <option value="serif">명조</option>
                    <option value="monospace">고정폭</option>
                  </select>
                </div>
                <div className="control-group" style={{ flex: 1 }}>
                  <NumberField label="글자 크기" min={1} max={1000} step={0.5} value={activeLayer.size} onChange={size => updateLayer(activeLayer.id, { size })} />
                </div>
              </div>
              <div className="control-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input type="checkbox" id="gradient-toggle" checked={activeLayer.useGradient || false} onChange={(e) => updateLayer(activeLayer.id, { useGradient: e.target.checked })} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
                <label htmlFor="gradient-toggle" style={{ cursor: 'pointer' }}>그라데이션 사용</label>
              </div>

              {!activeLayer.useGradient ? (
                <div className="control-group" style={{ width: '60px', marginTop: '8px' }}>
                  <label>단일 색상</label>
                  <input type="color" className="control-input" style={{ padding: '0', height: '32px', width: '100%', border: 'none' }} value={activeLayer.color} onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })} />
                </div>
              ) : (
                <div className="control-group" style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>색상 분할 ({currentGradientColors.length}/5)</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="action-sm-btn" onClick={() => updateLayer(activeLayer.id, { gradientColors: currentGradientColors.slice(0, -1) })} disabled={currentGradientColors.length <= 2}>-</button>
                      <button className="action-sm-btn" onClick={() => updateLayer(activeLayer.id, { gradientColors: [...currentGradientColors, '#ffffff'] })} disabled={currentGradientColors.length >= 5}>+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {currentGradientColors.map((color, index) => (
                      <input key={index} type="color" className="control-input" style={{ padding: '0', height: '32px', width: '40px', border: 'none' }} value={color} onChange={(e) => handleGradientChange(index, e.target.value)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeSticker && (
            <div className="control-group">
              <label>크기 조절: {activeSticker.width}px</label>
              <input type="range" min="20" max="400" value={activeSticker.width} onChange={(e) => updateSticker(activeSticker.id, { width: Number(e.target.value), height: Number(e.target.value) })} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
