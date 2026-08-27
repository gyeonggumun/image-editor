import { create } from 'zustand';

const useEditorStore = create((set) => ({
  image: null,
  text: '여기에 텍스트 입력\n줄바꿈도 가능합니다',
  ratio: '1:1',
  textPos: { x: 50, y: 50 },
  textSize: 40,
  textColor: '#ffffff',
  templates: [],
  errorMessage: '',

  setImage: (img) => set({ image: img }),
  setText: (text) => set({ text }),
  setRatio: (ratio) => set({ ratio }),
  setTextPos: (pos) => set((state) => ({ textPos: { ...state.textPos, ...pos } })),
  setTextSize: (textSize) => set({ textSize }),
  setTextColor: (textColor) => set({ textColor }),
  setTemplates: (templates) => set({ templates }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
}));

export default useEditorStore;