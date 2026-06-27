import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const WhopEntry: React.FC = () => {
  const { experienceId } = useParams<{ experienceId: string }>();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If already authenticated, go straight to dashboard
    if (isAuthenticated) {
      if (experienceId) {
        localStorage.setItem('whop_experience_id', experienceId);
      }
      navigate('/dashboard', { replace: true });
      return;
    }

    // Call the whop-login endpoint through the Vercel proxy
    // The x-whop-user-token header is auto-attached by Whop on same-origin requests
    const doWhopLogin = async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (experienceId) {
          headers['x-whop-experience-id'] = experienceId;
          localStorage.setItem('whop_experience_id', experienceId);
        }

        const response = await fetch('/api/auth/whop-login', {
          method: 'POST',
          headers,
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Login failed: ${response.status} - ${body}`);
        }

        const data = await response.json();

        // Store auth data using the existing AuthContext login method
        login(data.token, data.user_id, data.username, data.role);

        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        console.error('Whop login failed:', err);
        setError(err.message || 'Failed to authenticate with Whop');
      } finally {
        setLoading(false);
      }
    };

    doWhopLogin();
  }, [experienceId, isAuthenticated, login, navigate]);

  if (error) {
    // If auth fails (e.g. they don't have a token or it's invalid),
    // redirect them to the landing page so they can still browse the app.
    navigate('/', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 gap-6 text-center animate-fade-in">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/10 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Loading PerspectiQ</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Verifying your access and setting things up...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default WhopEntry;
