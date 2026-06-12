import selectIcon from '../assets/icons/select.png';
import addNodeIcon from '../assets/icons/add-node.png';
import linkIcon from '../assets/icons/link.png';
import arrowIcon from '../assets/icons/arrow.png';
import deleteIcon from '../assets/icons/delete.png';

export type ToolMode = 'SELECT' | 'ADD_NODE' | 'LINK' | 'ARROW' | 'DELETE_ANY';

export type PanelSection = 'TOOLS' | 'STRUCTURES' | 'ALGORITHMS';

export interface ToolConfig {
  mode: ToolMode;
  label: string;
  icon: string;
  shortcut: string;
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  { mode: 'SELECT', label: 'Select', icon: selectIcon, shortcut: 'V' },
  { mode: 'ADD_NODE', label: 'Add Node', icon: addNodeIcon, shortcut: 'N' },
  { mode: 'LINK', label: 'Link', icon: linkIcon, shortcut: 'L' },
  { mode: 'ARROW', label: 'Arrow', icon: arrowIcon, shortcut: 'A' },
  { mode: 'DELETE_ANY', label: 'Delete', icon: deleteIcon, shortcut: 'D' },
];
