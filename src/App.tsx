import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  Apple,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  BarChart3,
  Bath,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Cloud,
  CloudOff,
  Coffee,
  Droplets,
  ExternalLink,
  History,
  MapPin,
  Moon,
  Monitor,
  Home,
  Info,
  Leaf,
  ListChecks,
  Milk,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Sprout,
  Store,
  Target,
  Trash2,
  TrendingDown,
  Wallet,
  Wheat,
  X,
} from 'lucide-react';
import { categories, defaultState, receiptSummaries } from './data';
import { householdCatalog, householdCatalogGroups, type HouseholdCatalogEntry } from './catalog';
import type { AppState, InventoryItem, OnlinePriceOffer, Page, Priority, ShoppingItem, Source } from './types';

const STORAGE_KEY = 'budgetbasket-plan-v2';
const THEME_KEY = 'budgetbasket-theme-v1';
type ThemePreference = 'system' | 'light' | 'dark';

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);

const moneyPrecise = (amount: number) =>
  `₹${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)}`;

const numberFormat = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(value);

const sourceDetails: Record<Source, { label: string; short: string }> = {
  csd: { label: 'CSD', short: 'CSD' },
  market: { label: 'Local market', short: 'Market' },
  online: { label: 'Online', short: 'Online' },
  other: { label: 'Review source', short: 'Review' },
  remove: { label: "Don't buy", short: 'Remove' },
};

const onlineStores = [
  { name: 'JioMart', id: 'JioMart', search: (query: string) => `https://www.jiomart.com/search?q=${encodeURIComponent(query)}` },
  { name: 'BigBasket', id: 'BigBasket', search: (query: string) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}` },
  { name: 'Blinkit', id: 'Blinkit', search: (query: string) => `https://blinkit.com/s/?q=${encodeURIComponent(query)}` },
  { name: 'Zepto', id: 'Zepto', search: (query: string) => `https://www.zepto.com/search?query=${encodeURIComponent(query)}` },
  { name: 'Instamart', id: 'Instamart', search: (query: string) => `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}` },
  { name: 'Amazon', id: 'Amazon', search: (query: string) => `https://www.amazon.in/s?k=${encodeURIComponent(query)}` },
];

function onlineSearchUrl(store: string, query: string): string {
  return (onlineStores.find((entry) => entry.name === store) ?? onlineStores[0]).search(query);
}

function openRetailerSearch(url: string): void {
  if (Capacitor.isNativePlatform()) {
    void Browser.open({ url }).catch(() => { window.open(url, '_blank', 'noopener,noreferrer'); });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function normalizeOffer(offer: OnlinePriceOffer): { rate: number; unit: string } {
  if (offer.packUnit === 'g') return { rate: offer.price / (offer.packQuantity / 1000), unit: 'kg' };
  if (offer.packUnit === 'ml') return { rate: offer.price / (offer.packQuantity / 1000), unit: 'L' };
  return { rate: offer.price / offer.packQuantity, unit: offer.packUnit === 'piece' ? 'piece' : offer.packUnit };
}

function localDateStamp(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

const priorityDetails: Record<Priority, { label: string; className: string }> = {
  essential: { label: 'Essential', className: 'priority-essential' },
  important: { label: 'Important', className: 'priority-important' },
  optional: { label: 'Optional', className: 'priority-optional' },
  luxury: { label: 'Luxury', className: 'priority-luxury' },
};

const navItems: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBasket },
  { id: 'budget', label: 'Budget', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const pageCopy: Record<Page, { title: string; kicker: string }> = {
  home: { title: 'Your month, at a glance', kicker: 'OCTOBER 2026 · HOUSEHOLD PLAN' },
  shopping: { title: 'Shopping list', kicker: 'YOUR MONTHLY BASKET' },
  budget: { title: 'Budget overview', kicker: 'SPENDING PLAN · OCTOBER 2026' },
  inventory: { title: 'Home inventory', kicker: 'STOCK UPDATES YOUR NEXT SHOP' },
  settings: { title: 'Your household', kicker: 'PREFERENCES & PLAN RULES' },
};

function shouldShowTour(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.localStorage.getItem('budgetbasket-tour-complete-v1') !== 'true'; } catch { return true; }
}

function loadThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

function freshDefaultState(): AppState {
  return JSON.parse(JSON.stringify(defaultState)) as AppState;
}

function loadSavedState(): AppState {
  if (typeof window === 'undefined') return freshDefaultState();
  try {
    // Drop the previous demo basket instead of carrying it into the receipt-based plan.
    window.localStorage.removeItem('budgetbasket-plan-v1');
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshDefaultState();
    const saved = JSON.parse(raw) as Partial<AppState>;
    return {
      ...freshDefaultState(),
      ...saved,
      household: { ...defaultState.household, ...saved.household },
      items: Array.isArray(saved.items) ? saved.items : freshDefaultState().items,
      inventory: Array.isArray(saved.inventory) ? saved.inventory : freshDefaultState().inventory,
      rules: Array.isArray(saved.rules) ? saved.rules : [...defaultState.rules],
      categoryBudgets: { ...defaultState.categoryBudgets, ...saved.categoryBudgets },
    };
  } catch {
    return freshDefaultState();
  }
}

function monthlyPrice(item: ShoppingItem): number {
  return item.source === 'remove' ? 0 : item.estimatedPrice / Math.max(1, item.frequencyMonths);
}

function getTotals(state: AppState) {
  const active = state.items.filter((item) => item.source !== 'remove');
  const planned = active.reduce((sum, item) => sum + monthlyPrice(item), 0);
  const csd = active.filter((item) => item.source === 'csd').reduce((sum, item) => sum + monthlyPrice(item), 0);
  const market = active.filter((item) => item.source === 'market').reduce((sum, item) => sum + monthlyPrice(item), 0);
  const online = active.filter((item) => item.source === 'online').reduce((sum, item) => sum + monthlyPrice(item), 0);
  const other = active.filter((item) => item.source === 'other').reduce((sum, item) => sum + monthlyPrice(item), 0);
  const essential = active.filter((item) => item.priority === 'essential').reduce((sum, item) => sum + monthlyPrice(item), 0);
  const flexible = active.filter((item) => item.priority === 'optional' || item.priority === 'luxury').reduce((sum, item) => sum + monthlyPrice(item), 0);
  const savings = active
    .filter((item) => item.source === 'csd' && item.marketPrice !== undefined)
    .reduce((sum, item) => sum + Math.max(0, ((item.marketPrice ?? 0) - item.estimatedPrice) / Math.max(1, item.frequencyMonths)), 0);
  const purchased = active.filter((item) => item.checked);
  const actualRecorded = purchased.reduce((sum, item) => sum + (item.actualPrice ?? 0), 0);
  const actualVariance = purchased.filter((item) => item.actualPrice !== undefined).reduce((sum, item) => sum + item.estimatedPrice - (item.actualPrice ?? 0), 0);
  const completedSpend = purchased.reduce((sum, item) => sum + (item.actualPrice ?? item.estimatedPrice), 0);
  return { planned, csd, market, online, other, essential, flexible, savings, activeCount: active.length, removedCount: state.items.length - active.length, purchasedCount: purchased.length, actualRecorded, actualVariance, completedSpend };
}

function budgetGroup(category: string): string {
  if (category === 'Vegetables' || category === 'Fruits') return 'Fresh produce';
  if (category === 'Personal care') return 'Personal care';
  if (['Cleaning', 'Household', 'Baby & child', 'Pet care', 'Home maintenance', 'First aid'].includes(category)) return 'Household';
  return 'Food';
}

function categoryIcon(category: string) {
  if (category === 'Grocery' || category === 'Pulses') return Wheat;
  if (category === 'Cooking') return Droplets;
  if (category === 'Spices') return Leaf;
  if (category === 'Dairy') return Milk;
  if (category === 'Breakfast') return Coffee;
  if (category === 'Vegetables' || category === 'Fruits') return Apple;
  if (category === 'Personal care') return Bath;
  if (category === 'Cleaning') return Sparkles;
  return Package;
}

function groupTotals(items: ShoppingItem[]) {
  const groups: Record<string, number> = {
    Food: 0,
    'Fresh produce': 0,
    'Personal care': 0,
    Household: 0,
  };
  items.filter((item) => item.source !== 'remove').forEach((item) => {
    const group = budgetGroup(item.category);
    groups[group] = (groups[group] ?? 0) + monthlyPrice(item);
  });
  return groups;
}

type Suggestion = {
  id: string;
  itemId: string;
  title: string;
  reason: string;
  saving: number;
  action: 'reduce' | 'remove' | 'source';
  nextQuantity?: number;
  nextSource?: Source;
};

function getSuggestions(state: AppState): Suggestion[] {
  const suggestions: Suggestion[] = [];
  state.items.forEach((item) => {
    const protectedByRule = state.rules.includes('protect-milk') && item.name.toLowerCase() === 'milk';
    if (item.source === 'remove' || item.priority === 'essential' || protectedByRule) return;
    if (item.name.toLowerCase().includes('biscuit') && item.quantity > 2) {
      const reduceBy = Math.min(2, item.quantity - 1);
      const nextQuantity = item.quantity - reduceBy;
      const saving = Math.round((item.estimatedPrice * reduceBy) / Math.max(1, item.quantity) / Math.max(1, item.frequencyMonths));
      if (saving > 0) {
        suggestions.push({
          id: `reduce-${item.id}`,
          itemId: item.id,
          title: `Reduce ${item.name.toLowerCase()} by ${numberFormat(reduceBy)} packets`,
          reason: `Keep ${numberFormat(nextQuantity)} packets in this month's plan instead of ${numberFormat(item.quantity)}.`,
          saving,
          action: 'reduce',
          nextQuantity,
        });
      }
    }
    if (item.priority === 'luxury') {
      suggestions.push({
        id: `remove-${item.id}`,
        itemId: item.id,
        title: `Postpone ${item.name.toLowerCase()}`,
        reason: 'A flexible purchase you can skip this month. It will not change any essential quantities.',
        saving: Math.round(monthlyPrice(item)),
        action: 'remove',
      });
    }
    if (item.source !== 'csd' && item.csdPrice !== undefined && item.csdPrice < item.estimatedPrice) {
      suggestions.push({
        id: `csd-${item.id}`,
        itemId: item.id,
        title: `Buy ${item.name.toLowerCase()} from CSD`,
        reason: `Estimated CSD price is ${money(item.csdPrice)} versus ${money(item.estimatedPrice)} at the current source.`,
        saving: Math.round((item.estimatedPrice - item.csdPrice) / Math.max(1, item.frequencyMonths)),
        action: 'source',
        nextSource: 'csd',
      });
    }
  });
  const actionOrder: Record<Suggestion['action'], number> = { source: 0, reduce: 1, remove: 2 };
  return suggestions.sort((a, b) => actionOrder[a.action] - actionOrder[b.action] || b.saving - a.saving);
}

function App() {
  const [data, setData] = useState<AppState>(loadSavedState);
  const [themePreference, setThemePreference] = useState<ThemePreference>(loadThemePreference);
  const [page, setPage] = useState<Page>('home');
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [optimizerOpen, setOptimizerOpen] = useState(false);
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [onlineSearchItem, setOnlineSearchItem] = useState<ShoppingItem | null>(null);
  const [tourOpen, setTourOpen] = useState(() => shouldShowTour());
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [shoppingMode, setShoppingMode] = useState(false);
  const [shoppingFilter, setShoppingFilter] = useState<'all' | Source>('all');
  const [shoppingSearch, setShoppingSearch] = useState('');
  const [toast, setToast] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  const totals = useMemo(() => getTotals(data), [data]);
  const suggestions = useMemo(() => getSuggestions(data), [data]);
  const categoryTotals = useMemo(() => groupTotals(data.items), [data.items]);
  const copy = pageCopy[page];
  const remaining = data.budget - totals.planned;
  const progress = data.budget > 0 ? (totals.planned / data.budget) * 100 : 0;
  const spendCap = data.budget * (1 - data.bufferPercent / 100);
  const unpricedActiveCount = data.items.filter((item) => item.source !== 'remove' && item.priceNeedsReview).length;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const dark = themePreference === 'dark' || (themePreference === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d1510' : '#f5f7f4');
    };
    const savePreference = () => {
      try {
        if (themePreference === 'system') window.localStorage.removeItem(THEME_KEY);
        else window.localStorage.setItem(THEME_KEY, themePreference);
      } catch {
        setToast('Theme preference could not be saved on this device.');
      }
    };
    applyTheme();
    savePreference();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [themePreference]);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (event.key !== '/' || isTyping) return;
      event.preventDefault();
      setPage('shopping');
      setShoppingMode(false);
      window.setTimeout(() => document.querySelector<HTMLInputElement>('.search-field input')?.focus(), 20);
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (nextPage: Page) => {
    setPage(nextPage);
    setShoppingMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const patchItem = (id: string, patch: Partial<ShoppingItem>) => {
    setData((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const startAddItem = () => {
    setEditItem(null);
    setAddItemOpen(true);
  };

  const saveItem = (nextItem: ShoppingItem) => {
    const exists = data.items.some((item) => item.id === nextItem.id && nextItem.id !== 'draft-item');
    const savedItem = { ...nextItem, id: exists ? nextItem.id : `item-${Date.now()}`, priceNeedsReview: nextItem.estimatedPrice <= 0 };
    setData((current) => ({
      ...current,
      items: exists
        ? current.items.map((item) => (item.id === savedItem.id ? savedItem : item))
        : [...current.items, savedItem],
    }));
    setAddItemOpen(false);
    setEditItem(null);
    setToast(editItem ? 'Item details updated.' : `Added to your ${data.month} plan.`);
    if (savedItem.source === 'online' && (!editItem || editItem.source !== 'online')) setOnlineSearchItem(savedItem);
  };

  const addCatalogItems = (selectedEntries: HouseholdCatalogEntry[]) => {
    const existingNames = new Set(data.items.map((item) => item.name.trim().toLowerCase()));
    const existingCatalogIds = new Set(data.items.map((item) => item.catalogId).filter(Boolean));
    const additions = selectedEntries.filter((entry) => !existingNames.has(entry.name.trim().toLowerCase()) && !existingCatalogIds.has(entry.id));
    if (!additions.length) {
      setCatalogOpen(false);
      setToast('Those items are already in your plan.');
      return;
    }
    const newItems: ShoppingItem[] = additions.map((entry) => ({
      id: `catalog-${entry.id}`,
      catalogId: entry.id,
      name: entry.name,
      category: entry.category,
      quantity: entry.quantity,
      unit: entry.unit,
      priority: entry.priority,
      source: 'other',
      estimatedPrice: 0,
      priceNeedsReview: true,
      checked: false,
      frequencyMonths: entry.frequencyMonths,
    }));
    setData((current) => {
      const currentNames = new Set(current.items.map((item) => item.name.trim().toLowerCase()));
      const uniqueItems = newItems.filter((item) => !currentNames.has(item.name.trim().toLowerCase()) && !current.items.some((existing) => existing.catalogId === item.catalogId));
      return uniqueItems.length ? { ...current, items: [...current.items, ...uniqueItems] } : current;
    });
    setCatalogOpen(false);
    setToast(`${additions.length} selected items added. Set your local prices before relying on the budget total.`);
  };

  const saveOnlineOffer = (itemId: string, offer: OnlinePriceOffer) => {
    const recordedOffer = { ...offer, area: data.shoppingArea, postalCode: data.postalCode, url: onlineSearchUrl(offer.store, data.items.find((item) => item.id === itemId)?.name ?? '') };
    setData((current) => ({
      ...current,
      items: current.items.map((item) => item.id === itemId ? { ...item, onlineOffers: [...(item.onlineOffers ?? []).filter((saved) => saved.id !== recordedOffer.id), recordedOffer] } : item),
    }));
    setToast(`Saved ${recordedOffer.store} price for comparison. It is a dated quote, not a live feed.`);
  };

  const deleteItem = (id: string) => {
    setData((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
    setAddItemOpen(false);
    setEditItem(null);
    setToast('Item removed from your plan.');
  };

  const applySuggestion = (suggestion: Suggestion) => {
    const item = data.items.find((entry) => entry.id === suggestion.itemId);
    if (!item) return;
    if (suggestion.action === 'reduce' && suggestion.nextQuantity !== undefined) {
      const revised = item.estimatedPrice * (suggestion.nextQuantity / Math.max(1, item.quantity));
      patchItem(item.id, { quantity: suggestion.nextQuantity, estimatedPrice: Math.round(revised) });
    } else if (suggestion.action === 'remove') {
      patchItem(item.id, { source: 'remove', checked: false });
    } else if (suggestion.action === 'source' && suggestion.nextSource) {
      patchItem(item.id, { source: suggestion.nextSource, estimatedPrice: item.csdPrice ?? item.estimatedPrice });
    }
    setToast(`Suggestion applied: ${suggestion.title}.`);
  };

  const applyInventoryToPlan = (stock: InventoryItem) => {
    const recommended = Math.max(0, stock.monthlyUse - stock.currentStock);
    const matching = data.items.find((item) => item.name.toLowerCase() === stock.name.toLowerCase());
    const nextCost = Math.round(recommended * stock.unitPrice);
    if (matching) {
      const nextSource: Source = recommended === 0 ? 'remove' : matching.source === 'remove' ? 'market' : matching.source;
      patchItem(matching.id, {
        quantity: recommended,
        estimatedPrice: nextCost,
        source: nextSource,
        checked: recommended === 0 ? false : matching.checked,
      });
      setToast(recommended === 0
        ? `${stock.name} is covered by your stock. It was marked not to buy; you can change that in Shopping.`
        : `${stock.name} updated to ${numberFormat(recommended)} ${stock.unit} based on stock at home.`);
      return;
    }
    if (recommended === 0) {
      setToast(`You have enough ${stock.name.toLowerCase()} for this month.`);
      return;
    }
    const newItem: ShoppingItem = {
      id: `inventory-${Date.now()}`,
      name: stock.name,
      category: stock.category,
      quantity: recommended,
      unit: stock.unit,
      priority: 'essential',
      source: 'market',
      estimatedPrice: nextCost,
      checked: false,
      frequencyMonths: 1,
    };
    setData((current) => ({ ...current, items: [...current.items, newItem] }));
    setToast(`${stock.name} added to your shopping plan.`);
  };

  const toggleRule = (rule: string) => {
    setData((current) => ({
      ...current,
      rules: current.rules.includes(rule) ? current.rules.filter((entry) => entry !== rule) : [...current.rules, rule],
    }));
  };

  const startShopping = () => {
    setPage('shopping');
    setShoppingMode(true);
    setShoppingFilter('all');
  };

  const finishTour = () => {
    try { window.localStorage.setItem('budgetbasket-tour-complete-v1', 'true'); } catch { /* local storage may be unavailable */ }
    setTourOpen(false);
  };

  const renderPage = () => {
    if (page === 'home') {
      return <HomePage
        data={data}
        totals={totals}
        progress={progress}
        remaining={remaining}
        spendCap={spendCap}
        categoryTotals={categoryTotals}
        onAddItem={startAddItem}
        onOptimize={() => setOptimizerOpen(true)}
        onShopping={startShopping}
        onBudget={() => navigate('budget')}
        onReceipts={() => setReceiptsOpen(true)}
        onEdit={(item) => { setEditItem(item); setAddItemOpen(true); }}
        onCheck={(item) => patchItem(item.id, { checked: !item.checked })}
        onAffordCheck={(amount) => setToast(affordMessage(amount, remaining))}
      />;
    }
    if (page === 'shopping') {
      return <ShoppingPage
        items={data.items}
        totals={totals}
        budget={data.budget}
        shoppingMode={shoppingMode}
        search={shoppingSearch}
        filter={shoppingFilter}
        onSearch={setShoppingSearch}
        onFilter={setShoppingFilter}
        onToggleMode={() => setShoppingMode((mode) => !mode)}
        onPatch={patchItem}
        onAdd={startAddItem}
        onCatalog={() => setCatalogOpen(true)}
        onEdit={(item) => { setEditItem(item); setAddItemOpen(true); }}
        onOnlineSearch={(item) => setOnlineSearchItem(item)}
        onBulkSource={(ids, source) => {
          const restoreCount = data.items.filter((item) => ids.includes(item.id) && item.source === 'remove').length;
          setData((current) => ({ ...current, items: current.items.map((item) => ids.includes(item.id) && (source === 'remove' || item.source === 'remove') ? { ...item, source, ...(source === 'remove' ? { checked: false } : {}) } : item) }));
          setToast(source === 'remove' ? `${ids.length} items discontinued for this month.` : restoreCount ? `${restoreCount} discontinued items returned to the plan.` : 'Selected items are already in the plan.');
        }}
      />;
    }
    if (page === 'budget') {
      return <BudgetPage
        data={data}
        totals={totals}
        progress={progress}
        remaining={remaining}
        spendCap={spendCap}
        categoryTotals={categoryTotals}
        onAffordCheck={(amount) => setToast(affordMessage(amount, remaining))}
        onOptimize={() => setOptimizerOpen(true)}
        onSettings={() => navigate('settings')}
      />;
    }
    if (page === 'inventory') {
      return <InventoryPage
        inventory={data.inventory}
        items={data.items}
        onUpdate={(id, patch) => setData((current) => ({ ...current, inventory: current.inventory.map((item) => item.id === id ? { ...item, ...patch } : item) }))}
        onAdd={() => setInventoryModalOpen(true)}
        onApply={applyInventoryToPlan}
      />;
    }
    return <SettingsPage
      data={data}
      themePreference={themePreference}
      onTheme={setThemePreference}
      onBudget={(budget) => setData((current) => ({ ...current, budget }))}
      onBuffer={(bufferPercent) => setData((current) => ({ ...current, bufferPercent }))}
      onHousehold={(patch) => setData((current) => ({ ...current, household: { ...current.household, ...patch } }))}
      onRules={toggleRule}
      onCategoryBudgets={(category, value) => setData((current) => ({ ...current, categoryBudgets: { ...current.categoryBudgets, [category]: value } }))}
      onLocation={(patch) => setData((current) => ({ ...current, ...patch }))}
      onTour={() => setTourOpen(true)}
      onReset={() => {
        if (window.confirm('Restore the original receipt imports on this device? Any edits or discontinued-item choices will be reset.')) {
          setData(freshDefaultState());
          setToast('Receipt imports restored.');
        }
      }}
    />;
  };

  return (
    <div className="app-shell">
      <Sidebar page={page} data={data} progress={progress} itemCount={totals.activeCount} onNavigate={navigate} onHelp={() => setTourOpen(true)} />
      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-mark"><ShoppingBasket size={19} strokeWidth={2.2} /></div>
            <span>Budget<span className="brand-light">Basket</span></span>
          </div>
          <div className="topbar-context">
            <span className="context-label">Household plan</span>
            <ChevronRight size={14} />
            <span className="month-label"><CalendarDays size={14} /> {data.month}</span>
          </div>
          <div className="topbar-actions">
            <button
              className="theme-toggle-button"
              onClick={() => setThemePreference(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {document.documentElement.dataset.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="tour-help-button" onClick={() => setTourOpen(true)} aria-label="Open app guide"><CircleHelp size={17} /></button>
            <span className={`sync-indicator ${isOnline ? '' : 'sync-offline'}`}>
              {isOnline ? <Cloud size={15} /> : <CloudOff size={15} />}
              {isOnline ? 'Saved on this device' : 'Offline · changes saved'}
            </span>
            <div className="avatar" aria-label={`${data.household.name} profile`}>{data.household.name.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <main className="page-content">
          <div className="page-kicker">{copy.kicker}</div>
          {page !== 'shopping' && unpricedActiveCount > 0 && <button className="unpriced-global-warning" onClick={() => navigate('shopping')}><BadgeIndianRupee size={15} /><span>{unpricedActiveCount} household {unpricedActiveCount === 1 ? 'item still needs a price' : 'items still need prices'}. They are not reflected in the budget totals.</span><strong>Review</strong></button>}
          {renderPage()}
          <footer className="app-footer">
            <span>BudgetBasket · made for a calmer month</span>
            <span>Prices are estimates and can change by store, location and date.</span>
          </footer>
        </main>
      </div>
      <MobileNav page={page} onNavigate={navigate} />

      {addItemOpen && <ItemModal
        initial={editItem}
        onClose={() => { setAddItemOpen(false); setEditItem(null); }}
        onSave={saveItem}
        onDelete={editItem ? () => deleteItem(editItem.id) : undefined}
      />}
      {catalogOpen && <HouseholdCatalogModal existingItems={data.items} onAdd={addCatalogItems} onClose={() => setCatalogOpen(false)} />}
      {optimizerOpen && <OptimizerModal
        planned={totals.planned}
        budget={data.budget}
        spendCap={spendCap}
        remaining={remaining}
        bufferPercent={data.bufferPercent}
        suggestions={suggestions}
        onApply={applySuggestion}
        onClose={() => setOptimizerOpen(false)}
      />}
      {receiptsOpen && <ReceiptSummaryModal onClose={() => setReceiptsOpen(false)} onOpenList={() => { setReceiptsOpen(false); navigate('shopping'); }} />}
      {onlineSearchItem && <OnlineSearchModal item={data.items.find((item) => item.id === onlineSearchItem.id) ?? onlineSearchItem} area={data.shoppingArea} postalCode={data.postalCode} preferredStore={data.preferredOnlineStore} onSaveOffer={saveOnlineOffer} onEditLocation={() => { setOnlineSearchItem(null); navigate('settings'); }} onClose={() => setOnlineSearchItem(null)} />}
      {inventoryModalOpen && <InventoryModal
        onClose={() => setInventoryModalOpen(false)}
        onSave={(newStock) => {
          setData((current) => ({ ...current, inventory: [...current.inventory, { ...newStock, id: `inv-${Date.now()}` }] }));
          setInventoryModalOpen(false);
          setToast(`${newStock.name} added to inventory.`);
        }}
      />}
      {tourOpen && <ProductTour onClose={finishTour} />}
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}

function Sidebar({ page, data, progress, itemCount, onNavigate, onHelp }: { page: Page; data: AppState; progress: number; itemCount: number; onNavigate: (page: Page) => void; onHelp: () => void }) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <div className="brand-mark"><ShoppingBasket size={20} strokeWidth={2.2} /></div>
        <div className="brand-name">Budget<span>Basket</span><small>MONTHLY PLANNER</small></div>
      </div>
      <div className="side-section-label">YOUR HOUSEHOLD</div>
      <nav className="side-nav" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-link ${page === id ? 'active' : ''}`} onClick={() => onNavigate(id)}>
            <Icon size={18} strokeWidth={1.9} />
            <span>{label}</span>
            {id === 'shopping' && <span className="nav-count">{itemCount}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-plan-card">
        <div className="sidebar-plan-top"><span className="mini-sparkle"><Sparkles size={14} /></span><span>MONTHLY PLAN</span></div>
        <strong>{data.month}</strong>
        <span>{data.household.members} people · {money(data.budget)} budget</span>
        <div className="sidebar-plan-line"><i style={{ width: `${Math.min(progress, 100)}%` }} /></div>
        <button onClick={() => onNavigate('budget')}>View budget <ArrowUpRight size={14} /></button>
      </div>
      <div className="sidebar-bottom">
        <div className="household-avatar">A</div>
        <div className="household-meta"><strong>{data.household.name}'s home</strong><span>Personal plan</span></div>
        <button className="side-help" onClick={onHelp} aria-label="Help"><CircleHelp size={17} /></button>
      </div>
    </aside>
  );
}

function MobileNav({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onNavigate(id)} className={page === id ? 'active' : ''}>
          <Icon size={20} strokeWidth={page === id ? 2.2 : 1.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function HomePage({
  data,
  totals,
  progress,
  remaining,
  spendCap,
  categoryTotals,
  onAddItem,
  onOptimize,
  onShopping,
  onBudget,
  onReceipts,
  onEdit,
  onCheck,
  onAffordCheck,
}: {
  data: AppState;
  totals: ReturnType<typeof getTotals>;
  progress: number;
  remaining: number;
  spendCap: number;
  categoryTotals: Record<string, number>;
  onAddItem: () => void;
  onOptimize: () => void;
  onShopping: () => void;
  onBudget: () => void;
  onReceipts: () => void;
  onEdit: (item: ShoppingItem) => void;
  onCheck: (item: ShoppingItem) => void;
  onAffordCheck: (amount: number) => void;
}) {
  const [affordAmount, setAffordAmount] = useState('1500');
  const completion = totals.activeCount ? Math.round((totals.purchasedCount / totals.activeCount) * 100) : 0;
  const categoriesForHome = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const previewItems = data.items.filter((item) => item.source !== 'remove' && !item.checked).slice(0, 4);
  const recommendedGap = totals.planned - spendCap;
  const needsNameReview = data.items.filter((item) => item.reviewRequired).length;
  const receiptItemCount = data.items.filter((item) => item.receiptId).length;
  const comparedPriceCount = data.items.filter((item) => item.source === 'csd' && item.marketPrice !== undefined).length;

  return (
    <div className="page-stack">
      <PageHeading
        title={data.household.name === 'My household' ? 'Your monthly plan' : `Good morning, ${data.household.name}`}
        description="Recent receipt items are loaded. Choose what to keep in this month’s plan."
        action={<button className="button button-primary" onClick={onAddItem}><Plus size={17} /> Add item</button>}
      />

      <section className="receipt-import-card">
        <div className="receipt-import-icon"><ClipboardCheck size={19} /></div>
        <div className="receipt-import-copy"><span className="receipt-import-kicker">2 RECEIPTS ADDED · {receiptItemCount} LINE ITEMS</span><strong>Built from your recent purchases</strong><p>Last-paid amounts are carried forward as estimates. Assign a source or mark items “Don’t buy” to shape your October list.</p></div>
        <div className="receipt-import-actions"><span>{needsNameReview} names to review</span><button onClick={onReceipts}>Review receipts <ArrowRight size={14} /></button></div>
      </section>

      <section className="hero-grid">
        <div className="budget-hero">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />
          <div className="hero-head">
            <div className="hero-label"><span className="hero-label-dot" /> OCTOBER HOUSEHOLD BUDGET</div>
            <div className="hero-tag"><ShieldCheck size={14} /> {remaining >= 0 ? 'On track' : 'Needs attention'}</div>
          </div>
          <div className="hero-content">
            <div>
              <div className="hero-caption">{remaining >= 0 ? 'Still available to spend' : 'Over monthly budget'}</div>
              <div className="hero-remaining">{money(Math.abs(remaining))}</div>
              <div className="hero-subtext">of {money(data.budget)} monthly budget</div>
            </div>
            <div className="hero-donut" style={{ '--progress': `${Math.max(0, Math.min(progress, 100))}%` } as CSSProperties}>
              <div className="hero-donut-inner"><strong>{progress.toFixed(1)}%</strong><span>planned</span></div>
            </div>
          </div>
          <div className="hero-progress-wrap">
            <div className="hero-progress-track"><i className={progress > 100 ? 'over' : ''} style={{ width: `${Math.min(progress, 100)}%` }} /></div>
            <div className="hero-progress-label"><span>{money(totals.planned)} planned</span><span>{money(data.budget)} limit</span></div>
          </div>
          <div className="hero-buffer-note"><Target size={15} /> {money(spendCap)} suggested spending cap keeps a {data.bufferPercent}% buffer</div>
        </div>

        <div className="savings-card">
          <div className="savings-card-head">
            <div className="savings-icon"><Sprout size={19} /></div>
            <span className="tiny-label">SMART SAVINGS</span>
            <button className="icon-button subtle-icon" onClick={onBudget} aria-label="View budget details"><ArrowUpRight size={17} /></button>
          </div>
          <div className="savings-value">{money(Math.round(totals.savings))}</div>
          <p>{comparedPriceCount ? 'Estimated from prices you entered for CSD and other sources.' : 'Add a market price to an item to calculate real CSD savings.'}</p>
          <div className="savings-card-rule" />
          <div className="savings-foot"><span><TrendingDown size={15} /> {comparedPriceCount} price comparisons</span><button onClick={onBudget}>See breakdown <ArrowRight size={14} /></button></div>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard icon={<Store size={17} />} label="CSD basket" value={money(totals.csd)} detail={`${data.items.filter((item) => item.source === 'csd').length} items`} tint="mint" />
        <StatCard icon={<ShoppingCart size={17} />} label="Market & online" value={money(totals.market + totals.online)} detail={`${data.items.filter((item) => item.source === 'market' || item.source === 'online').length} items`} tint="peach" />
        <StatCard icon={<Info size={17} />} label="Source to review" value={money(totals.other)} detail={`${data.items.filter((item) => item.source === 'other').length} items`} tint="blue" />
        <StatCard icon={<ClipboardCheck size={17} />} label="Shopping progress" value={`${totals.purchasedCount} / ${totals.activeCount}`} detail={`${completion}% checked off`} tint="lavender" />
        <StatCard icon={<Wallet size={17} />} label="Flexible spending" value={money(totals.flexible)} detail="Optional + luxury" tint="yellow" />
      </section>

      <section className="quick-actions-card">
        <div className="quick-label">QUICK ACTIONS</div>
        <div className="quick-actions">
          <button className="quick-action" onClick={onAddItem}><span className="quick-action-icon quick-green"><Plus size={18} /></span><span>Add an item</span><ChevronRight size={15} /></button>
          <button className="quick-action" onClick={onOptimize}><span className="quick-action-icon quick-lilac"><Sparkles size={18} /></span><span>Optimize my budget</span><ChevronRight size={15} /></button>
          <button className="quick-action" onClick={onShopping}><span className="quick-action-icon quick-peach"><ShoppingBasket size={18} /></span><span>Start shopping</span><ChevronRight size={15} /></button>
          <button className="quick-action" onClick={onBudget}><span className="quick-action-icon quick-blue"><BarChart3 size={18} /></span><span>View budget</span><ChevronRight size={15} /></button>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main-column">
          <section className="card optimizer-card">
            <div className="optimizer-card-top">
              <div className="optimizer-badge"><Sparkles size={15} /> SMART CHECK-IN</div>
              <span className="saved-label"><span /> Your choices stay yours</span>
            </div>
            <div className="optimizer-copy">
              <div>
                <h2>{remaining >= 0 ? 'You’re under budget.' : `You’re ${money(Math.abs(remaining))} over budget.`}</h2>
                <p>{recommendedGap > 0
                  ? `Your plan is ${money(recommendedGap)} above the ${data.bufferPercent}% buffer target. A few optional tweaks can add breathing room.`
                  : `You have ${money(remaining)} left in your monthly plan. Essentials are protected.`}</p>
              </div>
              <button className="button button-dark" onClick={onOptimize}><Sparkles size={16} /> Review suggestions</button>
            </div>
            <div className="optimizer-foot"><ShieldCheck size={16} /><span>Suggestions explain every change. Nothing is removed unless you approve it.</span><button onClick={onOptimize} aria-label="View suggestions"><ArrowRight size={16} /></button></div>
          </section>

          <section className="card category-card">
            <div className="section-heading">
              <div><h2>Where your money goes</h2><p>Planned spend across your household</p></div>
              <button className="text-button" onClick={onBudget}>Full breakdown <ArrowRight size={14} /></button>
            </div>
            <div className="category-list">
              {categoriesForHome.map(([name, value], index) => {
                const percent = totals.planned ? (value / totals.planned) * 100 : 0;
                const Icon = categoryIcon(name === 'Fresh produce' ? 'Vegetables' : name === 'Household' ? 'Cleaning' : name);
                return <div className="category-line" key={name}>
                  <div className={`category-icon category-color-${index % 4}`}><Icon size={17} /></div>
                  <div className="category-line-main"><div className="category-line-title"><strong>{name}</strong><span>{money(value)}</span></div><div className="small-progress"><i style={{ width: `${percent}%` }} /></div></div>
                  <span className="category-percent">{Math.round(percent)}%</span>
                </div>;
              })}
            </div>
          </section>
        </div>

        <div className="dashboard-side-column">
          <section className="card shopping-progress-card">
            <div className="section-heading"><div><h2>Shopping progress</h2><p>One trip at a time</p></div><div className="progress-icon"><ListChecks size={18} /></div></div>
            <div className="progress-number-row"><strong>{totals.purchasedCount}<span>/{totals.activeCount}</span></strong><span>{completion}% done</span></div>
            <div className="simple-progress"><i style={{ width: `${completion}%` }} /></div>
            <div className="progress-card-bottom"><span>{money(totals.completedSpend)} checked off</span><button onClick={onShopping}>Open list <ArrowRight size={14} /></button></div>
          </section>

          <section className="card next-items-card">
            <div className="section-heading"><div><h2>Up next</h2><p>A few essentials to get started</p></div><button className="round-arrow" onClick={onShopping} aria-label="Open shopping list"><ArrowUpRight size={17} /></button></div>
            <div className="up-next-list">
              {previewItems.slice(0, 4).map((item) => <div className="up-next-row" key={item.id}>
                <button className="small-check" onClick={() => onCheck(item)} aria-label={`Mark ${item.name} purchased`}><Check size={13} /></button>
                <button className="up-next-name" onClick={() => onEdit(item)}>{item.name}<small>{numberFormat(item.quantity)} {item.unit}</small></button>
                <span>{money(monthlyPrice(item))}</span>
              </div>)}
            </div>
            <button className="view-shopping-link" onClick={onShopping}>View all {totals.activeCount} items <ArrowRight size={14} /></button>
          </section>
        </div>
      </div>

      <section className="afford-strip">
        <div className="afford-strip-icon"><BadgeIndianRupee size={19} /></div>
        <div className="afford-strip-copy"><strong>Can I afford something extra?</strong><span>You have {money(Math.max(0, remaining))} remaining in your plan.</span></div>
        <div className="afford-strip-form">
          <span className="rupee-prefix">₹</span>
          <input aria-label="Extra item cost" type="number" min="0" value={affordAmount} onChange={(event) => setAffordAmount(event.target.value)} />
          <button className="button button-small button-outline" onClick={() => onAffordCheck(Number(affordAmount))}>Check</button>
        </div>
      </section>

      <div className="receipt-note"><Info size={15} /><span>Receipt amounts are previous paid prices, not live store quotes. Review the flagged product names and confirm current prices before buying.</span><button onClick={onReceipts}>View receipt details <ArrowRight size={13} /></button></div>
    </div>
  );
}

function StatCard({ icon, label, value, detail, tint }: { icon: ReactNode; label: string; value: string; detail: string; tint: string }) {
  return <div className="stat-card"><span className={`stat-icon ${tint}`}>{icon}</span><div className="stat-text"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

function ShoppingPage({
  items,
  totals,
  budget,
  shoppingMode,
  search,
  filter,
  onSearch,
  onFilter,
  onToggleMode,
  onPatch,
  onAdd,
  onCatalog,
  onEdit,
  onOnlineSearch,
  onBulkSource,
}: {
  items: ShoppingItem[];
  totals: ReturnType<typeof getTotals>;
  budget: number;
  shoppingMode: boolean;
  search: string;
  filter: 'all' | Source;
  onSearch: (value: string) => void;
  onFilter: (value: 'all' | Source) => void;
  onToggleMode: () => void;
  onPatch: (id: string, patch: Partial<ShoppingItem>) => void;
  onAdd: () => void;
  onCatalog: () => void;
  onEdit: (item: ShoppingItem) => void;
  onOnlineSearch: (item: ShoppingItem) => void;
  onBulkSource: (ids: string[], source: Source) => void;
}) {
  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const active = items.filter((item) => item.source !== 'remove');
  const unpricedCount = active.filter((item) => item.priceNeedsReview).length;
  const shown = items.filter((item) => {
    if (shoppingMode && item.checked) return false;
    if (filter !== 'all' && item.source !== filter) return false;
    if (search.trim() && !`${item.name} ${item.category}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });
  const counts: Record<Source, number> = {
    csd: items.filter((item) => item.source === 'csd').length,
    market: items.filter((item) => item.source === 'market').length,
    online: items.filter((item) => item.source === 'online').length,
    other: items.filter((item) => item.source === 'other').length,
    remove: items.filter((item) => item.source === 'remove').length,
  };
  const filters: { id: 'all' | Source; label: string; count: number }[] = [
    { id: 'all', label: 'All items', count: items.length },
    { id: 'csd', label: sourceDetails.csd.label, count: counts.csd },
    { id: 'market', label: sourceDetails.market.label, count: counts.market },
    { id: 'online', label: sourceDetails.online.label, count: counts.online },
    { id: 'other', label: sourceDetails.other.label, count: counts.other },
    { id: 'remove', label: 'Discontinued', count: counts.remove },
  ];
  const allVisibleSelected = shown.length > 0 && shown.every((item) => selectedIds.includes(item.id));
  const toggleManageMode = () => {
    if (!manageMode && shoppingMode) onToggleMode();
    setManageMode((current) => !current);
    setSelectedIds([]);
  };
  const toggleShoppingMode = () => {
    if (!shoppingMode) setManageMode(false);
    setSelectedIds([]);
    onToggleMode();
  };
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
  const selectVisible = () => setSelectedIds(allVisibleSelected ? [] : shown.map((item) => item.id));
  const applyBulkSource = (source: Source) => {
    if (!selectedIds.length) return;
    onBulkSource(selectedIds, source);
    setSelectedIds([]);
    setManageMode(false);
  };

  return (
    <div className="page-stack">
      <PageHeading
        title="Shopping list"
        description="Keep the items you want, discontinue the rest, and assign a source when you’re ready."
        action={<div className="shopping-page-actions"><button className={`button ${manageMode ? 'button-soft' : 'button-outline'}`} onClick={toggleManageMode}>{manageMode ? <CheckCircle2 size={16} /> : <ListChecks size={16} />}{manageMode ? 'Done selecting' : 'Select items'}</button><button className={`button ${shoppingMode ? 'button-soft' : 'button-primary'}`} onClick={toggleShoppingMode}>{shoppingMode ? <CheckCircle2 size={17} /> : <ShoppingCart size={17} />}{shoppingMode ? 'Exit shopping' : 'Shopping mode'}</button></div>}
      />
      {shoppingMode && <div className="shopping-mode-banner"><div className="shopping-mode-icon"><ShoppingBasket size={19} /></div><div><strong>Shopping mode is on</strong><span>Check off items as you go. Your list saves on this device, even if you lose connection.</span></div><button onClick={toggleShoppingMode}>Done shopping <Check size={15} /></button></div>}
      {manageMode && <div className="manage-mode-banner"><div className="manage-mode-icon"><ListChecks size={18} /></div><div><strong>Choose items to keep or discontinue</strong><span>Selected items won’t change until you confirm below. Receipt details stay saved if you discontinue a product.</span></div><button onClick={selectVisible}>{allVisibleSelected ? 'Deselect visible' : 'Select visible'}</button></div>}

      <div className="source-summary-grid">
        <button className={`source-summary source-summary-csd ${filter === 'csd' ? 'selected' : ''}`} onClick={() => onFilter(filter === 'csd' ? 'all' : 'csd')}><span className="source-summary-icon"><Store size={17} /></span><span><strong>{counts.csd}</strong><small>CSD items</small></span><span className="source-summary-total">{money(totals.csd)}</span></button>
        <button className={`source-summary source-summary-market ${filter === 'market' ? 'selected' : ''}`} onClick={() => onFilter(filter === 'market' ? 'all' : 'market')}><span className="source-summary-icon"><ShoppingBasket size={17} /></span><span><strong>{counts.market}</strong><small>Market items</small></span><span className="source-summary-total">{money(totals.market)}</span></button>
        <button className={`source-summary source-summary-online ${filter === 'online' ? 'selected' : ''}`} onClick={() => onFilter(filter === 'online' ? 'all' : 'online')}><span className="source-summary-icon"><Package size={17} /></span><span><strong>{counts.online}</strong><small>Online items</small></span><span className="source-summary-total">{money(totals.online)}</span></button>
        <button className={`source-summary source-summary-other ${filter === 'other' ? 'selected' : ''}`} onClick={() => onFilter(filter === 'other' ? 'all' : 'other')}><span className="source-summary-icon"><Info size={17} /></span><span><strong>{counts.other}</strong><small>Source to review</small></span><span className="source-summary-total">{money(totals.other)}</span></button>
        <button className={`source-summary source-summary-remove ${filter === 'remove' ? 'selected' : ''}`} onClick={() => onFilter(filter === 'remove' ? 'all' : 'remove')}><span className="source-summary-icon"><X size={17} /></span><span><strong>{counts.remove}</strong><small>Discontinued</small></span><span className="source-summary-total">This month</span></button>
      </div>
      {unpricedCount > 0 && <div className="unpriced-warning"><BadgeIndianRupee size={16} /><span><strong>{unpricedCount} selected {unpricedCount === 1 ? 'item needs' : 'items need'} a price.</strong> They are not included in your budget total yet. Add a local estimate by selecting “Set price” on a row.</span></div>}

      <section className="card list-card">
          <div className="list-card-head">
          <div><h2>Your household basket</h2><p>{active.length} planned items <span className="dot-separator">·</span> {moneyPrecise(totals.planned)} monthly estimate from last-paid prices</p></div>
          <div className="list-card-actions"><button className="button button-soft button-add-small" onClick={onCatalog}><Boxes size={15} /> Browse essentials</button><button className="button button-primary button-add-small" onClick={onAdd}><Plus size={16} /> Add item</button></div>
        </div>
        {manageMode && <div className="bulk-action-bar"><div className="bulk-selection-count"><strong>{selectedIds.length}</strong><span>{selectedIds.length === 1 ? 'item selected' : 'items selected'}</span></div><div className="bulk-action-buttons"><button className="button button-outline button-small" disabled={!selectedIds.length} onClick={() => applyBulkSource('other')}>Keep in plan</button><button className="button button-danger-soft button-small" disabled={!selectedIds.length} onClick={() => applyBulkSource('remove')}>Discontinue selected <X size={14} /></button></div></div>}
        <div className="list-toolbar">
          <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search your list" /><kbd>/</kbd></label>
          <div className="filter-chips" aria-label="Filter by source">
            {filters.map((option) => <button key={option.id} onClick={() => onFilter(option.id)} className={filter === option.id ? 'active' : ''}>{option.label}<span>{option.count}</span></button>)}
          </div>
        </div>
        {shown.length ? <div className="shopping-list">
          {shown.map((item) => <ShoppingItemRow key={item.id} item={item} onPatch={onPatch} onEdit={onEdit} onOnlineSearch={onOnlineSearch} manageMode={manageMode} selected={selectedIds.includes(item.id)} onSelect={() => toggleSelected(item.id)} />)}
        </div> : <div className="empty-state"><div className="empty-state-icon"><Search size={23} /></div><strong>No items match this view</strong><span>Try another source filter or search term.</span><button className="text-button" onClick={() => { onFilter('all'); onSearch(''); }}>Clear filters</button></div>}
        <div className="price-disclaimer"><Info size={15} /><span>Receipt prices show what you paid previously, not a live quote. Check today’s price and availability before purchasing.</span></div>
      </section>
      <div className="shopping-footer-summary"><div><span className="footer-summary-dot" />Estimated basket total</div><strong>{money(totals.planned)}<small> / {money(budget)}</small></strong></div>
    </div>
  );
}

function ShoppingItemRow({ item, onPatch, onEdit, onOnlineSearch, manageMode, selected, onSelect }: { item: ShoppingItem; onPatch: (id: string, patch: Partial<ShoppingItem>) => void; onEdit: (item: ShoppingItem) => void; onOnlineSearch: (item: ShoppingItem) => void; manageMode: boolean; selected: boolean; onSelect: () => void }) {
  const Icon = categoryIcon(item.category);
  const removed = item.source === 'remove';
  return (
    <div className={`shopping-row ${item.checked ? 'checked' : ''} ${removed ? 'removed' : ''} ${manageMode ? 'manage-row' : ''}`}>
      <label className="item-check-wrap" aria-label={manageMode ? `Select ${item.name} for monthly-plan changes` : `Mark ${item.name} as purchased`}>
        <input type="checkbox" checked={manageMode ? selected : item.checked} onChange={manageMode ? onSelect : () => onPatch(item.id, { checked: !item.checked })} disabled={!manageMode && removed} />
        <span className="custom-checkbox"><Check size={13} /></span>
      </label>
      <div className={`item-category-glyph glyph-${item.category.toLowerCase().replace(/ /g, '-')}`}><Icon size={17} /></div>
      <div className="item-main">
        <div className="item-title-line"><strong>{item.name}</strong><span className={`priority-pill ${priorityDetails[item.priority].className}`}>{priorityDetails[item.priority].label}</span></div>
        <div className="item-subline"><span>{numberFormat(item.quantity)} {item.unit}</span><i /> <span>{item.category}</span>{item.frequencyMonths > 1 && <><i /><span>Every {item.frequencyMonths} months</span></>}{item.brand && <><i /><span>{item.brand}</span></>}{item.receiptLabel && <><i /><span>{item.receiptLabel}</span></>}</div>
        {item.reviewRequired && <button className="review-item-link" onClick={() => onEdit(item)}><Info size={12} /> Check receipt name</button>}
        {item.priceNeedsReview && <button className="price-needed-link" onClick={() => onEdit(item)}><BadgeIndianRupee size={12} /> Set price before budgeting</button>}
        {item.checked && <label className="actual-price-field"><span>Actual paid</span><span className="actual-input-wrap"><b>₹</b><input type="number" min="0" step="0.01" value={item.actualPrice ?? ''} placeholder={item.estimatedPrice.toFixed(2)} onChange={(event) => onPatch(item.id, { actualPrice: event.target.value === '' ? undefined : Number(event.target.value) })} /></span></label>}
        {item.checked && item.actualPrice !== undefined && <span className={`actual-variance ${item.estimatedPrice >= item.actualPrice ? 'variance-saved' : 'variance-over'}`}>{item.estimatedPrice >= item.actualPrice ? `${moneyPrecise(item.estimatedPrice - item.actualPrice)} under estimate` : `${moneyPrecise(item.actualPrice - item.estimatedPrice)} over estimate`}</span>}
      </div>
      <div className="item-source-control">
        <label className={`source-pill source-${item.source}`}>
          <span />
          <select aria-label={`Purchase source for ${item.name}`} value={item.source} onChange={(event) => { const nextSource = event.target.value as Source; onPatch(item.id, { source: nextSource, ...(nextSource === 'remove' ? { checked: false } : {}) }); if (nextSource === 'online') onOnlineSearch({ ...item, source: 'online' }); }}>
            <option value="csd">{sourceDetails.csd.label}</option><option value="market">{sourceDetails.market.label}</option><option value="online">{sourceDetails.online.label}</option><option value="other">{sourceDetails.other.label}</option><option value="remove">Don't buy this month</option>
          </select>
          <ChevronDown size={12} />
        </label>
        {item.source === 'online' && <button className="online-search-link" onClick={() => onOnlineSearch(item)}><Search size={11} /> Find online</button>}
      </div>
      <div className={`item-price-block ${item.priceNeedsReview ? 'item-price-missing' : ''}`}><strong>{item.priceNeedsReview ? '—' : moneyPrecise(monthlyPrice(item))}</strong><span>{item.priceNeedsReview ? 'price needed' : item.frequencyMonths > 1 ? 'monthly eq.' : item.receiptId ? 'last paid' : 'estimate'}</span></div>
      <button className="row-edit-button" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}><Pencil size={15} /></button>
    </div>
  );
}

function BudgetPage({
  data,
  totals,
  progress,
  remaining,
  spendCap,
  categoryTotals,
  onAffordCheck,
  onOptimize,
  onSettings,
}: {
  data: AppState;
  totals: ReturnType<typeof getTotals>;
  progress: number;
  remaining: number;
  spendCap: number;
  categoryTotals: Record<string, number>;
  onAffordCheck: (amount: number) => void;
  onOptimize: () => void;
  onSettings: () => void;
}) {
  const [amount, setAmount] = useState('1500');
  const groups = ['Food', 'Fresh produce', 'Personal care', 'Household'];
  const colors: Record<string, string> = { Food: '#2f6d52', 'Fresh produce': '#a5c76d', 'Personal care': '#d49b73', Household: '#7b8da8' };
  const donutBackground = `conic-gradient(${groups.map((group, index) => {
    const start = groups.slice(0, index).reduce((sum, current) => sum + (totals.planned ? categoryTotals[current] / totals.planned : 0), 0) * 100;
    const size = totals.planned ? (categoryTotals[group] / totals.planned) * 100 : 0;
    return `${colors[group]} ${start}% ${start + size}%`;
  }).join(', ')}, #e7ede8 0 100%)`;
  const spendColor = progress >= 100 ? 'danger' : progress >= 80 ? 'warning' : 'good';

  return (
    <div className="page-stack">
      <PageHeading title="Your budget, in focus" description="A clear view of what is planned, what is spent, and where a little flexibility remains." action={<button className="button button-soft" onClick={onOptimize}><Sparkles size={16} /> Optimize plan</button>} />

      <section className="budget-overview-grid">
        <div className="card budget-overview-card">
          <div className="budget-overview-top"><div><span className="eyebrow">OCTOBER MONTHLY BUDGET</span><h2>{money(data.budget)}</h2></div><div className={`spend-status status-${spendColor}`}><span />{progress >= 100 ? 'Over budget' : progress >= 80 ? 'Getting close' : 'Comfortable'}</div></div>
          <div className="budget-progress-label"><span>Planned spend <strong>{money(totals.planned)}</strong></span><span>{progress.toFixed(1)}%</span></div>
          <div className="budget-progress"><i className={spendColor} style={{ width: `${Math.min(progress, 100)}%` }} /></div>
          <div className="budget-overview-bottom"><div><span>Remaining</span><strong className={remaining < 0 ? 'negative' : ''}>{money(remaining)}</strong></div><div><span>Suggested buffer</span><strong>{money(data.budget * data.bufferPercent / 100)}</strong></div><div><span>Safe spend limit</span><strong>{money(spendCap)}</strong></div></div>
        </div>
        <div className="card spend-breakdown-card">
          <div className="section-heading"><div><h2>Plan by category</h2><p>Flexible allocation · based on your plan</p></div><button className="category-edit-mark" title="Edit allocations in Settings" onClick={onSettings}><SlidersHorizontal size={16} /></button></div>
          <div className="donut-layout">
            <div className="budget-donut" style={{ background: donutBackground }}><div className="budget-donut-inner"><strong>{money(totals.planned)}</strong><span>planned</span></div></div>
            <div className="donut-legend">
              {groups.map((group) => <div key={group}><i style={{ background: colors[group] }} /><span>{group}</span><strong>{money(categoryTotals[group] ?? 0)}</strong></div>)}
            </div>
          </div>
        </div>
      </section>

      <div className="budget-details-grid">
        <section className="card breakdown-card">
          <div className="section-heading"><div><h2>Planned spending</h2><p>Estimated monthly equivalents</p></div><span className="period-badge"><CalendarDays size={13} /> {data.month}</span></div>
          <div className="breakdown-rows">
            <div className="breakdown-row"><div className="breakdown-icon csd-breakdown"><Store size={17} /></div><div className="breakdown-label"><strong>CSD</strong><span>{data.items.filter((item) => item.source === 'csd').length} items · estimated</span></div><strong>{money(totals.csd)}</strong></div>
            <div className="breakdown-row"><div className="breakdown-icon market-breakdown"><ShoppingBasket size={17} /></div><div className="breakdown-label"><strong>Local market</strong><span>{data.items.filter((item) => item.source === 'market').length} items · estimated</span></div><strong>{money(totals.market)}</strong></div>
            <div className="breakdown-row"><div className="breakdown-icon online-breakdown"><Package size={17} /></div><div className="breakdown-label"><strong>Online</strong><span>{data.items.filter((item) => item.source === 'online').length} items · estimated</span></div><strong>{money(totals.online)}</strong></div>
            <div className="breakdown-row"><div className="breakdown-icon other-breakdown"><Info size={17} /></div><div className="breakdown-label"><strong>Source to review</strong><span>{data.items.filter((item) => item.source === 'other').length} receipt items</span></div><strong>{money(totals.other)}</strong></div>
          </div>
          <div className="breakdown-total"><span>Total planned</span><strong>{money(totals.planned)}</strong></div>
          <div className="csd-savings-note"><div className="csd-savings-icon"><TrendingDown size={16} /></div><div><strong>{moneyPrecise(totals.savings)} potential CSD savings</strong><span>Enter a market price for an item to calculate the actual difference.</span></div></div>
        </section>

        <section className="card essentials-card">
          <div className="section-heading"><div><h2>Priority check</h2><p>Essentials are always protected</p></div><ShieldCheck size={19} className="green-icon" /></div>
          <div className="priority-summary-row"><div className="priority-marker marker-essential" /><span>Essential spending</span><strong>{money(totals.essential)}</strong></div>
          <div className="priority-summary-row"><div className="priority-marker marker-flexible" /><span>Flexible spending</span><strong>{money(totals.flexible)}</strong></div>
          <div className="priority-summary-row"><div className="priority-marker marker-important" /><span>Important spending</span><strong>{money(Math.max(0, totals.planned - totals.essential - totals.flexible))}</strong></div>
          <div className="buffer-callout"><div className="buffer-callout-icon"><Target size={17} /></div><div><strong>Keep a little in reserve</strong><span>Your {data.bufferPercent}% buffer is {money(data.budget * data.bufferPercent / 100)}.</span></div><button onClick={onOptimize}><ArrowRight size={16} /></button></div>
        </section>
      </div>

      <section className="afford-budget-card">
        <div className="afford-budget-head"><div className="afford-budget-icon"><BadgeIndianRupee size={21} /></div><div><h2>Can I afford this?</h2><p>Add a one-off purchase to see how it changes your month.</p></div></div>
        <div className="afford-budget-form"><label><span>Item cost</span><div className="input-with-prefix"><b>₹</b><input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div></label><button className="button button-primary" onClick={() => onAffordCheck(Number(amount))}>Check against my plan <ArrowRight size={15} /></button></div>
        <div className="afford-budget-note"><Info size={15} /><span>Based on {money(Math.max(0, remaining))} remaining from your current plan. This check won't add the item automatically.</span></div>
      </section>

      <section className="card history-card">
        <div className="section-heading"><div><h2>Imported receipt history</h2><p>Previous paid amounts carried into your plan</p></div><span className="history-link"><History size={15} /> {receiptSummaries.length} receipts</span></div>
        <div className="history-table-head"><span>ENTRY</span><span>ITEM LINES</span><span>NET VALUE</span><span>SAVED</span><span>STATUS</span></div>
        <div className="history-row"><div><strong>{data.month}</strong><small>Current plan · {data.items.filter((item) => item.receiptId).length} imported items</small></div><span>{data.items.filter((item) => item.source !== 'remove').length} active</span><span className="history-estimate">{moneyPrecise(totals.planned)}<small> planned</small></span><span>—</span><span className="history-status under">Editable</span></div>
        {receiptSummaries.map((receipt) => <div className="history-row history-row-muted" key={receipt.id}><div><strong>{receipt.label}</strong><small>{receipt.date} · {receipt.store}</small></div><span>{receipt.itemCount}</span><span>{moneyPrecise(receipt.lineTotal)}</span><span>{receipt.discount ? moneyPrecise(receipt.discount) : '—'}</span><span className={`history-status ${receipt.id === 'receipt-a' ? 'over' : 'under'}`}>{receipt.id === 'receipt-a' ? 'Review' : 'Imported'}</span></div>)}
        <div className="history-foot"><Info size={14} /> Receipt A’s printed total is obscured; its net value is the sum of visible line amounts. Receipt B’s printed net total is ₹3,725.93.</div>
      </section>
    </div>
  );
}

function InventoryPage({ inventory, items, onUpdate, onAdd, onApply }: { inventory: InventoryItem[]; items: ShoppingItem[]; onUpdate: (id: string, patch: Partial<InventoryItem>) => void; onAdd: () => void; onApply: (item: InventoryItem) => void }) {
  const estimatedCoverage = inventory.filter((item) => item.currentStock >= item.monthlyUse).length;
  return (
    <div className="page-stack">
      <PageHeading title="Know what’s already at home" description="Update your stock and use it to right-size this month’s shopping list." action={<button className="button button-primary" onClick={onAdd}><Plus size={17} /> Add stock item</button>} />
      <section className="inventory-intro-grid">
        <div className="inventory-hero-card"><div className="inventory-hero-pattern"><Package size={106} strokeWidth={0.9} /></div><div className="inventory-hero-icon"><Boxes size={19} /></div><span className="eyebrow">LESS WASTE, SMARTER SHOPS</span><h2>Buy what you’ll use.<br />Skip what you already have.</h2><p>Your stock numbers stay on this device and are only used when you choose to update your plan.</p></div>
        <div className="inventory-summary-card card"><div className="inventory-summary-top"><span className="summary-icon-soft"><Package size={18} /></span><span className="tiny-label">CURRENT STOCK CHECK</span></div><strong>{inventory.length} <small>items tracked</small></strong><div className="inventory-summary-divider" /><div className="coverage-line"><span><span className="coverage-dot" />Fully covered this month</span><strong>{estimatedCoverage}</strong></div><div className="coverage-line"><span><span className="coverage-dot coverage-low" />Need a top-up</span><strong>{inventory.length - estimatedCoverage}</strong></div></div>
      </section>
      <section className="card inventory-table-card">
        <div className="list-card-head"><div><h2>Household stock</h2><p>Recommended purchase = monthly use − stock on hand</p></div><span className="privacy-chip"><ShieldCheck size={14} /> Private on this device</span></div>
        <div className="inventory-table-head"><span>ITEM</span><span>AT HOME</span><span>MONTHLY USE</span><span>RECOMMENDED</span><span /></div>
        <div className="inventory-rows">
          {inventory.length === 0 ? <div className="inventory-empty-state"><div className="empty-state-icon"><Boxes size={22} /></div><strong>No stock items yet</strong><span>Add items you already have at home. We’ll show a recommended quantity, but won’t change your plan without approval.</span><button className="button button-soft button-small" onClick={onAdd}><Plus size={14} /> Add first stock item</button></div> : inventory.map((entry) => {
            const recommended = Math.max(0, entry.monthlyUse - entry.currentStock);
            const remaining = Math.max(0, entry.currentStock - entry.monthlyUse);
            const hasPlanItem = items.some((item) => item.name.toLowerCase() === entry.name.toLowerCase());
            const Icon = categoryIcon(entry.category);
            return <div className="inventory-row" key={entry.id}>
              <div className="inventory-item-name"><span className="inventory-glyph"><Icon size={17} /></span><div><strong>{entry.name}</strong><small>{entry.category}</small></div></div>
              <label className="inventory-number"><input aria-label={`${entry.name} stock at home`} type="number" min="0" step="0.5" value={entry.currentStock} onChange={(event) => onUpdate(entry.id, { currentStock: Number(event.target.value) })} /><span>{entry.unit}</span></label>
              <label className="inventory-number"><input aria-label={`${entry.name} monthly use`} type="number" min="0" step="0.5" value={entry.monthlyUse} onChange={(event) => onUpdate(entry.id, { monthlyUse: Number(event.target.value) })} /><span>{entry.unit}</span></label>
              <div className="recommended-quantity"><strong>{numberFormat(recommended)} {entry.unit}</strong><small>{recommended === 0 ? `${numberFormat(remaining)} ${entry.unit} left after the month` : 'suggested to buy'}</small></div>
              <button className={`button ${recommended === 0 ? 'button-soft' : 'button-outline'} apply-stock-button`} onClick={() => onApply(entry)}>{hasPlanItem ? 'Update plan' : recommended === 0 ? 'All set' : 'Add to plan'}{recommended === 0 ? <Check size={14} /> : <ArrowRight size={14} />}</button>
            </div>;
          })}
        </div>
        <div className="inventory-disclaimer"><Info size={15} /><span>Stock changes never adjust your plan silently. Select “Update plan” or “Add to plan” to approve the suggested quantity.</span></div>
      </section>
      <div className="inventory-tip"><div className="inventory-tip-icon"><Sparkles size={17} /></div><div><strong>Small tip</strong><span>Keep an eye on opened packs and items with a longer shelf life. Your next month's plan can start with today's stock.</span></div></div>
    </div>
  );
}

function SettingsPage({ data, themePreference, onTheme, onBudget, onBuffer, onHousehold, onRules, onCategoryBudgets, onLocation, onTour, onReset }: {
  data: AppState;
  themePreference: ThemePreference;
  onTheme: (theme: ThemePreference) => void;
  onBudget: (budget: number) => void;
  onBuffer: (bufferPercent: number) => void;
  onHousehold: (patch: Partial<AppState['household']>) => void;
  onRules: (rule: string) => void;
  onCategoryBudgets: (category: string, value: number) => void;
  onLocation: (patch: Partial<Pick<AppState, 'shoppingArea' | 'postalCode' | 'preferredOnlineStore'>>) => void;
  onTour: () => void;
  onReset: () => void;
}) {
  const allocationNames = ['Food', 'Fresh produce', 'Household', 'Personal care', 'Buffer'];
  const rules = [
    { id: 'cheapest-acceptable', title: 'Prefer the lowest-priced acceptable brand', text: 'Compare unit prices without assuming products are the same quality.' },
    { id: 'buy-ghee-csd', title: 'Buy ghee from CSD when available', text: 'Use your CSD price preference as a shopping rule.' },
    { id: 'protect-milk', title: 'Never suggest removing milk', text: 'Keep this essential protected in every budget suggestion.' },
    { id: 'avoid-premium', title: 'Avoid premium brands when possible', text: 'Show a value option before suggesting a brand switch.' },
  ];
  return (
    <div className="page-stack">
      <PageHeading title="A plan that fits your home" description="Set your household size, monthly limit and the rules your shopping plan should respect." />
      <div className="settings-layout">
        <div className="settings-main">
          <section className="card settings-card appearance-card">
            <div className="settings-section-heading"><span className="settings-icon lilac-soft"><Sun size={18} /></span><div><h2>Appearance</h2><p>Choose a comfortable look for this device.</p></div></div>
            <div className="theme-options" role="group" aria-label="Color theme">
              {([
                { value: 'system', label: 'System', icon: Monitor },
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button key={value} className={`theme-option${themePreference === value ? ' selected' : ''}`} onClick={() => onTheme(value)} aria-pressed={themePreference === value}>
                  <Icon size={15} />{label}
                </button>
              ))}
            </div>
          </section>
          <section className="card settings-card">
            <div className="settings-section-heading"><span className="settings-icon green-soft"><Home size={18} /></span><div><h2>Household setup</h2><p>Used to personalize quantities and monthly needs.</p></div></div>
            <div className="settings-field-grid">
              <label className="form-field"><span>Household name</span><input value={data.household.name} onChange={(event) => onHousehold({ name: event.target.value })} /></label>
              <label className="form-field"><span>People in household</span><input type="number" min="1" value={data.household.members} onChange={(event) => onHousehold({ members: Math.max(1, Number(event.target.value)) })} /></label>
              <label className="form-field"><span>Adults <em>optional</em></span><input type="number" min="0" value={data.household.adults} onChange={(event) => onHousehold({ adults: Number(event.target.value) })} /></label>
              <label className="form-field"><span>Children <em>optional</em></span><input type="number" min="0" value={data.household.children} onChange={(event) => onHousehold({ children: Number(event.target.value) })} /></label>
              <label className="form-field"><span>Senior citizens <em>optional</em></span><input type="number" min="0" value={data.household.seniors} onChange={(event) => onHousehold({ seniors: Number(event.target.value) })} /></label>
            </div>
          </section>

          <section className="card settings-card">
            <div className="settings-section-heading"><span className="settings-icon blue-soft"><Wallet size={18} /></span><div><h2>Monthly budget</h2><p>Change your limit any time. Your items won't be altered.</p></div></div>
            <label className="form-field budget-input-field"><span>Grocery + household budget</span><div className="input-with-prefix"><b>₹</b><input type="number" min="0" step="500" value={data.budget} onChange={(event) => onBudget(Number(event.target.value))} /><span className="input-suffix">per month</span></div></label>
            <div className="preset-budgets">{[10000, 15000, 20000, 25000].map((preset) => <button key={preset} className={data.budget === preset ? 'selected' : ''} onClick={() => onBudget(preset)}>{money(preset)}</button>)}</div>
            <div className="buffer-setting"><div><strong>Monthly breathing room</strong><span>Keep this much unplanned for surprises. Recommended: 5–10%.</span></div><label><input type="range" min="5" max="15" value={data.bufferPercent} onChange={(event) => onBuffer(Number(event.target.value))} /><strong>{data.bufferPercent}%</strong></label></div>
            <div className="safe-cap-note"><Target size={16} /><span>Recommended spending cap: <strong>{money(data.budget * (1 - data.bufferPercent / 100))}</strong></span></div>
          </section>

          <section className="card settings-card allocation-settings-card">
            <div className="settings-section-heading"><span className="settings-icon peach-soft"><SlidersHorizontal size={18} /></span><div><h2>Category targets</h2><p>Starting points only — adjust these to suit your household.</p></div></div>
            <div className="allocation-settings-list">
              {allocationNames.map((name) => <label className="allocation-setting-row" key={name}><span>{name}</span><div><input type="number" min="0" max="100" value={data.categoryBudgets[name] ?? 0} onChange={(event) => onCategoryBudgets(name, Number(event.target.value))} /><b>%</b><small>{money(data.budget * (data.categoryBudgets[name] ?? 0) / 100)}</small></div></label>)}
            </div>
            <div className="allocation-foot"><Info size={14} /> Targets are guidance; actual shopping totals can vary month to month.</div>
          </section>
        </div>

        <aside className="settings-aside">
          <section className="card online-settings-card">
            <div className="settings-section-heading"><span className="settings-icon blue-soft"><Store size={18} /></span><div><h2>Online shopping</h2><p>Search nearby stores and compare saved quotes.</p></div></div>
            <div className="online-settings-fields"><label className="form-field"><span>Delivery area / city</span><input value={data.shoppingArea} onChange={(event) => onLocation({ shoppingArea: event.target.value })} placeholder="e.g. Delhi" /></label><label className="form-field"><span>PIN code <em>optional</em></span><input inputMode="numeric" maxLength={6} value={data.postalCode} onChange={(event) => onLocation({ postalCode: event.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit PIN" /></label><label className="form-field"><span>First store to check</span><select value={data.preferredOnlineStore} onChange={(event) => onLocation({ preferredOnlineStore: event.target.value })}>{onlineStores.map((store) => <option key={store.id}>{store.name}</option>)}</select></label></div>
            <div className="online-settings-note"><MapPin size={14} /><span>JioMart is your current first search. Store prices and delivery coverage still need confirmation on the retailer’s site.</span></div>
          </section>
          <section className="card rules-card">
            <div className="settings-section-heading"><span className="settings-icon lilac-soft"><ShieldCheck size={18} /></span><div><h2>My shopping rules</h2><p>Suggestions should work for you.</p></div></div>
            <div className="rule-list">{rules.map((rule) => <label className="rule-toggle-row" key={rule.id}><span className="rule-text"><strong>{rule.title}</strong><small>{rule.text}</small></span><input type="checkbox" checked={data.rules.includes(rule.id)} onChange={() => onRules(rule.id)} /><span className="toggle-ui" /></label>)}</div>
            <div className="rules-safety-note"><ShieldCheck size={16} /><span>Essential products are never silently removed or reduced.</span></div>
          </section>
          <section className="card data-card"><div className="data-card-icon"><Cloud size={18} /></div><div><h3>Saved on this device</h3><p>Your list, prices and stock are stored in this browser. Shopping mode works offline.</p></div><div className="data-state"><span /> Local storage active</div></section>
          <section className="card tour-replay-card"><div><h3>Need a refresher?</h3><p>Replay the step-by-step guide to the app.</p></div><button className="button button-soft button-small" onClick={onTour}><Sparkles size={14} /> Replay intro</button></section>
          <section className="card reset-card"><div><h3>Receipt imports</h3><p>Restore the item list transcribed from your two receipts.</p></div><button className="button button-outline button-small" onClick={onReset}><RotateCcwIcon /> Restore imports</button></section>
          <div className="settings-disclaimer"><Info size={15} /><span>Receipt A’s date and retailer are not visible; several names are flagged for review. Receipt B is dated 31 Aug 2026. These are past-paid prices, not current offers.</span></div>
        </aside>
      </div>
    </div>
  );
}

function RotateCcwIcon() {
  return <span className="rotate-symbol">↶</span>;
}

function affordMessage(amount: number, remaining: number): string {
  if (!amount || amount < 0) return 'Enter a valid item cost to check your budget.';
  const after = remaining - amount;
  if (after >= 0) return `Yes, you can fit ${money(amount)} in the plan. You would have ${money(after)} left. Add it only if that feels comfortable.`;
  return `That would put the plan ${money(Math.abs(after))} over budget. Consider a smaller purchase or review optional items first.`;
}

function ItemModal({ initial, onClose, onSave, onDelete }: { initial: ShoppingItem | null; onClose: () => void; onSave: (item: ShoppingItem) => void; onDelete?: () => void }) {
  const [draft, setDraft] = useState<ShoppingItem>(() => initial ?? {
    id: 'draft-item', name: '', category: 'Grocery', quantity: 1, unit: 'kg', priority: 'important', source: 'other', estimatedPrice: 0, checked: false, frequencyMonths: 1,
  });
  const change = <K extends keyof ShoppingItem>(key: K, value: ShoppingItem[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || draft.quantity <= 0 || draft.estimatedPrice < 0) return;
    onSave({ ...draft, name: draft.name.trim() });
  };
  return <ModalShell onClose={onClose}>
    <form className="dialog item-dialog" onSubmit={submit}>
      <div className="dialog-header"><div><span className="dialog-kicker">MONTHLY SHOPPING PLAN</span><h2>{initial ? 'Edit item' : 'Add an item'}</h2><p>Set what you need and where you plan to buy it.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
      {draft.reviewRequired && <div className="receipt-review-alert"><Info size={15} /><span>Some wording was transcribed from a blurry receipt photo. Check the item name and quantity before relying on it.</span><button type="button" onClick={() => change('reviewRequired', false)}>Mark reviewed</button></div>}
      {draft.priceNeedsReview && <div className="catalog-price-note"><BadgeIndianRupee size={15} /><span>Enter a current price you checked locally. This item’s estimate is blank so it will not affect your budget until you set one.</span></div>}
      <div className="dialog-fields">
        <label className="form-field full-field"><span>Item name</span><input autoFocus value={draft.name} onChange={(event) => change('name', event.target.value)} placeholder="e.g. Toor dal" required /></label>
        <label className="form-field"><span>Category</span><select value={draft.category} onChange={(event) => change('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="form-field"><span>Priority</span><select value={draft.priority} onChange={(event) => change('priority', event.target.value as Priority)}><option value="essential">Essential</option><option value="important">Important</option><option value="optional">Optional</option><option value="luxury">Luxury</option></select></label>
        <label className="form-field"><span>Quantity</span><input type="number" min="0.001" step="0.001" value={draft.quantity} onChange={(event) => change('quantity', Number(event.target.value))} /></label>
        <label className="form-field"><span>Unit</span><input value={draft.unit} onChange={(event) => change('unit', event.target.value)} placeholder="kg, L, packets" /></label>
        <label className="form-field"><span>Last paid / estimate</span><div className="input-with-prefix"><b>₹</b><input type="number" min="0" step="0.01" value={draft.estimatedPrice} onChange={(event) => change('estimatedPrice', Number(event.target.value))} /></div></label>
        <label className="form-field"><span>Purchase source</span><select value={draft.source} onChange={(event) => change('source', event.target.value as Source)}><option value="csd">{sourceDetails.csd.label}</option><option value="market">{sourceDetails.market.label}</option><option value="online">{sourceDetails.online.label}</option><option value="other">{sourceDetails.other.label}</option><option value="remove">Don't buy this month</option></select></label>
        <label className="form-field"><span>Repeat every</span><select value={draft.frequencyMonths} onChange={(event) => change('frequencyMonths', Number(event.target.value))}><option value={1}>Every month</option><option value={2}>Every 2 months</option><option value={3}>Every 3 months</option></select></label>
        <label className="form-field"><span>Brand <em>optional</em></span><input value={draft.brand ?? ''} onChange={(event) => change('brand', event.target.value)} placeholder="e.g. preferred brand" /></label>
        <label className="form-field"><span>CSD price <em>optional</em></span><div className="input-with-prefix"><b>₹</b><input type="number" min="0" step="0.01" value={draft.csdPrice ?? ''} onChange={(event) => change('csdPrice', event.target.value === '' ? undefined : Number(event.target.value))} /></div></label>
        <label className="form-field"><span>Market price <em>optional</em></span><div className="input-with-prefix"><b>₹</b><input type="number" min="0" step="0.01" value={draft.marketPrice ?? ''} onChange={(event) => change('marketPrice', event.target.value === '' ? undefined : Number(event.target.value))} /></div></label>
      </div>
      <div className="dialog-note"><Info size={15} /><span>Receipt prices are historical. Add current CSD/market prices for savings comparisons. Recurring items show a monthly-equivalent cost.</span></div>
      <div className="dialog-actions">{onDelete && <button type="button" className="delete-action" onClick={onDelete}><Trash2 size={15} /> Remove item</button>}<div className="dialog-actions-right"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Check size={16} /> {initial ? 'Save changes' : 'Add to plan'}</button></div></div>
    </form>
  </ModalShell>;
}

function InventoryModal({ onClose, onSave }: { onClose: () => void; onSave: (item: Omit<InventoryItem, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [currentStock, setCurrentStock] = useState(0);
  const [monthlyUse, setMonthlyUse] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [unitPrice, setUnitPrice] = useState(0);
  return <ModalShell onClose={onClose}>
    <form className="dialog inventory-dialog" onSubmit={(event) => { event.preventDefault(); if (name.trim()) onSave({ name: name.trim(), category, currentStock, monthlyUse, unit, unitPrice }); }}>
      <div className="dialog-header"><div><span className="dialog-kicker">HOME INVENTORY</span><h2>Add stock item</h2><p>Track what you already have before planning the next shop.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
      <div className="dialog-fields">
        <label className="form-field full-field"><span>Item name</span><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Rice" /></label>
        <label className="form-field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((categoryName) => <option key={categoryName}>{categoryName}</option>)}</select></label>
        <label className="form-field"><span>Unit</span><input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="kg" /></label>
        <label className="form-field"><span>Current stock</span><input type="number" min="0" step="0.5" value={currentStock} onChange={(event) => setCurrentStock(Number(event.target.value))} /></label>
        <label className="form-field"><span>Monthly use</span><input type="number" min="0" step="0.5" value={monthlyUse} onChange={(event) => setMonthlyUse(Number(event.target.value))} /></label>
        <label className="form-field full-field"><span>Estimated price per {unit || 'unit'}</span><div className="input-with-prefix"><b>₹</b><input type="number" min="0" value={unitPrice} onChange={(event) => setUnitPrice(Number(event.target.value))} /></div></label>
      </div>
      <div className="dialog-actions"><div /><div className="dialog-actions-right"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Plus size={16} /> Add to inventory</button></div></div>
    </form>
  </ModalShell>;
}

function OptimizerModal({ planned, budget, spendCap, remaining, bufferPercent, suggestions, onApply, onClose }: {
  planned: number;
  budget: number;
  spendCap: number;
  remaining: number;
  bufferPercent: number;
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onClose: () => void;
}) {
  const totalPotential = suggestions.reduce((sum, suggestion) => sum + suggestion.saving, 0);
  const overBudget = planned > budget;
  const aboveCap = planned > spendCap;
  return <ModalShell onClose={onClose}>
    <div className="dialog optimizer-dialog">
      <div className="dialog-header"><div><span className="dialog-kicker"><Sparkles size={13} /> BUDGETBASKET SMART CHECK</span><h2>Let's make your budget work harder.</h2><p>Here are transparent ideas based on your list. Nothing changes until you choose.</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
      <div className={`optimizer-summary ${overBudget ? 'optimizer-summary-alert' : ''}`}>
        <div><span>Planned spend</span><strong>{money(planned)}</strong></div><div><span>Monthly budget</span><strong>{money(budget)}</strong></div><div><span>{overBudget ? 'Over budget' : 'Still available'}</span><strong className={overBudget ? 'negative' : 'positive'}>{money(Math.abs(remaining))}</strong></div>
      </div>
      <div className="optimizer-status-message"><span className={`status-check ${overBudget ? 'status-check-warn' : ''}`}>{overBudget ? <TrendingDown size={17} /> : <Check size={17} />}</span><div><strong>{overBudget ? `Your plan is ${money(Math.abs(remaining))} over budget.` : aboveCap ? `You’re within budget, and only ${money(planned - spendCap)} above your ${bufferPercent}% buffer target.` : `Nice work — your plan is within the ${bufferPercent}% buffer target.`}</strong><span>{overBudget ? 'Start with flexible purchases. Essentials are protected.' : `You have ${money(Math.max(0, remaining))} left. Keep the rest as breathing room or review optional savings below.`}</span></div></div>
      <div className="suggestion-list-head"><div><h3>Suggestions for you</h3><span>Estimated possible savings: <strong>{money(totalPotential)}</strong></span></div><span className="approval-only"><ShieldCheck size={14} /> You approve each one</span></div>
      {suggestions.length ? <div className="suggestion-list">{suggestions.map((suggestion, index) => <div className="suggestion-row" key={suggestion.id}>
        <div className={`suggestion-number ${index === 0 ? 'first' : ''}`}>{String(index + 1).padStart(2, '0')}</div>
        <div className="suggestion-copy"><strong>{suggestion.title}</strong><span>{suggestion.reason}</span></div>
        <div className="suggestion-saving"><strong>{money(suggestion.saving)}</strong><span>save</span></div>
        <button className="suggestion-apply" onClick={() => onApply(suggestion)} aria-label={`Apply ${suggestion.title}`}><Plus size={16} /></button>
      </div>)}</div> : <div className="empty-suggestions"><div><Check size={19} /></div><strong>No changes recommended</strong><span>Your basket has no optional adjustments to suggest right now.</span></div>}
      <div className="optimizer-modal-foot"><Info size={15} /><span>Suggestions are estimates. Essential items are never reduced or removed automatically; price and product quality are not assumed to be identical.</span></div>
      <div className="dialog-actions"><button className="text-button optimizer-close-link" onClick={onClose}>Keep my plan as it is</button><div className="dialog-actions-right"><button className="button button-primary" onClick={onClose}>Done <Check size={16} /></button></div></div>
    </div>
  </ModalShell>;
}

function HouseholdCatalogModal({ existingItems, onAdd, onClose }: { existingItems: ShoppingItem[]; onAdd: (items: HouseholdCatalogEntry[]) => void; onClose: () => void }) {
  const [activeGroup, setActiveGroup] = useState('All essentials');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const existingNames = new Set(existingItems.map((entry) => entry.name.trim().toLowerCase()));
  const existingCatalogIds = new Set(existingItems.map((entry) => entry.catalogId).filter(Boolean));
  const isAdded = (entry: HouseholdCatalogEntry) => existingNames.has(entry.name.trim().toLowerCase()) || existingCatalogIds.has(entry.id);
  const visibleEntries = householdCatalog.filter((entry) => {
    const matchesGroup = activeGroup === 'All essentials' || entry.group === activeGroup;
    const matchesSearch = !search.trim() || `${entry.name} ${entry.category} ${entry.group} ${entry.note ?? ''}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesGroup && matchesSearch;
  });
  const availableVisible = visibleEntries.filter((entry) => !isAdded(entry));
  const allVisibleSelected = availableVisible.length > 0 && availableVisible.every((entry) => selectedIds.includes(entry.id));
  const toggleVisible = () => setSelectedIds((current) => allVisibleSelected ? current.filter((id) => !availableVisible.some((entry) => entry.id === id)) : [...new Set([...current, ...availableVisible.map((entry) => entry.id)])]);
  const selectedEntries = householdCatalog.filter((entry) => selectedIds.includes(entry.id) && !isAdded(entry));

  return <ModalShell onClose={onClose}>
    <div className="dialog catalog-dialog">
      <div className="dialog-header"><div><span className="dialog-kicker"><Boxes size={13} /> HOUSEHOLD STARTER CATALOG</span><h2>What else does your home need?</h2><p>A broad, editable checklist—not a universal prescription. Pick only the items your household actually uses.</p></div><button className="icon-button" onClick={onClose} aria-label="Close household catalog"><X size={19} /></button></div>
      <div className="catalog-transparency-note"><Info size={15} /><span>Nothing is added until you select it. Suggested prices are intentionally blank; each selected item stays out of the budget total until you enter a price.</span></div>
      <div className="catalog-toolbar"><label className="search-field"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an item or category" /></label><button className="catalog-select-visible" onClick={toggleVisible}>{allVisibleSelected ? 'Clear visible' : `Select visible (${availableVisible.length})`}</button></div>
      <div className="catalog-layout">
        <nav className="catalog-category-list" aria-label="Household catalog categories"><button className={activeGroup === 'All essentials' ? 'active' : ''} onClick={() => setActiveGroup('All essentials')}><span>All essentials</span><small>{householdCatalog.length}</small></button>{householdCatalogGroups.map((group) => <button key={group} className={activeGroup === group ? 'active' : ''} onClick={() => setActiveGroup(group)}><span>{group}</span><small>{householdCatalog.filter((entry) => entry.group === group).length}</small></button>)}</nav>
        <div className="catalog-item-list">{visibleEntries.length ? visibleEntries.map((entry) => {
          const added = isAdded(entry);
          const selected = selectedIds.includes(entry.id);
          return <label className={`catalog-item-option ${added ? 'already-added' : ''}`} key={entry.id}><input type="checkbox" checked={added || selected} disabled={added} onChange={() => setSelectedIds((current) => current.includes(entry.id) ? current.filter((id) => id !== entry.id) : [...current, entry.id])} /><span className="catalog-checkbox"><Check size={12} /></span><span className="catalog-item-copy"><strong>{entry.name}</strong><small>{entry.category} · {numberFormat(entry.quantity)} {entry.unit}{entry.frequencyMonths > 1 ? ` · every ${entry.frequencyMonths} months` : ''}{entry.note ? ` · ${entry.note}` : ''}</small></span><span className={`catalog-priority catalog-${entry.priority}`}>{added ? 'In your list' : entry.priority}</span></label>;
        }) : <div className="catalog-empty"><Search size={19} /><strong>No catalog matches</strong><span>Try a different item name or category.</span></div>}</div>
      </div>
      <div className="catalog-footer"><span>{selectedEntries.length} selected · {householdCatalog.length} suggestions across {householdCatalogGroups.length} categories</span><div><button className="button button-outline" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={!selectedEntries.length} onClick={() => onAdd(selectedEntries)}><Plus size={15} /> Add selected items</button></div></div>
    </div>
  </ModalShell>;
}

function ProductTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps: { eyebrow: string; title: string; body: string; takeaway: string; icon: ReactNode; color: string }[] = [
    { eyebrow: 'HOME · YOUR MONTH AT A GLANCE', title: 'Start with receipts, not a blank list.', body: 'Your two receipts are already in BudgetBasket. The home screen turns those past purchases into an editable starting point for this month.', takeaway: 'Past receipt prices are historical—not live store prices.', icon: <Home size={29} />, color: 'tour-green' },
    { eyebrow: 'SHOPPING · REVIEW WHAT REPEATS', title: 'Keep the items you want. Discontinue the rest.', body: 'Search the receipt list, correct flagged names, or browse the categorized household catalog. Select only what your home uses; set prices before trusting the budget.', takeaway: 'Catalog suggestions are optional; nothing is added unless you choose it.', icon: <ShoppingBasket size={29} />, color: 'tour-peach' },
    { eyebrow: 'ONLINE · SEARCH NEAR YOU', title: 'JioMart is your first online search.', body: 'Choose Online on an item and BudgetBasket opens retailer searches with JioMart first by default. Add your city and PIN code in Settings, then confirm delivery on the store site.', takeaway: 'Prices and stock are not scraped live. Save a checked quote to compare sellers by unit price.', icon: <Store size={29} />, color: 'tour-blue' },
    { eyebrow: 'BUDGET · MAKE A PLAN, NOT A GUESS', title: 'Your totals update as you edit.', body: 'BudgetBasket calculates totals from quantities and prices. Set a buffer, check whether you can afford an extra purchase, and review optimizer ideas before accepting them.', takeaway: 'The optimizer suggests changes; it never silently removes essentials.', icon: <BarChart3 size={29} />, color: 'tour-lilac' },
    { eyebrow: 'INVENTORY · SHOP WITH CONFIDENCE', title: 'Check stock, shop, and record what you paid.', body: 'Enter what is already at home, approve recommended quantities, and use Shopping mode to check off items and add actual prices—even if your connection drops after the page loads.', takeaway: 'Your current plan is saved in this browser. Cloud sync is not connected yet.', icon: <Boxes size={29} />, color: 'tour-yellow' },
  ];
  const current = steps[step];
  const advance = () => step === steps.length - 1 ? onClose() : setStep((value) => value + 1);
  const goBack = () => setStep((value) => Math.max(0, value - 1));
  return <ModalShell onClose={onClose}>
    <div className="dialog tour-dialog">
      <div className="tour-topline"><div className="brand-mini"><span className="brand-mark"><ShoppingBasket size={16} /></span><strong>Budget<span>Basket</span></strong></div><button className="tour-skip" onClick={onClose}>Skip intro <X size={14} /></button></div>
      <div className="tour-progress-track"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <div className="tour-step-grid" key={step}>
        <div className={`tour-illustration ${current.color}`}><div className="tour-orbit orbit-one" /><div className="tour-orbit orbit-two" /><div className="tour-illustration-icon">{current.icon}</div><div className="tour-mini-card"><span>{step === 0 ? 'RECEIPTS IMPORTED' : step === 1 ? 'MONTHLY PLAN' : step === 2 ? 'FIRST STORE' : step === 3 ? 'BUDGET CHECK' : 'AT HOME'}</span><strong>{step === 0 ? '73 items ready' : step === 1 ? 'You decide what stays' : step === 2 ? 'JioMart · first search' : step === 3 ? 'Essentials protected' : 'Stock adjusts the list'}</strong><i /></div><div className="tour-floating-check"><Check size={15} /></div></div>
        <div className="tour-copy"><span className="tour-eyebrow">STEP {String(step + 1).padStart(2, '0')} OF {steps.length} · {current.eyebrow}</span><h2>{current.title}</h2><p>{current.body}</p><div className="tour-takeaway"><Sparkles size={16} /><span>{current.takeaway}</span></div><div className="tour-dots">{steps.map((entry, index) => <button key={entry.eyebrow} onClick={() => setStep(index)} className={index === step ? 'active' : ''} aria-label={`Go to step ${index + 1}`} />)}</div></div>
      </div>
      <div className="tour-actions"><button className="button button-outline" onClick={goBack} disabled={step === 0}><ArrowLeft size={14} /> Back</button><span className="tour-step-count">{step + 1} / {steps.length}</span><button className="button button-primary" onClick={advance}>{step === steps.length - 1 ? 'Start planning' : 'Next step'} <ArrowRight size={15} /></button></div>
    </div>
  </ModalShell>;
}

function ReceiptSummaryModal({ onClose, onOpenList }: { onClose: () => void; onOpenList: () => void }) {
  const importedCount = defaultState.items.length;
  const transcribedTotal = receiptSummaries.reduce((sum, receipt) => sum + receipt.lineTotal, 0);
  return <ModalShell onClose={onClose}>
    <div className="dialog receipt-dialog">
      <div className="dialog-header"><div><span className="dialog-kicker"><ClipboardCheck size={13} /> YOUR RECEIPTS</span><h2>Purchases imported</h2><p>{importedCount} receipt line items are ready to review and manage.</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
      <div className="receipt-total-summary"><div><span>Visible line totals</span><strong>{moneyPrecise(transcribedTotal)}</strong></div><div><span>Products to review</span><strong>{defaultState.items.filter((item) => item.reviewRequired).length}</strong></div></div>
      <div className="receipt-record-list">
        {receiptSummaries.map((receipt) => <article className="receipt-record" key={receipt.id}>
          <div className="receipt-record-top"><span className="receipt-record-icon"><ClipboardCheck size={16} /></span><div><strong>{receipt.label}</strong><small>{receipt.date} · {receipt.store}</small></div><span className="receipt-line-count">{receipt.itemCount} lines</span></div>
          <div className="receipt-record-totals"><span>Visible line total <strong>{moneyPrecise(receipt.lineTotal)}</strong></span>{receipt.gross !== undefined && <span>Gross <strong>{moneyPrecise(receipt.gross)}</strong></span>}{receipt.discount !== undefined && <span>Discount saved <strong>{moneyPrecise(receipt.discount)}</strong></span>}</div>
          <p>{receipt.note}</p>
        </article>)}
      </div>
      <div className="receipt-modal-note"><Info size={15} /><span>Imported amounts are previous paid prices. They are not live prices or verified store classifications. Update source, quantity and recurrence for your October plan.</span></div>
      <div className="dialog-actions"><button className="text-button" onClick={onClose}>Close</button><div className="dialog-actions-right"><button className="button button-primary" onClick={onOpenList}>Manage items <ArrowRight size={15} /></button></div></div>
    </div>
  </ModalShell>;
}

function defaultOfferPack(item: ShoppingItem): { quantity: string; unit: OnlinePriceOffer['packUnit'] } {
  const match = item.unit.match(/([\d.]+)\s*(kg|g|ml|l)\b/i);
  if (match) {
    const unit = match[2].toLowerCase() === 'l' ? 'L' : match[2].toLowerCase() as OnlinePriceOffer['packUnit'];
    return { quantity: match[1], unit };
  }
  const normalized = item.unit.toLowerCase();
  if (['kg', 'g', 'ml', 'l'].includes(normalized)) {
    return { quantity: String(item.quantity), unit: normalized === 'l' ? 'L' : normalized as OnlinePriceOffer['packUnit'] };
  }
  return { quantity: '1', unit: 'piece' };
}

function OnlineSearchModal({ item, area, postalCode, preferredStore, onSaveOffer, onEditLocation, onClose }: {
  item: ShoppingItem;
  area: string;
  postalCode: string;
  preferredStore: string;
  onSaveOffer: (itemId: string, offer: OnlinePriceOffer) => void;
  onEditLocation: () => void;
  onClose: () => void;
}) {
  const packDefaults = defaultOfferPack(item);
  const [quoteStore, setQuoteStore] = useState(preferredStore);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteQuantity, setQuoteQuantity] = useState(packDefaults.quantity);
  const [quoteUnit, setQuoteUnit] = useState<OnlinePriceOffer['packUnit']>(packDefaults.unit);
  const [quoteError, setQuoteError] = useState('');
  const locationLabel = postalCode.trim() ? `${area || 'India'} · ${postalCode}` : (area || 'India');
  const stores = [onlineStores.find((store) => store.name === preferredStore) ?? onlineStores[0], ...onlineStores.filter((store) => store.name !== preferredStore)];
  const offers = (item.onlineOffers ?? []).map((offer) => ({ ...offer, ...normalizeOffer(offer) }));
  const bestPerUnit = new Map<string, number>();
  offers.forEach((offer) => bestPerUnit.set(offer.unit, Math.min(bestPerUnit.get(offer.unit) ?? Number.POSITIVE_INFINITY, offer.rate)));

  const saveQuote = () => {
    const price = Number(quotePrice);
    const quantity = Number(quoteQuantity);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      setQuoteError('Enter a price and pack size greater than zero.');
      return;
    }
    onSaveOffer(item.id, {
      id: `offer-${Date.now()}`,
      store: quoteStore,
      price,
      packQuantity: quantity,
      packUnit: quoteUnit,
      checkedAt: localDateStamp(),
    });
    setQuotePrice('');
    setQuoteError('');
  };

  return <ModalShell onClose={onClose}>
    <div className="dialog online-search-dialog">
      <div className="dialog-header"><div><span className="dialog-kicker"><ShoppingCart size={13} /> ONLINE SHOPPING · {locationLabel.toUpperCase()}</span><h2>Find {item.name} online</h2><p>{numberFormat(item.quantity)} {item.unit} · last paid {moneyPrecise(item.estimatedPrice)}</p></div><button className="icon-button" onClick={onClose} aria-label="Close online search"><X size={19} /></button></div>
      <div className="preferred-store-note"><span className="preferred-store-icon"><Store size={17} /></span><div><strong>{preferredStore} is your first search</strong><span>Prioritize it for your area, then compare any saved seller prices per unit.</span></div><button onClick={onEditLocation}>Change area</button></div>
      <div className="online-area-notice"><MapPin size={15} /><span>Delivery availability and price depend on your exact address. {postalCode ? `Your configured PIN is ${postalCode}. Enter or confirm it on the retailer site; availability and checkout totals are checked there.` : 'Add your PIN code in Settings, then enter or confirm the delivery address on the retailer site.'}</span></div>

      {offers.length > 0 ? <section className="saved-online-prices"><div className="online-section-title"><div><h3>Saved price checks</h3><span>Historical quotes · not live inventory</span></div><span className="online-price-count">{offers.length} saved</span></div><div className="online-offer-list">{[...offers].sort((a, b) => a.rate - b.rate).map((offer) => <div className="online-offer-row" key={offer.id}><span className="offer-store-mark"><Store size={14} /></span><div className="online-offer-main"><strong>{offer.store}</strong><span>{offer.packQuantity} {offer.packUnit} pack · checked {offer.checkedAt}{offer.area ? ` · ${offer.area}` : ''}{offer.postalCode ? ` ${offer.postalCode}` : ''}</span></div><div className="online-offer-price"><strong>{moneyPrecise(offer.price)}</strong><span>{moneyPrecise(offer.rate)} / {offer.unit}</span></div><span className={`offer-rank ${offer.rate === bestPerUnit.get(offer.unit) ? 'best' : ''}`}>{offer.rate === bestPerUnit.get(offer.unit) ? 'Lowest saved' : 'Recorded'}</span></div>)}</div></section> : <div className="online-no-offers"><div className="online-empty-icon"><Search size={17} /></div><div><strong>No saved seller prices yet</strong><span>Search a retailer below. BudgetBasket does not scrape live prices, so it won’t pretend a result is cheapest until you compare a verified quote.</span></div></div>}

      <section className="online-retailer-section"><div className="online-section-title"><div><h3>Search stores</h3><span>Opens retailer search results in a new tab</span></div></div><div className="retailer-search-list">{stores.map((store, index) => {
        const latest = [...(item.onlineOffers ?? [])].filter((offer) => offer.store === store.name).sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0];
        return <div className={`retailer-search-row ${index === 0 ? 'preferred' : ''}`} key={store.id}><span className="retailer-index">{String(index + 1).padStart(2, '0')}</span><div className="retailer-search-copy"><strong>{store.name}{index === 0 && <em>FIRST TO CHECK</em>}</strong><span>{latest ? `Last saved ${moneyPrecise(latest.price)} · ${latest.checkedAt}` : 'Check today’s price and delivery availability'}</span></div><button type="button" className="retailer-open-link" aria-label={`Search ${store.name} for ${item.name}`} onClick={() => openRetailerSearch(store.search(item.name))}>Search <ExternalLink size={13} /></button></div>;
      })}</div></section>

      <section className="save-online-quote"><div className="online-section-title"><div><h3>Found a price? Save it</h3><span>Quotes stay on this device and are dated for comparison.</span></div></div><div className="quote-entry-grid"><label className="form-field"><span>Store</span><select value={quoteStore} onChange={(event) => setQuoteStore(event.target.value)}>{onlineStores.map((store) => <option key={store.id}>{store.name}</option>)}</select></label><label className="form-field"><span>Pack price</span><div className="input-with-prefix"><b>₹</b><input type="number" min="0.01" step="0.01" value={quotePrice} onChange={(event) => setQuotePrice(event.target.value)} placeholder="0.00" /></div></label><label className="form-field"><span>Pack size</span><input type="number" min="0.001" step="0.001" value={quoteQuantity} onChange={(event) => setQuoteQuantity(event.target.value)} /></label><label className="form-field"><span>Unit</span><select value={quoteUnit} onChange={(event) => setQuoteUnit(event.target.value as OnlinePriceOffer['packUnit'])}><option value="kg">kg</option><option value="g">g</option><option value="L">L</option><option value="ml">ml</option><option value="piece">piece</option></select></label></div>{quoteError && <span className="quote-error">{quoteError}</span>}<button className="button button-primary save-quote-button" onClick={saveQuote}><Plus size={15} /> Save checked price</button></section>
      <div className="online-search-disclaimer"><Info size={14} /><span>Store pages may change prices, stock and delivery fees by PIN code. Confirm the final checkout amount before buying.</span></div>
      <div className="dialog-actions"><button className="text-button" onClick={onClose}>Close search</button><div className="dialog-actions-right"><button className="button button-outline" onClick={onEditLocation}><MapPin size={14} /> Set delivery area</button><button className="button button-primary" onClick={onClose}>Done</button></div></div>
    </div>
  </ModalShell>;
}

function ModalShell({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  return <div className="modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal-scroll-area">{children}</div></div>;
}

export default App;
