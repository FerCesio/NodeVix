export type ToolMode = 'SELECT' | 'ADD_NODE' | 'LINK' | 'ARROW' | 'DELETE_ANY';

export type PanelSection = 'TOOLS' | 'STRUCTURES' | 'ALGORITHMS';

export interface ToolConfig {
  mode: ToolMode;
  label: string;
  icon: string;
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  { mode: 'SELECT', label: 'Seleccionar', icon: '🖱️' },
  { mode: 'ADD_NODE', label: 'Nuevo Nodo', icon: '⚪' },
  { mode: 'LINK', label: 'Link', icon: '🔗' },
  { mode: 'ARROW', label: 'Arrow', icon: '➡️' },
  { mode: 'DELETE_ANY', label: 'Eliminar', icon: '🗑️' }
];