import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

// Uses service role to bypass RLS when processing webhooks
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = session.metadata?.user_id;
      const planSlug = session.metadata?.plan_slug;
      if (!userId || !planSlug) break;

      // Get plan id
      const { data: plan } = await supabase
        .from("plans")
        .select("id")
        .eq("slug", planSlug)
        .single();

      if (!plan) break;

      const stripeSubscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sub = stripeSubscription as any;
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan_id: plan.id,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: stripeSubscription.id,
          status: "active",
          current_period_start: sub.current_period_start
            ? new Date(sub.current_period_start * 1000).toISOString()
            : null,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end ?? false,
        },
        { onConflict: "user_id" },
      );
      break;
    }

    case "customer.subscription.updated": {
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subAny = subscription as any;
      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status as string,
          current_period_start: subAny.current_period_start
            ? new Date(subAny.current_period_start * 1000).toISOString()
            : null,
          current_period_end: subAny.current_period_end
            ? new Date(subAny.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
