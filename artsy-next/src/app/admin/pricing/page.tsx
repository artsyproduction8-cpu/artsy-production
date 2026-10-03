'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ServiceCategory,
  ServiceProduct,
  CameraAngleRule,
  DeliverySlaRule,
  loadPricingMatrix,
  savePricingMatrix,
  loadCameraAngleRules,
  saveCameraAngleRules,
  loadDeliverySlaRules,
  saveDeliverySlaRules,
  deployPricingMatrix,
  getDeploymentStatus,
  resetPricingMatrix,
  DEFAULT_CAMERA_ANGLES,
  DEFAULT_DELIVERY_SLAS,
} from '@/lib/pricing/catalog-matrix';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

export default function AdminPricingPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'formats' | 'angles' | 'delivery'>('formats');

  // Matrix state
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cameraAngles, setCameraAngles] = useState<CameraAngleRule[]>([]);
  const [deliverySlas, setDeliverySlas] = useState<DeliverySlaRule[]>([]);

  // Selection & filter state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('highlight-teaser');
  const [simulatedAngleId, setSimulatedAngleId] = useState<string>('single');
  const [simulatedDeliveryId, setSimulatedDeliveryId] = useState<string>('standard');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications & Deployment
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deployStatus, setDeployStatus] = useState<{ version: number; lastDeployed: string | null }>({
    version: 1,
    lastDeployed: null,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modals
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [addProductCategoryId, setAddProductCategoryId] = useState<string>('wedding');

  // Form states for adding category
  const [newCatId, setNewCatId] = useState('');
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatBadge, setNewCatBadge] = useState('STUDIO SUITE');
  const [newCatIcon, setNewCatIcon] = useState('🎬');
  const [newCatTagline, setNewCatTagline] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatTurnaround, setNewCatTurnaround] = useState('7–10 Days Standard');

  // Form states for adding product
  const [newProdName, setNewProdName] = useState('');
  const [newProdId, setNewProdId] = useState('');
  const [newProdDuration, setNewProdDuration] = useState('3–5 min');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(5000);
  const [newProdSla, setNewProdSla] = useState(168);
  const [newProdStandardDelivery, setNewProdStandardDelivery] = useState('7–10 working days');
  const [newProdRushFee, setNewProdRushFee] = useState(2000);
  const [newProdRushOptions, setNewProdRushOptions] = useState('+₹2,000 (4–5 days)');
  const [newProdSplit, setNewProdSplit] = useState(70);
  const [newProdTag, setNewProdTag] = useState('');
  const [newProdFormats, setNewProdFormats] = useState('ProRes 422 HQ 4K, 9:16 Vertical Cut, Dialogue Stems');
  const [newProdProfiles, setNewProdProfiles] = useState('Sony S-Log3, Canon Log 2/3');

  // Load matrices on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'angles' || tabParam === 'delivery' || tabParam === 'formats') {
        setActiveTab(tabParam);
      }
    }
    const cats = loadPricingMatrix();
    const angles = loadCameraAngleRules();
    const slas = loadDeliverySlaRules();
    setCategories(cats);
    setCameraAngles(angles);
    setDeliverySlas(slas);
    setDeployStatus(getDeploymentStatus());
    if (cats.length > 0 && cats[0].products.length > 0) {
      setSelectedProductId(cats[0].products[0].id);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Find currently selected product for waterfall calculation
  let activeProduct: ServiceProduct | null = null;
  let activeProductCategory: ServiceCategory | null = null;
  for (const cat of categories) {
    const found = cat.products.find((p) => p.id === selectedProductId);
    if (found) {
      activeProduct = found;
      activeProductCategory = cat;
      break;
    }
  }

  // Active angle & delivery simulated adjustments
  const isWeddingPersonal =
    activeProductCategory?.id === 'wedding' || activeProductCategory?.id === 'personal';

  const chosenAngle = cameraAngles.find((a) => a.id === simulatedAngleId) || cameraAngles[0];
  const angleSurcharge = chosenAngle
    ? isWeddingPersonal
      ? chosenAngle.costWeddingPersonal
      : chosenAngle.costBrandCorporate
    : 0;

  const chosenDelivery = deliverySlas.find((s) => s.id === simulatedDeliveryId) || deliverySlas[0];
  const deliverySurcharge = chosenDelivery
    ? isWeddingPersonal
      ? chosenDelivery.costWeddingPersonal
      : chosenDelivery.costBrandCorporate
    : 0;

  const totalSimulatedQuote =
    (activeProduct ? activeProduct.basePrice : 5000) + angleSurcharge + deliverySurcharge;

  // Calculate live financial waterfall based on total simulated quote
  const waterfall = calculateFinancialWaterfall(totalSimulatedQuote * 100, {
    creatorSharePct: activeProduct ? activeProduct.creatorSharePct : 70,
  });

  // Deploy handler: Deploys directly into live public website
  const handleDeploy = () => {
    const result = deployPricingMatrix(categories, cameraAngles, deliverySlas);
    setDeployStatus({ version: result.version, lastDeployed: result.timestamp });
    setHasUnsavedChanges(false);
    showToast(
      `✓ Successfully deployed (v${result.version}) to live website application! Public pages (/services and /book) now reflect these prices, camera angles, and delivery SLAs.`
    );
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        'Reset all categories, camera angles, and delivery turnaround SLAs to authentic studio default catalog?'
      )
    ) {
      const def = resetPricingMatrix();
      setCategories(def);
      setCameraAngles(DEFAULT_CAMERA_ANGLES);
      setDeliverySlas(DEFAULT_DELIVERY_SLAS);
      setDeployStatus(getDeploymentStatus());
      setHasUnsavedChanges(false);
      if (def[0]?.products[0]) setSelectedProductId(def[0].products[0].id);
      showToast('Catalog matrix, angles, and delivery SLAs reset to official default website catalog.');
    }
  };

  // Product price / SLA inline modifiers (Simplified: direct inputs & toggles)
  const updateProduct = (catId: string, prodId: string, patch: Partial<ServiceProduct>) => {
    setHasUnsavedChanges(true);
    setCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          products: c.products.map((p) => {
            if (p.id !== prodId) return p;
            return { ...p, ...patch };
          }),
        };
      });
      savePricingMatrix(updated);
      return updated;
    });
  };

  const toggleProductActive = (catId: string, prodId: string) => {
    setHasUnsavedChanges(true);
    setCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          products: c.products.map((p) => (p.id === prodId ? { ...p, active: !p.active } : p)),
        };
      });
      savePricingMatrix(updated);
      return updated;
    });
    showToast('Product active status toggled. Click Deploy to update main website.');
  };

  const toggleProductPopular = (catId: string, prodId: string) => {
    setHasUnsavedChanges(true);
    setCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          products: c.products.map((p) =>
            p.id === prodId ? { ...p, popular: !p.popular, tag: !p.popular ? 'Most Popular' : undefined } : p
          ),
        };
      });
      savePricingMatrix(updated);
      return updated;
    });
    showToast('Product popular highlight toggled.');
  };

  const deleteProduct = (catId: string, prodId: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the catalog?`)) {
      setHasUnsavedChanges(true);
      setCategories((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== catId) return c;
          return {
            ...c,
            products: c.products.filter((p) => p.id !== prodId),
          };
        });
        savePricingMatrix(updated);
        return updated;
      });
      showToast(`Removed product: ${name}`);
    }
  };

  const deleteCategory = (catId: string, title: string) => {
    if (confirm(`Delete category "${title}" and all of its formats from the website?`)) {
      setHasUnsavedChanges(true);
      setCategories((prev) => {
        const updated = prev.filter((c) => c.id !== catId);
        savePricingMatrix(updated);
        return updated;
      });
      if (selectedCategoryId === catId) setSelectedCategoryId('all');
      showToast(`Category "${title}" deleted.`);
    }
  };

  // Camera Angle Matrix Modifiers
  const updateCameraAngle = (angleId: string, patch: Partial<CameraAngleRule>) => {
    setHasUnsavedChanges(true);
    setCameraAngles((prev) => {
      const updated = prev.map((a) => (a.id === angleId ? { ...a, ...patch } : a));
      saveCameraAngleRules(updated);
      return updated;
    });
  };

  // Delivery SLA Matrix Modifiers
  const updateDeliverySla = (slaId: string, patch: Partial<DeliverySlaRule>) => {
    setHasUnsavedChanges(true);
    setDeliverySlas((prev) => {
      const updated = prev.map((s) => (s.id === slaId ? { ...s, ...patch } : s));
      saveDeliverySlaRules(updated);
      return updated;
    });
  };

  // Add Category Submit
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;

    const slug =
      newCatId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
      `cat-${Date.now().toString().slice(-5)}`;
    const newCategory: ServiceCategory = {
      id: slug,
      title: newCatTitle.trim(),
      badge: newCatBadge.trim().toUpperCase() || 'STUDIO SUITE',
      tagline: newCatTagline.trim() || `${newCatTitle.trim()} post-production engineering.`,
      icon: newCatIcon || '🎬',
      turnaround: newCatTurnaround.trim() || '7–10 Days Standard',
      description: newCatDesc.trim() || 'Custom studio production service line.',
      products: [],
    };

    const updated = [...categories, newCategory];
    setCategories(updated);
    savePricingMatrix(updated);
    setHasUnsavedChanges(true);
    setIsAddCategoryOpen(false);
    setNewCatTitle('');
    setNewCatId('');
    setNewCatDesc('');
    setNewCatTagline('');
    setSelectedCategoryId(slug);
    showToast(`✓ Created new category: ${newCategory.title}. Click Deploy to publish.`);
  };

  // Add Product Submit
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !addProductCategoryId) return;

    const slug =
      newProdId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
      `prod-${Date.now().toString().slice(-5)}`;
    const newProduct: ServiceProduct = {
      id: slug,
      categoryId: addProductCategoryId,
      name: newProdName.trim(),
      duration: newProdDuration.trim() || '3–5 min',
      description: newProdDesc.trim() || 'Precision timeline post-production service.',
      basePrice: Number(newProdPrice) || 3000,
      slaHours: Number(newProdSla) || 168,
      standardDelivery: newProdStandardDelivery.trim() || '7–10 working days',
      rushOptions: newProdRushOptions.trim() || '+₹2,000 (4–5 days)',
      rushFee: Number(newProdRushFee) || 2000,
      rushMultiplier: 1.4,
      creatorSharePct: Number(newProdSplit) || 70,
      tag: newProdTag.trim() || undefined,
      deliverables: newProdFormats
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      cameraProfiles: newProdProfiles
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      active: true,
    };

    const updated = categories.map((c) => {
      if (c.id !== addProductCategoryId) return c;
      return {
        ...c,
        products: [...c.products, newProduct],
      };
    });

    setCategories(updated);
    savePricingMatrix(updated);
    setHasUnsavedChanges(true);
    setSelectedProductId(slug);
    setIsAddProductOpen(false);
    setNewProdName('');
    setNewProdId('');
    setNewProdDesc('');
    showToast(
      `✓ Added "${newProduct.name}" under ${
        categories.find((c) => c.id === addProductCategoryId)?.title
      }. Click Deploy to publish.`
    );
  };

  // Filtered categories and products
  const filteredCategories = categories
    .filter((c) => selectedCategoryId === 'all' || c.id === selectedCategoryId)
    .map((c) => ({
      ...c,
      products: c.products.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.deliverables.some((df) => df.toLowerCase().includes(q)) ||
          p.cameraProfiles.some((cp) => cp.toLowerCase().includes(q))
        );
      }),
    }))
    .filter((c) => c.products.length > 0 || !searchQuery.trim());

  const totalProducts = categories.reduce((sum, c) => sum + c.products.length, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-[#1D1D1F] text-white text-xs font-semibold shadow-2xl border border-white/10 flex items-center gap-3 animate-fade-in max-w-md">
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
              Dashboard
            </Link>
            <span className="text-xs text-[#86868B]">/</span>
            <span className="text-xs font-bold text-[#1D1D1F]">Pricing &amp; Catalog SLAs</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F] mt-2">
            Pricing Engine &amp; SLA Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B] mt-1 max-w-2xl">
            Live catalog control across {categories.length} categories, {totalProducts} production formats,
            camera angle complexity, and delivery turnaround SLAs. Changes deploy directly to public pages (
            <code className="text-[#1D1D1F] font-mono text-[11px]">/services</code> and{' '}
            <code className="text-[#1D1D1F] font-mono text-[11px]">/book</code>).
          </p>

          {/* Deployment Status Pill */}
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                hasUnsavedChanges
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              {hasUnsavedChanges
                ? 'Unsaved Staging Changes (Not Yet Deployed)'
                : `Deployed to Main Website (v${deployStatus.version})`}
            </span>

            {deployStatus.lastDeployed && (
              <span className="text-[11px] text-[#86868B]">
                Last synced:{' '}
                {new Date(deployStatus.lastDeployed).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-[#E5E5E7] hover:border-[#1D1D1F] text-[#1D1D1F] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-white"
          >
            <span>+ Add Category</span>
          </button>

          <button
            onClick={() => {
              setAddProductCategoryId(categories[0]?.id || 'wedding');
              setIsAddProductOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-[#E5E5E7] hover:border-[#1D1D1F] text-[#1D1D1F] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-white"
          >
            <span>+ Add Format</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>

          <button
            onClick={handleDeploy}
            className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>Deploy to Main Application →</span>
          </button>
        </div>
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="flex items-center gap-3 p-1.5 bg-[#F5F5F7] rounded-2xl w-fit border border-[#E5E5E7]">
        <button
          onClick={() => setActiveTab('formats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'formats'
              ? 'bg-white text-[#1D1D1F] shadow-xs'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <span>🎬 Production Formats &amp; Base Rates</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7]">
            {totalProducts}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('angles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'angles'
              ? 'bg-white text-[#1D1D1F] shadow-xs'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <span>📐 Camera Angles Matrix</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7]">
            {cameraAngles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'delivery'
              ? 'bg-white text-[#1D1D1F] shadow-xs'
              : 'text-[#86868B] hover:text-[#1D1D1F]'
          }`}
        >
          <span>⚡ Delivery SLA &amp; Rush Matrix</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7]">
            {deliverySlas.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PRODUCTION FORMATS & BASE RATES */}
      {activeTab === 'formats' && (
        <>
          {/* Category Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryId === 'all'
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                All Categories ({totalProducts})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryId === c.id
                      ? 'bg-[#1D1D1F] text-white shadow-xs'
                      : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.title}</span>
                  <span className="opacity-60 text-[10px]">({c.products.length})</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search formats, deliverables, profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 bg-white rounded-xl border border-[#E5E5E7] text-xs focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          {/* Main Grid: Categories & Formats (Left 8) + Simulator (Right 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              {filteredCategories.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E5E7]">
                  <p className="text-sm font-semibold text-[#86868B]">
                    No categories or products match your search.
                  </p>
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E5E7] shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-6"
                  >
                    {/* Category Header */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F5F5F7]">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
                          {category.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {category.badge}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F7] text-[#86868B]">
                              {category.products.length} Formats
                            </span>
                            <span className="text-[11px] text-[#86868B] font-medium">
                              • {category.turnaround}
                            </span>
                          </div>
                          <h2 className="text-lg font-bold text-[#1D1D1F] mt-1">{category.title}</h2>
                          <p className="text-xs text-[#86868B] mt-0.5">{category.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setAddProductCategoryId(category.id);
                            setIsAddProductOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] text-xs font-bold transition-colors cursor-pointer"
                        >
                          + Add Format
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id, category.title)}
                          className="p-1.5 text-[#86868B] hover:text-red-600 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                          title="Delete category"
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Sub-Category Product Cards */}
                    <div className="space-y-4">
                      {category.products.map((product) => {
                        const isSelected = selectedProductId === product.id;

                        return (
                          <div
                            key={product.id}
                            className={`rounded-2xl p-5 border transition-all ${
                              isSelected
                                ? 'border-[#0071E3] bg-[#0071E3]/2 shadow-sm'
                                : product.active
                                ? 'border-[#E5E5E7] bg-white hover:border-[#86868B]/40'
                                : 'border-dashed border-[#E5E5E7] bg-[#F5F5F7]/60 opacity-60'
                            }`}
                          >
                            {/* Card Top Row */}
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-[#1D1D1F]">{product.name}</h3>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#86868B]">
                                  {product.duration}
                                </span>
                                {product.tag && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3]">
                                    {product.tag}
                                  </span>
                                )}

                                {/* Simple Input Toggle for Active State */}
                                <button
                                  type="button"
                                  onClick={() => toggleProductActive(category.id, product.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                                    product.active
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                                  }`}
                                  title="Click to toggle active on website"
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      product.active ? 'bg-emerald-500' : 'bg-zinc-400'
                                    }`}
                                  />
                                  <span>{product.active ? 'Active on Web' : 'Paused'}</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedProductId(product.id)}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#0071E3] text-white shadow-xs'
                                      : 'bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F]'
                                  }`}
                                >
                                  {isSelected ? '● Active in Simulator' : 'Simulate Quote'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleProductPopular(category.id, product.id)}
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                    product.popular
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-[#F5F5F7] text-[#86868B] border-[#E5E5E7] hover:text-[#1D1D1F]'
                                  }`}
                                >
                                  {product.popular ? '★ Featured' : '☆ Feature'}
                                </button>

                                <button
                                  onClick={() =>
                                    deleteProduct(category.id, product.id, product.name)
                                  }
                                  className="text-[#86868B] hover:text-red-600 p-1 rounded-md hover:bg-red-50 cursor-pointer text-xs"
                                  title="Delete Format"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-[#86868B] mb-4">{product.description}</p>

                            {/* Clean, Simple Input Fields (NO + / - buttons, NO range sliders) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#F5F5F7]">
                              {/* 1. Base Price Input */}
                              <div className="p-3 bg-[#F5F5F7]/80 rounded-xl border border-[#E5E5E7]/50">
                                <div className="flex items-center justify-between text-[11px] mb-1.5">
                                  <span className="font-bold text-[#86868B] uppercase tracking-wider text-[10px]">
                                    Base Price (INR)
                                  </span>
                                  <span className="text-[10px] text-[#86868B]">Single-Cam</span>
                                </div>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 text-xs font-bold text-[#86868B]">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    min={500}
                                    step={100}
                                    value={product.basePrice}
                                    onChange={(e) =>
                                      updateProduct(category.id, product.id, {
                                        basePrice: Math.max(0, Number(e.target.value) || 0),
                                      })
                                    }
                                    className="w-full bg-white border border-[#E5E5E7] rounded-xl pl-7 pr-3 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3] transition-colors"
                                  />
                                </div>
                              </div>

                              {/* 2. Delivery SLA (Hours) Input */}
                              <div className="p-3 bg-[#F5F5F7]/80 rounded-xl border border-[#E5E5E7]/50">
                                <div className="flex items-center justify-between text-[11px] mb-1.5">
                                  <span className="font-bold text-[#86868B] uppercase tracking-wider text-[10px]">
                                    Turnaround SLA
                                  </span>
                                  <span className="text-[10px] font-bold text-[#0071E3]">
                                    {Math.round(product.slaHours / 24)} Days
                                  </span>
                                </div>
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    min={24}
                                    step={12}
                                    value={product.slaHours}
                                    onChange={(e) => {
                                      const h = Math.max(12, Number(e.target.value) || 24);
                                      updateProduct(category.id, product.id, {
                                        slaHours: h,
                                        standardDelivery: `${Math.round(h / 24)}–${
                                          Math.round(h / 24) + 3
                                        } working days`,
                                      });
                                    }}
                                    className="w-full bg-white border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3] transition-colors"
                                  />
                                  <span className="absolute right-3 text-xs text-[#86868B] font-medium">
                                    hours
                                  </span>
                                </div>
                              </div>

                              {/* 3. Creator Split Toggle Pills & Input */}
                              <div className="p-3 bg-[#F5F5F7]/80 rounded-xl border border-[#E5E5E7]/50">
                                <div className="flex items-center justify-between text-[11px] mb-1.5">
                                  <span className="font-bold text-[#86868B] uppercase tracking-wider text-[10px]">
                                    Creator Payout %
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700">
                                    {100 - product.creatorSharePct}% Artsy
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {[65, 70, 75, 80].map((pct) => (
                                    <button
                                      key={pct}
                                      type="button"
                                      onClick={() =>
                                        updateProduct(category.id, product.id, {
                                          creatorSharePct: pct,
                                        })
                                      }
                                      className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                        product.creatorSharePct === pct
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
                                      }`}
                                    >
                                      {pct}%
                                    </button>
                                  ))}
                                  <div className="relative w-14">
                                    <input
                                      type="number"
                                      min={50}
                                      max={90}
                                      value={product.creatorSharePct}
                                      onChange={(e) =>
                                        updateProduct(category.id, product.id, {
                                          creatorSharePct: Math.min(
                                            90,
                                            Math.max(50, Number(e.target.value) || 70)
                                          ),
                                        })
                                      }
                                      className="w-full bg-white border border-[#E5E5E7] rounded-lg px-1.5 py-1 text-[11px] font-bold text-center focus:outline-hidden focus:border-[#0071E3]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Deliverables Scope & Supported Profiles */}
                            <div className="mt-3 pt-3 border-t border-[#F5F5F7] flex flex-wrap items-center gap-3 text-[11px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[#86868B] uppercase font-bold text-[9px]">
                                  Deliverables:
                                </span>
                                {product.deliverables.map((fmt, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-[#F5F5F7] text-[#1D1D1F] font-medium border border-[#E5E5E7]/60"
                                  >
                                    {fmt}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[#86868B] uppercase font-bold text-[9px]">
                                  Profiles:
                                </span>
                                {product.cameraProfiles.map((prof, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium"
                                  >
                                    {prof}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sticky Live Financial Waterfall Simulator (Right 4) */}
            <div className="lg:col-span-4 sticky top-24">
              <div className="bg-[#1D1D1F] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase block">
                      Live Financial Waterfall
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {activeProduct ? activeProduct.name : 'Platform Engine'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                    §2.1 Engine Active
                  </span>
                </div>

                {/* Simulated Angles & SLA Add-on Selectors */}
                <div className="space-y-3 p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs">
                  <div>
                    <span className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                      Simulate Camera Angle Add-on
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {cameraAngles.map((ang) => (
                        <button
                          key={ang.id}
                          type="button"
                          onClick={() => setSimulatedAngleId(ang.id)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                            simulatedAngleId === ang.id
                              ? 'bg-[#0071E3] text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/15'
                          }`}
                        >
                          {ang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-white/60 text-[10px] uppercase font-bold block mb-1">
                      Simulate Delivery Turnaround SLA
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {deliverySlas.map((sla) => (
                        <button
                          key={sla.id}
                          type="button"
                          onClick={() => setSimulatedDeliveryId(sla.id)}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer ${
                            simulatedDeliveryId === sla.id
                              ? 'bg-[#0071E3] text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/15'
                          }`}
                        >
                          {sla.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Waterfall Ledger Breakdown */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-white/60">Base Product Cost</span>
                    <span className="text-white">
                      ₹{(activeProduct ? activeProduct.basePrice : 5000).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {angleSurcharge > 0 && (
                    <div className="flex items-center justify-between text-blue-300">
                      <span>Camera Angle Surcharge</span>
                      <span>+ ₹{angleSurcharge.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {deliverySurcharge > 0 && (
                    <div className="flex items-center justify-between text-amber-300">
                      <span>Expedited Delivery Surcharge</span>
                      <span>+ ₹{deliverySurcharge.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 pb-2 border-y border-white/10">
                    <span className="text-white font-bold">Total Client Payable</span>
                    <span className="font-extrabold text-base text-white">
                      ₹{(waterfall.clientPayment / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-rose-400">
                    <span>Output GST (18%)</span>
                    <span>
                      - ₹
                      {(waterfall.gstAmount / 100).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-white/60">
                    <span>Gateway Fee (2% + GST)</span>
                    <span>- ₹{(waterfall.totalGatewayDeduction / 100).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between text-white/60">
                    <span>Ingest Infra Allocation</span>
                    <span>- ₹{(waterfall.infraAllocation / 100).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-white font-bold">
                    <span>Available for Split</span>
                    <span>
                      ₹
                      {(waterfall.availableForSplit / 100).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-400">
                    <span>
                      Creator Gross ({activeProduct ? activeProduct.creatorSharePct : 70}%)
                    </span>
                    <span>
                      ₹{(waterfall.creatorAmount / 100).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-rose-400">
                    <span>Section 194C TDS (1%)</span>
                    <span>- ₹{(waterfall.tdsAmount / 100).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-400">
                    <span className="font-bold">Direct NEFT Net Payout</span>
                    <span className="font-extrabold text-sm">
                      ₹
                      {(waterfall.creatorNetPayout / 100).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-blue-300">
                    <span className="font-bold">Artsy Retained Margin</span>
                    <span className="font-extrabold text-sm">
                      ₹
                      {(waterfall.artsyAmount / 100).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Deploy Button */}
                <button
                  onClick={handleDeploy}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold uppercase tracking-wider text-center transition-all cursor-pointer shadow-lg block"
                >
                  Deploy Configuration to Main Website →
                </button>

                <div className="p-3.5 rounded-xl bg-white/5 text-[11px] text-white/50 leading-relaxed">
                  <span className="text-amber-400 font-bold">💡 Compliance Rule:</span> Platform
                  payments are securely protected in the Production Vault and disbursed via Direct
                  NEFT with Section 194C TDS certificates post-QC.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: CAMERA ANGLES PRICING MATRIX */}
      {activeTab === 'angles' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F5F7]">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1D1F]">
                Camera Angle &amp; Waveform Sync Surcharge Matrix
              </h2>
              <p className="text-xs text-[#86868B] mt-1 max-w-2xl">
                Define ingestion surcharges for multi-camera setups, multi-angle audio sync, and drone
                conforming across creative service categories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = `multicam-${Date.now().toString().slice(-4)}`;
                  const newAngle: CameraAngleRule = {
                    id: id as any,
                    label: 'Custom Multi-Cam Tier',
                    camerasCount: '4+ Cameras & FPV Drone',
                    costWeddingPersonal: 2400,
                    costBrandCorporate: 1500,
                    description: 'Complex multi-cam audio matching and multi-track multiclip conform.',
                  };
                  const updated = [...cameraAngles, newAngle];
                  setCameraAngles(updated);
                  saveCameraAngleRules(updated);
                  setHasUnsavedChanges(true);
                  showToast('Added new camera angle tier.');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] text-xs font-bold transition-colors cursor-pointer"
              >
                + Add Angle Tier
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cameraAngles.map((angle) => (
              <div
                key={angle.id}
                className="p-6 rounded-2xl border border-[#E5E5E7] bg-white space-y-5 shadow-xs hover:border-[#0071E3]/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-[#86868B] block">
                        Tier ID: {angle.id}
                      </span>
                      <h3 className="text-base font-bold text-[#1D1D1F] mt-0.5">{angle.label}</h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F5F5F7] text-[#1D1D1F]">
                      {angle.camerasCount}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                      Tier Display Label
                    </label>
                    <input
                      type="text"
                      value={angle.label}
                      onChange={(e) => updateCameraAngle(angle.id, { label: e.target.value })}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                      Camera Setup Scope
                    </label>
                    <input
                      type="text"
                      value={angle.camerasCount}
                      onChange={(e) => updateCameraAngle(angle.id, { camerasCount: e.target.value })}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                    />
                  </div>

                  {/* Clean Direct Price Inputs (NO + / - buttons) */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F5F5F7]">
                    <div>
                      <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                        Wedding &amp; Personal
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-[#86868B]">₹</span>
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={angle.costWeddingPersonal}
                          onChange={(e) =>
                            updateCameraAngle(angle.id, {
                              costWeddingPersonal: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E7] rounded-xl pl-6 pr-2 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                        Brand &amp; Corporate
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-[#86868B]">₹</span>
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={angle.costBrandCorporate}
                          onChange={(e) =>
                            updateCameraAngle(angle.id, {
                              costBrandCorporate: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E7] rounded-xl pl-6 pr-2 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                      Technical Workflow Description
                    </label>
                    <textarea
                      rows={2}
                      value={angle.description}
                      onChange={(e) => updateCameraAngle(angle.id, { description: e.target.value })}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F5F5F7] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Live on Booking Page
                  </span>
                  {cameraAngles.length > 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = cameraAngles.filter((a) => a.id !== angle.id);
                        setCameraAngles(updated);
                        saveCameraAngleRules(updated);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleDeploy}
              className="px-6 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Deploy Camera Angles to Main Website →
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERY SLA & RUSH MATRIX */}
      {activeTab === 'delivery' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-[0_2px_16px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F5F7]">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1D1F]">
                Delivery Turnaround &amp; Rush SLA Pricing Matrix
              </h2>
              <p className="text-xs text-[#86868B] mt-1 max-w-2xl">
                Configure expedited production turnaround tiers, queue priority fees, and express 48h
                overnight delivery options for clients.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = `sla-${Date.now().toString().slice(-4)}`;
                  const newSla: DeliverySlaRule = {
                    id: id as any,
                    label: 'VIP Same-Day Express',
                    turnaroundDays: '24 Hours Express',
                    hours: 24,
                    costWeddingPersonal: 3000,
                    costBrandCorporate: 3000,
                    description: 'Direct priority lane with immediate timeline conform.',
                  };
                  const updated = [...deliverySlas, newSla];
                  setDeliverySlas(updated);
                  saveDeliverySlaRules(updated);
                  setHasUnsavedChanges(true);
                  showToast('Added new delivery turnaround SLA tier.');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] text-xs font-bold transition-colors cursor-pointer"
              >
                + Add Turnaround Tier
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deliverySlas.map((sla) => (
              <div
                key={sla.id}
                className="p-6 rounded-2xl border border-[#E5E5E7] bg-white space-y-5 shadow-xs hover:border-[#0071E3]/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-[#86868B] block">
                        Tier ID: {sla.id}
                      </span>
                      <h3 className="text-base font-bold text-[#1D1D1F] mt-0.5">{sla.label}</h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                      {sla.hours} Hours
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                      Tier Display Label
                    </label>
                    <input
                      type="text"
                      value={sla.label}
                      onChange={(e) => updateDeliverySla(sla.id, { label: e.target.value })}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                        Turnaround Days
                      </label>
                      <input
                        type="text"
                        value={sla.turnaroundDays}
                        onChange={(e) => updateDeliverySla(sla.id, { turnaroundDays: e.target.value })}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                        SLA Hours
                      </label>
                      <input
                        type="number"
                        min={12}
                        step={12}
                        value={sla.hours}
                        onChange={(e) =>
                          updateDeliverySla(sla.id, {
                            hours: Math.max(12, Number(e.target.value) || 24),
                          })
                        }
                        className="w-full bg-white border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                      />
                    </div>
                  </div>

                  {/* Clean Direct Price Inputs (NO + / - buttons) */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F5F5F7]">
                    <div>
                      <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                        Wedding &amp; Personal
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-[#86868B]">₹</span>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={sla.costWeddingPersonal}
                          onChange={(e) =>
                            updateDeliverySla(sla.id, {
                              costWeddingPersonal: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E7] rounded-xl pl-6 pr-2 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                        Brand &amp; Corporate
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-bold text-[#86868B]">₹</span>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={sla.costBrandCorporate}
                          onChange={(e) =>
                            updateDeliverySla(sla.id, {
                              costBrandCorporate: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white border border-[#E5E5E7] rounded-xl pl-6 pr-2 py-1.5 text-xs font-bold text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#86868B] uppercase block mb-1">
                      Technical Workflow Description
                    </label>
                    <textarea
                      rows={2}
                      value={sla.description}
                      onChange={(e) => updateDeliverySla(sla.id, { description: e.target.value })}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-1.5 text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#0071E3]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F5F5F7] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Active Delivery Rule
                  </span>
                  {deliverySlas.length > 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = deliverySlas.filter((s) => s.id !== sla.id);
                        setDeliverySlas(updated);
                        saveDeliverySlaRules(updated);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleDeploy}
              className="px-6 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Deploy Delivery SLAs to Main Website →
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add New Category */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E5E5E7] shadow-2xl animate-scale-up space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F7]">
              <h3 className="text-base font-bold text-[#1D1D1F]">+ Add New Service Category</h3>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1D1D1F] block mb-1">Category Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Music Video Production"
                  value={newCatTitle}
                  onChange={(e) => {
                    setNewCatTitle(e.target.value);
                    if (!newCatId) {
                      setNewCatId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">Slug ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. music-video"
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. CINEMATIC AUDIOVISUAL"
                    value={newCatBadge}
                    onChange={(e) => setNewCatBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs uppercase focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">Icon Emoji</label>
                  <input
                    type="text"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                    Turnaround SLA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7–10 Days Standard"
                    value={newCatTurnaround}
                    onChange={(e) => setNewCatTurnaround(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1D1D1F] block mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Narrative music videos, performance sync, and analog color grades."
                  value={newCatTagline}
                  onChange={(e) => setNewCatTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                  Operational Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe technical workflows and deliverables..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F5F5F7]">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Sub-Category / Product */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#E5E5E7] shadow-2xl animate-scale-up space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F7]">
              <h3 className="text-base font-bold text-[#1D1D1F]">
                + Add Sub-Category Format / Product
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                  Assign Category
                </label>
                <select
                  value={addProductCategoryId}
                  onChange={(e) => setAddProductCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                  Format / Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4K Performance Music Cut"
                  value={newProdName}
                  onChange={(e) => {
                    setNewProdName(e.target.value);
                    if (!newProdId) {
                      setNewProdId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">Slug ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. music-perf-cut"
                    value={newProdId}
                    onChange={(e) => setNewProdId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                    Duration Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3–5 min or 45–60 sec"
                    value={newProdDuration}
                    onChange={(e) => setNewProdDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    step={100}
                    min={500}
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">SLA Hours</label>
                  <input
                    type="number"
                    step={12}
                    min={24}
                    required
                    value={newProdSla}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setNewProdSla(h);
                      setNewProdStandardDelivery(
                        `${Math.round(h / 24)}–${Math.round(h / 24) + 3} working days`
                      );
                    }}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                    Creator Split %
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={85}
                    required
                    value={newProdSplit}
                    onChange={(e) => setNewProdSplit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">Rush Fee (₹)</label>
                  <input
                    type="number"
                    step={500}
                    min={0}
                    value={newProdRushFee}
                    onChange={(e) => {
                      setNewProdRushFee(Number(e.target.value));
                      setNewProdRushOptions(
                        `+₹${Number(e.target.value).toLocaleString('en-IN')} (4–5 days)`
                      );
                    }}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs font-mono focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                    Badge (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Popular or DTC Hero"
                    value={newProdTag}
                    onChange={(e) => setNewProdTag(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                  Deliverables Scope (comma-separated)
                </label>
                <input
                  type="text"
                  value={newProdFormats}
                  onChange={(e) => setNewProdFormats(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1D1D1F] block mb-1">
                  Supported Camera Profiles (comma-separated)
                </label>
                <input
                  type="text"
                  value={newProdProfiles}
                  onChange={(e) => setNewProdProfiles(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1D1D1F] block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed description of pacing, audio sync, and deliverables..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E7] rounded-xl text-xs focus:outline-hidden focus:border-[#0071E3]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F5F5F7]">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold cursor-pointer"
                >
                  Add Product Format
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
