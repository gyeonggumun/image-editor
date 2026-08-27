import { create } from 'zustand';

const useEditorStore = create((set) => ({
  image: null,
  ratio: '1:1',
  layers: [
    { id: Date.now(), text: '첫 번째 문구\n드래그 해보세요', x: 50, y: 50, size: 40, color: '#ffffff' }
  ],
  activeLayerId: null,
  templates: [],
  errorMessage: '',

  setImage: (img) => set({ image: img }),
  setRatio: (ratio) => set({ ratio }),
  
  addLayer: () => set((state) => {
    const newLayer = {
      id: Date.now(),
      text: '새로운 텍스트',
      x: 100, y: 100, size: 40, color: '#ffffff'
    };
    return { layers: [...state.layers, newLayer], activeLayerId: newLayer.id };
  }),
  
  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map(layer => layer.id === id ? { ...layer, ...updates } : layer)
  })),
  
  deleteLayer: (id) => set((state) => ({
    layers: state.layers.filter(layer => layer.id !== id),
    activeLayerId: state.activeLayerId === id ? null : state.activeLayerId
  })),

  setActiveLayer: (id) => set({ activeLayerId: id }),
  
  // 👇 템플릿 불러오기를 위해 추가된 액션
  setLayers: (layers) => set({ layers }), 
  
  setTemplates: (templates) => set({ templates }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));

export default useEditorStore;