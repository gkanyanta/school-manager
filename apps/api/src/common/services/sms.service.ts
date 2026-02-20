import { Injectable, Logger } from '@nestjs/common';

export interface SmsMessage {
  to: string;
  message: string;
  schoolId: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<SmsResult>;
}

class MockSmsProvider implements SmsProvider {
  private logger = new Logger('MockSmsProvider');

  async send(message: SmsMessage): Promise<SmsResult> {
    this.logger.log(`[MOCK SMS] To: ${message.to} | Message: ${message.message}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }
}

@Injectable()
export class SmsService {
  private provider: SmsProvider;

  constructor() {
    // In the future, switch based on env var to a real provider
    this.provider = new MockSmsProvider();
  }

  async send(message: SmsMessage): Promise<SmsResult> {
    return this.provider.send(message);
  }

  async sendBulk(messages: SmsMessage[]): Promise<SmsResult[]> {
    return Promise.all(messages.map((m) => this.provider.send(m)));
  }
}
