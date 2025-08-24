const stripe: any = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (amount: number, currency: string) => {
    try {
    const paymentIntent: any = await stripe.paymentIntents.create({
            amount,
            currency,
        });
        return paymentIntent;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Payment Intent creation failed: ${msg}`);
    }
};

export const confirmPayment = async (paymentIntentId: string) => {
    try {
        const paymentIntent: any = await stripe.paymentIntents.confirm(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Payment confirmation failed: ${msg}`);
    }
};