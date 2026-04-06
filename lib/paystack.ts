import axios from 'axios';

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const paystackApi = {
  initializeTransaction: async (data: { email: string; amount: number }) => {
    // Paystack amounts are in kobo/cents, so multiply by 100
    const response = await paystack.post('/transaction/initialize', {
      ...data,
      amount: data.amount * 100,
    });
    return response.data;
  },
  verifyTransaction: async (reference: string) => {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return response.data;
  },
  // Add other endpoints as needed...
};
