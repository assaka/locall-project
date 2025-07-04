// lib/oauth-service.ts
import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface OAuthProvider {
  id: 'hubspot' | 'google' | 'calendly';
  name: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export interface OAuthConnection {
  id: string;
  user_id: string;
  workspace_id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
  provider_user_id: string;
  provider_email: string;
  status: 'active' | 'expired' | 'error';
  last_sync: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SyncResult {
  success: boolean;
  contacts_synced?: number;
  appointments_synced?: number;
  errors?: string[];
  last_sync: Date;
}

export class OAuthService {
  private static providers: Record<string, OAuthProvider> = {
    hubspot: {
      id: 'hubspot',
      name: 'HubSpot',
      authUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      clientId: process.env.HUBSPOT_CLIENT_ID!,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET!,
      scopes: ['contacts', 'crm.objects.contacts.read', 'crm.objects.contacts.write']
    },
    google: {
      id: 'google',
      name: 'Google Calendar',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email']
    },
    calendly: {
      id: 'calendly',
      name: 'Calendly',
      authUrl: 'https://auth.calendly.com/oauth/authorize',
      tokenUrl: 'https://auth.calendly.com/oauth/token',
      clientId: process.env.CALENDLY_CLIENT_ID!,
      clientSecret: process.env.CALENDLY_CLIENT_SECRET!,
      scopes: ['default']
    }
  };

  static getProvider(providerId: string): OAuthProvider | null {
    return this.providers[providerId] || null;
  }

  static generateAuthUrl(providerId: string, userId: string, workspaceId: string): string {
    const provider = this.getProvider(providerId);
    if (!provider) throw new Error('Invalid provider');

    const state = Buffer.from(JSON.stringify({ userId, workspaceId, provider: providerId })).toString('base64');
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/${providerId}`;

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      scope: provider.scopes.join(' '),
      response_type: 'code',
      state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${provider.authUrl}?${params.toString()}`;
  }

  static async exchangeCodeForToken(providerId: string, code: string, state: string): Promise<any> {
    const provider = this.getProvider(providerId);
    if (!provider) throw new Error('Invalid provider');

    const { userId, workspaceId } = JSON.parse(Buffer.from(state, 'base64').toString());
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/${providerId}`;

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: redirectUri
      }).toString()
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokenData = await response.json();
    
    // Get user info from provider
    const userInfo = await this.getUserInfo(providerId, tokenData.access_token);

    // Store connection in database
    const connection = await this.storeConnection({
      user_id: userId,
      workspace_id: workspaceId,
      provider: providerId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      provider_user_id: userInfo.id,
      provider_email: userInfo.email,
      status: 'active'
    });

    return { connection, tokenData };
  }

  static async getUserInfo(providerId: string, accessToken: string): Promise<any> {
    let url: string;
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`
    };

    switch (providerId) {
      case 'hubspot':
        url = 'https://api.hubapi.com/oauth/v1/access-tokens/' + accessToken;
        break;
      case 'google':
        url = 'https://www.googleapis.com/oauth2/v2/userinfo';
        break;
      case 'calendly':
        url = 'https://api.calendly.com/users/me';
        break;
      default:
        throw new Error('Unsupported provider');
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    const data = await response.json();
    
    switch (providerId) {
      case 'hubspot':
        return { id: data.hub_id.toString(), email: data.user };
      case 'google':
        return { id: data.id, email: data.email };
      case 'calendly':
        return { id: data.resource.uri.split('/').pop(), email: data.resource.email };
      default:
        return data;
    }
  }

  static async storeConnection(connectionData: Partial<OAuthConnection>): Promise<OAuthConnection> {
    const { data, error } = await supabaseAdmin
      .from('oauth_connections')
      .upsert({
        ...connectionData,
        last_sync: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }, {
        onConflict: 'user_id,workspace_id,provider'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getConnection(userId: string, workspaceId: string, provider: string): Promise<OAuthConnection | null> {
    const { data, error } = await supabaseAdmin
      .from('oauth_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('provider', provider)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async refreshToken(connectionId: string): Promise<OAuthConnection> {
    const { data: connection } = await supabaseAdmin
      .from('oauth_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection || !connection.refresh_token) {
      throw new Error('No refresh token available');
    }

    const provider = this.getProvider(connection.provider);
    if (!provider) throw new Error('Invalid provider');

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        refresh_token: connection.refresh_token
      }).toString()
    });

    if (!response.ok) {
      await supabaseAdmin
        .from('oauth_connections')
        .update({ status: 'expired' })
        .eq('id', connectionId);
      throw new Error('Token refresh failed');
    }

    const tokenData = await response.json();

    const { data: updatedConnection } = await supabaseAdmin
      .from('oauth_connections')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || connection.refresh_token,
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
        status: 'active',
        updated_at: new Date()
      })
      .eq('id', connectionId)
      .select()
      .single();

    return updatedConnection;
  }

  static async syncContacts(connectionId: string): Promise<SyncResult> {
    const { data: connection } = await supabaseAdmin
      .from('oauth_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection) throw new Error('Connection not found');

    try {
      let contactsSynced = 0;
      const errors: string[] = [];

      switch (connection.provider) {
        case 'hubspot':
          contactsSynced = await this.syncHubSpotContacts(connection);
          break;
        case 'google':
          // Google Contacts API integration would go here
          break;
        default:
          throw new Error(`Contact sync not supported for ${connection.provider}`);
      }

      await supabaseAdmin
        .from('oauth_connections')
        .update({ last_sync: new Date() })
        .eq('id', connectionId);

      return {
        success: true,
        contacts_synced: contactsSynced,
        last_sync: new Date(),
        errors
      };

    } catch (error) {
      return {
        success: false,
        contacts_synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        last_sync: new Date()
      };
    }
  }

  private static async syncHubSpotContacts(connection: OAuthConnection): Promise<number> {
    const url = 'https://api.hubapi.com/crm/v3/objects/contacts';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch HubSpot contacts');

    const data = await response.json();
    let syncedCount = 0;

    for (const contact of data.results || []) {
      try {
        await supabaseAdmin
          .from('synced_contacts')
          .upsert({
            workspace_id: connection.workspace_id,
            provider: 'hubspot',
            provider_contact_id: contact.id,
            email: contact.properties.email,
            first_name: contact.properties.firstname,
            last_name: contact.properties.lastname,
            phone: contact.properties.phone,
            company: contact.properties.company,
            last_modified: contact.properties.lastmodifieddate,
            raw_data: contact,
            created_at: new Date(),
            updated_at: new Date()
          }, {
            onConflict: 'workspace_id,provider,provider_contact_id'
          });
        syncedCount++;
      } catch (error) {
        console.error('Error syncing contact:', error);
      }
    }

    return syncedCount;
  }

  static async syncAppointments(connectionId: string): Promise<SyncResult> {
    const { data: connection } = await supabaseAdmin
      .from('oauth_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection) throw new Error('Connection not found');

    try {
      let appointmentsSynced = 0;

      switch (connection.provider) {
        case 'google':
          appointmentsSynced = await this.syncGoogleCalendarEvents(connection);
          break;
        case 'calendly':
          appointmentsSynced = await this.syncCalendlyEvents(connection);
          break;
        default:
          throw new Error(`Appointment sync not supported for ${connection.provider}`);
      }

      return {
        success: true,
        appointments_synced: appointmentsSynced,
        last_sync: new Date()
      };

    } catch (error) {
      return {
        success: false,
        appointments_synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        last_sync: new Date()
      };
    }
  }

  private static async syncGoogleCalendarEvents(connection: OAuthConnection): Promise<number> {
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch Google Calendar events');

    const data = await response.json();
    let syncedCount = 0;

    for (const event of data.items || []) {
      if (event.status === 'cancelled') continue;

      try {
        await supabaseAdmin
          .from('synced_appointments')
          .upsert({
            workspace_id: connection.workspace_id,
            provider: 'google',
            provider_event_id: event.id,
            title: event.summary,
            description: event.description,
            start_time: event.start.dateTime || event.start.date,
            end_time: event.end.dateTime || event.end.date,
            attendees: event.attendees?.map((a: any) => a.email) || [],
            status: event.status,
            raw_data: event,
            created_at: new Date(),
            updated_at: new Date()
          }, {
            onConflict: 'workspace_id,provider,provider_event_id'
          });
        syncedCount++;
      } catch (error) {
        console.error('Error syncing event:', error);
      }
    }

    return syncedCount;
  }

  private static async syncCalendlyEvents(connection: OAuthConnection): Promise<number> {
    const url = 'https://api.calendly.com/scheduled_events';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch Calendly events');

    const data = await response.json();
    let syncedCount = 0;

    for (const event of data.collection || []) {
      try {
        await supabaseAdmin
          .from('synced_appointments')
          .upsert({
            workspace_id: connection.workspace_id,
            provider: 'calendly',
            provider_event_id: event.uri.split('/').pop(),
            title: event.name,
            start_time: event.start_time,
            end_time: event.end_time,
            status: event.status,
            raw_data: event,
            created_at: new Date(),
            updated_at: new Date()
          }, {
            onConflict: 'workspace_id,provider,provider_event_id'
          });
        syncedCount++;
      } catch (error) {
        console.error('Error syncing event:', error);
      }
    }

    return syncedCount;
  }

  static async disconnectProvider(userId: string, workspaceId: string, provider: string): Promise<void> {
    await supabaseAdmin
      .from('oauth_connections')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('provider', provider);
  }

  static async disconnectIntegration(workspaceId: string, provider: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabaseAdmin
        .from('oauth_connections')
        .update({ status: 'expired' })
        .eq('workspace_id', workspaceId)
        .eq('provider', provider);

      return { success: true };
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getWorkspaceConnections(workspaceId: string): Promise<OAuthConnection[]> {
    const { data, error } = await supabaseAdmin
      .from('oauth_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  }
}
