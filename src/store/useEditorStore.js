// src/store/useEditorStore.js
import { create } from 'zustand';

const useEditorStore = create((set) => ({
  // 1. 상태 (State)
  image: null,
  text: '여기에 텍스트 입력\n줄바꿈도 가능합니다',
  ratio: '1:1',
  textPos: { x: 50, y: 50 },
  textSize: 40,
  textColor: '#ffffff',
  templates: [],
  errorMessage: '',

  // 2. 액션 (Actions) - 상태를 변경하는 함수들
  setImage: (img) => set({ image: img }),
  setText: (newText) => set({ text: newText }),
  setRatio: (newRatio) => set({ ratio: newRatio }),
  setTextPos: (pos) => set((state) => ({ textPos: { ...state.textPos, ...pos } })),
  setTextSize: (size) => set({ textSize: size }),
  setTextColor: (color) => set({ textColor: color }),
  
  // 템플릿 관리 액션
  setTemplates: (newTemplates) => set({ templates: newTemplates }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
}));

export default useEditorStore;