import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserContext, AppRole, AuthState } from '@/types/auth';

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<boolean>;
  refreshUserContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserContext = useCallback(async (): Promise<UserContext | null> => {
    try {
      const { data, error } = await supabase.rpc('get_user_context');
      if (error) {
        console.error('Error fetching user context:', error);
        return null;
      }
      return data as unknown as UserContext;
    } catch (err) {
      console.error('Error in fetchUserContext:', err);
      return null;
    }
  }, []);

  const refreshUserContext = useCallback(async () => {
    const context = await fetchUserContext();
    setUser(context);
  }, [fetchUserContext]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserContext().then(setUser);
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserContext().then(context => {
          setUser(context);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserContext]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const switchCompany = async (companyId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('set_primary_company', {
        _company_id: companyId,
      });
      
      if (error) {
        console.error('Error switching company:', error);
        return false;
      }
      
      if (data) {
        await refreshUserContext();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error in switchCompany:', err);
      return false;
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!session?.user,
    currentCompanyId: user?.current_company_id || null,
    currentRole: user?.current_role || null,
    signIn,
    signUp,
    signOut,
    switchCompany,
    refreshUserContext,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
