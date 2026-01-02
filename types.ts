
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
  state?: string;
  composition?: string[];
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

export interface TasteProfile {
  sweet: number;
  bitter: number;
  sour: number;
  umami: number;
  salty: number;
  pungency: number;
  alcohol: number;
  fat: number;
}

export type TasteKey = keyof TasteProfile;

export interface PairingItem {
  id: string;
  name: string;
  image: string;
  flavorProfile: TasteKey[]; 
  alternatives?: PairingItem[];
}

export interface AppState {
  ingredients: Ingredient[];
  nodes: Node[];
  edges: Edge[];
  stepGroups: StepGroup[];
}
