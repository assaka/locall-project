/**
 * Enhanced White-label Branding Service
 * Provides advanced customization for white-label clients
 */

import { supabase } from '../app/utils/supabaseClient';

export interface AdvancedBrandingConfig {
  // Basic branding
  logo_url: string;
  favicon_url?: string;
  company_name: string;
  
  // Color scheme
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  
  // Typography
  font_family?: string;
  heading_font_family?: string;
  font_size_scale?: number;
  
  // Layout
  header_style?: 'default' | 'minimal' | 'modern' | 'classic';
  sidebar_style?: 'default' | 'collapsed' | 'overlay' | 'hidden' | 'minimal';
  border_radius?: number;
  spacing_scale?: number;
  
  // Custom CSS
  custom_css?: string;
  
  // Footer
  footer_text?: string;
  footer_links?: Array<{
    label: string;
    url: string;
    external?: boolean;
  }>;
  
  // Contact info
  support_email?: string;
  support_phone?: string;
  website_url?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  
  // Features
  hide_powered_by?: boolean;
  custom_login_page?: boolean;
  custom_domain_verified?: boolean;
  ssl_enabled?: boolean;
  
  // Advanced features
  white_label_features?: {
    custom_integrations?: boolean;
    api_access?: boolean;
    webhook_customization?: boolean;
    advanced_analytics?: boolean;
    priority_support?: boolean;
  };
}

export interface WhiteLabelClient {
  id: string;
  user_id: string;
  client_name: string;
  subdomain: string;
  custom_domain?: string;
  branding_config: AdvancedBrandingConfig;
  is_active: boolean;
  tier: 'basic' | 'professional' | 'enterprise';
  monthly_calls_limit?: number;
  monthly_forms_limit?: number;
  storage_limit_gb?: number;
  created_at: string;
  updated_at: string;
}

class WhiteLabelBrandingService {
  /**
   * Create a new white-label client with advanced branding
   */
  async createWhiteLabelClient(
    userId: string,
    clientData: Omit<WhiteLabelClient, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<WhiteLabelClient> {
    try {
      const { data, error } = await supabase
        .from('white_labels')
        .insert({
          user_id: userId,
          ...clientData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Generate CSS file for the client
      await this.generateCustomCSS(data.id, clientData.branding_config);

      return data as WhiteLabelClient;
    } catch (error) {
      console.error('Failed to create white-label client:', error);
      throw error;
    }
  }

  /**
   * Update white-label branding configuration
   */
  async updateBrandingConfig(
    clientId: string,
    brandingConfig: Partial<AdvancedBrandingConfig>
  ): Promise<WhiteLabelClient> {
    try {
      // Get current config
      const { data: currentClient, error: fetchError } = await supabase
        .from('white_labels')
        .select('branding_config')
        .eq('id', clientId)
        .single();

      if (fetchError) throw fetchError;

      // Merge configurations
      const updatedConfig = {
        ...currentClient.branding_config,
        ...brandingConfig,
      };

      // Update in database
      const { data, error } = await supabase
        .from('white_labels')
        .update({
          branding_config: updatedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;

      // Regenerate CSS file
      await this.generateCustomCSS(clientId, updatedConfig);

      return data as WhiteLabelClient;
    } catch (error) {
      console.error('Failed to update branding config:', error);
      throw error;
    }
  }

  /**
   * Generate custom CSS for a white-label client
   */
  async generateCustomCSS(
    clientId: string,
    brandingConfig: AdvancedBrandingConfig
  ): Promise<string> {
    const css = this.buildCustomCSS(brandingConfig);
    
    try {
      // Store CSS in database or file system
      const { error } = await supabase
        .from('white_label_assets')
        .upsert({
          client_id: clientId,
          asset_type: 'css',
          content: css,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      return css;
    } catch (error) {
      console.error('Failed to generate custom CSS:', error);
      throw error;
    }
  }

  /**
   * Build CSS string from branding configuration
   */
  private buildCustomCSS(config: AdvancedBrandingConfig): string {
    let css = `
/* White-label Custom Styles */
:root {
  --primary-color: ${config.primary_color};
  --secondary-color: ${config.secondary_color};
  --accent-color: ${config.accent_color || config.primary_color};
  --background-color: ${config.background_color || '#ffffff'};
  --text-color: ${config.text_color || '#1a1a1a'};
  --success-color: ${config.success_color || '#10b981'};
  --warning-color: ${config.warning_color || '#f59e0b'};
  --error-color: ${config.error_color || '#ef4444'};
  --border-radius: ${config.border_radius || 8}px;
  --spacing-scale: ${config.spacing_scale || 1};
  --font-size-scale: ${config.font_size_scale || 1};
}

/* Typography */
body {
  font-family: ${config.font_family || "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
  color: var(--text-color);
  background-color: var(--background-color);
}

h1, h2, h3, h4, h5, h6 {
  font-family: ${config.heading_font_family || config.font_family || "'Inter', sans-serif"};
}

/* Primary elements styling */
.MuiButton-containedPrimary {
  background-color: var(--primary-color) !important;
  color: white !important;
}

.MuiButton-containedPrimary:hover {
  background-color: ${this.darkenColor(config.primary_color, 0.1)} !important;
}

.MuiButton-outlinedPrimary {
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
}

.MuiTab-root.Mui-selected {
  color: var(--primary-color) !important;
}

.MuiTabs-indicator {
  background-color: var(--primary-color) !important;
}

/* Header styling */
.app-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)) !important;
}

/* Sidebar styling */
.app-sidebar {
  ${config.sidebar_style === 'hidden' ? 'display: none !important;' : ''}
  ${config.sidebar_style === 'minimal' ? 'width: 60px !important;' : ''}
}

/* Logo styling */
.brand-logo {
  content: url('${config.logo_url}');
  max-height: 40px;
  max-width: 200px;
}

/* Border radius */
.MuiPaper-root,
.MuiCard-root,
.MuiButton-root,
.MuiTextField-root .MuiOutlinedInput-root {
  border-radius: var(--border-radius) !important;
}

/* Footer */
${config.hide_powered_by ? '.powered-by { display: none !important; }' : ''}

/* Custom spacing */
.MuiBox-root,
.MuiContainer-root {
  --spacing-unit: calc(8px * var(--spacing-scale));
}

/* Font scaling */
html {
  font-size: calc(16px * var(--font-size-scale)) !important;
}

/* Color variants */
.MuiChip-colorPrimary {
  background-color: var(--primary-color) !important;
  color: white !important;
}

.MuiLinearProgress-colorPrimary .MuiLinearProgress-bar {
  background-color: var(--primary-color) !important;
}

.MuiCheckbox-colorPrimary.Mui-checked {
  color: var(--primary-color) !important;
}

.MuiRadio-colorPrimary.Mui-checked {
  color: var(--primary-color) !important;
}

/* Form styling */
.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
  border-color: var(--primary-color) !important;
}

.MuiInputLabel-root.Mui-focused {
  color: var(--primary-color) !important;
}

/* Alert colors */
.MuiAlert-standardSuccess {
  background-color: ${this.lightenColor(config.success_color || '#10b981', 0.9)} !important;
  color: ${config.success_color || '#10b981'} !important;
}

.MuiAlert-standardWarning {
  background-color: ${this.lightenColor(config.warning_color || '#f59e0b', 0.9)} !important;
  color: ${config.warning_color || '#f59e0b'} !important;
}

.MuiAlert-standardError {
  background-color: ${this.lightenColor(config.error_color || '#ef4444', 0.9)} !important;
  color: ${config.error_color || '#ef4444'} !important;
}

/* Header styles */
${this.getHeaderStyles(config.header_style)}

/* Custom CSS */
${config.custom_css || ''}
`;

    return css;
  }

  /**
   * Get header styles based on configuration
   */
  private getHeaderStyles(style?: string): string {
    switch (style) {
      case 'minimal':
        return `
.app-header {
  box-shadow: none !important;
  border-bottom: 1px solid rgba(0,0,0,0.1) !important;
  background: var(--background-color) !important;
  color: var(--text-color) !important;
}
`;
      case 'modern':
        return `
.app-header {
  backdrop-filter: blur(10px) !important;
  background: rgba(255,255,255,0.8) !important;
  border-bottom: 1px solid rgba(0,0,0,0.1) !important;
}
`;
      case 'classic':
        return `
.app-header {
  background: var(--background-color) !important;
  color: var(--text-color) !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
}
`;
      default:
        return '';
    }
  }

  /**
   * Utility functions for color manipulation
   */
  private darkenColor(color: string, amount: number): string {
    // Simple color darkening (you might want to use a proper color library)
    return color.replace(/^#/, '').replace(/../g, (color) =>
      Math.max(0, Math.min(255, parseInt(color, 16) - Math.round(255 * amount)))
        .toString(16)
        .padStart(2, '0')
    ).padStart(6, '0').replace(/^/, '#');
  }

  private lightenColor(color: string, amount: number): string {
    // Simple color lightening
    return color.replace(/^#/, '').replace(/../g, (color) =>
      Math.max(0, Math.min(255, parseInt(color, 16) + Math.round(255 * amount)))
        .toString(16)
        .padStart(2, '0')
    ).padStart(6, '0').replace(/^/, '#');
  }

  /**
   * Get white-label client by subdomain
   */
  async getClientBySubdomain(subdomain: string): Promise<WhiteLabelClient | null> {
    try {
      const { data, error } = await supabase
        .from('white_labels')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      return data as WhiteLabelClient;
    } catch (error) {
      console.error('Failed to get client by subdomain:', error);
      return null;
    }
  }

  /**
   * Get white-label client by custom domain
   */
  async getClientByDomain(domain: string): Promise<WhiteLabelClient | null> {
    try {
      const { data, error } = await supabase
        .from('white_labels')
        .select('*')
        .eq('custom_domain', domain)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as WhiteLabelClient;
    } catch (error) {
      console.error('Failed to get client by domain:', error);
      return null;
    }
  }

  /**
   * Generate theme configuration for Material-UI
   */
  generateMuiTheme(brandingConfig: AdvancedBrandingConfig): any {
    return {
      palette: {
        primary: {
          main: brandingConfig.primary_color,
        },
        secondary: {
          main: brandingConfig.secondary_color,
        },
        success: {
          main: brandingConfig.success_color || '#10b981',
        },
        warning: {
          main: brandingConfig.warning_color || '#f59e0b',
        },
        error: {
          main: brandingConfig.error_color || '#ef4444',
        },
        background: {
          default: brandingConfig.background_color || '#ffffff',
        },
        text: {
          primary: brandingConfig.text_color || '#1a1a1a',
        },
      },
      typography: {
        fontFamily: brandingConfig.font_family || "'Inter', sans-serif",
        h1: {
          fontFamily: brandingConfig.heading_font_family || brandingConfig.font_family || "'Inter', sans-serif",
        },
        h2: {
          fontFamily: brandingConfig.heading_font_family || brandingConfig.font_family || "'Inter', sans-serif",
        },
        h3: {
          fontFamily: brandingConfig.heading_font_family || brandingConfig.font_family || "'Inter', sans-serif",
        },
        h4: {
          fontFamily: brandingConfig.heading_font_family || brandingConfig.font_family || "'Inter', sans-serif",
        },
        h5: {
          fontFamily: brandingConfig.heading_font_family || brandingConfig.font_family || "'Inter', sans-serif",
        },
        h6: {
          fontFamily: brandingConfig.heading_font_family || brandingConfig.font_family || "'Inter', sans-serif",
        },
      },
      shape: {
        borderRadius: brandingConfig.border_radius || 8,
      },
      spacing: (factor: number) => `${8 * (brandingConfig.spacing_scale || 1) * factor}px`,
    };
  }

  /**
   * Validate custom domain setup
   */
  async validateCustomDomain(domain: string): Promise<{
    valid: boolean;
    dns_configured: boolean;
    ssl_ready: boolean;
    issues?: string[];
  }> {
    try {
      // This would typically involve DNS checks and SSL certificate validation
      // For now, we'll return a basic validation
      const issues: string[] = [];
      
      // Basic domain format validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        issues.push('Invalid domain format');
      }

      // Mock DNS and SSL checks (in production, you'd use actual DNS/SSL validation)
      const dns_configured = true; // Replace with actual DNS check
      const ssl_ready = true; // Replace with actual SSL check

      return {
        valid: issues.length === 0,
        dns_configured,
        ssl_ready,
        issues: issues.length > 0 ? issues : undefined,
      };
    } catch (error) {
      console.error('Domain validation error:', error);
      return {
        valid: false,
        dns_configured: false,
        ssl_ready: false,
        issues: ['Domain validation failed'],
      };
    }
  }

  /**
   * Export branding configuration
   */
  async exportBrandingConfig(clientId: string): Promise<{
    config: AdvancedBrandingConfig;
    css: string;
    theme: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('white_labels')
        .select('branding_config')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      const config = data.branding_config as AdvancedBrandingConfig;
      const css = this.buildCustomCSS(config);
      const theme = this.generateMuiTheme(config);

      return { config, css, theme };
    } catch (error) {
      console.error('Failed to export branding config:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const whiteLabelBrandingService = new WhiteLabelBrandingService();
