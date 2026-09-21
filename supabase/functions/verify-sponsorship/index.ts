// Supabase Edge Function: verify-sponsorship
// Independently confirms a Paystack payment before marking a sponsorship as paid.
// Never trusts the browser's "payment succeeded" callback alone.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Service role key is used here (server-side only) so this function can
// update rows regardless of RLS — the anon key on the frontend never gets this power.
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing reference' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Find the pending row that matches this reference
    const { data: sponsor, error: fetchError } = await db
      .from('sponsors')
      .select('*')
      .eq('payment_ref', reference)
      .single();

    if (fetchError || !sponsor) {
      return new Response(
        JSON.stringify({ success: false, error: 'No matching sponsorship record found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Already verified before? Don't double-charge logic, just confirm success again.
    if (sponsor.payment_status === 'paid') {
      return new Response(
        JSON.stringify({ success: true, sponsor }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Ask Paystack directly — never trust the browser's word alone
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    );
    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || paystackData.data?.status !== 'success') {
      return new Response(
        JSON.stringify({ success: false, error: 'Payment not confirmed by Paystack' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Confirm the amount matches what we expected (Paystack amounts are in kobo/cents equivalent — KES lowest unit)
    const paidAmount = paystackData.data.amount / 100; // convert back to KES
    if (paidAmount !== sponsor.amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Amount mismatch — possible tampering' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Mark as paid
    const { data: updated, error: updateError } = await db
      .from('sponsors')
      .update({ payment_status: 'paid' })
      .eq('payment_ref', reference)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not update sponsorship record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Send thank-you email via Resend (best-effort — don't fail the whole request if email fails)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Micky Mimsanii <sponsors@mickymimsanii.com>', // ⚠️ replace with your verified Resend sending domain/address
          to: sponsor.email,
          subject: `Thank you for becoming a ${sponsor.tier} Partner!`,
          html: `
            <div style="font-family:sans-serif;line-height:1.6">
              <h2>Thank you, ${sponsor.contact_name}!</h2>
              <p>Your ${sponsor.tier} sponsorship of <strong>KSh ${sponsor.amount.toLocaleString()}</strong> on behalf of <strong>${sponsor.org_name}</strong> has been received and confirmed.</p>
              <p>Reference: ${reference}</p>
              <p>We'll be in touch shortly about your partner perks. God bless you for your generosity.</p>
              <p>— Micky Mimsanii</p>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      console.error('Resend email failed (non-fatal):', emailErr);
    }

    return new Response(
      JSON.stringify({ success: true, sponsor: updated }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('verify-sponsorship error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});