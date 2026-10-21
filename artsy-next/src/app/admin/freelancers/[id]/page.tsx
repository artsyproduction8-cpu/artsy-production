'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface SampleReel {
  id: string;
  title: string;
  category: string;
  video_url: string;
  codec?: string;
  resolution?: string;
}

export default function AdminFreelancerDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Account & Personal Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [isSuspended, setIsSuspended] = useState(false);
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [softwareText, setSoftwareText] = useState('');
  const [rating, setRating] = useState(4.9);
  const [completedProjects, setCompletedProjects] = useState(0);

  // Public Profile (/creators Directory) Settings
  const [isPublic, setIsPublic] = useState(true);
  const [publicDisplayName, setPublicDisplayName] = useState('');
  const [publicSpecialty, setPublicSpecialty] = useState('');
  const [publicBio, setPublicBio] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(5);
  const [creatorTier, setCreatorTier] = useState<'rising_talent' | 'standard' | 'senior'>('senior');
  const [isAcceptingWork, setIsAcceptingWork] = useState(true);

  // Hardware Rig and Studio Setup
  const [workstationRig, setWorkstationRig] = useState('');
  const [monitoringSpec, setMonitoringSpec] = useState('');
  const [storageSpec, setStorageSpec] = useState('');
  const [audioSpec, setAudioSpec] = useState('');
  const [capacityText, setCapacityText] = useState('');
  const [languagesText, setLanguagesText] = useState('');

  // Compliance & Banking (Masked)
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [panNumber, setPanNumber] = useState('');

  // Relational data
  const [samples, setSamples] = useState<SampleReel[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [activeWorkload, setActiveWorkload] = useState(0);

  const fetchCreatorData = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/creators?id=${id}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.creator) {
        setErrorMessage(data.error || 'Creator profile not found in database.');
        setLoading(false);
        return;
      }

      const c = data.creator;
      const p = c.profile || {};

      setFullName(c.display_name || '');
      setEmail(c.email || '');
      setPhone(c.phone || '');
      setStatus(c.status || 'active');
      setApprovalStatus(p.approval_status || 'approved');
      setIsSuspended(Boolean(p.is_suspended || c.status === 'suspended'));
      setBio(p.bio || '');
      setPortfolioUrl(p.portfolio_url || '');

      const skillsArr = Array.isArray(p.skills) ? p.skills : [];
      setSkillsText(skillsArr.join(', '));

      const swArr = Array.isArray(p.software) ? p.software : [];
      setSoftwareText(swArr.join(', '));

      setRating(Number(p.avg_rating || c.metrics?.rating || 4.9));
      setCompletedProjects(Number(p.total_projects_completed || c.metrics?.totalProjectsCompleted || 0));

      setIsPublic(Boolean(p.is_public));
      setPublicDisplayName(p.public_display_name || c.display_name || '');
      setPublicSpecialty(p.public_specialty || (skillsArr[0] ? `${skillsArr[0]} Specialist` : 'Video Editor'));
      setPublicBio(p.public_bio || p.bio || '');
      setYearsOfExperience(Number(p.years_of_experience || p.experience_years || 5));
      setCreatorTier(p.creator_tier || 'standard');
      setIsAcceptingWork(p.is_accepting_work !== false);

      const sd = c.studio_details || {};
      setWorkstationRig(sd.workstationRig || '');
      setMonitoringSpec(sd.monitoringSpec || '');
      setStorageSpec(sd.storageSpec || '');
      setAudioSpec(sd.audioSpec || '');
      setCapacityText(sd.capacity || '');
      const langs = Array.isArray(sd.languages) ? sd.languages : (Array.isArray(p.languages) ? p.languages : ['Hindi', 'English']);
      setLanguagesText(langs.join(', '));

      setBankAccountName(p.bank_account_name || sd.legalName || c.display_name || '');
      setBankAccountNumber(p.bank_account_number || (sd.bankAccount ? `•••• ${sd.bankAccount.slice(-4)}` : ''));
      setBankIfscCode(p.bank_ifsc_code || sd.ifsc || '');
      setPanNumber(p.pan_number || (sd.pan ? `••••••${sd.pan.slice(-4)}` : ''));

      setSamples(c.samples || []);
      setAssignments(c.assignments || []);
      setPayouts(c.payouts || []);
      setRevisions(c.revisions || []);
      setActiveWorkload(c.metrics?.activeWorkload || 0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorData();
  }, [id]);

  const handleSaveAll = async () => {
    if (!id) return;
    setSaving(true);
    setActionNotice(null);
    setErrorMessage(null);

    const skillsArray = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    const softwareArray = softwareText.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'update_profile',
          full_name: fullName,
          email,
          phone,
          bio,
          skills: skillsArray,
          software: softwareArray,
          portfolio_url: portfolioUrl,
          avg_rating: rating,
          total_projects_completed: completedProjects,
          is_public: isPublic,
          public_display_name: publicDisplayName,
          public_specialty: publicSpecialty,
          public_bio: publicBio,
          years_of_experience: yearsOfExperience,
          creator_tier: creatorTier,
          is_accepting_work: isAcceptingWork,
          studio_details: {
            workstationRig,
            monitoringSpec,
            storageSpec,
            audioSpec,
            capacity: capacityText,
            languages: languagesText.split(',').map((l) => l.trim()).filter(Boolean),
            software: softwareArray,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice('Creator profile & discovery settings successfully saved to database.');
        setTimeout(() => setActionNotice(null), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to update creator profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (action: 'approve' | 'reject' | 'suspend' | 'reactivate') => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice(`Creator status updated: ${action.toUpperCase()}`);
        fetchCreatorData();
      } else {
        setErrorMessage(data.error || 'Action failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Action error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCreator = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${fullName || 'this creator'}"? This will remove their profile and portfolio samples cascade.`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Creator deleted successfully.');
        router.push('/admin/freelancers');
      } else {
        setErrorMessage(data.error || 'Failed to delete creator.');
        setSaving(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Delete error');
      setSaving(false);
    }
  };

  const formatInr = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format((paisa || 0) / 100);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs text-[#86868B] font-mono">Loading creator record from database...</div>
      </div>
    );
  }

  const initials = (fullName || 'Creator')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full space-y-8">
      {/* Alert Notices */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 shadow-xs flex items-center justify-between">
          <span className="font-semibold">✓ {actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 shadow-xs flex items-center justify-between">
          <span className="font-semibold">⚠ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900 font-bold">✕</button>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            href="/admin/freelancers"
            className="text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] inline-flex items-center gap-1.5 transition-colors"
          >
            ← Back to Talent &amp; Creator Roster
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">{fullName || 'Creator Member'}</h1>
            <span
              className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isSuspended
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : approvalStatus === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isSuspended ? 'SUSPENDED' : approvalStatus}
            </span>
            {isPublic && approvalStatus === 'approved' && !isSuspended && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                LIVE ON /creators
              </span>
            )}
          </div>
          <div className="text-xs font-mono text-[#86868B] mt-1">
            Database UUID: {id}
          </div>
        </div>

        {/* Global Save and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {approvalStatus === 'pending' && (
            <button
              onClick={() => handleQuickStatus('approve')}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Approve Creator
            </button>
          )}
          {!isSuspended && approvalStatus === 'approved' && (
            <button
              onClick={() => handleQuickStatus('suspend')}
              disabled={saving}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 cursor-pointer"
            >
              Suspend
            </button>
          )}
          {isSuspended && (
            <button
              onClick={() => handleQuickStatus('reactivate')}
              disabled={saving}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 cursor-pointer"
            >
              Reactivate
            </button>
          )}
          <button
            onClick={handleDeleteCreator}
            disabled={saving}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 cursor-pointer"
          >
            Delete
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-[#86868B]">Active Workload</div>
          <div className="text-xl font-extrabold text-[#1D1D1F] mt-1">{activeWorkload} Projects</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-[#86868B]">Delivered Masters</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{completedProjects} Jobs</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-[#86868B]">Platform Rating</div>
          <div className="text-xl font-extrabold text-amber-500 mt-1">★ {rating.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E5E5E7] shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-[#86868B]">Tier</div>
          <div className="text-xl font-extrabold text-[#1D1D1F] capitalize mt-1">
            {creatorTier.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Section 1: Public Profile & Directory Listing (/creators) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E7] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 className="text-base font-bold text-[#1D1D1F]">Public Directory Settings (/creators)</h2>
            </div>
            <p className="text-xs text-[#86868B] mt-0.5">
              Control public visibility, pseudonym display name, specialty headline, and tier shown on the public site.
            </p>
          </div>
          <Link
            href={`/creators/${id}`}
            target="_blank"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            Preview Public Page ↗
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Toggles */}
          <div className="p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1D1D1F] block">Listed on /creators Directory</span>
              <span className="text-[11px] text-[#86868B]">
                {approvalStatus !== 'approved'
                  ? 'Must be approved to display publicly'
                  : isPublic
                  ? 'Active and discoverable by clients'
                  : 'Hidden from public directory'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                disabled={approvalStatus !== 'approved'}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-50"></div>
            </label>
          </div>

          <div className="p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1D1D1F] block">Accepting Work</span>
              <span className="text-[11px] text-[#86868B]">
                {isAcceptingWork ? 'Available for client booking requests' : 'Fully Booked / Paused'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAcceptingWork}
                onChange={(e) => setIsAcceptingWork(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D1D1F]"></div>
            </label>
          </div>

          {/* Public Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F] flex items-center justify-between">
              <span>Public Display Name</span>
              <span className="text-[10px] text-[#86868B] font-normal">e.g. Vikram R. (Protects Full PII)</span>
            </label>
            <input
              type="text"
              value={publicDisplayName}
              onChange={(e) => setPublicDisplayName(e.target.value)}
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs font-bold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          {/* Public Specialty */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">
              Public Specialty / Headline
            </label>
            <input
              type="text"
              value={publicSpecialty}
              onChange={(e) => setPublicSpecialty(e.target.value)}
              placeholder="e.g. Wedding Cinema &amp; Film Colorist"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          {/* Experience Years */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">
              Years of Experience
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(Number(e.target.value))}
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          {/* Tier */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">
              Creator Tier
            </label>
            <select
              value={creatorTier}
              onChange={(e) => setCreatorTier(e.target.value as any)}
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs font-bold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            >
              <option value="rising_talent">Rising Talent (&lt; 10 completed projects)</option>
              <option value="standard">Standard (10 - 50 completed projects)</option>
              <option value="senior">Senior (&gt; 50 completed projects)</option>
            </select>
          </div>
        </div>

        {/* Public Bio */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1D1D1F]">
            Public Bio / Narrative (Displayed on /creators profile)
          </label>
          <textarea
            rows={3}
            value={publicBio}
            onChange={(e) => setPublicBio(e.target.value)}
            placeholder="Creative narrative highlighting editing style, cinematic influences, and client deliverables..."
            className="w-full bg-[#F5F5F7] p-3 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
          />
        </div>
      </div>

      {/* Section 2: Core Talent & Account Credentials */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-2xs space-y-6">
        <div className="pb-4 border-b border-[#E5E5E7]">
          <h2 className="text-base font-bold text-[#1D1D1F]">Core Member &amp; Contact Details</h2>
          <p className="text-xs text-[#86868B] mt-0.5">
            Internal contact details, skills list, external portfolio reel, and completed project stats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Full Legal / Real Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs font-semibold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9900000000"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-[#1D1D1F]">External Portfolio Link (Vimeo / Drive / Showcase)</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://vimeo.com/showcase/..."
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Completed Deliveries</label>
            <input
              type="number"
              min={0}
              value={completedProjects}
              onChange={(e) => setCompletedProjects(Number(e.target.value))}
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">
              Verified Skills (Comma Separated)
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g. Wedding Cinema, 4K Color Grading, Sound Design, Multi-Cam"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">
              Software Stack (Comma Separated)
            </label>
            <input
              type="text"
              value={softwareText}
              onChange={(e) => setSoftwareText(e.target.value)}
              placeholder="e.g. DaVinci Resolve Studio, Premiere Pro, After Effects"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1D1D1F]">Internal Background &amp; Bio</label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-[#F5F5F7] p-3 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
          />
        </div>
      </div>

      {/* Section 2.5: Studio Hardware, Editing Rig & Compliance */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-2xs space-y-6">
        <div className="pb-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h2 className="text-base font-bold text-[#1D1D1F]">Hardware Rig, Studio Specs &amp; Compliance</h2>
          </div>
          <p className="text-xs text-[#86868B] mt-0.5">
            Verified workstation hardware, calibrated monitoring, scratch disk throughput, capacity, and masked banking credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Workstation Rig</label>
            <input
              type="text"
              value={workstationRig}
              onChange={(e) => setWorkstationRig(e.target.value)}
              placeholder="e.g. Apple Mac Studio M2 Ultra (128GB Unified Memory)"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Calibrated Monitoring Spec</label>
            <input
              type="text"
              value={monitoringSpec}
              onChange={(e) => setMonitoringSpec(e.target.value)}
              placeholder="e.g. Apple Studio Display 27&quot; (P3-D65 Calibrated)"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Storage &amp; Scratch Setup</label>
            <input
              type="text"
              value={storageSpec}
              onChange={(e) => setStorageSpec(e.target.value)}
              placeholder="e.g. 10GbE Synology RAID + Internal 4TB NVMe"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Audio Reference Gear</label>
            <input
              type="text"
              value={audioSpec}
              onChange={(e) => setAudioSpec(e.target.value)}
              placeholder="e.g. Yamaha HS7 Studio Monitors + Beyerdynamic DT 990 Pro"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Weekly Delivery Capacity</label>
            <input
              type="text"
              value={capacityText}
              onChange={(e) => setCapacityText(e.target.value)}
              placeholder="e.g. 20 - 30 Hours / Week (2 Commercial Projects)"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1D1D1F]">Spoken &amp; Subtitle Languages</label>
            <input
              type="text"
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              placeholder="e.g. Hindi, English, Punjabi"
              className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
          </div>
        </div>

        {/* Masked Banking & Compliance Sub-box */}
        <div className="p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7] space-y-3">
          <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-2">
            <span className="text-xs font-bold text-[#1D1D1F]">Verified Compliance &amp; Bank Settlement (Masked)</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              DPDP Compliant Masking
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-[#86868B] block font-bold uppercase">Beneficiary Name</span>
              <span className="font-semibold text-[#1D1D1F] mt-0.5 block">{bankAccountName || fullName || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#86868B] block font-bold uppercase">Bank Account</span>
              <span className="font-mono text-[#1D1D1F] mt-0.5 block">{bankAccountNumber || '•••• On File'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#86868B] block font-bold uppercase">IFSC Code</span>
              <span className="font-mono text-[#1D1D1F] mt-0.5 block">{bankIfscCode || 'HDFC0001234'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#86868B] block font-bold uppercase">Income Tax PAN</span>
              <span className="font-mono text-[#1D1D1F] mt-0.5 block">{panNumber || '•••••• Verified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Portfolio Samples */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-2xs space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E7]">
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F]">Database Portfolio Samples ({samples.length})</h2>
            <p className="text-xs text-[#86868B] mt-0.5">
              Live samples stored in portfolio_samples table linked to this creator.
            </p>
          </div>
        </div>

        {samples.length === 0 ? (
          <div className="p-6 bg-[#F5F5F7] rounded-2xl text-center text-xs text-[#86868B]">
            No portfolio samples attached to this creator yet.
          </div>
        ) : (
          <div className="space-y-3">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    {sample.category}
                  </span>
                  <h3 className="text-xs font-bold text-[#1D1D1F] mt-0.5">{sample.title}</h3>
                  <p className="text-[11px] text-[#86868B] mt-0.5">
                    Codec: {sample.codec || 'ProRes 422'} • Resolution: {sample.resolution || '4K UHD'}
                  </p>
                </div>
                {sample.video_url && (
                  <a
                    href={sample.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-lg transition-all text-center"
                  >
                    Play Reel ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Assignments & Payouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assignments */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E7] shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
            Assignments History ({assignments.length})
          </h2>
          {assignments.length === 0 ? (
            <div className="p-4 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B] text-center">
              No project assignments logged.
            </div>
          ) : (
            <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                  <tr>
                    <th className="py-2 px-3">Project</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  {assignments.map((a: any) => (
                    <tr key={a.id}>
                      <td className="py-2 px-3 font-mono text-blue-600">{a.project_id || a.id.slice(0, 8)}</td>
                      <td className="py-2 px-3 capitalize">{a.status}</td>
                      <td className="py-2 px-3 text-[#86868B]">{new Date(a.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payouts */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E5E7] shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
            Payouts &amp; Settlements ({payouts.length})
          </h2>
          {payouts.length === 0 ? (
            <div className="p-4 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B] text-center">
              No payout records logged.
            </div>
          ) : (
            <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                  <tr>
                    <th className="py-2 px-3">Gross</th>
                    <th className="py-2 px-3">TDS</th>
                    <th className="py-2 px-3">Net</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  {payouts.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono">{formatInr(p.gross_amount)}</td>
                      <td className="py-2 px-3 text-amber-700">{formatInr(p.tds_amount)}</td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-600">{formatInr(p.net_payout)}</td>
                      <td className="py-2 px-3 capitalize">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}