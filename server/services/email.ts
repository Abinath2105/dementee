import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email configuration
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✓ Email server connection successful');
    return true;
  } catch (error) {
    console.error('✗ Email server connection failed:', error);
    return false;
  }
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'VideoLearn Pro - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563EB; margin: 0;">VideoLearn Pro</h1>
            <p style="color: #64748B; margin: 5px 0;">Learning Management Platform</p>
          </div>
          
          <div style="background: #F8FAFC; padding: 30px; border-radius: 12px; text-align: center;">
            <h2 style="color: #1E293B; margin-bottom: 20px;">Verify Your Email Address</h2>
            <p style="color: #64748B; margin-bottom: 30px;">
              Thank you for joining VideoLearn Pro! Please use the verification code below to complete your registration:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #E2E8F0;">
              <div style="font-size: 32px; font-weight: bold; color: #2563EB; letter-spacing: 8px;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #64748B; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #64748B; font-size: 12px;">
            <p>© 2024 VideoLearn Pro. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
}
