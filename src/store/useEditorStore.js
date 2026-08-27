import { create } from 'zustand';

const useEditorStore = create((set) => ({
  image: null,
  ratio: '1:1',
  
  layers: [
    { id: Date.now(), text: '첫 번째 문구', x: 50, y: 50, size: 40, color: '#ffffff' }
  ],
  activeLayerId: null,

  // 🌟 스티커 상태 추가
  stickers: [], 
  activeStickerId: null,

  templates: [],
  errorMessage: '',

  setImage: (img) => set({ image: img }),
  setRatio: (ratio) => set({ ratio }),
  
  // 텍스트 레이어 액션
  addLayer: () => set((state) => {
    const newLayer = { id: Date.now(), text: '새로운 텍스트', x: 100, y: 100, size: 40, color: '#ffffff' };
    return { layers: [...state.layers, newLayer], activeLayerId: newLayer.id, activeStickerId: null };
  }),
  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map(layer => layer.id === id ? { ...layer, ...updates } : layer)
  })),
  deleteLayer: (id) => set((state) => ({
    layers: state.layers.filter(layer => layer.id !== id),
    activeLayerId: state.activeLayerId === id ? null : state.activeLayerId
  })),

  // 🌟 스티커 액션 추가
  addSticker: (src) => set((state) => {
    const newSticker = { id: Date.now(), src, x: 150, y: 150, width: 100, height: 100 };
    return { stickers: [...state.stickers, newSticker], activeStickerId: newSticker.id, activeLayerId: null };
  }),
  updateSticker: (id, updates) => set((state) => ({
    stickers: state.stickers.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  deleteSticker: (id) => set((state) => ({
    stickers: state.stickers.filter(s => s.id !== id),
    activeStickerId: state.activeStickerId === id ? null : state.activeStickerId
  })),

  // 선택 상태 관리 (상호 배제)
  setActiveLayer: (id) => set({ activeLayerId: id, activeStickerId: null }),
  setActiveSticker: (id) => set({ activeStickerId: id, activeLayerId: null }),
  
  // 템플릿용
  setLayers: (layers) => set({ layers }), 
  setStickers: (stickers) => set({ stickers }),
  setTemplates: (templates) => set({ templates }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));

export default useEditorStore;