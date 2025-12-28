
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

export interface SubStep {
  instruction: string;
  duration?: number;
}

export interface StepGroup {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
  isExpanded?: boolean;
  assignedChef?: ChefCategory;
  startTime?: string;
  durationMinutes?: number;
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
  isExpanded?: boolean;
  subSteps?: SubStep[];
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
  startTime: string; 
  chef: ChefCategory;
  resultLabel: string;
}

export interface AppState {
  ingredients: Ingredient[];
  nodes: Node[];
  edges: Edge[];
  steps: MethodStep[];
  stepGroups: StepGroup[];
}
