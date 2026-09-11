import useEditorStore from '../store/useEditorStore';
import BackgroundSettings from './panel/BackgroundSettings';
import ElementLists from './panel/ElementLists';
import PropertyEditor from './panel/PropertyEditor';

export default function ControlPanel() {
  const { errorMessage, past, future, undo, redo } = useEditorStore();

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-base)', paddingBottom: '12px', marginBottom: '20px' }}>
        <h2 className="panel-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>스튜디오 설정</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="action-sm-btn" onClick={undo} disabled={past.length === 0} title="실행 취소">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5H9" strokeLinecap="round"/><path d="M3 10l6-6M3 10l6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="action-sm-btn" onClick={redo} disabled={future.length === 0} title="다시 실행">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 0 0-5 5v2a5 5 0 0 0 5 5h4" strokeLinecap="round"/><path d="M21 10l-6-6M21 10l-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
      
      {errorMessage && (
        <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center', fontSize: '13px' }}>
          {errorMessage}
        </div>
      )}

      {/* 🌟 기능별로 분리된 컴포넌트 조합 */}
      <BackgroundSettings />
      <ElementLists />
      <PropertyEditor />
    </>
  );
}