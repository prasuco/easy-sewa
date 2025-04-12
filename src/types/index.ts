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
  product_delivery_charge?: string
  product_service_charge?: string
  tax_amount?: string
}


export interface FormData {
  [key: string]: string | number;
}