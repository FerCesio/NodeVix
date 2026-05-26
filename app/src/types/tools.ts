export type ToolMode = 'SELECT' | 'ADD_NODE' | 'CONNECT' | 'DELETE_ANY';

export type PanelSection = 'TOOLS' | 'STRUCTURES' | 'ALGORITHMS';

export interface ToolConfig {
  mode: ToolMode;
  label: string;
  icon: string;
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  { mode: 'SELECT', label: 'Seleccionar', icon: '🖱️' },
  { mode: 'ADD_NODE', label: 'Nuevo Nodo', icon: '⚪' },
  { mode: 'CONNECT', label: 'Conectar', icon: '🔗' },
  { mode: 'DELETE_ANY', label: 'Eliminar', icon: '🗑️' }
];