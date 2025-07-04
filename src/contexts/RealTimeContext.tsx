'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../app/utils/supabaseClient';
import { useNotification } from './NotificationContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealTimeData {
  // Analytics
  totalCalls: number;
  activeCalls: number;
  totalRevenue: number;
  conversionRate: number;
  
  // System Health
  systemStatus: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  
  // User Activity
  activeUsers: number;
  onlineUsers: string[];
  
  // Recent Activity
  recentActivities: Activity[];
  
  // Notifications
  unreadNotifications: number;
  
  // Real-time events
  newCalls: Call[];
  newFormSubmissions: FormSubmission[];
  systemAlerts: SystemAlert[];
}

interface Call {
  id: string;
  from_number: string;
  to_number: string;
  status: string;
  duration: number | null;
  started_at: string;
  ended_at: string | null;
  workspace_id: string;
  direction: 'inbound' | 'outbound';
}

interface FormSubmission {
  id: string;
  form_name: string;
  submitted_at: string;
  data: Record<string, any>;
  workspace_id: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

interface Activity {
  id: string;
  type: 'call' | 'form' | 'payment' | 'user' | 'system';
  message: string;
  timestamp: Date;
  severity: 'info' | 'success' | 'warning' | 'error';
  user?: string;
}

interface RealTimeContextType {
  data: RealTimeData;
  isConnected: boolean;
  lastUpdated: Date | null;
  refreshData: () => void;
  subscriptions: RealtimeChannel[];
  connectToWorkspace: (workspaceId: string) => void;
  disconnectFromWorkspace: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RealTimeData>({
    totalCalls: 0,
    activeCalls: 0,
    totalRevenue: 0,
    conversionRate: 0,
    systemStatus: 'healthy',
    uptime: 0,
    responseTime: 0,
    activeUsers: 0,
    onlineUsers: [],
    recentActivities: [],
    unreadNotifications: 0,
    newCalls: [],
    newFormSubmissions: [],
    systemAlerts: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const { showSuccess, showWarning, showError } = useNotification();

  // Connect to real-time subscriptions for a workspace
  const connectToWorkspace = async (workspaceId: string) => {
    if (currentWorkspaceId === workspaceId) return;
    
    // Disconnect from previous workspace
    await disconnectFromWorkspace();
    
    try {
      setCurrentWorkspaceId(workspaceId);
      
      // Subscribe to calls table
      const callsChannel = supabase
        .channel(`calls-${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'calls',
            filter: `workspace_id=eq.${workspaceId}`
          },
          (payload) => {
            console.log('Call change received:', payload);
            handleCallUpdate(payload);
          }
        )
        .subscribe((status) => {
          console.log('Calls subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            showSuccess('Connected to real-time updates');
          }
        });

      // Subscribe to form submissions
      const formsChannel = supabase
        .channel(`forms-${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'form_submissions',
            filter: `workspace_id=eq.${workspaceId}`
          },
          (payload) => {
            console.log('Form submission change received:', payload);
            handleFormSubmissionUpdate(payload);
          }
        )
        .subscribe();

      // Subscribe to workspace activity
      const activityChannel = supabase
        .channel(`activity-${workspaceId}`)
        .on('broadcast', { event: 'activity' }, (payload) => {
          console.log('Activity broadcast received:', payload);
          handleActivityBroadcast(payload);
        })
        .subscribe();

      // Subscribe to presence for online users
      const presenceChannel = supabase
        .channel(`presence-${workspaceId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const onlineUsers = Object.keys(state).map(key => {
            const presenceData = state[key][0] as any;
            return presenceData?.user_name || 'Unknown';
          });
          setData(prev => ({
            ...prev,
            onlineUsers,
            activeUsers: onlineUsers.length
          }));
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', leftPresences);
        })
        .subscribe();

      setSubscriptions([callsChannel, formsChannel, activityChannel, presenceChannel]);

      // Load initial data
      await loadInitialData(workspaceId);

    } catch (error) {
      console.error('Error connecting to workspace:', error);
      showError('Failed to connect to real-time updates');
      setIsConnected(false);
    }
  };

  const disconnectFromWorkspace = async () => {
    if (subscriptions.length > 0) {
      await Promise.all(subscriptions.map(sub => supabase.removeChannel(sub)));
      setSubscriptions([]);
    }
    setCurrentWorkspaceId(null);
    setIsConnected(false);
  };

  // Load initial analytics data
  const loadInitialData = async (workspaceId: string) => {
    try {
      // Get total calls count
      const { count: totalCallsCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId);

      // Get active calls (calls in progress)
      const { count: activeCallsCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .in('status', ['ringing', 'in-progress']);

      // Get recent activities
      const { data: recentCalls } = await supabase
        .from('calls')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('started_at', { ascending: false })
        .limit(5);

      const { data: recentForms } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('submitted_at', { ascending: false })
        .limit(5);

      // Convert to activities
      const activities: Activity[] = [
        ...(recentCalls?.map(call => ({
          id: call.id,
          type: 'call' as const,
          message: `${call.direction} call ${call.status} - ${call.from_number}`,
          timestamp: new Date(call.started_at),
          severity: call.status === 'completed' ? 'success' as const : 'info' as const
        })) || []),
        ...(recentForms?.map(form => ({
          id: form.id,
          type: 'form' as const,
          message: `Form submission: ${form.form_name}`,
          timestamp: new Date(form.submitted_at),
          severity: 'success' as const
        })) || [])
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

      setData(prev => ({
        ...prev,
        totalCalls: totalCallsCount || 0,
        activeCalls: activeCallsCount || 0,
        recentActivities: activities,
        systemStatus: 'healthy',
        uptime: 99.9,
        responseTime: 150
      }));

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error loading initial data:', error);
      showError('Failed to load initial data');
    }
  };

  // Handle real-time call updates
  const handleCallUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setData(prev => {
      let newData = { ...prev };
      
      if (eventType === 'INSERT') {
        // New call started
        newData.newCalls = [newRecord, ...prev.newCalls.slice(0, 9)];
        newData.activeCalls = prev.activeCalls + 1;
        
        // Add to recent activities
        const activity: Activity = {
          id: newRecord.id,
          type: 'call',
          message: `New ${newRecord.direction} call from ${newRecord.from_number}`,
          timestamp: new Date(newRecord.started_at),
          severity: 'info'
        };
        newData.recentActivities = [activity, ...prev.recentActivities.slice(0, 9)];
        
        showSuccess(`New ${newRecord.direction} call received`);
      } 
      else if (eventType === 'UPDATE') {
        // Call status updated
        if (oldRecord.status !== newRecord.status) {
          if (newRecord.status === 'completed') {
            newData.activeCalls = Math.max(0, prev.activeCalls - 1);
            newData.totalCalls = prev.totalCalls + 1;
          }
        }
      }
      
      return newData;
    });
    
    setLastUpdated(new Date());
  };

  // Handle real-time form submission updates
  const handleFormSubmissionUpdate = (payload: any) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      setData(prev => {
        const activity: Activity = {
          id: newRecord.id,
          type: 'form',
          message: `New form submission: ${newRecord.form_name}`,
          timestamp: new Date(newRecord.submitted_at),
          severity: 'success'
        };
        
        return {
          ...prev,
          newFormSubmissions: [newRecord, ...prev.newFormSubmissions.slice(0, 9)],
          recentActivities: [activity, ...prev.recentActivities.slice(0, 9)]
        };
      });
      
      showSuccess('New form submission received');
      setLastUpdated(new Date());
    }
  };

  // Handle activity broadcasts
  const handleActivityBroadcast = (payload: any) => {
    const { activity } = payload.payload;
    
    setData(prev => ({
      ...prev,
      recentActivities: [activity, ...prev.recentActivities.slice(0, 9)]
    }));
    
    setLastUpdated(new Date());
  };

  const refreshData = async () => {
    if (currentWorkspaceId) {
      await loadInitialData(currentWorkspaceId);
      showSuccess('Data refreshed successfully');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromWorkspace();
    };
  }, []);

  const value: RealTimeContextType = {
    data,
    isConnected,
    lastUpdated,
    refreshData,
    subscriptions,
    connectToWorkspace,
    disconnectFromWorkspace,
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
}
