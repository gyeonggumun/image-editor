export default function ZoomControls({ zoom, setZoom, setPan }) {
  return (
    <div style={{ position: 'absolute', bottom: '110px', right: '20px', zIndex: 10, display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-subtle)', border: '1px solid var(--border-base)' }}>
      <button className="action-sm-btn" onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))} title="축소">-</button>
      <span style={{ fontSize: '12px', padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
        {Math.round(zoom * 100)}%
      </span>
      <button className="action-sm-btn" onClick={() => setZoom(prev => Math.min(3, prev + 0.1))} title="확대">+</button>
      <button className="action-sm-btn" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="초기화">Reset</button>
    </div>
  );
}