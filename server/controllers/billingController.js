import Stripe from "stripe";
import { prisma } from "../utils/prisma.js";

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    gender: user.gender,
    isPremium: user.isPremium,
    isGuest: user.isGuest,
    createdAt: user.createdAt,
  };
}

export async function createCheckoutSession(req, res) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!stripeKey || !priceId) {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { isPremium: true },
    });

    await prisma.subscription.create({
      data: {
        userId: req.user.id,
        status: "active_mock",
      },
    });

    return res.json({
      checkoutUrl: null,
      demoMode: true,
      message:
        "Stripe keys are not configured, so premium was enabled locally in demo mode.",
      user: serializeUser(updatedUser),
    });
  }

  const stripe = new Stripe(stripeKey);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: req.user.email || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/dashboard?premium=success`,
    cancel_url: `${process.env.CLIENT_URL}/dashboard?premium=cancel`,
    metadata: {
      userId: req.user.id,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: req.user.id,
      status: "pending",
    },
  });

  return res.json({ checkoutUrl: session.url, demoMode: false });
}
