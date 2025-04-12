import CryptoJS from 'crypto-js';
import { EasySewaConfig, FormData, PayOptions } from './types';

export class EasySewa {
  private secret: string;
  private product_code: string;
  private environment: 'production' | 'development';
  private success_url: string;
  private failure_url: string;

  private urls = {
    production: 'https://epay.esewa.com.np/api/epay/main/v2/form',
    development: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  };

  constructor(config: EasySewaConfig) {
    this.secret = config.secret;
    this.product_code = config.product_code;
    this.environment = config.environment;
    this.success_url = config.success_url;
    this.failure_url = config.failure_url;
  }

  // Helper method to create signature
  private createSignature(message: string): string {
    const hmac = CryptoJS.HmacSHA256(message, this.secret);
    return CryptoJS.enc.Base64.stringify(hmac);
  }

  // Method to initiate payment with parameters
  public pay(options: PayOptions): void {
    const {
      amount,
      transaction_uuid,
      product_delivery_charge,
      product_service_charge,
      tax_amount,
    } = options;


    const signatureMessage = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${this.product_code}`;
    const signature = this.createSignature(signatureMessage);

    // Prepare form data
    const formData: FormData = {
      amount: amount,
      failure_url: this.failure_url,
      product_delivery_charge: product_delivery_charge ?? 0,
      product_service_charge: product_service_charge ?? 0,
      tax_amount: tax_amount ?? '0',
      product_code: this.product_code,
      signature: signature,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      success_url: this.success_url,
      total_amount: amount + (tax_amount ?? 0),
      transaction_uuid: transaction_uuid,
    };

    const formActionPostURL =
      this.environment === 'production'
        ? this.urls.production
        : this.urls.development;

    // Create the form with required fields.
    const form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', formActionPostURL);

    // Add form fields as hidden inputs
    for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', key);
        hiddenField.setAttribute('value', formData[key].toString());
        form.appendChild(hiddenField);
      }
    }

    // Append form to body and submit
    document.body.appendChild(form);
    form.submit();
  }
}
