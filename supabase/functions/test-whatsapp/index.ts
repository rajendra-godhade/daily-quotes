/// <reference types="https://deno.land/x/supabase@1.1.2/mod.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/std@0.203.0/dotenv/load.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Your Twilio credentials
const accountSid = 'AC3cbf0ce851ece8b8934329b86870a19e'
const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const whatsappFrom = 'whatsapp:+14155238886'

// Test WhatsApp message function
async function sendTestWhatsAppMessage(to: string, message: string) {
  if (!authToken) {
    throw new Error('TWILIO_AUTH_TOKEN environment variable is not set')
  }

  const body = new URLSearchParams({
    From: whatsappFrom,
    To: 'whatsapp:' + to,
    Body: message,
  })

  const authHeader = 'Basic ' + btoa(`${accountSid}:${authToken}`)

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  )

  if (!response.ok) {
    let errorData: any = { message: response.statusText }
    try {
      errorData = await response.json()
    } catch (jsonError) {
      console.error('Failed to parse error response as JSON:', jsonError)
      errorData = { message: response.statusText }
    }
    console.error('Twilio API error:', errorData)
    throw new Error(`Twilio API error: ${errorData.message || response.statusText}. Status: ${response.status}`)
  }

  const result = await response.json()
  console.log('Twilio API response:', result)
  return result
}

// Supabase setup
const supabaseUrl = Deno.env.get('PROJECT_URL')
const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseKey) {
  throw new Error('PROJECT_URL and SERVICE_ROLE_KEY environment variables are required')
}

const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: { ...corsHeaders },
    })
  }

  try {
    const { phone } = await req.json()
    
    if (!phone) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Phone number is required' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }

    const testMessage = "🧪 Test message from Daily Quotes App!\n\nThis is a test to verify WhatsApp integration is working correctly.\n\nIf you receive this, the setup is successful! 🎉"
    
    console.log(`Sending test message to ${phone}`)
    
    // Check if Twilio auth token is set
    if (!authToken) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'TWILIO_AUTH_TOKEN environment variable is not set. Please configure it in Supabase Dashboard.',
        details: 'Go to Settings > Functions and add TWILIO_AUTH_TOKEN'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }
    
    const result = await sendTestWhatsAppMessage(phone, testMessage)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test message sent successfully',
      result,
      phone: phone,
      authTokenSet: !!authToken
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('Test function error:', error.message)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
}) 