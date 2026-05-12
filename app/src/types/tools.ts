export type ToolMode = 'SELECT' | 'ADD_CIRCLE' | 'ADD_SQUARE';

export interface ToolConfig {
  mode: ToolMode;
  label: string;
  icon: string;
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  { mode: 'SELECT', label: 'SELECT', icon: '🖱️' },
  { mode: 'ADD_CIRCLE', label: 'CIRCLE', icon: '⭕' },
  { mode: 'ADD_SQUARE', label: 'SQUARE', icon: '🟩' },
];
