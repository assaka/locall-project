# 📚 LOCALL PROJECT - API DOCUMENTATION

## 🌟 Overview

This documentation covers all the advanced features and integrations implemented in the Locall project, including call routing, agency management, loyalty programs, webform tracking, and external integrations.

---

## 🔗 External Integrations

### Google Calendar Integration

#### **Sync Events**
```http
GET /api/integrations/google-calendar?workspaceId={id}&action=sync_events
```

**Parameters:**
- `workspaceId` (required): Workspace identifier
- `action` (optional): Action type (sync_events, list_calendars, get_event)
- `calendarId` (optional): Calendar ID (default: primary)
- `timeMin` (optional): Start time filter (ISO 8601)
- `timeMax` (optional): End time filter (ISO 8601)

**Response:**
```json
{
  "success": true,
  "events_synced": 25,
  "total_events": 30,
  "next_sync_token": "abc123..."
}
```

#### **Create Event**
```http
POST /api/integrations/google-calendar
```

**Request Body:**
```json
{
  "workspaceId": "workspace-123",
  "summary": "Client Meeting",
  "description": "Quarterly review meeting",
  "startDateTime": "2024-01-15T10:00:00Z",
  "endDateTime": "2024-01-15T11:00:00Z",
  "timeZone": "UTC",
  "attendees": ["client@example.com"],
  "location": "Conference Room A",
  "reminders": [
    { "method": "email", "minutes": 60 },
    { "method": "popup", "minutes": 15 }
  ]
}
```

#### **Update Event**
```http
PUT /api/integrations/google-calendar
```

#### **Delete Event**
```http
DELETE /api/integrations/google-calendar?workspaceId={id}&eventId={eventId}
```

---

### Calendly Integration

#### **Sync Events**
```http
GET /api/integrations/calendly?workspaceId={id}&action=sync_events
```

**Parameters:**
- `workspaceId` (required): Workspace identifier
- `action` (optional): sync_events, get_user, list_event_types, get_event, get_invitees
- `startTime` (optional): Filter events after this time
- `endTime` (optional): Filter events before this time
- `status` (optional): Event status filter

**Response:**
```json
{
  "success": true,
  "events_synced": 15,
  "total_events": 20,
  "pagination": {
    "next_page": "https://api.calendly.com/...",
    "count": 20
  }
}
```

#### **Get User Info**
```http
GET /api/integrations/calendly?workspaceId={id}&action=get_user
```

#### **List Event Types**
```http
GET /api/integrations/calendly?workspaceId={id}&action=list_event_types
```

#### **Create Webhook**
```http
POST /api/integrations/calendly
```

**Request Body:**
```json
{
  "workspaceId": "workspace-123",
  "action": "create_webhook",
  "url": "https://yourdomain.com/webhooks/calendly",
  "events": ["invitee.created", "invitee.canceled"],
  "organization": "https://api.calendly.com/organizations/123",
  "scope": "organization"
}
```

---

### HubSpot Integration

#### **Sync Data**
```http
GET /api/integrations/hubspot?workspaceId={id}&action=sync_all
```

**Actions:**
- `sync_contacts`: Sync contacts only
- `sync_deals`: Sync deals only
- `sync_all`: Sync both contacts and deals

#### **Create Contact**
```http
POST /api/integrations/hubspot
```

**Request Body:**
```json
{
  "workspaceId": "workspace-123",
  "action": "create_contact",
  "data": {
    "email": "contact@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "phone": "+1234567890",
    "company": "Example Corp"
  }
}
```

#### **Create Deal**
```http
POST /api/integrations/hubspot
```

**Request Body:**
```json
{
  "workspaceId": "workspace-123",
  "action": "create_deal",
  "data": {
    "dealname": "Q1 2024 Deal",
    "amount": 50000,
    "dealstage": "appointmentscheduled",
    "pipeline": "default"
  }
}
```

---

## 📞 Advanced Call Routing

### **Configure Routing**
```http
POST /api/routing/config
```

**Time-based Routing:**
```json
{
  "workspaceId": "workspace-123",
  "type": "time_based",
  "config": {
    "business_hours": {
      "monday": { "start": "09:00", "end": "17:00" },
      "tuesday": { "start": "09:00", "end": "17:00" }
    },
    "timezone": "America/New_York",
    "holidays": ["2024-01-01", "2024-12-25"]
  }
}
```

**Geographic Routing:**
```json
{
  "workspaceId": "workspace-123",
  "type": "geographic",
  "config": {
    "regions": [
      {
        "name": "North America",
        "countries": ["US", "CA"],
        "agents": ["agent1", "agent2"]
      },
      {
        "name": "Europe",
        "countries": ["GB", "FR", "DE"],
        "agents": ["agent3", "agent4"]
      }
    ]
  }
}
```

**Skills-based Routing:**
```json
{
  "workspaceId": "workspace-123",
  "type": "skills_based",
  "config": {
    "skills": [
      {
        "name": "Spanish",
        "agents": ["agent1", "agent3"],
        "priority": 1
      },
      {
        "name": "Technical Support",
        "agents": ["agent2", "agent4"],
        "priority": 2
      }
    ]
  }
}
```

### **Execute Routing**
```http
POST /api/routing/advanced
```

**Request Body:**
```json
{
  "workspaceId": "workspace-123",
  "callerId": "+1234567890",
  "callerLocation": {
    "country": "US",
    "state": "CA",
    "city": "San Francisco"
  },
  "requiredSkills": ["Spanish"],
  "priority": "high",
  "callbackNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "selectedAgent": {
    "id": "agent1",
    "name": "Maria Garcia",
    "skills": ["Spanish", "Sales"],
    "phone": "+1987654321"
  },
  "routingType": "skills_based",
  "waitTime": 0,
  "queuePosition": null
}
```

---

## 🏢 Agency/White-Label Management

### **Manage Clients**
```http
GET /api/agency/clients?workspaceId={id}
POST /api/agency/clients
PUT /api/agency/clients/{clientId}
DELETE /api/agency/clients/{clientId}
```

**Create Client:**
```json
{
  "workspaceId": "workspace-123",
  "name": "Client Corp",
  "email": "admin@clientcorp.com",
  "phone": "+1234567890",
  "plan": "business",
  "settings": {
    "call_limit": 1000,
    "storage_limit": "10GB"
  }
}
```

### **White-Label Configuration**
```http
PUT /api/white-label
```

**Request Body:**
```json
{
  "workspaceId": "workspace-123",
  "branding": {
    "company_name": "Your Agency",
    "logo_url": "https://yourdomain.com/logo.png",
    "primary_color": "#007bff",
    "secondary_color": "#6c757d",
    "domain": "agency.yourdomain.com",
    "email_domain": "youragency.com"
  },
  "features": {
    "custom_domain": true,
    "remove_branding": true,
    "custom_emails": true
  }
}
```

---

## 🎁 Loyalty & Referral System

### **Loyalty Programs**
```http
GET /api/loyalty?workspaceId={id}
POST /api/loyalty/programs
PUT /api/loyalty/programs/{programId}
DELETE /api/loyalty/programs/{programId}
```

**Create Program:**
```json
{
  "workspaceId": "workspace-123",
  "name": "Gold Rewards",
  "type": "points",
  "rules": {
    "points_per_call": 10,
    "points_per_referral": 100,
    "points_per_dollar": 1,
    "redemption_threshold": 500
  },
  "rewards": [
    {
      "name": "Free Month",
      "cost": 500,
      "type": "credit"
    }
  ]
}
```

### **Member Management**
```http
GET /api/loyalty/members?workspaceId={id}
POST /api/loyalty/members
PUT /api/loyalty/members/{memberId}
```

### **Referral Tracking**
```http
POST /api/referrals
```

**Request Body:**
```json
{
  "workspaceId": "workspace-123",
  "referrer_email": "referrer@example.com",
  "referee_email": "referee@example.com",
  "type": "email",
  "campaign": "spring-2024"
}
```

---

## 📝 Webform Tracking

### **Generate Tracking Script**
```http
GET /api/webforms/script/{trackingId}
```

**Response:** JavaScript tracking code

### **Submit Form Data**
```http
POST /api/webforms/submit
```

**Request Body:**
```json
{
  "tracking_id": "track-123",
  "form_data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "message": "Interested in your services"
  },
  "utm_params": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "q1-2024"
  },
  "page_url": "https://yoursite.com/contact",
  "visitor_id": "visitor-456"
}
```

### **Analytics**
```http
GET /api/webforms/analytics?workspaceId={id}
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "total_submissions": 150,
    "conversion_rate": 3.2,
    "top_sources": [
      { "source": "google", "submissions": 75 },
      { "source": "facebook", "submissions": 45 }
    ],
    "monthly_trend": [
      { "month": "2024-01", "submissions": 120 },
      { "month": "2024-02", "submissions": 150 }
    ]
  }
}
```

---

## 🔄 Queue Management

### **Queue Operations**
```http
GET /api/queue/management?workspaceId={id}
POST /api/queue/management
PUT /api/queue/management/{queueId}
DELETE /api/queue/management/{queueId}
```

**Create Queue:**
```json
{
  "workspaceId": "workspace-123",
  "name": "Sales Queue",
  "type": "sales",
  "priority": 1,
  "max_wait_time": 300,
  "max_queue_size": 50,
  "agents": ["agent1", "agent2"],
  "overflow_action": "voicemail",
  "business_hours": {
    "enabled": true,
    "timezone": "UTC"
  }
}
```

### **Queue Status**
```http
GET /api/queue/status?queueId={id}
```

**Response:**
```json
{
  "queue_id": "queue-123",
  "name": "Sales Queue",
  "current_size": 5,
  "average_wait_time": 45,
  "available_agents": 2,
  "busy_agents": 1,
  "longest_wait": 120
}
```

---

## 🔌 OAuth & Webhooks

### **OAuth Flow**
```http
POST /api/oauth/initiate
```

**Request Body:**
```json
{
  "provider": "google",
  "workspaceId": "workspace-123",
  "redirectUri": "https://yourdomain.com/oauth/callback",
  "scopes": ["calendar.readonly", "calendar.events"]
}
```

### **Webhook Endpoints**
- `POST /api/webhooks/integrations/hubspot`
- `POST /api/webhooks/integrations/google`
- `POST /api/webhooks/integrations/calendly`

**Webhook Verification:**
Each webhook endpoint includes signature verification for security.

---

## 📊 Analytics & Reporting

### **System Analytics**
```http
GET /api/analytics?workspaceId={id}&type={type}&period={period}
```

**Types:**
- `calls`: Call volume and performance
- `conversions`: Form and call conversions
- `integrations`: Integration sync status
- `loyalty`: Loyalty program performance

**Periods:**
- `day`, `week`, `month`, `quarter`, `year`

---

## 🚨 Error Handling

### **Standard Error Response**
```json
{
  "success": false,
  "error": "Detailed error message",
  "error_code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### **Common Error Codes**
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid API key or token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `RATE_LIMIT_ERROR`: Too many requests
- `INTEGRATION_ERROR`: External service error
- `INTERNAL_ERROR`: Server error

---

## 🔐 Authentication

### **API Key Authentication**
Include in headers:
```http
x-api-key: your-api-key-here
```

### **OAuth Bearer Token**
Include in headers:
```http
Authorization: Bearer your-oauth-token-here
```

---

## 📈 Rate Limits

- **Standard endpoints**: 100 requests/minute
- **Webhook endpoints**: 1000 requests/minute
- **Analytics endpoints**: 50 requests/minute
- **Integration sync**: 10 requests/minute

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

*API Version: v1.0*  
*Last Updated: [DATE]*
