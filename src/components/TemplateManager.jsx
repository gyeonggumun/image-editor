import { useEffect } from 'react';
import useEditorStore from '../store/useEditorStore';

function TemplateManager() {
  const store = useEditorStore();

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
      stickers: store.stickers // 🌟 스티커도 함께 저장
    };
    const updated = [...store.templates, newTemplate];
    store.setTemplates(updated);
    localStorage.setItem('editorTemplates', JSON.stringify(updated));
  };

  const loadTemplate = (tmpl) => {
    store.setRatio(tmpl.ratio);
    store.setLayers(tmpl.layers || []); 
    store.setStickers(tmpl.stickers || []); // 🌟 스티커 복원
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

  return (
    <>
      <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
      <h3 className="template-section-title">템플릿 관리</h3>
      <div className="btn-group">
        <button className="secondary-btn" onClick={saveTemplate}>설정 저장</button>
        <button className="secondary-btn" onClick={exportJSON}>내보내기</button>
        <label className="file-upload-label">
          가져오기
          <input type="file" accept=".json" className="file-upload-input" onChange={importJSON} />
        </label>
      </div>

      <ul className="template-list">
        {store.templates.map(tmpl => (
          <li key={tmpl.id} className="template-item">
            <span>{tmpl.name} ({tmpl.ratio})</span>
            <div className="template-actions">
              <button className="action-sm-btn" onClick={() => loadTemplate(tmpl)}>적용</button>
              <button className="action-sm-btn delete" onClick={() => deleteTemplate(tmpl.id)}>삭제</button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default TemplateManager;