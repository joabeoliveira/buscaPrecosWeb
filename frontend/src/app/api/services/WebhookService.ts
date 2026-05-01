import axios from 'axios';

export class WebhookService {
  private n8nUrl: string;

  constructor() {
    this.n8nUrl = process.env.N8N_WEBHOOK_URL || '';
  }

  async notify(alertType: string, payload: any): Promise<void> {
    if (!this.n8nUrl) {
      console.log(`[WebhookService] N8N_WEBHOOK_URL not configured. Skipped sending alert: ${alertType}`);
      return;
    }

    try {
      await axios.post(this.n8nUrl, {
        event: alertType,
        timestamp: new Date().toISOString(),
        data: payload
      }, { timeout: 5000 });
      console.log(`[WebhookService] Successfully notified n8n for event: ${alertType}`);
    } catch (err: any) {
      console.error(`[WebhookService] Failed to notify n8n for event ${alertType}:`, err.message);
    }
  }
}
