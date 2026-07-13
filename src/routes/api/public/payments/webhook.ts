import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { sendTransactionalEmailServer } from "@/lib/email/send.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await (getSupabase().from("subscriptions") as any).upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await (getSupabase().from("subscriptions") as any)
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await (getSupabase().from("subscriptions") as any)
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any) {
  // Only handle one-off recipe purchases here (subscriptions go through
  // customer.subscription.* events).
  if (session.mode !== "payment") return;
  const type = session.metadata?.type;
  if (type !== "recipe_purchase" && type !== "cookbook_purchase" && type !== "tip") return;

  if (type === "tip") {
    const sessionId = session.id as string;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    const purchasedAt = new Date().toISOString();
    const { error } = await (getSupabase().from("tips") as any).upsert(
      {
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id: paymentIntentId,
        status: "paid",
        purchased_at: purchasedAt,
        updated_at: purchasedAt,
        sender_user_id: session.metadata?.userId ?? undefined,
        chef_user_id: session.metadata?.chef_user_id ?? undefined,
        message: session.metadata?.tip_message ?? undefined,
        gross_cents: session.amount_total ?? undefined,
        platform_fee_cents: session.metadata?.platform_fee_cents
          ? Number(session.metadata.platform_fee_cents)
          : undefined,
        chef_net_cents: session.metadata?.chef_net_cents
          ? Number(session.metadata.chef_net_cents)
          : undefined,
        currency: (session.currency as string) ?? "usd",
      },
      { onConflict: "stripe_checkout_session_id" },
    );
    if (error) console.error("Failed to upsert tip:", error);
    return;
  }

  const sessionId = session.id as string;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const purchasedAt = new Date().toISOString();

  // Upsert by stripe_checkout_session_id (unique) — covers both the
  // pre-inserted pending row and the missing-row fallback. Same shape
  // for recipe_purchase and cookbook_purchase.
  const { error } = await (getSupabase().from("recipe_purchases") as any).upsert(
    {
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: "paid",
      purchased_at: purchasedAt,
      updated_at: purchasedAt,
      buyer_user_id: session.metadata?.userId ?? undefined,
      chef_user_id: session.metadata?.chef_user_id ?? undefined,
      paid_recipe_id:
        type === "recipe_purchase" ? session.metadata?.paid_recipe_id ?? undefined : undefined,
      cookbook_id:
        type === "cookbook_purchase" ? session.metadata?.cookbook_id ?? undefined : undefined,
      gross_cents: session.amount_total ?? undefined,
      platform_fee_cents: session.metadata?.platform_fee_cents
        ? Number(session.metadata.platform_fee_cents)
        : undefined,
      chef_net_cents: session.metadata?.chef_net_cents
        ? Number(session.metadata.chef_net_cents)
        : undefined,
      currency: (session.currency as string) ?? "usd",
    },
    { onConflict: "stripe_checkout_session_id" },
  );
  if (error) console.error("Failed to upsert purchase:", error);

  // Fire-and-forget purchase receipt email.
  try {
    const buyerEmail: string | undefined =
      session.customer_details?.email ?? session.customer_email ?? undefined;
    if (buyerEmail) {
      const amount = session.amount_total
        ? (Number(session.amount_total) / 100).toFixed(2)
        : "0.00";
      await sendTransactionalEmailServer({
        templateName: "purchase-receipt",
        recipientEmail: buyerEmail,
        idempotencyKey: `receipt-${sessionId}`,
        templateData: {
          recipeTitle: session.metadata?.recipe_title ?? "your recipe",
          chefName: session.metadata?.chef_name ?? undefined,
          amount,
          currency: (session.currency as string) ?? "usd",
          orderId: sessionId,
          recipeUrl: "https://fridgecuisine.com/cookbook",
        },
      });
    }
  } catch (e) {
    console.error("purchase-receipt email failed", e);
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});