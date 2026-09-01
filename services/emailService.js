/**
 * Email Service
 * Placeholder implementation - logs to console in dev mode
 * Replace with nodemailer/SendGrid/SES when ready
 */

const sendEmail = async (to, subject, body) => {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("========== EMAIL SERVICE (DEV MODE) ==========");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      console.log("===============================================");
      return { success: true, message: "Email logged (dev mode)" };
    }

    // Production: Replace with actual email service
    // Example with nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({ from, to, subject, html: body });

    return { success: true, message: "Email sent" };
  } catch (error) {
    console.error("Email service error:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Send booking confirmation email
 */
const sendBookingConfirmation = async (email, bookingData) => {
  const subject = `Booking Confirmed - Token: ${bookingData.tokenNumber}`;
  const body = `
    <h2>Booking Confirmed!</h2>
    <p>Your crop procurement booking has been confirmed.</p>
    <p><strong>Token Number:</strong> ${bookingData.tokenNumber}</p>
    <p><strong>Appointment Date:</strong> ${bookingData.appointmentDate}</p>
    <p><strong>Time Slot:</strong> ${bookingData.appointmentTime}</p>
    <p>Please arrive on time at the procurement center.</p>
  `;
  return sendEmail(email, subject, body);
};

/**
 * Send payment receipt email
 */
const sendPaymentReceipt = async (email, transactionData) => {
  const subject = `Payment Receipt - ₹${transactionData.finalAmount}`;
  const body = `
    <h2>Payment Receipt</h2>
    <p><strong>Amount:</strong> ₹${transactionData.finalAmount}</p>
    <p><strong>Transaction ID:</strong> ${transactionData.transactionId}</p>
    <p><strong>Payment Method:</strong> ${transactionData.paymentMethod}</p>
    <p>Thank you for selling your crops through our platform!</p>
  `;
  return sendEmail(email, subject, body);
};

module.exports = { sendEmail, sendBookingConfirmation, sendPaymentReceipt };
