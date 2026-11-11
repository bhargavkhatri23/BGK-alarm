import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  HelpCircle,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { whatsappApiService } from '../utils/whatsappApiService';
import { WhatsAppApiConfig, WhatsAppApiProvider, WhatsAppMessageLog } from '../types/whatsappApi';

interface WhatsAppApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHindi: boolean;
}

export const WhatsAppApiSettingsModal: React.FC<WhatsAppApiSettingsModalProps> = ({
  isOpen,
  onClose,
  isHindi,
}) => {
  const [config, setConfig] = useState<WhatsAppApiConfig>(whatsappApiService.getConfig());
  const [activeTab, setActiveTab] = useState<'config' | 'test' | 'logs' | 'guide'>('config');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('BGK स्मार्ट अलार्म: WhatsApp API ऑटोमेशन टेस्ट सफल! यह संदेश बिना किसी मैन्युअल हस्तक्षेप के स्वतः भेजा गया है।');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rawResponse?: any } | null>(null);
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentConfig = whatsappApiService.loadConfig();
      setConfig(currentConfig);
      setLogs(whatsappApiService.getMessageLogs());
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    await whatsappApiService.saveConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      setTestResult({
        success: false,
        message: isHindi ? 'कृपया एक मान्य 10-अंकीय फोन नंबर दर्ज करें।' : 'Please enter a valid phone number.',
      });
      return;
    }

    // Save current config first so test uses current form values
    await whatsappApiService.saveConfig(config);

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await whatsappApiService.testConnection(testPhone.trim(), testMessage.trim());
      setTestResult(res);
      setLogs(whatsappApiService.getMessageLogs());
      setConfig(whatsappApiService.getConfig());
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = () => {
    whatsappApiService.clearLogs();
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border-2 border-blue-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-blue-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              {/* WhatsApp Brand Icon in Royal Blue Theme */}
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16ZM16.56 14.39C16.31 14.27 15.09 13.67 14.86 13.58C14.64 13.5 14.47 13.46 14.31 13.71C14.15 13.95 13.68 14.51 13.53 14.67C13.39 14.83 13.25 14.86 13 14.73C12.75 14.61 11.95 14.35 11 13.5C10.26 12.84 9.76 12.03 9.61 11.78C9.47 11.54 9.6 11.4 9.72 11.28C9.83 11.17 9.97 10.99 10.09 10.85C10.21 10.71 10.25 10.61 10.33 10.45C10.41 10.28 10.37 10.14 10.31 10.02C10.25 9.9 9.76 8.7 9.56 8.2C9.36 7.72 9.16 7.78 9.01 7.77H8.54C8.38 7.77 8.11 7.83 7.89 8.07C7.66 8.32 7.02 8.92 7.02 10.14C7.02 11.36 7.91 12.54 8.03 12.7C8.16 12.86 9.78 15.36 12.26 16.43C12.85 16.69 13.31 16.84 13.67 16.95C14.26 17.14 14.8 17.11 15.22 17.05C15.7 16.98 16.68 16.45 16.89 15.88C17.09 15.31 17.09 14.82 17.03 14.72C16.97 14.61 16.81 14.52 16.56 14.39Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-2">
                <span>{isHindi ? 'WhatsApp API ऑटोमेशन' : 'WhatsApp API Automation'}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  config.enabled 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {config.enabled ? (isHindi ? 'API सक्रिय' : 'ACTIVE') : (isHindi ? 'बंद' : 'DISABLED')}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isHindi
                  ? 'अलार्म बजते ही बिना किसी बटन दबाए स्वतः WhatsApp संदेश भेजें (जैसे Sky GST)'
                  : 'Automated 100% silent WhatsApp messaging on alarm trigger'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isHindi ? 'API क्रेडेंशियल्स' : 'API Configuration'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'test'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isHindi ? 'लाइव टेस्ट कंसोल' : 'Live Test'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isHindi ? 'मैसेज लॉग्स' : 'Logs'} ({logs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isHindi ? 'Sky GST गाइड' : 'API Guide'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* TAB 1: API CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              
              {/* Master Automation Switch */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{isHindi ? 'अलार्म बजते ही ऑटोमैटिक WhatsApp भेजें' : 'Auto-Send WhatsApp on Alarm'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHindi 
                      ? 'बिना स्क्रीन पर सेंड बटन दबाए सीधे बैकग्राउंड से संदेश डिलीवर होगा।' 
                      : 'Sends message silently in background without manual intervention.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    config.enabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                    config.enabled ? 'left-6.5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {isHindi ? '1. API प्रदाता चुनें (Select API Provider)' : '1. Select API Provider'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Meta Cloud API */}
                  <div
                    onClick={() => setConfig({ ...config, provider: 'meta_cloud' })}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      config.provider === 'meta_cloud'
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-900">
                        Meta WhatsApp Cloud API
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                        Official (Sky GST Style)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isHindi 
                        ? 'developers.facebook.com का आधिकारिक API. Phone ID और Token की आवश्यकता है।' 
                        : 'Official Cloud API via Facebook Developers. Free tier included.'}
                    </p>
                  </div>

                  {/* Gateway REST API (UltraMsg / Whapi) */}
                  <div
                    onClick={() => setConfig({ ...config, provider: 'gateway_rest' })}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      config.provider === 'gateway_rest'
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-900">
                        WhatsApp QR Gateway (UltraMsg / Whapi)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        Easy Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isHindi 
                        ? 'अपने नंबर का QR कोड स्कैन करके सीधा REST API कनेक्ट करें। किसी अप्रूवल की आवश्यकता नहीं।' 
                        : 'QR-code based personal gateway. Quick 2-minute setup.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields for Meta Cloud API */}
              {config.provider === 'meta_cloud' && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b pb-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Meta Cloud API Credentials</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.metaCloud.phoneNumberId}
                      onChange={(e) => setConfig({
                        ...config,
                        metaCloud: { ...config.metaCloud, phoneNumberId: e.target.value }
                      })}
                      placeholder="e.g. 102938475612345"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Facebook Developers &gt; WhatsApp &gt; API Setup &gt; Phone number ID
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Access Token (Bearer Token) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={config.metaCloud.accessToken}
                      onChange={(e) => setConfig({
                        ...config,
                        metaCloud: { ...config.metaCloud, accessToken: e.target.value }
                      })}
                      placeholder="e.g. EAAG..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Temporary Access Token या System User Permanent Token
                    </span>
                  </div>
                </div>
              )}

              {/* Form Fields for Gateway REST API */}
              {config.provider === 'gateway_rest' && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b pb-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>REST Gateway Endpoint & Token</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API Instance URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={config.gatewayRest.endpointUrl}
                      onChange={(e) => setConfig({
                        ...config,
                        gatewayRest: { ...config.gatewayRest, endpointUrl: e.target.value }
                      })}
                      placeholder="https://api.ultramsg.com/instance12345/messages/chat"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      UltraMsg, Whapi, Wassenger या आपके कस्टम वेबहुक का URL
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API Token / Secret Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={config.gatewayRest.apiKey}
                      onChange={(e) => setConfig({
                        ...config,
                        gatewayRest: { ...config.gatewayRest, apiKey: e.target.value }
                      })}
                      placeholder="e.g. v2c3d4e5f6g7h8..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      {isHindi ? 'सेटिंग्स सफलतापूर्वक सेव की गईं!' : 'Settings saved successfully!'}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isHindi ? 'सेटिंग्स सेव करें' : 'Save API Settings'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE TEST CONSOLE */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {isHindi ? 'लाइव टेस्ट कंसोल' : 'Live Test Console'}
                  </p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    {isHindi 
                      ? 'यहाँ अपना फोन नंबर डालकर टेस्ट करें कि आपकी API बिना किसी ऐप को खोले सीधे मैसेज डिलीवर कर पा रही है या नहीं।'
                      : 'Send a test WhatsApp message to verify that your API key and endpoint are working.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleRunTest} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHindi ? 'टेस्ट फोन नंबर (10 अंक)' : 'Test Phone Number'}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-mono font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHindi ? 'टेस्ट संदेश' : 'Test Message'}
                  </label>
                  <textarea
                    rows={3}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isTesting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isHindi ? 'संदेश भेजा जा रहा है...' : 'Sending Test Message...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isHindi ? '🚀 लाइव टेस्ट मैसेज भेजें' : 'Send Test Message'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Test Result Banner */}
              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{testResult.success ? (isHindi ? 'सफल! मैसेज चला गया' : 'Success!') : (isHindi ? 'विफल' : 'Failed')}</span>
                  </div>
                  <p className="font-mono text-[11px] break-all">{testResult.message}</p>
                  
                  {testResult.rawResponse && (
                    <details className="mt-2 text-[10px] font-mono text-slate-600 bg-white/70 p-2 rounded-lg">
                      <summary className="cursor-pointer font-bold text-slate-700">Raw API Server Response</summary>
                      <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(testResult.rawResponse, null, 2)}</pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MESSAGE LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {isHindi ? 'हाल ही में भेजे गए संदेश (Recent Dispatches)' : 'Recent Outbound Messages'}
                </span>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="text-[11px] text-rose-600 hover:text-rose-700 cursor-pointer font-semibold"
                  >
                    {isHindi ? 'लॉग्स साफ़ करें' : 'Clear Logs'}
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-dashed rounded-2xl">
                  {isHindi ? 'कोई संदेश रिकॉर्ड नहीं है। टेस्ट कंसोल से मैसेज भेजें।' : 'No messages sent yet.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            log.status === 'sent' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {log.status === 'sent' ? 'SENT' : 'FAILED'}
                          </span>
                          <span className="font-bold font-mono text-slate-900">
                            +{log.recipientPhone}
                          </span>
                          {log.recipientName && (
                            <span className="text-slate-500">({log.recipientName})</span>
                          )}
                        </div>
                        <p className="text-slate-700 text-xs italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          "{log.messageText}"
                        </p>
                        {log.responseDetails && (
                          <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                            {log.responseDetails}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SKY GST & WHATSAPP API GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
                <h4 className="font-bold text-blue-900 text-sm mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Sky GST जैसा ऑटोमेशन कैसे काम करता है?</span>
                </h4>
                <p className="text-blue-800 text-xs">
                  जैसे CA ऑफिस का <strong>Sky GST</strong> सॉफ्टवेयर GSTN के सर्वर से सीधे API द्वारा रिटर्न फाइल करता है, 
                  वैसे ही यह ऐप Meta या Gateway API के ज़रिए आपके अलार्म ट्रिगर होते ही 
                  <strong> बिना आपका फोन छुए या WhatsApp खोले</strong> सीधे संदेश डिलीवर करता है!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  दो आसान तरीके (Choose any option):
                </h4>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-blue-600 flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>तरीका 1: UltraMsg / Whapi QR गेटवे (2 मिनट में चालू, बिना किसी अप्रूवल के)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    1. <a href="https://ultramsg.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">ultramsg.com</a> या <a href="https://whapi.cloud" target="_blank" rel="noreferrer" className="text-blue-600 underline">whapi.cloud</a> पर जाएं।<br/>
                    2. स्क्रीन पर आने वाले QR कोड को अपने मोबाइल के WhatsApp (Linked Devices) से स्कैन करें।<br/>
                    3. मिलने वाले <strong>Instance URL</strong> और <strong>Token</strong> को यहाँ पेस्ट करें — बस, आपका खुद का WhatsApp नंबर पूरी तरह ऑटोमेट हो गया!
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <div className="font-bold text-blue-600 flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>तरीका 2: Meta WhatsApp Cloud API (आधिकारिक Enterprise API)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    1. <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">developers.facebook.com</a> पर लॉगिन करें।<br/>
                    2. <strong>WhatsApp Cloud API</strong> सेटअप करें। वहाँ से अपना <strong>Phone Number ID</strong> और <strong>Access Token</strong> कॉपी करके यहाँ पेस्ट करें।
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            BGK API Engine v2.0 • 100% Background Automation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
