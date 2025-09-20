# Easy eSewa

A simple and lightweight TypeScript/JavaScript library for integrating eSewa payments in web applications.

## Installation

```bash
npm install @prasuco/easy-sewa 
```

## Quick Start

```typescript
import { EasySewa } from 'easy-sewa';

// Initialize
const easySewa = new EasySewa({
  secret: 'your-secret-key',
  product_code: 'your-product-code',
  environment: 'development', // or 'production'
  success_url: 'https://yoursite.com/success',
  failure_url: 'https://yoursite.com/failure'
});

// Generate payment form
const form = easySewa.generatePaymentForm({
  amount: 100,
  transaction_uuid: 'unique-transaction-id',
  tax_amount: 10, // optional
  product_service_charge: 5, // optional
  product_delivery_charge: 2 // optional
});

// Verify payment response
const result = easySewa.verifyPayment(responseFromEsewa);

// Check transaction status
const status = await easySewa.checkTransactionStatus('transaction-id', 100);
```

## API Reference

### Constructor

```typescript
new EasySewa(config: EasySewaConfig)
```

#### EasySewaConfig

| Property | Type | Description |
|----------|------|-------------|
| `secret` | string | Your eSewa secret key |
| `product_code` | string | Your eSewa product code |
| `environment` | 'development' \| 'production' | Environment |
| `success_url` | string | Success redirect URL |
| `failure_url` | string | Failure redirect URL |

### Methods

#### `generatePaymentForm(options: PayOptions): string`

Generates HTML form for eSewa payment.

#### `verifyPayment(response: any): VerificationResult`

Verifies payment response from eSewa.

#### `checkTransactionStatus(transactionUuid: string, amount: number): Promise<StatusResult>`

Checks the status of a transaction.

## Error Handling

The library throws standard JavaScript `Error` objects with descriptive messages:

```typescript
try {
  const form = easySewa.generatePaymentForm(options);
} catch (error) {
  console.error('Payment form generation failed:', error.message);
}
```

## Testing

```bash
npm test
```

## Environment URLs

- **Development**: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- **Production**: `https://epay.esewa.com.np/api/epay/main/v2/form`

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## ⚠️ Disclaimer
> This package has not been tested in production using the production merchant codes of esewa.
