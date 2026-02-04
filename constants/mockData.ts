
import { ChefCategory, Ingredient, Node, Edge, StepGroup, DiscoverySet } from '../types';
import { getIngImage } from '../utils/ui-helpers';

export const MOCK_BUTTER_CHICKEN_INGREDIENTS: Ingredient[] = [
  { id: 'ing_chicken', name: 'Chicken Thighs', quantity: '1.5kg', image: getIngImage('raw chicken') },
  { id: 'ing_butter', name: 'Amul Butter', quantity: '200g', image: getIngImage('butter') },
  { id: 'ing_tomato', name: 'Tomato Purée', quantity: '1L', image: getIngImage('tomato sauce') },
  { id: 'ing_cream', name: 'Heavy Cream', quantity: '300ml', image: getIngImage('cream') },
  { id: 'ing_yogurt', name: 'Greek Yogurt', quantity: '250g', image: getIngImage('yogurt') },
  { id: 'ing_gg_paste', name: 'Ginger Garlic', quantity: '50g', image: getIngImage('ginger garlic paste') },
  { id: 'ing_spices', name: 'Kashmiri Mirch', quantity: '5 tbsp', image: getIngImage('spices') },
];

export const INITIAL_NODES: Node[] = [
  { id: 'node_raw', type: 'input', label: 'BONELESS THIGHS', image: getIngImage('raw chicken'), quantity: '1.5KG', x: 100, y: 300, content: 'Trim fat and cut into 2-inch chunks.' },
  { id: 'node_marinade', type: 'instructions', label: 'FIRST MARINATION', image: getIngImage('spiced chicken'), quantity: '1.6KG', x: 500, y: 300, content: 'Ginger-garlic paste, lemon, and kashmiri mirch chill for 30m.', duration: 30 },
  { id: 'node_sauce', type: 'instructions', label: 'MAKHANI GRAVY', image: getIngImage('simmering tomato'), quantity: '1.2L', x: 500, y: 650, content: 'Slow simmered tomatoes with whole spices and butter.', duration: 60 },
  { id: 'node_finish', type: 'instructions', label: 'FINAL ASSEMBLY', image: getIngImage('butter chicken plating'), quantity: '2.5KG', x: 900, y: 450, content: 'Fold cream and kasuri methi into the grilled chicken gravy.', duration: 15 }
];

export const INITIAL_EDGES: Edge[] = [
  { id: 'e1', sourceId: 'node_raw', targetId: 'node_marinade', action: 'MARINATE', iconType: 'resting' },
  { id: 'e2', sourceId: 'node_marinade', targetId: 'node_finish', action: 'COMBINE', iconType: 'cooking' },
  { id: 'e3', sourceId: 'node_sauce', targetId: 'node_finish', action: 'FOLD', iconType: 'cooking' }
];

export const INITIAL_STEP_GROUPS: StepGroup[] = [
  { id: 'g1', label: 'CHICKEN PREP', nodeIds: ['node_raw', 'node_marinade'], color: '#fee2e2', assignedChef: ChefCategory.JUNIOR, startTime: '08:00 AM', durationMinutes: 45 },
  { id: 'g2', label: 'GRAVY PRODUCTION', nodeIds: ['node_sauce'], color: '#fef3c7', assignedChef: ChefCategory.STATION, startTime: '09:30 AM', durationMinutes: 90 },
  { id: 'g3', label: 'SERVICE FINISH', nodeIds: ['node_finish'], color: '#dcfce7', assignedChef: ChefCategory.SOUS, startTime: '12:00 PM', durationMinutes: 45 },
];

export const INITIAL_DISCOVERY_SETS: DiscoverySet[] = [
  {
    id: 'set-1',
    title: 'BUTTER CHICKEN LATTICE A',
    dishes: [
      { id: 'bc-1', name: 'BUTTER CHICKEN', color: '#f87171', x: 10, y: 15, width: 45, height: 60, demand: 98, cookingTime: 45, cost: 12, alternatives: [{name: 'KADHAI CHICKEN', demand: 92, cookingTime: 35, cost: 11}, {name: 'CHICKEN CURRY', demand: 85, cookingTime: 30, cost: 9}, {name: 'TIKKA MASALA', demand: 95, cookingTime: 50, cost: 13}] },
      { id: 'bc-2', name: 'GARLIC NAAN', color: '#fde047', x: 45, y: 10, width: 40, height: 40, demand: 96, cookingTime: 120, cost: 1.5, alternatives: [{name: 'BUTTER NAAN', demand: 94, cookingTime: 120, cost: 1.2}, {name: 'TANDOORI ROTI', demand: 88, cookingTime: 60, cost: 0.8}, {name: 'MISSI ROTI', demand: 75, cookingTime: 90, cost: 2}] },
      { id: 'bc-3', name: 'LASSI', color: '#60a5fa', x: 70, y: 40, width: 25, height: 50, demand: 91, cookingTime: 15, cost: 4, alternatives: [{name: 'CHAAS', demand: 82, cookingTime: 10, cost: 2}, {name: 'MANGO SHAKE', demand: 95, cookingTime: 20, cost: 5}, {name: 'COLD COFFEE', demand: 70, cookingTime: 15, cost: 4.5}] },
      { id: 'bc-4', name: 'GULAB JAMUN', color: '#fb923c', x: 20, y: 65, width: 35, height: 30, demand: 94, cookingTime: 40, cost: 3, alternatives: [{name: 'RASMALAI', demand: 96, cookingTime: 60, cost: 4}, {name: 'GAJAR HALWA', demand: 89, cookingTime: 90, cost: 5}, {name: 'KULFI', demand: 82, cookingTime: 30, cost: 2.5}] },
      { id: 'bc-5', name: 'CHICKEN TIKKA', color: '#4ade80', x: 50, y: 55, width: 45, height: 40, demand: 88, cookingTime: 240, cost: 18, alternatives: [{name: 'PANEER TIKKA', demand: 82, cookingTime: 180, cost: 14}, {name: 'SEEKH KEBAB', demand: 91, cookingTime: 210, cost: 16}, {name: 'FISH FRY', demand: 75, cookingTime: 30, cost: 20}] },
      { id: 'bc-6', name: 'VEG KOLHAPURI', color: '#a78bfa', x: 0, y: 40, width: 30, height: 50, demand: 78, cookingTime: 25, cost: 8, alternatives: [{name: 'PANEER BUTTER', demand: 95, cookingTime: 30, cost: 12}, {name: 'DAL TADKA', demand: 88, cookingTime: 20, cost: 6}, {name: 'MIX VEG', demand: 72, cookingTime: 25, cost: 7}] },
    ]
  },
  {
    id: 'set-2',
    title: 'BUTTER CHICKEN LATTICE B',
    dishes: [
      { id: 'bc2-1', name: 'BUTTER CHICKEN', color: '#f87171', x: 15, y: 10, width: 50, height: 55, demand: 98, cookingTime: 45, cost: 12, alternatives: [{name: 'CHICKEN AFGHANI', demand: 88, cookingTime: 50, cost: 14}, {name: 'WHITE GRAVY CHICKEN', demand: 82, cookingTime: 45, cost: 13}] },
      { id: 'bc2-2', name: 'GARLIC NAAN', color: '#fde047', x: 55, y: 5, width: 35, height: 35, demand: 96, cookingTime: 120, cost: 1.5, alternatives: [{name: 'LACCHA PARATHA', demand: 92, cookingTime: 90, cost: 2.5}, {name: 'RUMALI ROTI', demand: 85, cookingTime: 30, cost: 1.5}] },
      { id: 'bc2-3', name: 'CHAAS', color: '#a5f3fc', x: 75, y: 35, width: 20, height: 60, demand: 82, cookingTime: 10, cost: 2, alternatives: [{name: 'SWEET LASSI', demand: 91, cookingTime: 15, cost: 4}, {name: 'JALJEERA', demand: 78, cookingTime: 5, cost: 1.5}] },
      { id: 'bc2-4', name: 'KADHAI PANEER', color: '#c084fc', x: 5, y: 50, width: 45, height: 45, demand: 95, cookingTime: 30, cost: 12, alternatives: [{name: 'MATAR PANEER', demand: 88, cookingTime: 25, cost: 10}, {name: 'PANEER LABABDAR', demand: 93, cookingTime: 35, cost: 14}] },
      { id: 'bc2-5', name: 'RASMALAI', color: '#fecaca', x: 45, y: 60, width: 40, height: 35, demand: 96, cookingTime: 60, cost: 4, alternatives: [{name: 'RABRI', demand: 92, cookingTime: 120, cost: 6}, {name: 'JALEBI', demand: 95, cookingTime: 45, cost: 3.5}] },
    ]
  }
];
