import { WhatsAppApiConfig, DEFAULT_WHATSAPP_API_CONFIG, WhatsAppMessageLog } from '../types/whatsappApi';
import { nativeAlarmService } from './nativeAlarm';

const STORAGE_KEY_CONFIG = 'bgk_wa_api_config';
const STORAGE_KEY_LOGS = 'bgk_wa_api_logs';

class WhatsAppApiService {
  private config: WhatsAppApiConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public getConfig(): WhatsAppApiConfig {
    return { ...this.config };
  }

  public loadConfig(): WhatsAppApiConfig {
    if (typeof window === 'undefined') return DEFAULT_WHATSAPP_API_CONFIG;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (stored) {
        return { ...DEFAULT_WHATSAPP_API_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load WhatsApp API config from localStorage', e);
    }
    return { ...DEFAULT_WHATSAPP_API_CONFIG };
  }

  public async saveConfig(newConfig: WhatsAppApiConfig): Promise<void> {
    this.config = { ...newConfig };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      } catch (e) {
        console.warn('Failed to write WhatsApp API config to localStorage', e);
      }
    }

    // Sync to Android Native Plugin if available
    try {
      await (nativeAlarmService as any).syncWhatsAppApiConfig?.(this.config);
    } catch (e) {
      // Ignored
    }
  }

  public formatPhoneNumber(rawNumber: string): string {
    let clean = rawNumber.replace(/[^0-9]/g, '');
    // If 10 digits (India standard), prefix with 91
    if (clean.length === 10) {
      clean = '91' + clean;
    }
    return clean;
  }

  /**
   * Sends an automated WhatsApp message through the configured API (Meta Cloud API or Gateway)
   */
  public async sendAutomatedWhatsAppMessage(options: {
    phoneNumber: string;
    message: string;
    recipientName?: string;
    alarmTask?: string;
  }): Promise<{
    success: boolean;
    provider: string;
    messageId?: string;
    error?: string;
    rawResponse?: any;
  }> {
    const { phoneNumber, message, recipientName, alarmTask } = options;
    const cleanPhone = this.formatPhoneNumber(phoneNumber);

    if (!cleanPhone) {
      return { success: false, provider: 'none', error: 'फोन नंबर अमान्य है (Invalid Phone Number)' };
    }

    if (!message || !message.trim()) {
      return { success: false, provider: 'none', error: 'संदेश खाली है (Empty Message)' };
    }

    // If API is disabled or set to url_direct, fallback
    if (!this.config.enabled || this.config.provider === 'url_direct') {
      return {
        success: false,
        provider: 'url_direct',
        error: 'WhatsApp API सक्रिय नहीं है। डिफ़ॉल्ट WhatsApp ऐप लिंक का उपयोग किया जाएगा।',
      };
    }

    // 1. Meta WhatsApp Cloud API (Official Enterprise API)
    if (this.config.provider === 'meta_cloud') {
      const { phoneNumberId, accessToken } = this.config.metaCloud;

      if (!phoneNumberId || !accessToken) {
        return {
          success: false,
          provider: 'meta_cloud',
          error: 'Meta WhatsApp Cloud API के लिए Phone Number ID और Access Token आवश्यक है।',
        };
      }

      try {
        const url = `https://graph.facebook.com/v19.0/${phoneNumberId.trim()}/messages`;
        const payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message.trim(),
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.messages && data.messages.length > 0) {
          const messageId = data.messages[0].id;
          this.logMessage({
            recipientPhone: cleanPhone,
            recipientName,
            messageText: message,
            provider: 'meta_cloud',
            status: 'sent',
            responseDetails: `Meta ID: ${messageId}`,
            alarmTask,
          });

          return {
            success: true,
            provider: 'meta_cloud',
            messageId,
            rawResponse: data,
          };
        } else {
          const errorMsg = data.error?.message || response.statusText || 'Meta API request failed';
          this.logMessage({
            recipientPhone: cleanPhone,
            recipientName,
            messageText: message,
            provider: 'meta_cloud',
            status: 'failed',
            responseDetails: errorMsg,
            alarmTask,
          });

          return {
            success: false,
            provider: 'meta_cloud',
            error: errorMsg,
            rawResponse: data,
          };
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'Network error during Meta WhatsApp API call';
        return {
          success: false,
          provider: 'meta_cloud',
          error: errorMsg,
        };
      }
    }

    // 2. Gateway REST API (UltraMsg, Whapi, Custom Webhook)
    if (this.config.provider === 'gateway_rest') {
      const { endpointUrl, apiKey, headerAuth } = this.config.gatewayRest;

      if (!endpointUrl) {
        return {
          success: false,
          provider: 'gateway_rest',
          error: 'Gateway Endpoint URL आवश्यक है (e.g. UltraMsg/Whapi instance URL)',
        };
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (headerAuth && apiKey) {
          headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        }

        const payload: Record<string, any> = {
          to: cleanPhone,
          body: message.trim(),
          message: message.trim(),
        };

        if (!headerAuth && apiKey) {
          payload['token'] = apiKey.trim();
          payload['token_key'] = apiKey.trim();
        }

        const response = await fetch(endpointUrl.trim(), {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        let data: any = {};
        try {
          data = await response.json();
        } catch {
          data = { text: await response.text() };
        }

        if (response.ok) {
          const messageId = data.id || data.message_id || data.sent || 'ok';
          this.logMessage({
            recipientPhone: cleanPhone,
            recipientName,
            messageText: message,
            provider: 'gateway_rest',
            status: 'sent',
            responseDetails: JSON.stringify(data).slice(0, 150),
            alarmTask,
          });

          return {
            success: true,
            provider: 'gateway_rest',
            messageId: String(messageId),
            rawResponse: data,
          };
        } else {
          const errorMsg = data.error || data.message || response.statusText || 'Gateway request failed';
          this.logMessage({
            recipientPhone: cleanPhone,
            recipientName,
            messageText: message,
            provider: 'gateway_rest',
            status: 'failed',
            responseDetails: errorMsg,
            alarmTask,
          });

          return {
            success: false,
            provider: 'gateway_rest',
            error: errorMsg,
            rawResponse: data,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          provider: 'gateway_rest',
          error: err?.message || 'Gateway network error',
        };
      }
    }

    return { success: false, provider: 'none', error: 'अज्ञात API प्रदाता' };
  }

  /**
   * Tests the connection with a live message
   */
  public async testConnection(testPhoneNumber: string, testMessage?: string): Promise<{
    success: boolean;
    message: string;
    rawResponse?: any;
  }> {
    const msg = testMessage || 'BGK स्मार्ट अलार्म: WhatsApp API ऑटोमेशन टेस्ट सफल! यह संदेश बिना किसी मैन्युअल हस्तक्षेप के भेजा गया है।';
    const result = await this.sendAutomatedWhatsAppMessage({
      phoneNumber: testPhoneNumber,
      message: msg,
      recipientName: 'Test Recipient',
      alarmTask: 'API Connection Verification',
    });

    const updatedConfig = { ...this.config };
    updatedConfig.lastTestedAt = Date.now();
    updatedConfig.lastStatus = result.success ? 'success' : 'failed';
    updatedConfig.lastStatusMessage = result.success
      ? `सफल! Message ID: ${result.messageId || 'OK'}`
      : `विफल: ${result.error || 'Unknown error'}`;

    await this.saveConfig(updatedConfig);

    return {
      success: result.success,
      message: updatedConfig.lastStatusMessage,
      rawResponse: result.rawResponse,
    };
  }

  public getMessageLogs(): WhatsAppMessageLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [];
  }

  public clearLogs(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_LOGS);
    }
  }

  private logMessage(log: Omit<WhatsAppMessageLog, 'id' | 'timestamp'>): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getMessageLogs();
      const newEntry: WhatsAppMessageLog = {
        ...log,
        id: 'walog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now(),
      };
      const updated = [newEntry, ...current].slice(0, 30); // keep last 30 logs
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
    } catch {}
  }
}

export const whatsappApiService = new WhatsAppApiService();
