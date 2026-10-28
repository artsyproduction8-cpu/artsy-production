'use client';

import React, { useState, useRef, useEffect } from 'react';

export const COMPUTER_PRESETS = [
  'Apple Mac Studio M2 Ultra (128GB Unified Memory)',
  'Apple Mac Studio M2 Max (64GB Unified Memory)',
  'Apple Mac Studio M1 Ultra (64GB / 128GB)',
  'Apple MacBook Pro 16" M3 Max (64GB / 128GB)',
  'Apple MacBook Pro 16" M3 Pro (36GB Unified Memory)',
  'Apple MacBook Pro 16" M2 Max (64GB / 96GB)',
  'Apple Mac mini M2 Pro (32GB Unified Memory)',
  'Custom PC: AMD Ryzen 9 7950X / RTX 4090 (24GB) / 64GB DDR5',
  'Custom PC: AMD Ryzen 9 7900X / RTX 4080 (16GB) / 64GB DDR5',
  'Custom PC: AMD Ryzen 7 7800X3D / RTX 4070 Ti / 32GB DDR5',
  'Custom PC: Intel Core i9-14900K / RTX 4090 / 128GB RAM',
  'Custom PC: Intel Core i9-13900K / RTX 4080 / 64GB RAM',
  'Custom PC: Intel Core i7-14700K / RTX 4070 Ti Super / 64GB RAM',
  'Custom PC: Intel Core i7-13700K / RTX 3080 (10GB) / 32GB RAM',
  'Laptop: ASUS ROG Zephyrus G16 (i9 / RTX 4080 / 32GB)',
  'Laptop: Dell XPS 17 (i9 / RTX 4070 / 64GB)',
  'Laptop: Lenovo Legion Pro 7i (i9 / RTX 4080 / 32GB)',
];

export const MONITOR_PRESETS = [
  'Apple Studio Display 27" (P3-D65 Calibrated) + BenQ ColorVu',
  'Apple Studio Display 27" 5K Retina (100% P3-D65)',
  'BenQ SW271C 27" 4K HDR Color Accurate (100% sRGB / 99% AdobeRGB)',
  'BenQ PD3220U 32" 4K Thunderbolt 3 Designer Monitor',
  'LG UltraFine 27" 5K IPS (DCI-P3 99% Color Calibrated)',
  'LG 27UP850-W 27" 4K UHD IPS with DCI-P3 95%',
  'ASUS ProArt Display PA278CV / PA329CV (Calman Verified)',
  'ASUS ProArt PA32UCG-K 32" 4K 120Hz Mini-LED HDR1600',
  'Dell UltraSharp PremierColor UP2720Q 4K with Calibrator',
  'Dell UltraSharp U2723QE 27" 4K IPS Black (98% DCI-P3)',
  'Dual Monitor: Primary 4K Color Accurate + Secondary 1440p Timeline',
];

export const STORAGE_PRESETS = [
  '10GbE Synology RAID-0 Scratch + 4TB NVMe Internal Cache',
  '4TB NVMe Internal Scratch + 2TB Fast External SSD (1050MB/s)',
  'Direct Thunderbolt 3 RAID (OWC ThunderBay 4 / 16TB RAID-5)',
  'SanDisk Professional PRO-BLADE Transport 4TB NVMe (2000MB/s)',
  'Samsung 990 PRO 4TB PCIe 4.0 NVMe M.2 SSD Scratch Disk',
  'Samsung 980 PRO 2TB NVMe Internal + 4TB Crucial X9 Pro External',
  'OWC Envoy Pro FX 2TB Thunderbolt 3 Rugged SSD',
  '2TB NVMe Gen4 Internal SSD Scratch + 8TB External Archive HDD',
  'QNAP 10GbE NAS (64TB RAID-6 Studio Shared Storage)',
];

export const AUDIO_PRESETS = [
  'Yamaha HS7 Studio Monitors + Beyerdynamic DT 990 Pro (250Ω)',
  'Yamaha HS5 Studio Monitors + Audio-Technica ATH-M50x',
  'Yamaha HS8 Active Studio Reference Monitors (Pair)',
  'Beyerdynamic DT 990 Pro (250Ω) Open-Back Studio Reference',
  'Beyerdynamic DT 770 Pro (80Ω/250Ω) Closed Studio Headphones',
  'Audio-Technica ATH-M50x Professional Studio Monitor Headphones',
  'Sennheiser HD 650 / HD 600 Open-Back Reference Headphones',
  'Sony MDR-7506 Professional Studio Diaphragm Headphones',
  'Genelec 8010A / 8020D Active Studio Monitors + Focusrite Audio Interface',
  'KRK ROKIT 5 G4 Near-Field Studio Monitors',
  'AirPods Max / AirPods Pro (Spatial Audio Monitoring)',
];

export function computeHardwareConfigString(
  comp: string,
  mon: string,
  stor: string,
  aud: string
): string {
  const parts: string[] = [];
  if (comp && comp.trim()) parts.push(`Computer: ${comp.trim()}`);
  if (mon && mon.trim()) parts.push(`Display: ${mon.trim()}`);
  if (stor && stor.trim()) parts.push(`Storage: ${stor.trim()}`);
  if (aud && aud.trim()) parts.push(`Audio: ${aud.trim()}`);
  return parts.join('\n');
}

export function parseHardwareConfig(raw: string): {
  comp: string;
  mon: string;
  stor: string;
  aud: string;
} {
  let comp = '';
  let mon = '';
  let stor = '';
  let aud = '';

  if (!raw || !raw.trim()) {
    return { comp, mon, stor, aud };
  }

  // 1. Try parsing JSON
  try {
    if (raw.trim().startsWith('{')) {
      const parsed = JSON.parse(raw);
      return {
        comp: parsed.primaryComputer || parsed.comp || parsed.computer || '',
        mon: parsed.monitorDisplay || parsed.mon || parsed.display || parsed.monitor || '',
        stor: parsed.storageRig || parsed.stor || parsed.storage || '',
        aud: parsed.audioSetup || parsed.aud || parsed.audio || parsed.headphones || '',
      };
    }
  } catch {}

  // 2. Parse categorized lines
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  let matchedAny = false;
  for (const line of lines) {
    if (/^(Computer|Primary|Laptop|PC|Rig):\s*/i.test(line)) {
      comp = line.replace(/^(Computer|Primary|Laptop|PC|Rig):\s*/i, '').trim();
      matchedAny = true;
    } else if (/^(Display|Monitor|Screen):\s*/i.test(line)) {
      mon = line.replace(/^(Display|Monitor|Screen):\s*/i, '').trim();
      matchedAny = true;
    } else if (/^(Storage|Drives|Disk|Drive|SSD|RAID):\s*/i.test(line)) {
      stor = line.replace(/^(Storage|Drives|Disk|Drive|SSD|RAID):\s*/i, '').trim();
      matchedAny = true;
    } else if (/^(Audio|Sound|Headphones|Speakers|Monitors):\s*/i.test(line)) {
      aud = line.replace(/^(Audio|Sound|Headphones|Speakers|Monitors):\s*/i, '').trim();
      matchedAny = true;
    }
  }

  // 3. Fallback for legacy single-string format
  if (!matchedAny) {
    comp = raw.trim();
  }

  return { comp, mon, stor, aud };
}

function PresetDropdown({
  presets,
  onSelect,
  label,
}: {
  presets: string[];
  onSelect: (preset: string) => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${label} Presets`}
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-[11px] font-semibold text-[#1D1D1F] px-2.5 py-1 rounded-md border border-[#E5E5E7] shadow-xs transition-all cursor-pointer hover:border-[#D2D2D7]"
      >
        <span>⚡ Presets</span>
        <svg
          className={`w-2.5 h-2.5 text-[#86868B] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 max-h-64 overflow-y-auto bg-white rounded-xl shadow-xl border border-[#E5E5E7] z-50 py-1.5 text-left animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#86868B] uppercase tracking-wider border-b border-[#F5F5F7]">
            Select Studio Preset
          </div>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                onSelect(preset);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-[#1D1D1F] hover:bg-[#F5F5F7] hover:text-[#3B82F6] transition-colors flex items-center justify-between gap-2 border-b border-[#F5F5F7]/50 last:border-0 cursor-pointer"
            >
              <span className="truncate">{preset}</span>
              <span className="text-[10px] text-[#86868B] shrink-0 font-medium">Use</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface HardwareSetupSectionProps {
  primaryComputer: string;
  setPrimaryComputer: (val: string) => void;
  monitorDisplay: string;
  setMonitorDisplay: (val: string) => void;
  storageRig: string;
  setStorageRig: (val: string) => void;
  audioSetup: string;
  setAudioSetup: (val: string) => void;
  stepNumber?: number;
  required?: boolean;
}

export default function HardwareSetupSection({
  primaryComputer,
  setPrimaryComputer,
  monitorDisplay,
  setMonitorDisplay,
  storageRig,
  setStorageRig,
  audioSetup,
  setAudioSetup,
  stepNumber = 3,
  required = true,
}: HardwareSetupSectionProps) {
  const renderHardwareCard = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    presets: string[],
    guideline: string,
    isRequired: boolean = false
  ) => {
    const isPresetMatch = presets.includes(value);
    const hasValue = Boolean(value && value.trim());

    return (
      <div className="bg-[#F5F5F7] p-4 sm:p-4.5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between gap-2.5 transition-all hover:border-[#D2D2D7] relative">
        {/* Card Header: Clear Bold Title on Left + Custom Presets Button on Right */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-[#1D1D1F] tracking-wide uppercase whitespace-nowrap">
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>

          <PresetDropdown presets={presets} onSelect={onChange} label={label} />
        </div>

        {/* Clean Single Input Field with Clear (✕) Action */}
        <div className="relative flex items-center">
          <input
            type="text"
            required={isRequired}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white px-3.5 py-2.5 pr-8 text-xs text-[#1D1D1F] font-medium rounded-lg border border-[#E5E5E7] focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/15 outline-none transition-all placeholder:text-[#86868B]/60 shadow-xs"
          />
          {hasValue && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Clear specification"
              aria-label="Clear specification"
              className="absolute right-2.5 p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-gray-100 rounded-md transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Bottom Row: Dynamic Status / Studio Benchmark */}
        <div className="flex items-center justify-between text-[11px] pt-0.5 gap-2">
          {isPresetMatch ? (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Studio Verified Preset
            </span>
          ) : hasValue ? (
            <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
              ✓ Custom Workstation Spec
            </span>
          ) : (
            <span className="text-[#86868B] text-[10.5px] truncate">
              {guideline}
            </span>
          )}

          {isRequired && !hasValue ? (
            <span className="text-[10px] font-semibold text-amber-600 shrink-0">
              Required *
            </span>
          ) : !hasValue ? (
            <span className="text-[10px] text-[#86868B] shrink-0">
              Optional
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
        <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
            {stepNumber}
          </span>
          Computer &amp; Hardware Setup
        </span>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          Studio 4K ProRes Certified
        </span>
      </div>

      <p className="text-xs text-[#86868B] leading-relaxed">
        To guarantee smooth commercial turnarounds, submit your editing workstation specs. Select from certified studio presets via <strong className="text-[#1D1D1F]">Presets ▾</strong> or type your custom hardware configuration.
      </p>

      {/* 2x2 Grid with Perfect Alignment and Non-Wrapping Titles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Primary Computer */}
        {renderHardwareCard(
          'COMPUTER / LAPTOP',
          primaryComputer,
          setPrimaryComputer,
          'Apple Mac Studio M2 Ultra (128GB Unified Memory)',
          COMPUTER_PRESETS,
          'Min: 6+ CPU Cores, 16GB+ RAM, dedicated GPU',
          required
        )}

        {/* Card 2: Monitor / Display */}
        {renderHardwareCard(
          'DISPLAY / MONITOR',
          monitorDisplay,
          setMonitorDisplay,
          'Apple Studio Display 27" (P3-D65 Calibrated) + BenQ ColorVu',
          MONITOR_PRESETS,
          'Min: 100% sRGB / 95%+ DCI-P3 calibrated color',
          false
        )}

        {/* Card 3: Storage */}
        {renderHardwareCard(
          'STORAGE / DRIVES',
          storageRig,
          setStorageRig,
          '10GbE Synology RAID-0 Scratch + 4TB NVMe Internal Cache',
          STORAGE_PRESETS,
          'Min: Fast NVMe SSD scratch disk or RAID array',
          false
        )}

        {/* Card 4: Audio */}
        {renderHardwareCard(
          'AUDIO / HEADPHONES',
          audioSetup,
          setAudioSetup,
          'Yamaha HS7 Studio Monitors + Beyerdynamic DT 990 Pro (250Ω)',
          AUDIO_PRESETS,
          'Min: Studio reference flat-response monitoring',
          false
        )}
      </div>

      {/* Section Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-[#86868B] pt-2 border-t border-[#F5F5F7] gap-2">
        <span>
          💡 Select from <strong className="text-[#1D1D1F]">Presets ▾</strong> to auto-fill, or freely type your workstation hardware.
        </span>
        <span className="font-semibold text-emerald-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Certified for 4K ProRes &amp; Color Grading
        </span>
      </div>
    </div>
  );
}
