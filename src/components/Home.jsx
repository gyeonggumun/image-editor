export const TOOLS = [
  { id: 'edit', number: '01', title: '이미지 편집', en: 'IMAGE EDITOR', description: '작은 문구부터 레이아웃까지. 텍스트와 도형을 원하는 자리에.', mark: 'Aa', detail: '텍스트 · 레이어 · 도형' },
  { id: 'resize', number: '02', title: '크기 조절', en: 'IMAGE RESIZE', description: '필요한 규격에 정확하게. 픽셀 크기와 비율을 직접 설정하세요.', mark: '↗', detail: '픽셀 입력 · 비율 유지' },
  { id: 'enhance', number: '03', title: '화질 보정', en: 'IMAGE ENHANCE', description: '조금 더 또렷하게. 선명도와 색감을 다듬고 크게 저장하세요.', mark: '◐', detail: '선명도 · 색감 · 최대 4× 확대' },
  { id: 'pdf', number: '04', title: 'PDF 변환', en: 'IMAGE TO PDF', description: '한 장의 이미지도, 여러 장의 시안도. 하나의 문서로 정리하세요.', mark: '↓', detail: '다중 이미지 · 페이지 설정' },
  { id: 'logo', number: '05', title: '로고 크기 만들기', en: 'LOGO SIZE', description: '작은 아이콘부터 가로형 로고까지. 여백과 크기를 맞춰 저장하세요.', mark: 'Lg.', detail: '로고 규격 · 투명 PNG' },
];

export default function Home({ onSelect, hasWork }) {
  return <main className="home-page">
    <section className="home-intro">
      <div><span className="eyebrow">A SMALL STUDIO FOR YOUR EVERYDAY WORK</span><h1>이미지를 다루는<br />가장 단정한 작업실<span>.</span></h1><p>아이디어에 필요한 도구만, 손이 닿는 곳에.<br />편집부터 최종 파일까지 한곳에서 완성하세요.</p><button className="primary-button" onClick={() => onSelect('edit')}>{hasWork ? '이어서 작업하기' : '편집 시작하기'} <span>↗</span></button></div>
      <div className="specimen" aria-hidden="true"><span className="specimen-index">STUDIO NOTES — Nº 001</span><div className="specimen-art"><i /><i /><i /><div className="specimen-type">Make<br /><em>room.</em></div><span className="specimen-cross">+</span></div><div className="specimen-caption"><span>작은 디테일이 만드는 차이</span><span>1080 × 1080</span></div></div>
    </section>
    <section className="tool-section" aria-labelledby="tools-title"><div className="section-heading"><h2 id="tools-title">어떤 작업을 시작할까요?</h2><span>YOUR TOOLKIT / {String(TOOLS.length).padStart(2, '0')}</span></div><div className="tool-grid">{TOOLS.map(tool => <button className={`tool-card tool-${tool.id}`} key={tool.id} onClick={() => onSelect(tool.id)}><div className="tool-card-top"><span>{tool.number} / {tool.en}</span><span>↗</span></div><div className="tool-mark" aria-hidden="true">{tool.mark}</div><h3>{tool.title}</h3><p>{tool.description}</p><div className="tool-detail">{tool.detail}<span>→</span></div></button>)}</div></section>
    <div className="home-footnote"><span><i /> 이미지 편집과 변환은 브라우저 안에서 처리됩니다.</span><span>설치 없이 · 회원가입 없이</span></div>
  </main>;
}
