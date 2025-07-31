import { supabase } from './supabaseClient';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SUBSCRIPTION_AMOUNT = 99; // ₹99 per month
const CURRENCY = 'INR';

interface OrderResponse {
  id: string;
  amount: number;
  currency: string;
}

export const createSubscriptionOrder = async (): Promise<OrderResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Call your Supabase Edge Function to create order
    const response = await fetch('https://hfhiqbjqppyruzkljpvd.supabase.co/functions/v1/handle-subscription/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        amount: SUBSCRIPTION_AMOUNT,
        currency: CURRENCY,
        userId: user.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const initializeRazorpayPayment = async (
  orderData: OrderResponse,
  onSuccess: () => void,
  onError: (error: any) => void
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your Razorpay Key ID
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Daily Quotes Subscription',
      description: 'Monthly subscription for daily motivational quotes',
      order_id: orderData.id,
      handler: async function (response: any) {
        try {
          // Verify payment and update subscription in a single transaction
          const verifyResponse = await fetch('https://hfhiqbjqppyruzkljpvd.supabase.co/functions/v1/handle-subscription/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              amount: SUBSCRIPTION_AMOUNT * 100, // Include amount for verification
              subscription_data: {
                is_subscribed: true,
                subscription_status: 'active',
                subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                last_payment_id: response.razorpay_payment_id,
                last_payment_amount: SUBSCRIPTION_AMOUNT * 100,
                last_payment_date: new Date().toISOString()
              }
            })
          });

          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            throw new Error(`Payment verification failed: ${errorData.error || 'Unknown error'}`);
          }

          const verificationResult = await verifyResponse.json();
          if (!verificationResult.success) {
            throw new Error(`Payment verification failed: ${verificationResult.error}`);
          }

          onSuccess();
        } catch (error) {
          console.error('Payment verification error:', error);
          onError(error);
        }
      },
      prefill: {
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        contact: user.phone || ''
      },
      theme: {
        color: '#111111'
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Razorpay initialization error:', error);
    onError(error);
  }
}; 