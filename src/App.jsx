import { useState } from 'react';
import './App.css';
import './studio.css';
import Home, { TOOLS } from './components/Home';
import PdfWorkspace from './components/PdfWorkspace';
import LogoWorkspace from './components/LogoWorkspace';
import PropertyEditor from './components/panel/PropertyEditor';
import useEditorStore from './store/useEditorStore';
import ControlPanel from './components/ControlPanel';
import TemplateManager from './components/TemplateManager';
import CanvasPreview from './components/CanvasPreview';

function App() {
  const [page, setPage] = useState('home');
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const store = useEditorStore();
  const activeTool = TOOLS.find(tool => tool.id === page);
  const navigate = page => { store.setMaskMode(false); setPage(page); };
  const hasWork = Boolean(store.image || store.layers.length || store.shapes.length || store.stickers.length);
  return (
    <div className={`app-shell ${page === 'home' ? 'is-home' : 'is-workspace'}`}>
      <header className="app-header">
        <button className="brand-lockup brand-button" onClick={() => navigate('home')} aria-label="Image Studio 홈">
          <span className="brand-icon" aria-hidden="true">is.</span><span className="brand-copy"><strong>Image Studio</strong><span>YOUR EVERYDAY WORKSPACE</span></span>
        </button>
        <nav className="header-navigation" aria-label="주 메뉴"><button className={page === 'home' ? 'active' : ''} onClick={() => navigate('home')}>작업실</button>{TOOLS.map(tool => <button className={page === tool.id ? 'active' : ''} aria-current={page === tool.id ? 'page' : undefined} key={tool.id} onClick={() => navigate(tool.id)}>{tool.title}</button>)}</nav>
        <span className="header-edition">DESIGNED FOR THE DETAILS</span>
      </header>

      {page === 'home' ? <Home onSelect={navigate} hasWork={hasWork} /> : ['pdf', 'logo'].includes(page) ? null : <>
        <div className="workspace-heading"><div><button className="text-button" onClick={() => navigate('home')}>작업실</button><span>/</span><strong>{activeTool.title}</strong></div><span>{store.imageName} <i>·</i> {store.canvasWidth} × {store.canvasHeight} px</span></div>
        <main className={`editor-layout mode-${page}`}>
          <aside className="control-panel"><ControlPanel mode={page} /></aside>
          <section className="preview-column" aria-label="이미지 미리보기"><div className="preview-heading"><span className="eyebrow">{activeTool.en}</span><span>Space 이동 · Ctrl + 휠 확대</span></div><CanvasPreview mode={page} /><div className="canvas-note"><span>방향키 1px 이동 · Shift + 방향키 10px 이동</span><span>Ctrl / ⌘ + Z 실행 취소</span></div></section>
          {page === 'edit' && <aside className="inspector-panel"><div className="section-label"><h3>속성</h3><span>INSPECTOR</span></div><PropertyEditor /><details className="template-details" open={templatesOpen} onToggle={e => setTemplatesOpen(e.currentTarget.open)}><summary>템플릿 보관함</summary>{templatesOpen && <TemplateManager />}</details></aside>}
        </main>
      </>}

      <div hidden={page !== 'pdf'}><PdfWorkspace /></div>
      <div hidden={page !== 'logo'}><LogoWorkspace /></div>
      <footer className="app-footer">Image Studio <span>작은 디테일까지, 나답게.</span></footer>
    </div>
  );
}

export default App;
