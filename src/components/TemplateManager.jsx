import { useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

const getUserId = () => {
  let id = localStorage.getItem('editor_user_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `editor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('editor_user_id', id);
  }
  return id;
};

const RATIOS = ['1:1', '4:5', '9:16'];
const DEFAULT_IMAGE_FILTERS = { brightness: 100, contrast: 100, grayscale: 0, blur: 0 };
const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const normalizeTemplate = (template, index) => {
  if (!template || typeof template !== 'object' || !Array.isArray(template.layers) || !Array.isArray(template.stickers)) {
    throw new Error('레이어와 에셋 목록이 없는 템플릿이 포함되어 있습니다.');
  }
  return {
    id: template.id ?? `imported-${Date.now()}-${index}`,
    name: typeof template.name === 'string' && template.name.trim() ? template.name : `템플릿 ${index + 1}`,
    ratio: RATIOS.includes(template.ratio) ? template.ratio : '1:1',
    tag: typeof template.tag === 'string' ? template.tag : '기본',
    layers: template.layers.map((layer, layerIndex) => ({
      id: layer.id ?? `layer-${Date.now()}-${index}-${layerIndex}`,
      text: String(layer.text ?? ''), x: numberOr(layer.x, 50), y: numberOr(layer.y, 50), size: numberOr(layer.size, 40),
      color: typeof layer.color === 'string' ? layer.color : '#18181b', useGradient: Boolean(layer.useGradient),
      fontFamily: typeof layer.fontFamily === 'string' ? layer.fontFamily : 'sans-serif',
      gradientColors: Array.isArray(layer.gradientColors) && layer.gradientColors.length >= 2 ? layer.gradientColors : ['#18181b', '#a1a1aa'],
    })),
    stickers: template.stickers.map((sticker, stickerIndex) => ({
      id: sticker.id ?? `sticker-${Date.now()}-${index}-${stickerIndex}`, src: String(sticker.src ?? ''),
      x: numberOr(sticker.x, 150), y: numberOr(sticker.y, 150), width: numberOr(sticker.width, 100), height: numberOr(sticker.height, 100),
    })),
    shapes: (Array.isArray(template.shapes) ? template.shapes : []).map((shape, shapeIndex) => ({
      id: shape.id ?? `shape-${Date.now()}-${index}-${shapeIndex}`, type: ['rect', 'circle', 'line'].includes(shape.type) ? shape.type : 'rect',
      x: numberOr(shape.x, 100), y: numberOr(shape.y, 100), width: numberOr(shape.width, 150), height: numberOr(shape.height, 150),
      fill: typeof shape.fill === 'string' ? shape.fill : '#e5e7eb', opacity: numberOr(shape.opacity, 1), hasFill: shape.hasFill ?? true,
      hasStroke: Boolean(shape.hasStroke), strokeColor: typeof shape.strokeColor === 'string' ? shape.strokeColor : '#18181b',
      strokeWidth: numberOr(shape.strokeWidth, 2), borderRadius: numberOr(shape.borderRadius, 0),
    })),
    imageFilters: { ...DEFAULT_IMAGE_FILTERS, ...(template.imageFilters || {}) },
  };
};

function TemplateManager() {
  const store = useEditorStore();
  const setTemplates = useEditorStore(state => state.setTemplates);
  const setErrorMessage = useEditorStore(state => state.setErrorMessage);
  const [saveTag, setSaveTag] = useState('기본');
  const [filterTag, setFilterTag] = useState('전체');
  const [isLoading, setIsLoading] = useState(false);
  
  const categories = ['기본', 'SNS', '전단지', '약도'];
  const userId = getUserId();

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/templates?userId=${userId}`);
        if (!res.ok) throw new Error('템플릿 API 응답 오류');
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : data.templates || []);
      } catch {
        setErrorMessage('클라우드 템플릿을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, [setTemplates, setErrorMessage, userId]);

  const syncToCloud = async (updatedTemplates) => {
    try {
      const res = await fetch(`/api/templates?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: updatedTemplates })
      });
      if (!res.ok) throw new Error('템플릿 API 응답 오류');
      const data = await res.json().catch(() => ({}));
      if (data.success === false) throw new Error('클라우드 저장소를 사용할 수 없습니다.');
      return true;
    } catch {
      setErrorMessage('클라우드 동기화에 실패했습니다. 현재 작업은 이 브라우저에만 유지됩니다.');
      return false;
    }
  };

  const saveTemplate = async () => {
    const newTemplate = {
      id: Date.now(),
      name: `템플릿 ${store.templates.length + 1}`,
      ratio: store.ratio,
      layers: store.layers,
      stickers: store.stickers,
      shapes: store.shapes,
      imageFilters: store.imageFilters,
      tag: saveTag
    };
    const updated = [...store.templates, newTemplate];
    store.setTemplates(updated);
    await syncToCloud(updated);
  };

  const loadTemplate = (tmpl) => {
    store.saveHistory();
    store.setRatio(tmpl.ratio);
    store.setLayers(tmpl.layers || []); 
    store.setStickers(tmpl.stickers || []); 
    store.setShapes(tmpl.shapes || []);
    store.setImageFilters(tmpl.imageFilters || DEFAULT_IMAGE_FILTERS);
    store.clearSelection();
    setErrorMessage('');
  };

  const deleteTemplate = async (id) => {
    const updated = store.templates.filter(t => t.id !== id);
    store.setTemplates(updated);
    await syncToCloud(updated);
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(store.templates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'templates.json';
    link.href = url;
    link.click();
  };

  const importJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error("배열 형태가 아닙니다.");
        const normalized = parsed.map(normalizeTemplate);
        store.setTemplates(normalized);
        const synced = await syncToCloud(normalized);
        if (synced) setErrorMessage('');
      } catch {
        setErrorMessage('잘못된 JSON 파일입니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const filteredTemplates = store.templates.filter(t => 
    filterTag === '전체' ? true : (t.tag || '기본') === filterTag
  );

  return (
    <>
      <hr style={{ margin: '24px 0', borderColor: 'var(--border-base)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 className="template-section-title" style={{ margin: 0 }}>템플릿 보관함</h3>
        {isLoading && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>동기화 중...</span>}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="control-input" style={{ padding: '8px', width: '90px' }} value={saveTag} onChange={(e) => setSaveTag(e.target.value)}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button className="secondary-btn" style={{ flex: 1, backgroundColor: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'var(--accent)' }} onClick={saveTemplate}>클라우드에 저장</button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary-btn" style={{ flex: 1 }} onClick={exportJSON}>내보내기</button>
          <label className="file-upload-label" style={{ flex: 1, margin: 0 }}>
            가져오기
            <input type="file" accept=".json" className="file-upload-input" onChange={importJSON} />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '15px', flexWrap: 'wrap' }}>
        {['전체', ...categories].map(tag => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            style={{
              padding: '6px 12px', fontSize: '12px', fontWeight: '500', borderRadius: '20px', cursor: 'pointer',
              border: `1px solid ${filterTag === tag ? 'var(--text-primary)' : 'var(--border-base)'}`,
              backgroundColor: filterTag === tag ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
              color: filterTag === tag ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <ul className="template-list">
        {filteredTemplates.length > 0 ? filteredTemplates.map(tmpl => (
          <li key={tmpl.id} className="template-item">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>[{tmpl.tag || '기본'}] {tmpl.ratio}</span>
              <span>{tmpl.name}</span>
            </div>
            <div className="template-actions">
              <button className="action-sm-btn" onClick={() => loadTemplate(tmpl)}>적용</button>
              <button className="action-sm-btn delete" onClick={() => deleteTemplate(tmpl.id)}>삭제</button>
            </div>
          </li>
        )) : (
          <li style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)', fontSize: '13px', border: '1px dashed var(--border-base)', borderRadius: 'var(--radius-md)' }}>저장된 템플릿이 없습니다.</li>
        )}
      </ul>
    </>
  );
}

export default TemplateManager;
