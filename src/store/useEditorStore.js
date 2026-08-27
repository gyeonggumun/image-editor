import { create } from 'zustand';

const useEditorStore = create((set) => ({
  image: null,
  ratio: '1:1',
  // 텍스트 레이어들을 배열로 관리
  layers: [
    { id: Date.now(), text: '첫 번째 문구\n드래그 해보세요', x: 50, y: 50, size: 40, color: '#ffffff' }
  ],
  activeLayerId: null, // 현재 선택된 레이어 ID
  templates: [],
  errorMessage: '',

  setImage: (img) => set({ image: img }),
  setRatio: (ratio) => set({ ratio }),
  
  // 레이어 추가
  addLayer: () => set((state) => {
    const newLayer = {
      id: Date.now(),
      text: '새로운 텍스트',
      x: 100,
      y: 100,
      size: 40,
      color: '#ffffff'
    };
    return { layers: [...state.layers, newLayer], activeLayerId: newLayer.id };
  }),
  
  // 특정 레이어 업데이트
  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map(layer => layer.id === id ? { ...layer, ...updates } : layer)
  })),
  
  // 특정 레이어 삭제
  deleteLayer: (id) => set((state) => ({
    layers: state.layers.filter(layer => layer.id !== id),
    activeLayerId: state.activeLayerId === id ? null : state.activeLayerId
  })),

  setActiveLayer: (id) => set({ activeLayerId: id }),
  setTemplates: (templates) => set({ templates }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));

export default useEditorStore;