import { supabase } from '@/app/utils/supabaseClient';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
}

export interface EmailRequest {
  to: Array<{ email: string; name?: string }>;
  from?: { email: string; name?: string };
  subject: string;
  html_content?: string;
  text_content?: string;
  template_id?: number;
  template_variables?: { [key: string]: any };
  workspace_id?: string;
  user_id?: string;
  campaign_id?: string;
  metadata?: any;
}

export interface EmailResponse {
  message_id: string;
  status: string;
  accepted: string[];
  rejected: string[];
}

export class BrevoEmailService {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY!;
  }

  async sendEmail(emailRequest: EmailRequest): Promise<EmailResponse> {
    try {
      console.log('Sending email via Brevo:', emailRequest);

      const emailData: any = {
        to: emailRequest.to,
        subject: emailRequest.subject,
        sender: emailRequest.from || {
          email: process.env.NEXT_PUBLIC_BREVO_SMTP_USER!,
          name: 'LoCall Support'
        }
      };

      if (emailRequest.template_id && emailRequest.template_variables) {
        // Use template
        emailData.templateId = emailRequest.template_id;
        emailData.params = emailRequest.template_variables;
      } else {
        // Use custom content
        if (emailRequest.html_content) {
          emailData.htmlContent = emailRequest.html_content;
        }
        if (emailRequest.text_content) {
          emailData.textContent = emailRequest.text_content;
        }
      }

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
      }

      // Store email record in database
      const emailRecord = {
        brevo_message_id: result.messageId,
        to_emails: emailRequest.to.map(t => t.email),
        from_email: emailData.sender.email,
        subject: emailRequest.subject,
        status: 'sent',
        workspace_id: emailRequest.workspace_id,
        user_id: emailRequest.user_id,
        campaign_id: emailRequest.campaign_id,
        template_id: emailRequest.template_id,
        metadata: emailRequest.metadata,
        created_at: new Date().toISOString()
      };

      const { error: saveError } = await supabase
        .from('emails')
        .insert(emailRecord);

      if (saveError) {
        console.error('Error saving email record:', saveError);
      }

      return {
        message_id: result.messageId,
        status: 'sent',
        accepted: emailRequest.to.map(t => t.email),
        rejected: []
      };

    } catch (error) {
      console.error('Error sending email:', error);

      // Store failed email record
      const failedEmailRecord = {
        to_emails: emailRequest.to.map(t => t.email),
        from_email: emailRequest.from?.email || process.env.NEXT_PUBLIC_BREVO_SMTP_USER!,
        subject: emailRequest.subject,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        workspace_id: emailRequest.workspace_id,
        user_id: emailRequest.user_id,
        campaign_id: emailRequest.campaign_id,
        metadata: emailRequest.metadata,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('emails')
        .insert(failedEmailRecord);

      if (insertError) {
        console.error('Error saving failed email record:', insertError);
      }

      throw error;
    }
  }

  async sendBulkEmail(
    emails: EmailRequest[],
    workspaceId?: string,
    userId?: string
  ): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];

    for (const email of emails) {
      try {
        const result = await this.sendEmail({
          ...email,
          workspace_id: workspaceId,
          user_id: userId
        });
        results.push(result);
      } catch (error) {
        console.error('Error sending bulk email:', error);
        results.push({
          message_id: '',
          status: 'failed',
          accepted: [],
          rejected: email.to.map(t => t.email)
        });
      }
    }

    return results;
  }

  async createTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate> {
    try {
      const templateData = {
        name: template.name,
        subject: template.subject,
        htmlContent: template.html_content,
        textContent: template.text_content,
        isActive: true
      };

      const response = await fetch(`${this.baseUrl}/smtp/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify(templateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Brevo API error: ${result.message || 'Unknown error'}`);
      }

      // Store template in database
      const templateRecord = {
        brevo_template_id: result.id,
        name: template.name,
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content,
        variables: template.variables,
        created_at: new Date().toISOString()
      };

      const { data: savedTemplate, error } = await supabase
        .from('email_templates')
        .insert(templateRecord)
        .select()
        .single();

      if (error) {
        console.error('Error saving template:', error);
      }

      return {
        id: result.id.toString(),
        ...template
      };

    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async getTemplates(workspaceId?: string): Promise<EmailTemplate[]> {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data: templates, error } = await query;

      if (error) {
        throw error;
      }

      return templates?.map(template => ({
        id: template.brevo_template_id?.toString() || template.id,
        name: template.name,
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content,
        variables: template.variables || []
      })) || [];

    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  async trackEmailEvent(eventData: any): Promise<void> {
    try {
      const { message_id, event, email, ts } = eventData;

      // Update email record
      await supabase
        .from('emails')
        .update({
          status: event,
          updated_at: new Date(ts * 1000).toISOString()
        })
        .eq('brevo_message_id', message_id);

      // Store email event
      await supabase
        .from('email_events')
        .insert({
          email: email,
          message_id: message_id,
          event_type: event,
          event_data: eventData,
          created_at: new Date(ts * 1000).toISOString()
        });

    } catch (error) {
      console.error('Error tracking email event:', error);
      throw error;
    }
  }

  async getEmailAnalytics(
    startDate: string,
    endDate: string,
    workspaceId?: string
  ): Promise<any> {
    try {
      let query = supabase
        .from('emails')
        .select('status, created_at, to_emails, workspace_id')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data: emails, error } = await query;

      if (error) {
        throw error;
      }

      const totalEmails = emails?.length || 0;
      const sentEmails = emails?.filter(e => e.status === 'sent').length || 0;
      const failedEmails = emails?.filter(e => e.status === 'failed').length || 0;

      // Get email events for delivered/opened/clicked stats
      let eventsQuery = supabase
        .from('email_events')
        .select('event_type, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const { data: events } = await eventsQuery;

      const deliveredEmails = events?.filter(e => e.event_type === 'delivered').length || 0;
      const openedEmails = events?.filter(e => e.event_type === 'opened').length || 0;
      const clickedEmails = events?.filter(e => e.event_type === 'clicked').length || 0;

      return {
        total_emails: totalEmails,
        sent_emails: sentEmails,
        failed_emails: failedEmails,
        delivered_emails: deliveredEmails,
        opened_emails: openedEmails,
        clicked_emails: clickedEmails,
        delivery_rate: sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0,
        open_rate: deliveredEmails > 0 ? (openedEmails / deliveredEmails) * 100 : 0,
        click_rate: openedEmails > 0 ? (clickedEmails / openedEmails) * 100 : 0
      };

    } catch (error) {
      console.error('Error getting email analytics:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string, workspaceId?: string): Promise<void> {
    const emailRequest: EmailRequest = {
      to: [{ email: userEmail, name: userName }],
      subject: 'Welcome to LoCall!',
      html_content: `
        <h1>Welcome to LoCall, ${userName}!</h1>
        <p>Thank you for joining LoCall. You're now ready to start making calls and managing forms with our powerful platform.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Set up your first call campaign</li>
          <li>Create custom forms</li>
          <li>Purchase phone numbers</li>
          <li>View analytics and reports</li>
        </ul>
        <p>If you have any questions, our support team is here to help!</p>
        <p>Best regards,<br>The LoCall Team</p>
      `,
      text_content: `
        Welcome to LoCall, ${userName}!
        
        Thank you for joining LoCall. You're now ready to start making calls and managing forms with our powerful platform.
        
        Here's what you can do next:
        - Set up your first call campaign
        - Create custom forms
        - Purchase phone numbers
        - View analytics and reports
        
        If you have any questions, our support team is here to help!
        
        Best regards,
        The LoCall Team
      `,
      workspace_id: workspaceId
    };

    await this.sendEmail(emailRequest);
  }

  async sendInviteEmail(
    inviteEmail: string,
    inviterName: string,
    workspaceName: string,
    inviteLink: string,
    workspaceId?: string
  ): Promise<void> {
    const emailRequest: EmailRequest = {
      to: [{ email: inviteEmail }],
      subject: `You're invited to join ${workspaceName} on LoCall`,
      html_content: `
        <h1>You've been invited to join ${workspaceName}</h1>
        <p>${inviterName} has invited you to join their workspace on LoCall.</p>
        <p>LoCall is a powerful platform for call management and form tracking that helps teams stay connected and organized.</p>
        <p><a href="${inviteLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
        <p>If the button doesn't work, copy and paste this link into your browser:<br>
        ${inviteLink}</p>
        <p>This invitation will expire in 7 days.</p>
        <p>Best regards,<br>The LoCall Team</p>
      `,
      text_content: `
        You've been invited to join ${workspaceName}
        
        ${inviterName} has invited you to join their workspace on LoCall.
        
        LoCall is a powerful platform for call management and form tracking that helps teams stay connected and organized.
        
        To accept this invitation, visit: ${inviteLink}
        
        This invitation will expire in 7 days.
        
        Best regards,
        The LoCall Team
      `,
      workspace_id: workspaceId
    };

    await this.sendEmail(emailRequest);
  }
}

export const brevoEmailService = new BrevoEmailService();
