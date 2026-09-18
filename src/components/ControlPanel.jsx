import useEditorStore from '../store/useEditorStore';
import BackgroundSettings from './panel/BackgroundSettings';
import ElementLists from './panel/ElementLists';
import PropertyEditor from './panel/PropertyEditor';

export default function ControlPanel() {
  const {
    errorMessage,
    past,
    future,
    undo,
    redo,
    image,
    maskMode,
    maskBrushSize,
    maskStrokes,
    setMaskMode,
    setMaskBrushSize,
    clearMaskSelection
  } = useEditorStore();

  return (
    <>
      <div className="panel-header">
        <h2 className="panel-title">스튜디오 설정</h2>
        <div className="history-actions">
          <button className="action-sm-btn" onClick={undo} disabled={past.length === 0} title="실행 취소">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5H9" strokeLinecap="round"/><path d="M3 10l6-6M3 10l6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="action-sm-btn" onClick={redo} disabled={future.length === 0} title="다시 실행">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 0 0-5 5v2a5 5 0 0 0 5 5h4" strokeLinecap="round"/><path d="M21 10l-6-6M21 10l-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
      
      {errorMessage && (
        <div className="status-message">
          {errorMessage}
        </div>
      )}

      <section className="mask-tool-card" aria-label="개체 지우기 마스크 도구">
        <div className="mask-tool-header">
          <div>
            <span className="mask-tool-kicker">AI 지우개 준비</span>
            <h3>개체 지우기 마스크</h3>
          </div>
          <span className={`mask-tool-state${maskMode ? ' is-active' : ''}`}>
            {maskMode ? '선택 중' : '준비됨'}
          </span>
        </div>
        <p>지우고 싶은 사람이나 물체를 브러시로 칠해 영역을 표시하세요.</p>
        <div className="mask-tool-note">현재는 선택 영역만 표시하며 AI API를 호출하지 않습니다.</div>
        <button
          className={`secondary-btn mask-toggle${maskMode ? ' is-active' : ''}`}
          type="button"
          disabled={!image}
          onClick={() => setMaskMode(!maskMode)}
        >
          {maskMode ? '선택 완료' : '마스크 선택 시작'}
        </button>
        {maskMode && (
          <div className="mask-tool-controls">
            <div className="mask-size-row">
              <label htmlFor="mask-brush-size">브러시 크기</label>
              <strong>{maskBrushSize}px</strong>
            </div>
            <input
              id="mask-brush-size"
              type="range"
              min="12"
              max="160"
              step="4"
              value={maskBrushSize}
              onChange={(e) => setMaskBrushSize(Number(e.target.value))}
            />
            <div className="mask-tool-footer">
              <span>{maskStrokes.length > 0 ? `${maskStrokes.length}개 영역 표시됨` : '캔버스에서 영역을 칠하세요'}</span>
              <button className="action-sm-btn" type="button" onClick={clearMaskSelection} disabled={maskStrokes.length === 0}>
                초기화
              </button>
            </div>
          </div>
        )}
        {!image && <span className="mask-tool-hint">먼저 배경 이미지를 추가하면 사용할 수 있습니다.</span>}
      </section>

      {/* 🌟 기능별로 분리된 컴포넌트 조합 */}
      <BackgroundSettings />
      <ElementLists />
      <PropertyEditor />
    </>
  );
}
