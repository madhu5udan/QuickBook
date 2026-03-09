import sendEmail from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Show from "../models/Shows.js";
import User from "../models/User.js";
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

// to save user data
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.create(userData);
  },
);

// to delete user
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  },
);

// to update user
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData);
  },
);

// to cancel booking and release seats after 10mins
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  {
    id: "release-seats-delete-booking",
  },
  { event: "/app/checkpayment" },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);
    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);
      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });
        show.markModified("occupiedSeats");
        await show.save();
        await Booking.findByIdAndDelete(booking._id);
      }
    });
  },
);

// to send an email
const sendConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event, step }) => {
    const { bookingId } = event.data;
    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" },
      })
      .populate("user");

    await sendEmail({
      to: booking.user.email,
      subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
      body: `
<div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:30px;">
  <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

    <div style="background:#1e1e2f; color:white; padding:20px; text-align:center;">
      <h1 style="margin:0;">🎬 Booking Confirmed</h1>
      <p style="margin:5px 0 0;">Your movie ticket is ready</p>
    </div>

    <div style="padding:25px; color:#333;">

      <h2>Hello ${userName},</h2>
      <p>Your booking has been successfully confirmed.</p>

      <table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:14px;">
        
        <tr>
          <td style="padding:10px; font-weight:bold;">Movie</td>
          <td style="padding:10px;">${movieTitle}</td>
        </tr>

        <tr style="background:#f7f7f7;">
          <td style="padding:10px; font-weight:bold;">Date</td>
          <td style="padding:10px;">${date}</td>
        </tr>

        <tr>
          <td style="padding:10px; font-weight:bold;">Show Time</td>
          <td style="padding:10px;">${time}</td>
        </tr>

        <tr style="background:#f7f7f7;">
          <td style="padding:10px; font-weight:bold;">Seats</td>
          <td style="padding:10px;">${seats}</td>
        </tr>

        <tr>
          <td style="padding:10px; font-weight:bold;">Booking ID</td>
          <td style="padding:10px;">${bookingIdValue}</td>
        </tr>

      </table>

      <div style="text-align:center; margin-top:30px;">
        <a href="#" 
        style="background:#ff3d00; color:white; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold;">
          View Ticket
        </a>
      </div>

      <p style="margin-top:25px;">
        Please show this email at the theatre entrance.
      </p>

      <p>Enjoy the movie! 🍿</p>

    </div>

    <div style="background:#f4f4f4; text-align:center; padding:15px; font-size:12px; color:#777;">
      <p style="margin:0;">Thank you for booking with us!</p>
      <p style="margin:5px 0 0;">Movie Booking System</p>
    </div>

  </div>
</div>
`,
    });
  },
);

const sendNewShowNotifications = inngest.createFunction(
  { id: "send-new-show-notifications" },
  { event: "app/show.added" },
  async ({ event }) => {
    const { movieTitle } = event.data;
    const users = await User.find({});
    for (const user of users) {
      const userEmail = user.email;
      const userName = user.name;
      const subject = `new Show Added: ${movieTitle}`;
      const body = `<div style="font-family:Arial,sans-serif,padding:20px;">
      <h2> Hi ${userName},</h2>
      <p>We've just Added a new Movie </p>
      <h3 style="color:#F84565;">"${movieTitle}"</h3>
      </div>`;
      await sendEmail({ to: userEmail, subject, body });
    }
    return { message: "Notification sent" };
  },
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendConfirmationEmail,
  sendNewShowNotifications,
];
