const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP credentials not configured. Email sending disabled.');
    return null;
  }

  return nodemailer.createTransport({   // ✅ FIXED (no 'createTransporter')
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send email
 */
const sendEmail = async (options) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email sending skipped - SMTP not configured');
    console.log('Would have sent:', options.subject, 'to', options.to);
    return { success: false, message: 'SMTP not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'PropertyHub <noreply@propertyhub.com>',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to PropertyHub!';
  const html = `
    <h1>Welcome to PropertyHub, ${user.name}!</h1>
    <p>Thank you for joining PropertyHub. Your account has been successfully created.</p>
    <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
    <p>You can now log in and start managing your properties.</p>
    <br>
    <p>Best regards,<br>PropertyHub Team</p>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send payment receipt email
 */
const sendPaymentReceipt = async (payment, user, property) => {
  const subject = 'Payment Receipt - PropertyHub';
  const html = `
    <h1>Payment Receipt</h1>
    <p>Dear ${user.name},</p>
    <p>Thank you for your payment. Here are the details:</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Receipt Number:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${payment.receiptNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Property:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${property.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">$${payment.amount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date(payment.paidDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Method:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${payment.paymentMethod}</td>
      </tr>
    </table>
    <br>
    <p>Best regards,<br>PropertyHub Team</p>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send payment reminder email
 */
const sendPaymentReminder = async (payment, user, property) => {
  const dueDate = new Date(payment.dueDate).toLocaleDateString();
  const subject = 'Payment Reminder - PropertyHub';
  const html = `
    <h1>Payment Reminder</h1>
    <p>Dear ${user.name},</p>
    <p>This is a friendly reminder that your rent payment is due soon.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Property:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${property.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Due:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">$${payment.amount.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${dueDate}</td>
      </tr>
    </table>
    <br>
    <p>Please log in to your PropertyHub account to make a payment.</p>
    <p>Best regards,<br>PropertyHub Team</p>
  `;
  
  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send lease expiry reminder
 */
const sendLeaseExpiryReminder = async (lease, tenant, property) => {
  const endDate = new Date(lease.endDate).toLocaleDateString();
  const subject = 'Lease Expiring Soon - PropertyHub';
  const html = `
    <h1>Lease Expiry Reminder</h1>
    <p>Dear ${tenant.name},</p>
    <p>Your lease is expiring soon. Please contact your landlord to discuss renewal options.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Property:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${property.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Lease End Date:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${endDate}</td>
      </tr>
    </table>
    <br>
    <p>Best regards,<br>PropertyHub Team</p>
  `;
  
  return await sendEmail({
    to: tenant.email,
    subject,
    html
  });
};

/**
 * Send maintenance request notification
 */
const sendMaintenanceNotification = async (request, landlord, tenant, property) => {
  const subject = 'New Maintenance Request - PropertyHub';
  const html = `
    <h1>New Maintenance Request</h1>
    <p>Dear ${landlord.name},</p>
    <p>A new maintenance request has been submitted.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Property:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${property.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tenant:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${tenant.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Issue:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${request.title}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><strong>Priority:</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${request.priority.toUpperCase()}</td>
      </tr>
    </table>
    <br>
    <p>Description: ${request.description}</p>
    <p>Please log in to your PropertyHub account to review and respond.</p>
    <p>Best regards,<br>PropertyHub Team</p>
  `;
  
  return await sendEmail({
    to: landlord.email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPaymentReceipt,
  sendPaymentReminder,
  sendLeaseExpiryReminder,
  sendMaintenanceNotification
};