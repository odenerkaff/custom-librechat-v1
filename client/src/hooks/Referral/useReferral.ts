import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../AuthContext';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  currentBalance: number;
  user: {
    name: string;
    email: string;
  };
}

interface ReferralHistory {
  success: boolean;
  referrals: Array<{
    id: string;
    referredUser: {
      name: string;
      email: string;
      createdAt: string;
    };
    status: string;
    createdAt: string;
    completedAt: string;
  }>;
  total: number;
}

interface LeaderboardItem {
  referrerId: string;
  totalReferrals: number;
  name: string;
  email: string;
  lastReferralDate: string;
}

interface LeaderboardData {
  success: boolean;
  leaderboard: LeaderboardItem[];
}

export function useReferralData() {
  const { user, token, isAuthenticated } = useAuthContext();

  const { data, isLoading, error, refetch } = useQuery<ReferralData>({
    queryKey: ['referralData'],
    queryFn: async () => {
      if (!isAuthenticated || !token) {
        console.log('[Referral Hook] User not authenticated:', { isAuthenticated, hasToken: !!token });
        throw new Error('User not authenticated');
      }

      console.log('[Referral Hook] Making request to /api/referral/me with token');

      const response = await fetch('/api/referral/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('[Referral Hook] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Referral Hook] API Error:', response.status, errorData);
        throw new Error(`Failed to fetch referral data: ${response.status} - ${errorData}`);
      }

      const jsonData = await response.json();
      console.log('[Referral Hook] API Response:', jsonData);

      return jsonData;
    },
    enabled: !!(isAuthenticated && token),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

export function useReferralHistory() {
  const { user, token, isAuthenticated } = useAuthContext();

  const { data, isLoading, error } = useQuery<ReferralHistory>({
    queryKey: ['referralHistory'],
    queryFn: async () => {
      if (!isAuthenticated || !token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/referral/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch referral history');
      }

      return response.json();
    },
    enabled: !!(isAuthenticated && token),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    data: data?.referrals || [],
    total: data?.total || 0,
    isLoading,
    error
  };
}

export function useReferralLeaderboard(limit = 10) {
  const { user, token, isAuthenticated } = useAuthContext();

  const { data, isLoading, error } = useQuery<LeaderboardData>({
    queryKey: ['referralLeaderboard', limit],
    queryFn: async () => {
      if (!isAuthenticated || !token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/referral/leaderboard?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return response.json();
    },
    enabled: !!(isAuthenticated && token),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: data?.leaderboard || [],
    isLoading,
    error
  };
}

export function useReferralActions() {
  const { user, token, isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const shareReferralLink = async () => {
    if (!isAuthenticated || !token) {
      throw new Error('User not authenticated');
    }

    const referralData = await queryClient.fetchQuery({
      queryKey: ['referralData'],
    });

    if (!referralData?.referralLink) {
      throw new Error('Referral link not available');
    }

    if (navigator.share) {
      // Native share API
      await navigator.share({
        title: 'Junte-se ao LibreChat!',
        text: 'Ganhe 500 créditos gratuitos quando você se cadastrar conosco!',
        url: referralData.referralLink,
      });
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(referralData.referralLink);
      // You might want to show a toast notification here
    }

    return referralData.referralLink;
  };

  const regenerateReferralLink = async () => {
    setIsGeneratingLink(true);
    try {
      // Force refetch of referral data
      await queryClient.invalidateQueries({ queryKey: ['referralData'] });
      const newData = await queryClient.fetchQuery({
        queryKey: ['referralData'],
      });
      return newData?.referralLink;
    } catch (error) {
      throw new Error('Failed to regenerate referral link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return {
    shareReferralLink,
    regenerateReferralLink,
    isGeneratingLink
  };
}
