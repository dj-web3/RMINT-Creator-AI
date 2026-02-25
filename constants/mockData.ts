
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
    title: 'SIGNATURE MAKHANI LATTICE',
    dishes: [
      { id: 'bc-1', name: 'BUTTER CHICKEN', color: '#f87171', x: 5, y: 15, width: 50, height: 60, demand: 98, cookingTime: 45, cost: 12, alternatives: [{name: 'KADHAI CHICKEN', demand: 92, cookingTime: 35, cost: 11}, {name: 'CHICKEN CURRY', demand: 85, cookingTime: 30, cost: 9}] },
      { id: 'bc-2', name: 'NAAN', color: '#fde047', x: 45, y: 5, width: 45, height: 40, demand: 96, cookingTime: 120, cost: 1.5, alternatives: [{name: 'BUTTER NAAN', demand: 94, cookingTime: 120, cost: 1.2}, {name: 'TANDOORI ROTI', demand: 88, cookingTime: 60, cost: 0.8}] },
      { id: 'bc-3', name: 'LASSI', color: '#60a5fa', x: 75, y: 40, width: 20, height: 55, demand: 91, cookingTime: 15, cost: 4, alternatives: [{name: 'CHAAS', demand: 82, cookingTime: 10, cost: 2}] },
      { id: 'bc-4', name: 'GULAB JAMUN', color: '#fb923c', x: 15, y: 65, width: 35, height: 30, demand: 94, cookingTime: 40, cost: 3, alternatives: [{name: 'RASMALAI', demand: 96, cookingTime: 60, cost: 4}] },
      { id: 'bc-5', name: 'CHICKEN TIKKA', color: '#4ade80', x: 50, y: 50, width: 40, height: 45, demand: 88, cookingTime: 240, cost: 18, alternatives: [{name: 'PANEER TIKKA', demand: 82, cookingTime: 180, cost: 14}] },
      { id: 'bc-6', name: 'VEG KOLHAPURI', color: '#a78bfa', x: 0, y: 45, width: 25, height: 45, demand: 78, cookingTime: 25, cost: 8, alternatives: [{name: 'PANEER BUTTER', demand: 95, cookingTime: 30, cost: 12}] },
    ]
  },
  {
    id: 'set-2',
    title: 'STATION PRODUCTION LATTICE B',
    dishes: [
      { id: 'bc2-1', name: 'BUTTER CHICKEN', color: '#f87171', x: 10, y: 10, width: 55, height: 50, demand: 98, cookingTime: 45, cost: 12, alternatives: [{name: 'CHICKEN AFGHANI', demand: 88, cookingTime: 50, cost: 14}] },
      { id: 'bc2-2', name: 'GARLIC NAAN', color: '#fde047', x: 60, y: 5, width: 35, height: 40, demand: 96, cookingTime: 120, cost: 1.5, alternatives: [{name: 'LACCHA PARATHA', demand: 92, cookingTime: 90, cost: 2.5}] },
      { id: 'bc2-3', name: 'CHAAS', color: '#a5f3fc', x: 80, y: 35, width: 15, height: 60, demand: 82, cookingTime: 10, cost: 2, alternatives: [{name: 'SWEET LASSI', demand: 91, cookingTime: 15, cost: 4}] },
      { id: 'bc2-4', name: 'KADHAI PANEER', color: '#c084fc', x: 5, y: 55, width: 40, height: 40, demand: 95, cookingTime: 30, cost: 12, alternatives: [{name: 'MATAR PANEER', demand: 88, cookingTime: 25, cost: 10}] },
      { id: 'bc2-5', name: 'RASMALAI', color: '#fecaca', x: 45, y: 65, width: 45, height: 30, demand: 96, cookingTime: 60, cost: 4, alternatives: [{name: 'RABRI', demand: 92, cookingTime: 120, cost: 6}] },
    ]
  },
  {
    id: 'set-3',
    title: 'COASTAL FUSION LATTICE',
    dishes: [
      { id: 'cf-1', name: 'PRAWN CURRY', color: '#fb923c', x: 15, y: 10, width: 45, height: 55, demand: 94, cookingTime: 20, cost: 22, alternatives: [{name: 'FISH MOILEE', demand: 89, cookingTime: 25, cost: 18}] },
      { id: 'cf-2', name: 'APPAM', color: '#f8fafc', x: 50, y: 5, width: 40, height: 40, demand: 92, cookingTime: 45, cost: 2.5, alternatives: [{name: 'NEER DOSA', demand: 88, cookingTime: 30, cost: 2}] },
      { id: 'cf-3', name: 'TENDER COCONUT', color: '#ecfeff', x: 80, y: 40, width: 15, height: 50, demand: 85, cookingTime: 5, cost: 6, alternatives: [{name: 'SOL KADHI', demand: 91, cookingTime: 10, cost: 3}] },
      { id: 'cf-4', name: 'PAYASAM', color: '#fdf4ff', x: 5, y: 60, width: 35, height: 35, demand: 97, cookingTime: 40, cost: 5, alternatives: [{name: 'UNNI APPAM', demand: 84, cookingTime: 20, cost: 3}] },
      { id: 'cf-5', name: 'SQUID FRY', color: '#86efac', x: 45, y: 50, width: 45, height: 45, demand: 81, cookingTime: 15, cost: 15, alternatives: [{name: 'BOMBAY DUCK', demand: 76, cookingTime: 10, cost: 10}] },
    ]
  },
  {
    id: 'set-4',
    title: 'MODERN STREET LATTICE',
    dishes: [
      { id: 'ms-1', name: 'PANEER TIKKA ROLL', color: '#f472b6', x: 10, y: 10, width: 40, height: 50, demand: 93, cookingTime: 15, cost: 9, alternatives: [{name: 'EGG ROLL', demand: 88, cookingTime: 10, cost: 6}] },
      { id: 'ms-2', name: 'PAV BHAJI', color: '#f87171', x: 45, y: 15, width: 45, height: 45, demand: 99, cookingTime: 30, cost: 7, alternatives: [{name: 'VADA PAV', demand: 95, cookingTime: 5, cost: 3}] },
      { id: 'ms-3', name: 'MASALA CHAI', color: '#78350f', x: 75, y: 50, width: 20, height: 40, demand: 96, cookingTime: 12, cost: 1.5, alternatives: [{name: 'KULHAD COFFEE', demand: 82, cookingTime: 8, cost: 2.5}] },
      { id: 'ms-4', name: 'JALEBI', color: '#fbbf24', x: 20, y: 65, width: 35, height: 30, demand: 95, cookingTime: 45, cost: 4, alternatives: [{name: 'IMARTI', demand: 88, cookingTime: 60, cost: 4.5}] },
      { id: 'ms-5', name: 'MOMOS', color: '#f1f5f9', x: 50, y: 60, width: 30, height: 35, demand: 98, cookingTime: 20, cost: 8, alternatives: [{name: 'DIM SUM', demand: 92, cookingTime: 25, cost: 12}] },
    ]
  }
];
