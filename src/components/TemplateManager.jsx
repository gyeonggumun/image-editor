import { useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

const getUserId = () => {
  let id = localStorage.getItem('editor_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('editor_user_id', id);
  }
  return id;
};

function TemplateManager() {
  const store = useEditorStore();
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
        if (res.ok) {
          const data = await res.json();
          store.setTemplates(data || []);
        }
      } catch (e) {
        store.setErrorMessage('클라우드 템플릿을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []); 

  const syncToCloud = async (updatedTemplates) => {
    try {
      await fetch(`/api/templates?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: updatedTemplates })
      });
    } catch (e) {
      store.setErrorMessage('클라우드 동기화에 실패했습니다.');
    }
  };

  const saveTemplate = async () => {
    const newTemplate = {
      id: Date.now(),
      name: `템플릿 ${store.templates.length + 1}`,
      ratio: store.ratio,
      layers: store.layers,
      stickers: store.stickers,
      tag: saveTag
    };
    const updated = [...store.templates, newTemplate];
    store.setTemplates(updated);
    await syncToCloud(updated);
  };

  const loadTemplate = (tmpl) => {
    store.setRatio(tmpl.ratio);
    store.setLayers(tmpl.layers || []); 
    store.setStickers(tmpl.stickers || []); 
    store.setActiveLayer(null);
    store.setActiveSticker(null);
    store.setErrorMessage('');
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
        
        store.setTemplates(parsed);
        await syncToCloud(parsed);
        store.setErrorMessage('');
      } catch (err) {
        store.setErrorMessage('잘못된 JSON 파일입니다.');
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