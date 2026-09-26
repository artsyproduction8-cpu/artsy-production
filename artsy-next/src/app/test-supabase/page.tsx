'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, isAuthenticated, hasRole } from '@/lib/auth';

export default function TestSupabase() {
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [userStatus, setUserStatus] = useState('Checking...');
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Test Supabase connection
        const { data, error } = await supabase.from('services').select('count').limit(1);

        if (error) {
          setDbStatus(`Error: ${error.message}`);
        } else {
          setDbStatus('Connected ✓');

          // Fetch actual services
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true);

          if (!servicesError) {
            setServices(servicesData);
          }
        }
      } catch (err) {
        setDbStatus(`Connection failed: ${err}`);
      }
    };

    checkSupabase();
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();
      const authenticated = isAuthenticated();

      if (user) {
        setUserStatus(`Logged in as ${user.full_name} (${user.role})`);
      } else if (authenticated) {
        setUserStatus('Authenticated but no user data');
      } else {
        setUserStatus('Not authenticated');
      }
    };

    checkAuth();

    // Listen for auth changes
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-[100vh] flex items-center justify-center bg-[--bg-subtle] px-4">
      <div className="w-full max-w-[480px] bg-white border border-[--border-default] rounded-[--radius-lg] p-6">
        <h1 className="text-[--text-md] font-bold text-center mb-4">Supabase Connection Test</h1>

        <div className="space-y-4">
          <div className="p-4 bg-[--bg-subtle] rounded-[--radius-lg]">
            <h2 className="text-[--text-sm] font-bold mb-2">Database Status</h2>
            <p className="text-[13px]">{dbStatus}</p>
          </div>

          <div className="p-4 bg-[--bg-subtle] rounded-[--radius-lg]">
            <h2 className="text-[--text-sm] font-bold mb-2">Auth Status</h2>
            <p className="text-[13px]">{userStatus}</p>
          </div>

          {services.length > 0 && (
            <div className="p-4 bg-[--bg-subtle] rounded-[--radius-lg]">
              <h2 className="text-[--text-sm] font-bold mb-2">Services ({services.length})</h2>
              <ul className="space-y-2 text-[13px]">
                {services.map((service, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{service.name}</span>
                    <span className="text-[--color-primary-dark] font-medium">₹{service.base_price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => {
                // Clear auth for testing
                localStorage.removeItem('artsy_auth_user');
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-[--color-sale-red] text-white font-medium text-[13px] rounded-md hover:bg-[--color-sale-dark] transition-colors duration-200"
            >
              Clear Auth & Reload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}