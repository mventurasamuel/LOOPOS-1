// File: contexts/AuthContext.tsx
// Este arquivo gerencia o estado de autenticação do usuário em toda a aplicação.
// Agora integrado com Supabase para autenticação.

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Interface pública do contexto de autenticação.
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Contexto interno e hook de acesso.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// Mapeia o usuário do Supabase para o formato de usuário da aplicação
const mapSupabaseUser = (user: SupabaseUser | null): User | null => {
  if (!user) return null;
  
  // Usar o email como username se não houver username definido
  const username = user.user_metadata?.username || user.email?.split('@')[0] || '';
  
  return {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
    username: username,
    email: user.email || '',
    phone: user.user_metadata?.phone || '',
    role: user.user_metadata?.role || 'user',
    can_login: user.user_metadata?.can_login ?? true,
    // Campos opcionais
    supervisorId: user.user_metadata?.supervisorId,
    plantIds: user.user_metadata?.plantIds || []
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        console.log('👤 Usuário recuperado do localStorage:', parsed.name);
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao recuperar usuário:', error);
    }
    return null;
  });

  // Efeito para lidar com mudanças na sessão do Supabase
  useEffect(() => {
    // Verifica a sessão atual
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔑 Evento de autenticação:', event);
        
        if (session?.user) {
          const userData = mapSupabaseUser(session.user);
          if (userData) {
            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
          }
        } else {
          setUser(null);
          localStorage.removeItem('currentUser');
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error.message);
        throw new Error(error.message || 'Falha no login');
      }

      if (!data.user) {
        throw new Error('Nenhum usuário retornado');
      }

      const userData = mapSupabaseUser(data.user);
      if (!userData) {
        throw new Error('Falha ao processar dados do usuário');
      }

      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
    } catch (error) {
      console.error('Erro durante o login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error.message);
      }
    } catch (error) {
      console.error('Erro durante o logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('currentUser');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};