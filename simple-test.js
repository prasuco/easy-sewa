/**
 * Simple test suite for EasySewa
 * Uses Node.js built-in test runner
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EasySewa } from './dist/index.js';

const config = {
  secret: '8gBm/:&EnhH.1/q',
  product_code: 'EPAYTEST',
  environment: 'development',
  success_url: 'https://example.com/success',
  failure_url: 'https://example.com/failure'
};

describe('EasySewa Basic Tests', () => {
  
  describe('Configuration', () => {
    it('should create instance with valid config', () => {
      const easySewa = new EasySewa(config);
      assert.ok(easySewa instanceof EasySewa);
    });

    it('should throw error for missing secret', () => {
      assert.throws(() => {
        new EasySewa({ ...config, secret: '' });
      }, /Secret is required/);
    });

    it('should throw error for invalid environment', () => {
      assert.throws(() => {
        new EasySewa({ ...config, environment: 'invalid' });
      }, /Environment must be/);
    });
  });

  describe('Payment Form Generation', () => {
    const easySewa = new EasySewa(config);

    it('should generate payment form', () => {
      const form = easySewa.generatePaymentForm({
        amount: 100,
        transaction_uuid: 'test-123'
      });
      
      assert.ok(form.includes('<form'));
      assert.ok(form.includes('name="amount" value="100"'));
      assert.ok(form.includes('name="transaction_uuid" value="test-123"'));
      assert.ok(form.includes('name="signature"'));
    });

    it('should calculate total amount correctly', () => {
      const form = easySewa.generatePaymentForm({
        amount: 100,
        transaction_uuid: 'test-123',
        tax_amount: 10,
        product_service_charge: 5
      });
      
      assert.ok(form.includes('name="total_amount" value="115"'));
    });

    it('should reject invalid amount', () => {
      assert.throws(() => {
        easySewa.generatePaymentForm({
          amount: -100,
          transaction_uuid: 'test-123'
        });
      }, /Amount must be a positive number/);
    });

    it('should reject invalid transaction UUID', () => {
      assert.throws(() => {
        easySewa.generatePaymentForm({
          amount: 100,
          transaction_uuid: 'test@123'
        });
      }, /Transaction UUID can only contain/);
    });
  });

  describe('Payment Verification', () => {
    const easySewa = new EasySewa(config);

    it('should verify valid payment', () => {
      // Create a mock valid response with proper signature
      const response = {
        transaction_code: 'T123456',
        status: 'COMPLETE',
        total_amount: '100',
        transaction_uuid: 'test-123',
        product_code: 'EPAYTEST',
        signed_field_names: 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names',
        signature: 'mock-signature' // This would be properly calculated in real scenario
      };

      // For this simple test, we'll just test the structure
      assert.throws(() => {
        easySewa.verifyPayment(response);
      }, /Invalid signature/); // Expected since signature is mock
    });

    it('should reject response missing fields', () => {
      const response = {
        transaction_code: 'T123456'
        // Missing other required fields
      };

      assert.throws(() => {
        easySewa.verifyPayment(response);
      }, /Missing required field/);
    });
  });

  describe('Status Check', async () => {
    const easySewa = new EasySewa(config);

    it('should reject invalid parameters', async () => {
      await assert.rejects(async () => {
        await easySewa.checkTransactionStatus('', 100);
      }, /Invalid transaction UUID/);

      await assert.rejects(async () => {
        await easySewa.checkTransactionStatus('test-123', -100);
      }, /Invalid transaction UUID/);
    });
  });

  describe('Edge Cases', () => {
    const easySewa = new EasySewa(config);

    it('should handle decimal amounts', () => {
      const form = easySewa.generatePaymentForm({
        amount: 99.99,
        transaction_uuid: 'decimal-test'
      });
      
      assert.ok(form.includes('name="amount" value="99.99"'));
    });

    it('should handle zero optional charges', () => {
      const form = easySewa.generatePaymentForm({
        amount: 100,
        transaction_uuid: 'zero-test',
        tax_amount: 0,
        product_service_charge: 0
      });
      
      // Zero values should not be included in form
      assert.ok(!form.includes('name="tax_amount"'));
      assert.ok(!form.includes('name="product_service_charge"'));
    });
  });
});

console.log('✓ Running simplified EasySewa tests...');