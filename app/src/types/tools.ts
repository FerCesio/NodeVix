import selectIcon from '../assets/icons/select.svg';
import addNodeIcon from '../assets/icons/add-node.svg';
import linkIcon from '../assets/icons/link.svg';
import arrowIcon from '../assets/icons/arrow.svg';
import deleteIcon from '../assets/icons/delete.svg';

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
