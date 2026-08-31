import { useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

function TemplateManager() {
  const store = useEditorStore();
  
  // 🌟 카테고리 태그 상태 관리
  const [saveTag, setSaveTag] = useState('기본');
  const [filterTag, setFilterTag] = useState('전체');
  
  const categories = ['기본', 'SNS', '전단지', '약도'];

  useEffect(() => {
    const saved = localStorage.getItem('editorTemplates');
    if (saved) {
      try {
        store.setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('템플릿 복원 실패', e);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveTemplate = () => {
    const newTemplate = {
      id: Date.now(),
      name: `템플릿 ${store.templates.length + 1}`,
      ratio: store.ratio,
      layers: store.layers,
      stickers: store.stickers,
      tag: saveTag // 선택된 태그 함께 저장
    };
    const updated = [...store.templates, newTemplate];
    store.setTemplates(updated);
    localStorage.setItem('editorTemplates', JSON.stringify(updated));
  };

  const loadTemplate = (tmpl) => {
    store.setRatio(tmpl.ratio);
    store.setLayers(tmpl.layers || []); 
    store.setStickers(tmpl.stickers || []); 
    store.setActiveLayer(null);
    store.setActiveSticker(null);
    store.setErrorMessage('');
  };

  const deleteTemplate = (id) => {
    const updated = store.templates.filter(t => t.id !== id);
    store.setTemplates(updated);
    localStorage.setItem('editorTemplates', JSON.stringify(updated));
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

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error("배열 형태가 아닙니다.");
        
        store.setTemplates(parsed);
        localStorage.setItem('editorTemplates', JSON.stringify(parsed));
        store.setErrorMessage('');
      } catch (err) {
        store.setErrorMessage('잘못된 JSON 파일입니다. 기존 템플릿이 유지됩니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  // 선택된 탭에 따라 템플릿 목록 필터링
  const filteredTemplates = store.templates.filter(t => 
    filterTag === '전체' ? true : (t.tag || '기본') === filterTag
  );

  return (
    <>
      <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
      <h3 className="template-section-title">템플릿 관리</h3>
      
      {/* 🌟 템플릿 저장 및 파일 입출력 영역 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            className="control-input" 
            style={{ padding: '8px', width: '90px' }} 
            value={saveTag} 
            onChange={(e) => setSaveTag(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button className="secondary-btn" style={{ flex: 1, backgroundColor: '#4f46e5', color: '#fff', borderColor: '#4f46e5' }} onClick={saveTemplate}>
            현재 설정 저장
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary-btn" style={{ flex: 1 }} onClick={exportJSON}>내보내기 (JSON)</button>
          <label className="file-upload-label" style={{ flex: 1, margin: 0 }}>
            가져오기 (JSON)
            <input type="file" accept=".json" className="file-upload-input" onChange={importJSON} />
          </label>
        </div>
      </div>

      {/* 🌟 태그 필터링 탭 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '15px', flexWrap: 'wrap' }}>
        {['전체', ...categories].map(tag => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              fontWeight: '600',
              borderRadius: '20px',
              cursor: 'pointer',
              border: `1px solid ${filterTag === tag ? '#4f46e5' : '#d1d5db'}`,
              backgroundColor: filterTag === tag ? '#eef2ff' : '#ffffff',
              color: filterTag === tag ? '#4f46e5' : '#4b5563',
              transition: 'all 0.2s'
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 필터링된 템플릿 목록 출력 */}
      <ul className="template-list">
        {filteredTemplates.length > 0 ? filteredTemplates.map(tmpl => (
          <li key={tmpl.id} className="template-item">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold' }}>[{tmpl.tag || '기본'}] {tmpl.ratio}</span>
              <span>{tmpl.name}</span>
            </div>
            <div className="template-actions">
              <button className="action-sm-btn" onClick={() => loadTemplate(tmpl)}>적용</button>
              <button className="action-sm-btn delete" onClick={() => deleteTemplate(tmpl.id)}>삭제</button>
            </div>
          </li>
        )) : (
          <li style={{ textAlign: 'center', padding: '15px', color: '#9ca3af', fontSize: '0.9rem' }}>
            해당 카테고리의 템플릿이 없습니다.
          </li>
        )}
      </ul>
    </>
  );
}

export default TemplateManager;