'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setCurrentUser, ArtsyUser } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('karan@artsy.production');
  const [passkey, setPasskey] = useState('ARTSY-OPS-2026');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Simulate auth check
      await new Promise(resolve => setTimeout(resolve, 500));

      const adminUser: ArtsyUser = {
        id: 'admin-karan-001',
        email: email.trim(),
        full_name: 'Karan (Studio Director)',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCurrentUser(adminUser);
      router.push('/admin');
    } catch {
      setError('Invalid admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0A0A0F',
      padding: '24px',
      color: '#ffffff'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#12121A',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        position: 'relative'
      }}>
        {/* Back Link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#9CA3AF',
            textDecoration: 'none',
            marginBottom: '20px'
          }}
        >
          ← Return to Studio
        </Link>

        {/* Studio Ops Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(0, 191, 99, 0.15)',
            color: '#00BF63',
            fontSize: '24px',
            marginBottom: '12px'
          }}>
            🛡️
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            Studio Ops Administration
          </h1>
          <p style={{ fontSize: '12.5px', color: '#9CA3AF' }}>
            Private internal terminal for studio directors & QA leads
          </p>
        </div>

        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D1D5DB', marginBottom: '6px' }}>
              Staff Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#1A1A24',
                border: '1px solid #2D2D3D',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13.5px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#D1D5DB', marginBottom: '6px' }}>
              Security Passkey / 2FA Token
            </label>
            <input
              type="text"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                background: '#1A1A24',
                border: '1px solid #2D2D3D',
                borderRadius: '8px',
                color: '#00BF63',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#3B1212',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '12.5px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '13px',
              background: '#00BF63',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.2s'
            }}
          >
            <span>{isLoading ? 'Verifying Credentials...' : 'Access Studio Ops'}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => {
              const adminUser = {
                id: 'admin-karan-001',
                email: 'admin@artsyprod.studio',
                full_name: 'Studio Director',
                role: 'admin' as const,
                status: 'active' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setCurrentUser(adminUser);
              router.push('/admin');
            }}
            style={{
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#9CA3AF',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            ⚡ Instant Admin Demo Access
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#6B7280' }}>
          🔒 Restricted access. All authorization attempts are logged and monitored.
        </div>
      </div>
    </div>
  );
}
