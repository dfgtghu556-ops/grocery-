export type Priority = 'essential' | 'important' | 'optional' | 'luxury';
export type Source = 'csd' | 'market' | 'online' | 'other' | 'remove';

export interface OnlinePriceOffer {
  id: string;
  store: string;
  price: number;
  packQuantity: number;
  packUnit: 'kg' | 'g' | 'L' | 'ml' | 'piece';
  checkedAt: string;
  area?: string;
  postalCode?: string;
  url?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  priority: Priority;
  source: Source;
  estimatedPrice: number;
  actualPrice?: number;
  checked: boolean;
  frequencyMonths: number;
  csdPrice?: number;
  marketPrice?: number;
  store?: string;
  brand?: string;
  receiptId?: string;
  receiptLabel?: string;
  receiptDate?: string;
  reviewRequired?: boolean;
  priceNeedsReview?: boolean;
  catalogId?: string;
  onlineOffers?: OnlinePriceOffer[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  monthlyUse: number;
  unit: string;
  unitPrice: number;
}

export interface ReceiptSummary {
  id: string;
  label: string;
  date: string;
  store: string;
  itemCount: number;
  lineTotal: number;
  gross?: number;
  discount?: number;
  note: string;
}

export interface Household {
  name: string;
  members: number;
  adults: number;
  children: number;
  seniors: number;
}

export interface AppState {
  budget: number;
  bufferPercent: number;
  household: Household;
  items: ShoppingItem[];
  inventory: InventoryItem[];
  rules: string[];
  categoryBudgets: Record<string, number>;
  shoppingArea: string;
  postalCode: string;
  preferredOnlineStore: string;
  month: string;
}

export type Page = 'home' | 'shopping' | 'budget' | 'inventory' | 'settings';
