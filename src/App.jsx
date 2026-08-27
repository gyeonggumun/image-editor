import './App.css';
import ControlPanel from './components/ControlPanel';
import TemplateManager from './components/TemplateManager';
import CanvasPreview from './components/CanvasPreview';

function App() {
  return (
    <div className="editor-layout">
      <div className="control-panel">
        <ControlPanel />
        <TemplateManager />
      </div>
      <CanvasPreview />
    </div>
  );
}

export default App;