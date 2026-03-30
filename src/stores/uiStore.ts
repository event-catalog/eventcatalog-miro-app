import { atom } from 'nanostores';
import type { CategoryType } from '../utils/types';

export interface SelectedNodeInfo {
  id: string;
  name: string;
  type: string;
  version?: string;
  summary?: string;
  connectedTo: { name: string; label: string; direction: 'incoming' | 'outgoing'; boardItemId?: string }[];
}

// State atoms
export const $displayType = atom<'sticky' | 'appcard'>(
  (localStorage.getItem('ec-display-type') as 'sticky' | 'appcard') || 'appcard'
);

export const $activeCategory = atom<CategoryType | null>(
  (localStorage.getItem('ec-active-category') as CategoryType | null) || null
);

export const $searchTerm = atom<string>('');

export const $showRelatedServices = atom<boolean>(localStorage.getItem('ec-show-related') === 'true');

export const $selectedNode = atom<SelectedNodeInfo | null>(null);

export const $editingField = atom<'name' | 'version' | 'summary' | null>(null);

export const $editValue = atom<string>('');

export const $isLayouting = atom<boolean>(false);

// Actions
export function setDisplayType(type: 'sticky' | 'appcard') {
  $displayType.set(type);
  localStorage.setItem('ec-display-type', type);
}

export function setActiveCategory(category: CategoryType | null) {
  $activeCategory.set(category);
  if (category === null) {
    localStorage.removeItem('ec-active-category');
  } else {
    localStorage.setItem('ec-active-category', category);
  }
}

export function setSearchTerm(term: string) {
  $searchTerm.set(term);
}

export function setShowRelatedServices(show: boolean) {
  $showRelatedServices.set(show);
  localStorage.setItem('ec-show-related', String(show));
}

export function setSelectedNode(node: SelectedNodeInfo | null) {
  $selectedNode.set(node);
}

export function startEdit(field: 'name' | 'version' | 'summary', value: string) {
  $editingField.set(field);
  $editValue.set(value);
}

export function cancelEdit() {
  $editingField.set(null);
  $editValue.set('');
}

export function setIsLayouting(loading: boolean) {
  $isLayouting.set(loading);
}
