export type WhatsAppApiProvider = 'meta_cloud' | 'gateway_rest' | 'url_direct';

export interface MetaCloudConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  templateName?: string;
}

export interface GatewayRestConfig {
  endpointUrl: string; // e.g., https://api.ultramsg.com/instanceXXXX/messages/chat or https://gate.whapi.cloud/messages/text
  apiKey: string;      // Token or API Key
  headerAuth?: boolean; // Send in Authorization: Bearer <token> or body { token: ... }
}

export interface WhatsAppApiConfig {
  enabled: boolean;
  provider: WhatsAppApiProvider;
  metaCloud: MetaCloudConfig;
  gatewayRest: GatewayRestConfig;
  autoSendOnAlarm: boolean;
  lastTestedAt?: number;
  lastStatus?: 'success' | 'failed' | 'idle';
  lastStatusMessage?: string;
}

export interface WhatsAppMessageLog {
  id: string;
  timestamp: number;
  recipientPhone: string;
  recipientName?: string;
  messageText: string;
  provider: WhatsAppApiProvider;
  status: 'sent' | 'failed';
  responseDetails?: string;
  alarmTask?: string;
}

export const DEFAULT_WHATSAPP_API_CONFIG: WhatsAppApiConfig = {
  enabled: false,
  provider: 'meta_cloud',
  metaCloud: {
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    templateName: '',
  },
  gatewayRest: {
    endpointUrl: '',
    apiKey: '',
    headerAuth: false,
  },
  autoSendOnAlarm: true,
  lastStatus: 'idle',
};
