import './App.css';
import ControlPanel from './components/ControlPanel';
import TemplateManager from './components/TemplateManager';
import CanvasPreview from './components/CanvasPreview';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-icon" aria-hidden="true">✦</span>
          <div className="brand-copy">
            <strong>Image Studio</strong>
            <span>간결한 이미지 편집 작업 공간</span>
          </div>
        </div>
        <div className="header-note">
          <span className="status-dot" aria-hidden="true" />
          브라우저에서 안전하게 작업 중
        </div>
      </header>

      <main className="editor-layout">
        <aside className="control-panel">
          <ControlPanel />
          <TemplateManager />
        </aside>
        <section className="preview-column" aria-label="이미지 미리보기">
          <div className="preview-heading">
            <div className="preview-heading-copy">
              <strong>작업 미리보기</strong>
              <span>변경 사항이 캔버스에 실시간으로 반영됩니다.</span>
            </div>
            <span className="preview-badge">실시간 반영</span>
          </div>
          <CanvasPreview />
        </section>
      </main>

      <footer className="app-footer">Image Studio · 로컬 우선 편집 환경</footer>
    </div>
  );
}

export default App;
