'use client';

import React from 'react';

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
  const renderHardwareField = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    presets: string[],
    listId: string,
    isRequired: boolean = false
  ) => {
    const isPresetMatch = presets.includes(value);

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[#1D1D1F] tracking-wider uppercase">
            {label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <div className="flex items-center gap-1.5">
            <select
              aria-label={`${label} Presets`}
              value={isPresetMatch ? value : (value ? '__custom__' : '')}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  // Keep current value and let user edit
                } else if (e.target.value) {
                  onChange(e.target.value);
                }
              }}
              className="text-[11px] font-semibold text-[#3B82F6] bg-[#F5F5F7] hover:bg-white hover:border-[#3B82F6] px-2.5 py-1 rounded-lg border border-[#E5E5E7] transition-all cursor-pointer outline-none"
            >
              <option value="" disabled>
                ⚡ Choose Preset ▾
              </option>
              {presets.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              <option value="__custom__">✏️ Custom (Type my own)</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            required={isRequired}
            list={listId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#F5F5F7] px-4 py-3 text-sm text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all font-medium placeholder:text-[#A1A1A6]"
          />
          <datalist id={listId}>
            {presets.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col gap-5">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-4">
        <span className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
            {stepNumber}
          </span>
          Computer &amp; Hardware Setup
        </span>
        <span className="text-[11px] uppercase font-bold tracking-wider text-[#86868B] bg-[#F5F5F7] px-2.5 py-1 rounded-md border border-[#E5E5E7]/60">
          EDITING SETUP
        </span>
      </div>

      {/* 2x2 Grid matching user layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {renderHardwareField(
          'PRIMARY COMPUTER / LAPTOP',
          primaryComputer,
          setPrimaryComputer,
          'Apple Mac Studio M2 Ultra (128GB Unified Memory)',
          COMPUTER_PRESETS,
          'primary-computer-presets',
          required
        )}

        {renderHardwareField(
          'MONITOR / DISPLAY',
          monitorDisplay,
          setMonitorDisplay,
          'Apple Studio Display 27" (P3-D65 Calibrated) + BenQ ColorVu',
          MONITOR_PRESETS,
          'monitor-display-presets',
          false
        )}

        {renderHardwareField(
          'STORAGE / HARD DRIVES',
          storageRig,
          setStorageRig,
          '10GbE Synology RAID-0 Scratch + 4TB NVMe Internal Cache',
          STORAGE_PRESETS,
          'storage-presets',
          false
        )}

        {renderHardwareField(
          'HEADPHONES / SPEAKERS',
          audioSetup,
          setAudioSetup,
          'Yamaha HS7 Studio Monitors + Beyerdynamic DT 990 Pro (250Ω)',
          AUDIO_PRESETS,
          'audio-presets',
          false
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-[#86868B] pt-1 border-t border-[#F5F5F7] gap-2">
        <span>
          💡 Choose standard studio configurations from the dropdown or type your custom workstation specs.
        </span>
        <span className="font-medium text-[#1D1D1F]">
          Certified for 4K ProRes &amp; Color Grading
        </span>
      </div>
    </div>
  );
}
