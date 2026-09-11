import { jsPDF } from 'jspdf';

export default function ExportButtons({ canvasRef }) {
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `result-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isLandscape = canvas.width > canvas.height;
    
    const pdf = new jsPDF({ 
      orientation: isLandscape ? 'landscape' : 'portrait', 
      unit: 'px', 
      format: [canvas.width, canvas.height] 
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`design-export-${Date.now()}.pdf`);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
      <button className="secondary-btn" style={{ flex: 1, padding: '12px', fontWeight: 'bold' }} onClick={handleExportPNG}>
        웹용 이미지(PNG) 다운로드
      </button>
      <button className="action-btn" style={{ flex: 1, margin: 0, padding: '12px', backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 'bold' }} onClick={handleExportPDF}>
        인쇄용 PDF 다운로드
      </button>
    </div>
  );
}