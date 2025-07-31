/// <reference types="https://deno.land/x/supabase@1.1.2/mod.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/std@0.203.0/dotenv/load.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Your Twilio credentials - moved to environment variables for security
const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || 'AC3cbf0ce851ece8b8934329b86870a19e'
const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const whatsappFrom = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886'

// Instead of using Twilio SDK, we'll use fetch directly
async function sendWhatsAppMessage(to: string, message: string) {
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
    const errorData = await response.json()
    throw new Error(`Twilio API error: ${errorData.message || response.statusText}`)
  }

  return response.json()
}

// Supabase setup
const supabaseUrl = Deno.env.get('PROJECT_URL')
const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseKey) {
  throw new Error('PROJECT_URL and SERVICE_ROLE_KEY environment variables are required')
}

const supabase = createClient(supabaseUrl, supabaseKey)

serve(async () => {
  try {
    // Get today's date in UTC (consistent timezone handling)
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    console.log(`Processing daily quotes for date: ${today} (UTC: ${now.toISOString()})`)

    // Try to get today's quote first
    let { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .eq('date', today)
      .limit(1)

    if (quotesError) {
      throw new Error(`Database error fetching quotes: ${quotesError.message}`)
    }

    // If no quote for today, get the most recent quote available
    if (!quotes?.length) {
      console.log(`No quote found for today (${today}), fetching most recent quote`)
      const { data: fallbackQuotes, error: fallbackError } = await supabase
        .from('quotes')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
      
      if (fallbackError) {
        throw new Error(`Database error fetching fallback quotes: ${fallbackError.message}`)
      }
      
      if (!fallbackQuotes?.length) {
        throw new Error('No quotes available in the database')
      }
      
      quotes = fallbackQuotes
      console.log(`Using fallback quote from date: ${quotes[0].date}`)
    }

    const quote = quotes[0]
    console.log(`Found quote: "${quote.quote}" by ${quote.author}`)

    // Get only subscribed users with phone numbers
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, phone, subscription_status, subscription_end_date')
      .not('phone', 'is', null)
      .eq('is_subscribed', true)
      .eq('subscription_status', 'active')
      .gte('subscription_end_date', new Date().toISOString())

    if (usersError) {
      throw new Error(`Database error fetching users: ${usersError.message}`)
    }

    if (!users?.length) {
      console.log('No active subscribed users found')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active subscribed users found',
        results: [] 
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }

    console.log(`Found ${users.length} active subscribed users`)

    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const message = `${quote.quote}\n— ${quote.author}`
          console.log(`Sending message to ${user.phone}: ${message}`)
          
          const result = await sendWhatsAppMessage(user.phone, message)
          
          return {
            userId: user.id,
            phone: user.phone,
            status: 'success',
            detail: result
          }
        } catch (error) {
          console.error(`Error sending to ${user.phone}:`, error.message)
          return {
            userId: user.id,
            phone: user.phone,
            status: 'error',
            error: error.message
          }
        }
      })
    )

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    console.log(`Daily quote delivery completed: ${successCount} successful, ${errorCount} failed`)

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Daily quotes sent: ${successCount} successful, ${errorCount} failed`,
      results 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('Daily quote function error:', error.message)
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
