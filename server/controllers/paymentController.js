const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const User = require('../models/User');

// @desc    Create Stripe checkout session
// @route   POST /api/payments/create-checkout
exports.createCheckout = async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' or 'yearly'
    const user = req.user;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const priceId = plan === 'monthly'
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ success: false, message: 'Payment configuration error' });
    }

    let customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, {
        'subscription.stripeCustomerId': customerId
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?cancelled=true`,
      metadata: { userId: user._id.toString(), plan }
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ success: false, message: 'Payment error: ' + err.message });
  }
};

// @desc    Create portal session (manage subscription)
// @route   POST /api/payments/portal
exports.createPortal = async (req, res) => {
  try {
    const user = req.user;
    if (!user.subscription.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/dashboard`
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Portal error: ' + err.message });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await User.findByIdAndUpdate(session.metadata.userId, {
          'subscription.status': 'active',
          'subscription.plan': session.metadata.plan,
          'subscription.stripeSubscriptionId': subscription.id,
          'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
          'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': false
        });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const user = await User.findOne({ 'subscription.stripeSubscriptionId': sub.id });
        if (user) {
          await User.findByIdAndUpdate(user._id, {
            'subscription.status': sub.status === 'active' ? 'active' : sub.status,
            'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
            'subscription.cancelAtPeriodEnd': sub.cancel_at_period_end
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': sub.id },
          { 'subscription.status': 'cancelled', 'subscription.plan': null }
        );
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': invoice.customer },
          { 'subscription.status': 'past_due' }
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// @desc    Get subscription status
// @route   GET /api/payments/status
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, subscription: user.subscription });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
