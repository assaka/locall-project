/**
 * IVR Configuration Management
 * Centralized configuration for IVR behavior, business hours, and routing
 */

export interface BusinessHours {
  enabled: boolean;
  timezone: string;
  weekdays: {
    [key: string]: {
      enabled: boolean;
      open: string; // HH:MM format
      close: string; // HH:MM format
    };
  };
  holidays: string[]; // YYYY-MM-DD format
}

export interface IVRMenuOption {
  digit: string;
  action: 'transfer' | 'queue' | 'voicemail' | 'submenu' | 'appointment';
  destination?: string;
  message?: string;
  submenu_id?: string;
}

export interface IVRMenu {
  id: string;
  name: string;
  welcome_message: string;
  timeout_message?: string;
  invalid_message?: string;
  timeout_seconds: number;
  max_retries: number;
  options: IVRMenuOption[];
}

export interface IVRConfig {
  enabled: boolean;
  business_hours: BusinessHours;
  main_menu: IVRMenu;
  after_hours_menu: IVRMenu;
  voice_settings: {
    voice_name: string;
    language: string;
    speed: number;
  };
  transfer_numbers: {
    sales: string;
    support: string;
    billing: string;
    operator: string;
  };
  features: {
    voicemail_enabled: boolean;
    appointment_scheduling_enabled: boolean;
    call_recording_enabled: boolean;
    transcription_enabled: boolean;
  };
}

export const DEFAULT_IVR_CONFIG: IVRConfig = {
  enabled: true,
  business_hours: {
    enabled: true,
    timezone: 'America/New_York',
    weekdays: {
      monday: { enabled: true, open: '09:00', close: '17:00' },
      tuesday: { enabled: true, open: '09:00', close: '17:00' },
      wednesday: { enabled: true, open: '09:00', close: '17:00' },
      thursday: { enabled: true, open: '09:00', close: '17:00' },
      friday: { enabled: true, open: '09:00', close: '17:00' },
      saturday: { enabled: false, open: '10:00', close: '14:00' },
      sunday: { enabled: false, open: '12:00', close: '16:00' }
    },
    holidays: []
  },
  main_menu: {
    id: 'main',
    name: 'Main Menu',
    welcome_message: 'Thank you for calling. For sales, press 1. For support, press 2. For billing, press 3. To speak with an operator, press 0.',
    timeout_message: 'We didn\'t receive your selection. Please try again.',
    invalid_message: 'Invalid selection. Please try again.',
    timeout_seconds: 10,
    max_retries: 3,
    options: [
      {
        digit: '1',
        action: 'transfer',
        destination: process.env.SALES_PHONE || '+1234567890',
        message: 'Connecting you to sales. Please hold.'
      },
      {
        digit: '2', 
        action: 'transfer',
        destination: process.env.SUPPORT_PHONE || '+1234567891',
        message: 'Connecting you to support. Please hold.'
      },
      {
        digit: '3',
        action: 'transfer', 
        destination: process.env.BILLING_PHONE || '+1234567892',
        message: 'Connecting you to billing. Please hold.'
      },
      {
        digit: '0',
        action: 'transfer',
        destination: process.env.OPERATOR_PHONE || '+1234567893', 
        message: 'Connecting you to an operator. Please hold.'
      }
    ]
  },
  after_hours_menu: {
    id: 'after_hours',
    name: 'After Hours Menu',
    welcome_message: 'Thank you for calling. Our office is currently closed. If this is an emergency, please hang up and dial 911. To schedule an appointment, press 1. To leave a voicemail, press 2.',
    timeout_message: 'We didn\'t receive your selection. To schedule an appointment, press 1. To leave a voicemail, press 2.',
    invalid_message: 'Invalid selection. Press 1 to schedule an appointment or 2 to leave a voicemail.',
    timeout_seconds: 10,
    max_retries: 3,
    options: [
      {
        digit: '1',
        action: 'appointment',
        message: 'We will send you a text message with a link to schedule your appointment. Please ensure you have your phone nearby.'
      },
      {
        digit: '2',
        action: 'voicemail',
        message: 'Please leave your message after the beep. Press hash when you are finished.'
      }
    ]
  },
  voice_settings: {
    voice_name: 'Amy',
    language: 'en-US',
    speed: 1.0
  },
  transfer_numbers: {
    sales: process.env.SALES_PHONE || '+1234567890',
    support: process.env.SUPPORT_PHONE || '+1234567891', 
    billing: process.env.BILLING_PHONE || '+1234567892',
    operator: process.env.OPERATOR_PHONE || '+1234567893'
  },
  features: {
    voicemail_enabled: true,
    appointment_scheduling_enabled: true,
    call_recording_enabled: true,
    transcription_enabled: false
  }
};

/**
 * Check if current time is within business hours
 */
export function isWithinBusinessHours(config: IVRConfig, timezone?: string): boolean {
  if (!config.business_hours.enabled) {
    return true; // Always open if business hours are disabled
  }

  const now = new Date();
  const tz = timezone || config.business_hours.timezone;
  
  // Get current time in business timezone
  const businessTime = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const dayOfWeek = businessTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[dayOfWeek];
  
  const dayConfig = config.business_hours.weekdays[currentDay];
  if (!dayConfig || !dayConfig.enabled) {
    return false; // Day is not enabled for business
  }

  // Check if today is a holiday
  const today = businessTime.toISOString().split('T')[0]; // YYYY-MM-DD
  if (config.business_hours.holidays.includes(today)) {
    return false;
  }

  // Check time range
  const currentTime = businessTime.getHours() * 100 + businessTime.getMinutes();
  const openTime = parseInt(dayConfig.open.replace(':', ''));
  const closeTime = parseInt(dayConfig.close.replace(':', ''));

  return currentTime >= openTime && currentTime < closeTime;
}

/**
 * Get the appropriate menu based on business hours
 */
export function getCurrentMenu(config: IVRConfig): IVRMenu {
  return isWithinBusinessHours(config) ? config.main_menu : config.after_hours_menu;
}

/**
 * Generate NCCO for menu presentation
 */
export function generateMenuNCCO(menu: IVRMenu, config: IVRConfig): any[] {
  return [
    {
      action: 'talk',
      text: menu.welcome_message,
      voiceName: config.voice_settings.voice_name,
      language: config.voice_settings.language
    },
    {
      action: 'input',
      timeOut: menu.timeout_seconds,
      maxDigits: 1,
      submitOnHash: false,
      eventUrl: [`${process.env.BASE_URL || 'http://localhost:3000'}/api/ivr/webhook`],
      eventMethod: 'POST'
    }
  ];
}

/**
 * Generate NCCO for menu option handling
 */
export function generateOptionNCCO(option: IVRMenuOption, config: IVRConfig): any[] {
  const voice = config.voice_settings;

  switch (option.action) {
    case 'transfer':
      return [
        {
          action: 'talk',
          text: option.message || 'Please hold while we connect you.',
          voiceName: voice.voice_name,
          language: voice.language
        },
        {
          action: 'connect',
          endpoint: [
            {
              type: 'phone',
              number: option.destination
            }
          ],
          eventUrl: [`${process.env.BASE_URL || 'http://localhost:3000'}/api/ivr/transfer`],
          eventMethod: 'POST'
        }
      ];

    case 'appointment':
      return [
        {
          action: 'talk',
          text: option.message || 'We will send you a text message with appointment scheduling information.',
          voiceName: voice.voice_name,
          language: voice.language
        }
      ];

    case 'voicemail':
      return [
        {
          action: 'talk',
          text: option.message || 'Please leave your message after the beep.',
          voiceName: voice.voice_name,
          language: voice.language
        },
        {
          action: 'record',
          format: 'mp3',
          endOnSilence: 3,
          endOnKey: '#',
          timeOut: 120,
          beepStart: true,
          eventUrl: [`${process.env.BASE_URL || 'http://localhost:3000'}/api/ivr/recording`],
          eventMethod: 'POST'
        },
        {
          action: 'talk',
          text: 'Thank you for your message. We will get back to you soon. Goodbye.',
          voiceName: voice.voice_name,
          language: voice.language
        }
      ];

    case 'queue':
      return [
        {
          action: 'talk',
          text: option.message || 'You are being added to the queue. Please hold.',
          voiceName: voice.voice_name,
          language: voice.language
        }
        // Queue implementation would go here
      ];

    default:
      return [
        {
          action: 'talk',
          text: 'Invalid selection. Please try again.',
          voiceName: voice.voice_name,
          language: voice.language
        }
      ];
  }
}

/**
 * Generate invalid input NCCO
 */
export function generateInvalidInputNCCO(menu: IVRMenu, config: IVRConfig): any[] {
  return [
    {
      action: 'talk',
      text: menu.invalid_message || 'Invalid selection. Please try again.',
      voiceName: config.voice_settings.voice_name,
      language: config.voice_settings.language
    },
    {
      action: 'input',
      timeOut: menu.timeout_seconds,
      maxDigits: 1,
      submitOnHash: false,
      eventUrl: [`${process.env.BASE_URL || 'http://localhost:3000'}/api/ivr/webhook`],
      eventMethod: 'POST'
    }
  ];
}

export default {
  DEFAULT_IVR_CONFIG,
  isWithinBusinessHours,
  getCurrentMenu,
  generateMenuNCCO,
  generateOptionNCCO,
  generateInvalidInputNCCO
};
