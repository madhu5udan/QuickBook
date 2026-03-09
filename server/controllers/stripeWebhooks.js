import stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhooks error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("Processing payment_intent.succeeded:", paymentIntent.id);

        // Get bookingId from payment_intent metadata
        if (!paymentIntent.metadata || !paymentIntent.metadata.bookingId) {
          console.error(
            "No bookingId in payment_intent metadata:",
            paymentIntent.metadata,
          );
          return res.status(400).json({ error: "No bookingId in metadata" });
        }

        const { bookingId } = paymentIntent.metadata;
        console.log("Updating booking:", bookingId);

        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            isPaid: true,
            paymentLink: "",
          },
          { new: true },
        );

        if (!updatedBooking) {
          console.error("Booking not found:", bookingId);
          return res.status(404).json({ error: "Booking not found" });
        }

        console.log("Booking updated successfully:", bookingId);
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId },
        });
        break;
      }
      default:
        console.log("Unhandled event type:", event.type);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhooks processing error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
