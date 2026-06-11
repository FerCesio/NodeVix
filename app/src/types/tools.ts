export type ToolMode = 'SELECT' | 'ADD_NODE' | 'LINK' | 'ARROW' | 'DELETE_ANY';

export type PanelSection = 'TOOLS' | 'STRUCTURES' | 'ALGORITHMS';

export interface ToolConfig {
  mode: ToolMode;
  label: string;
  icon: string;
  shortcut: string;
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  { mode: 'SELECT', label: 'Select', icon: '🖱️', shortcut: 'V' },
  { mode: 'ADD_NODE', label: 'Add Node', icon: '⚪', shortcut: 'N' },
  { mode: 'LINK', label: 'Link', icon: '🔗', shortcut: 'L' },
  { mode: 'ARROW', label: 'Arrow', icon: '➡️', shortcut: 'A' },
  { mode: 'DELETE_ANY', label: 'Delete', icon: '🗑️', shortcut: 'D' },
];
