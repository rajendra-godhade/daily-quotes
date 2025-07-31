// Follow Deno Edge Function conventions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const SUBSCRIPTION_AMOUNT = 9900; // ₹99 in paise

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the JWT token from the authorization header
    const token = authHeader.replace('Bearer ', '')

    // Verify the JWT token and get the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    if (path === 'create-subscription') {
      // Create a new order
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`
        },
        body: JSON.stringify({
          amount: SUBSCRIPTION_AMOUNT,
          currency: 'INR',
          receipt: `sub_${user.id}_${Date.now()}`,
          payment_capture: 1
        })
      })

      const order = await response.json()

      return new Response(
        JSON.stringify(order),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (path === 'verify-payment') {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

      // Verify payment signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`
      const crypto = await import('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex')

      if (expectedSignature !== razorpay_signature) {
        throw new Error('Invalid signature')
      }

      // Update user's subscription status
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          is_subscribed: true,
          subscription_status: 'active',
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_payment_id: razorpay_payment_id,
          last_payment_amount: SUBSCRIPTION_AMOUNT,
          last_payment_date: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid endpoint')
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 