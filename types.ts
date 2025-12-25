
export enum ChefCategory {
  SOUS = 'Sous Chef',
  STATION = 'Station Chef',
  TRAINEE = 'Trainee Chef',
  JUNIOR = 'Junior Chef'
}

export type ActionIconType = 'cooking' | 'resting' | 'waiting' | 'baking' | 'default';

export interface Ingredient {
  id: string;
  name: string;
  image: string;
  quantity: string;
}

export interface Node {
  id: string;
  type: 'ingredient' | 'action-result';
  label: string;
  quantity: string;
  image?: string;
  duration?: number;
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  action: string;
  iconType: ActionIconType;
}

export interface MethodStep {
  id: string;
  stepNumber: number;
  action: string;
  ingredients: string[];
  durationMinutes: number;
  startTime: string; // e.g. "08:00 am"
  chef: ChefCategory;
  resultLabel: string;
}

export interface AppState {
  ingredients: Ingredient[];
  nodes: Node[];
  edges: Edge[];
  steps: MethodStep[];
}
