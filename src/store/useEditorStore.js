import { create } from 'zustand';

const useEditorStore = create((set) => ({
  image: null,
  ratio: '1:1',
  layers: [
    { 
      id: Date.now(), text: '첫 번째 문구', x: 50, y: 50, size: 40, 
      color: '#18181b', color2: '#a1a1aa', useGradient: false, fontFamily: 'sans-serif' 
    }
  ],
  activeLayerId: null,
  stickers: [], 
  activeStickerId: null,
  guidelines: { x: null, y: null },
  templates: [],
  errorMessage: '',

  setImage: (img) => set({ image: img }),
  setRatio: (ratio) => set({ ratio }),
  
  addLayer: () => set((state) => {
    const newLayer = { 
      id: Date.now(), text: '새로운 텍스트', x: 100, y: 100, size: 40, 
      color: '#18181b', color2: '#a1a1aa', useGradient: false, fontFamily: 'sans-serif' 
    };
    return { layers: [...state.layers, newLayer], activeLayerId: newLayer.id, activeStickerId: null };
  }),
  
  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map(layer => layer.id === id ? { ...layer, ...updates } : layer)
  })),
  
  deleteLayer: (id) => set((state) => ({
    layers: state.layers.filter(layer => layer.id !== id),
    activeLayerId: state.activeLayerId === id ? null : state.activeLayerId
  })),

  reorderLayer: (id, direction) => set((state) => {
    const index = state.layers.findIndex(l => l.id === id);
    if (index < 0) return state;
    const newLayers = [...state.layers];
    
    if (direction === 'up' && index < newLayers.length - 1) { 
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      return { layers: newLayers };
    }
    if (direction === 'down' && index > 0) { 
      [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      return { layers: newLayers };
    }
    return state;
  }),

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

  reorderSticker: (id, direction) => set((state) => {
    const index = state.stickers.findIndex(s => s.id === id);
    if (index < 0) return state;
    const newStickers = [...state.stickers];
    
    if (direction === 'up' && index < newStickers.length - 1) {
      [newStickers[index], newStickers[index + 1]] = [newStickers[index + 1], newStickers[index]];
      return { stickers: newStickers };
    }
    if (direction === 'down' && index > 0) {
      [newStickers[index], newStickers[index - 1]] = [newStickers[index - 1], newStickers[index]];
      return { stickers: newStickers };
    }
    return state;
  }),

  setActiveLayer: (id) => set({ activeLayerId: id, activeStickerId: null }),
  setActiveSticker: (id) => set({ activeStickerId: id, activeLayerId: null }),
  setGuidelines: (guidelines) => set({ guidelines }),
  setLayers: (layers) => set({ layers }), 
  setStickers: (stickers) => set({ stickers }),
  setTemplates: (templates) => set({ templates }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));

export default useEditorStore;