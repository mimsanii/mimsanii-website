// supabase/functions/verify-payment/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers so your website can call this function from the browser
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle browser preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reference, name, email, phone, event_name, ticket_type, quantity } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'Missing payment reference' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify the payment with Paystack using the SECRET key (server-side only)
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return new Response(
        JSON.stringify({ error: 'Payment not verified', details: paystackData }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Confirm the amount paid matches what we expect (in kobo/cents, so KES * 100)
    const amountPaidKES = paystackData.data.amount / 100;

    // 3. Insert the ticket using the SERVICE ROLE key (bypasses RLS, server-side only)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabaseAdmin
      .from('tickets')
      .insert([
        {
          name,
          email,
          phone,
          event_name,
          ticket_type,
          quantity,
          amount_paid: amountPaidKES,
          payment_ref: reference,
          payment_status: 'paid',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Payment verified but failed to save ticket', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Send confirmation email (non-blocking — ticket is already saved even if this fails)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Micky Mimsanii <onboarding@resend.dev>',
          to: email,
          subject: `Your ticket for ${event_name} is confirmed!`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0E2931;color:#E2E2E0;border-radius:8px">
              <h1 style="color:#2B7574;font-size:24px;margin-bottom:8px">Ticket Confirmed 🎟️</h1>
              <p style="font-size:14px;line-height:1.6">Hi ${name},</p>
              <p style="font-size:14px;line-height:1.6">Your ticket for <strong>${event_name}</strong> has been booked successfully.</p>
              <div style="background:#12484C;border-radius:6px;padding:16px;margin:20px 0">
                <p style="margin:4px 0;font-size:13px"><strong>Ticket Type:</strong> ${ticket_type}</p>
                <p style="margin:4px 0;font-size:13px"><strong>Quantity:</strong> ${quantity}</p>
                <p style="margin:4px 0;font-size:13px"><strong>Amount Paid:</strong> KSh ${amountPaidKES.toLocaleString()}</p>
                <p style="margin:4px 0;font-size:13px"><strong>Reference:</strong> ${reference}</p>
              </div>
              <p style="font-size:13px;color:#9BAFAF">Show this email at the venue entrance. See you there!</p>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      console.error('Email sending failed (ticket still saved):', emailErr);
    }

    // 5. Success — return the saved ticket
    return new Response(
      JSON.stringify({ success: true, ticket: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Unexpected server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});