import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * Create and configure nodemailer transporter
 */
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
  }

  // Determine if we should use secure connection
  const isSecure = smtpPort === 465;
  const requiresTLS = smtpPort === 587 && (smtpHost.includes('office365.com') || smtpHost.includes('outlook.com'));

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure, // true for 465, false for other ports
    requireTLS: requiresTLS, // For Outlook/Office365 on port 587
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send email with optional PDF attachment
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com';

    const mailOptions = {
      from: smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Plain text fallback
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Provide more helpful error messages
    if (error.code === 'EAUTH') {
      const helpfulMessage = `
Email authentication failed. This usually means:
1. For Gmail: You need to use an "App Password" instead of your regular password
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Generate an app password and use it as SMTP_PASS
2. For Outlook/Office365: You need to use an "App Password" 
   - Go to Microsoft Account > Security > Advanced security options > App passwords
   - Generate an app password and use it as SMTP_PASS
3. Make sure SMTP_USER is your full email address
4. Verify SMTP_HOST and SMTP_PORT are correct for your email provider

Current settings:
- SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}
- SMTP_PORT: ${process.env.SMTP_PORT || '587'}
- SMTP_USER: ${process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : 'Not set'}
      `.trim();
      throw new Error(`Failed to send email: ${helpfulMessage}`);
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send invoice/quote email with PDF attachment
 */
export const sendDocumentEmail = async (
  to: string,
  subject: string,
  message: string,
  pdfBuffer: Buffer,
  filename: string
): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .message {
          margin: 20px 0;
          padding: 15px;
          background-color: #f9fafb;
          border-left: 4px solid #3b82f6;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${subject}</h2>
        <div class="message">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p>Please find the attached document.</p>
        <p>Best regards,<br>Your Team</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: `${filename}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

