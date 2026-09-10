import { create } from 'zustand';

const useEditorStore = create((set, get) => ({
  image: null,
  ratio: '1:1',
  layers: [{ 
    id: Date.now(), text: '첫 번째 문구', x: 50, y: 50, size: 40, 
    color: '#18181b', useGradient: false, fontFamily: 'sans-serif', gradientColors: ['#18181b', '#a1a1aa']
  }],
  stickers: [], 
  shapes: [], // 🌟 도형 상태 추가
  
  selectedLayerIds: [],
  selectedStickerIds: [],
  selectedShapeIds: [], // 🌟 도형 선택 상태
  
  guidelines: { x: null, y: null },
  templates: [],
  errorMessage: '',
  past: [],
  future: [],

  saveHistory: () => {
    const { layers, stickers, shapes } = get();
    set((state) => ({
      past: [...state.past, { 
        layers: JSON.parse(JSON.stringify(layers)), 
        stickers: JSON.parse(JSON.stringify(stickers)),
        shapes: JSON.parse(JSON.stringify(shapes)) // 🌟 도형 히스토리 저장
      }].slice(-30),
      future: []
    }));
  },

  undo: () => {
    const { past, layers, stickers, shapes } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [{ layers: JSON.parse(JSON.stringify(layers)), stickers: JSON.parse(JSON.stringify(stickers)), shapes: JSON.parse(JSON.stringify(shapes)) }, ...state.future],
      layers: previous.layers,
      stickers: previous.stickers,
      shapes: previous.shapes,
      selectedLayerIds: [], selectedStickerIds: [], selectedShapeIds: []
    }));
  },

  redo: () => {
    const { future, layers, stickers, shapes } = get();
    if (future.length === 0) return;
    const next = future[0];
    set((state) => ({
      past: [...state.past, { layers: JSON.parse(JSON.stringify(layers)), stickers: JSON.parse(JSON.stringify(stickers)), shapes: JSON.parse(JSON.stringify(shapes)) }],
      future: state.future.slice(1),
      layers: next.layers,
      stickers: next.stickers,
      shapes: next.shapes,
      selectedLayerIds: [], selectedStickerIds: [], selectedShapeIds: []
    }));
  },

  setImage: (img) => set({ image: img }),
  setRatio: (ratio) => set({ ratio }),
  
  selectItem: (id, type, isMulti) => set((state) => {
    if (isMulti) {
      if (type === 'layer') {
        const isSelected = state.selectedLayerIds.includes(id);
        return { selectedLayerIds: isSelected ? state.selectedLayerIds.filter(i => i !== id) : [...state.selectedLayerIds, id] };
      } else if (type === 'sticker') {
        const isSelected = state.selectedStickerIds.includes(id);
        return { selectedStickerIds: isSelected ? state.selectedStickerIds.filter(i => i !== id) : [...state.selectedStickerIds, id] };
      } else {
        const isSelected = state.selectedShapeIds.includes(id);
        return { selectedShapeIds: isSelected ? state.selectedShapeIds.filter(i => i !== id) : [...state.selectedShapeIds, id] };
      }
    }
    return {
      selectedLayerIds: type === 'layer' ? [id] : [],
      selectedStickerIds: type === 'sticker' ? [id] : [],
      selectedShapeIds: type === 'shape' ? [id] : []
    };
  }),

  clearSelection: () => set({ selectedLayerIds: [], selectedStickerIds: [], selectedShapeIds: [] }),

  moveSelectedItems: (dx, dy) => set((state) => ({
    layers: state.layers.map(l => state.selectedLayerIds.includes(l.id) ? { ...l, x: l.x + dx, y: l.y + dy } : l),
    stickers: state.stickers.map(s => state.selectedStickerIds.includes(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s),
    shapes: state.shapes.map(s => state.selectedShapeIds.includes(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s)
  })),

  // 🌟 도형 추가/수정/삭제 액션
  addShape: (type) => {
    get().saveHistory();
    set((state) => {
      const newShape = { 
        id: Date.now(), type, x: 100, y: 100, 
        width: type === 'line' ? 200 : 150, height: type === 'line' ? 5 : 150, 
        fill: type === 'line' ? '#000000' : '#e5e7eb', 
        opacity: 1 
      };
      return { shapes: [...state.shapes, newShape], selectedShapeIds: [newShape.id], selectedLayerIds: [], selectedStickerIds: [] };
    });
  },
  updateShape: (id, updates) => set((state) => ({
    shapes: state.shapes.map(shape => shape.id === id ? { ...shape, ...updates } : shape)
  })),
  deleteShape: (id) => {
    get().saveHistory();
    set((state) => ({
      shapes: state.shapes.filter(s => s.id !== id),
      selectedShapeIds: state.selectedShapeIds.filter(selectedId => selectedId !== id)
    }));
  },
  reorderShape: (id, direction) => {
    get().saveHistory();
    set((state) => {
      const index = state.shapes.findIndex(s => s.id === id);
      if (index < 0) return state;
      const newShapes = [...state.shapes];
      if (direction === 'up' && index < newShapes.length - 1) [newShapes[index], newShapes[index + 1]] = [newShapes[index + 1], newShapes[index]];
      if (direction === 'down' && index > 0) [newShapes[index], newShapes[index - 1]] = [newShapes[index - 1], newShapes[index]];
      return { shapes: newShapes };
    });
  },

  // 텍스트 레이어 액션 (기존 동일)
  addLayer: () => {
    get().saveHistory();
    set((state) => {
      const newLayer = { id: Date.now(), text: '새로운 텍스트', x: 100, y: 100, size: 40, color: '#18181b', useGradient: false, fontFamily: 'sans-serif', gradientColors: ['#18181b', '#a1a1aa'] };
      return { layers: [...state.layers, newLayer], selectedLayerIds: [newLayer.id], selectedStickerIds: [], selectedShapeIds: [] };
    });
  },
  updateLayer: (id, updates) => set((state) => ({ layers: state.layers.map(layer => layer.id === id ? { ...layer, ...updates } : layer) })),
  deleteLayer: (id) => {
    get().saveHistory();
    set((state) => ({ layers: state.layers.filter(layer => layer.id !== id), selectedLayerIds: state.selectedLayerIds.filter(selectedId => selectedId !== id) }));
  },
  reorderLayer: (id, direction) => {
    get().saveHistory();
    set((state) => {
      const index = state.layers.findIndex(l => l.id === id);
      if (index < 0) return state;
      const newLayers = [...state.layers];
      if (direction === 'up' && index < newLayers.length - 1) [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      if (direction === 'down' && index > 0) [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      return { layers: newLayers };
    });
  },

  // 스티커 액션 (기존 동일)
  addSticker: (src) => {
    get().saveHistory();
    set((state) => {
      const newSticker = { id: Date.now(), src, x: 150, y: 150, width: 100, height: 100 };
      return { stickers: [...state.stickers, newSticker], selectedStickerIds: [newSticker.id], selectedLayerIds: [], selectedShapeIds: [] };
    });
  },
  updateSticker: (id, updates) => set((state) => ({ stickers: state.stickers.map(s => s.id === id ? { ...s, ...updates } : s) })),
  deleteSticker: (id) => {
    get().saveHistory();
    set((state) => ({ stickers: state.stickers.filter(s => s.id !== id), selectedStickerIds: state.selectedStickerIds.filter(selectedId => selectedId !== id) }));
  },
  reorderSticker: (id, direction) => {
    get().saveHistory();
    set((state) => {
      const index = state.stickers.findIndex(s => s.id === id);
      if (index < 0) return state;
      const newStickers = [...state.stickers];
      if (direction === 'up' && index < newStickers.length - 1) [newStickers[index], newStickers[index + 1]] = [newStickers[index + 1], newStickers[index]];
      if (direction === 'down' && index > 0) [newStickers[index], newStickers[index - 1]] = [newStickers[index - 1], newStickers[index]];
      return { stickers: newStickers };
    });
  },

  setGuidelines: (guidelines) => set({ guidelines }),
  setLayers: (layers) => set({ layers }), 
  setStickers: (stickers) => set({ stickers }),
  setShapes: (shapes) => set({ shapes }),
  setTemplates: (templates) => set({ templates }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));

export default useEditorStore;