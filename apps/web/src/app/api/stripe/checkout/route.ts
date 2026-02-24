import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan_slug } = await req.json() as { plan_slug: string };

  // Get plan details
  const { data: plan } = await supabase
    .from("plans")
    .select("stripe_price_id, name")
    .eq("slug", plan_slug)
    .eq("is_active", true)
    .single();

  if (!plan?.stripe_price_id) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  // Get or create Stripe customer
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  let customerId = subscription?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      name: profile?.full_name,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${appUrl}/settings?payment=success`,
    cancel_url: `${appUrl}/settings?payment=cancelled`,
    metadata: { user_id: user.id, plan_slug },
    subscription_data: {
      metadata: { user_id: user.id, plan_slug },
    },
  });

  return NextResponse.json({ url: session.url });
}
