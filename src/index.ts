import CryptoJS from 'crypto-js';

// Types
export interface EasySewaConfig {
  secret: string;
  product_code: string;
  environment: 'production' | 'development';
  success_url: string;
  failure_url: string;
}

export interface PayOptions {
  amount: number;
  transaction_uuid: string;
  tax_amount?: number;
  product_service_charge?: number;
  product_delivery_charge?: number;
}

export interface VerificationResult {
  isValid: boolean;
  transactionCode: string;
  status: string;
  totalAmount: number;
  transactionUuid: string;
}

export interface StatusResult {
  status: string;
  totalAmount: number;
  transactionUuid: string;
  refId: string;
}

// Constants
const ESEWA_URLS = {
  production: 'https://epay.esewa.com.np/api/epay/main/v2/form',
  development: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
};

const STATUS_URLS = {
  production: 'https://epay.esewa.com.np/api/epay/transaction/status/',
  development: 'https://rc-epay.esewa.com.np/api/epay/transaction/status/'
};

/**
 * Simple eSewa payment integration class
 */
export class EasySewa {
  private config: EasySewaConfig;

  constructor(config: EasySewaConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  /**
   * Generate payment form HTML
   */
  generatePaymentForm(options: PayOptions): string {
    this.validatePayOptions(options);
    
    const totalAmount = this.calculateTotal(options);
    const signature = this.createSignature(totalAmount, options.transaction_uuid);
    
    return this.buildForm({
      amount: options.amount,
      total_amount: totalAmount,
      transaction_uuid: options.transaction_uuid,
      product_code: this.config.product_code,
      success_url: this.config.success_url,
      failure_url: this.config.failure_url,
      signature,
      ...this.getOptionalFields(options)
    });
  }

  /**
   * Verify payment response from eSewa
   */
  verifyPayment(response: any): VerificationResult {
    this.validateResponse(response);
    
    if (!this.verifySignature(response)) {
      throw new Error('Invalid signature');
    }

    return {
      isValid: true,
      transactionCode: response.transaction_code,
      status: response.status,
      totalAmount: parseFloat(response.total_amount),
      transactionUuid: response.transaction_uuid
    };
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(transactionUuid: string, amount: number): Promise<StatusResult> {
    if (!transactionUuid || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid transaction UUID or amount');
    }

    const url = `${STATUS_URLS[this.config.environment]}?product_code=${this.config.product_code}&transaction_uuid=${transactionUuid}&total_amount=${amount}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.transaction_uuid !== transactionUuid || parseFloat(data.total_amount) !== amount) {
        throw new Error('Transaction data mismatch');
      }

      return {
        status: data.status,
        totalAmount: parseFloat(data.total_amount),
        transactionUuid: data.transaction_uuid,
        refId: data.ref_id
      };
    } catch (error) {
      throw new Error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private methods
  private validateConfig(config: EasySewaConfig): void {
    if (!config.secret || typeof config.secret !== 'string') {
      throw new Error('Secret is required and must be a string');
    }
    if (!config.product_code || typeof config.product_code !== 'string') {
      throw new Error('Product code is required and must be a string');
    }
    if (!['production', 'development'].includes(config.environment)) {
      throw new Error('Environment must be "production" or "development"');
    }
    if (!this.isValidUrl(config.success_url)) {
      throw new Error('Success URL must be a valid URL');
    }
    if (!this.isValidUrl(config.failure_url)) {
      throw new Error('Failure URL must be a valid URL');
    }
  }

  private validatePayOptions(options: PayOptions): void {
    if (typeof options.amount !== 'number' || options.amount <= 0) {
      throw new Error('Amount must be a positive number');
    }
    if (!options.transaction_uuid || typeof options.transaction_uuid !== 'string') {
      throw new Error('Transaction UUID is required and must be a string');
    }
    if (!/^[a-zA-Z0-9-]+$/.test(options.transaction_uuid)) {
      throw new Error('Transaction UUID can only contain letters, numbers, and hyphens');
    }
    if (options.tax_amount !== undefined && (typeof options.tax_amount !== 'number' || options.tax_amount < 0)) {
      throw new Error('Tax amount must be a non-negative number');
    }
    if (options.product_service_charge !== undefined && (typeof options.product_service_charge !== 'number' || options.product_service_charge < 0)) {
      throw new Error('Product service charge must be a non-negative number');
    }
    if (options.product_delivery_charge !== undefined && (typeof options.product_delivery_charge !== 'number' || options.product_delivery_charge < 0)) {
      throw new Error('Product delivery charge must be a non-negative number');
    }
  }

  private validateResponse(response: any): void {
    const required = ['transaction_code', 'status', 'total_amount', 'transaction_uuid', 'product_code', 'signed_field_names', 'signature'];
    for (const field of required) {
      if (!response[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  private calculateTotal(options: PayOptions): number {
    return options.amount + 
           (options.tax_amount || 0) + 
           (options.product_service_charge || 0) + 
           (options.product_delivery_charge || 0);
  }

  private createSignature(totalAmount: number, transactionUuid: string): string {
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${this.config.product_code}`;
    const hmac = CryptoJS.HmacSHA256(message, this.config.secret);
    return CryptoJS.enc.Base64.stringify(hmac);
  }

  private verifySignature(response: any): boolean {
    const fields = response.signed_field_names.split(',');
    const message = fields.map((field: string) => `${field}=${response[field]}`).join(',');
    const expectedSignature = this.createSignatureFromMessage(message);
    return response.signature === expectedSignature;
  }

  private createSignatureFromMessage(message: string): string {
    const hmac = CryptoJS.HmacSHA256(message, this.config.secret);
    return CryptoJS.enc.Base64.stringify(hmac);
  }

  private getOptionalFields(options: PayOptions): Record<string, number> {
    const fields: Record<string, number> = {};
    if (options.tax_amount && options.tax_amount > 0) {
      fields.tax_amount = options.tax_amount;
    }
    if (options.product_service_charge && options.product_service_charge > 0) {
      fields.product_service_charge = options.product_service_charge;
    }
    if (options.product_delivery_charge && options.product_delivery_charge > 0) {
      fields.product_delivery_charge = options.product_delivery_charge;
    }
    return fields;
  }

  private buildForm(data: Record<string, any>): string {
    const url = ESEWA_URLS[this.config.environment];
    const fields = Object.entries(data)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${this.escapeHtml(String(value))}">`)
      .join('\n    ');

    return `<form method="POST" action="${url}">
    ${fields}
    <input type="submit" value="Pay with eSewa">
</form>`;
  }

  private escapeHtml(text: string): string {
    // Use simple replacement since we're likely in Node.js
    return text.replace(/[&<>"']/g, (match) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[match];
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
