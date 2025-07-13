import nodemailer from 'nodemailer';

// Check if SMTP is properly configured
const isSmtpConfigured = () => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

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
  if (!isSmtpConfigured()) {
    console.warn('SMTP not configured - OTP email not sent. Set SMTP_USER and SMTP_PASS environment variables.');
    return;
  }
  
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

export async function sendInvitationEmail(email: string, token: string, role: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.warn('SMTP not configured - Invitation email not sent. Set SMTP_USER and SMTP_PASS environment variables.');
    return;
  }
  
  try {
    // Use the proper Replit domain or fallback to localhost for development
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : process.env.FRONTEND_URL || 'http://localhost:5000';
    const inviteUrl = `${baseUrl}/invite/${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `VideoLearn Pro - You're invited as a ${role}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563EB; margin: 0;">VideoLearn Pro</h1>
            <p style="color: #64748B; margin: 5px 0;">Learning Management Platform</p>
          </div>
          
          <div style="background: #F8FAFC; padding: 30px; border-radius: 12px;">
            <h2 style="color: #1E293B; margin-bottom: 20px; text-align: center;">You're Invited!</h2>
            <p style="color: #64748B; margin-bottom: 20px;">
              You have been invited to join VideoLearn Pro as a <strong>${role}</strong>.
            </p>
            <p style="color: #64748B; margin-bottom: 30px;">
              Click the button below to accept your invitation and set up your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #2563EB; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #E2E8F0;">
              <p style="margin: 0; color: #64748B; font-size: 14px;">Or copy and paste this link:</p>
              <p style="margin: 5px 0 0 0; color: #2563EB; word-break: break-all;">${inviteUrl}</p>
            </div>
            
            <p style="color: #64748B; font-size: 14px; margin-top: 20px;">
              This invitation will expire in 7 days. If you didn't expect this invitation, please ignore this email.
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
    console.error('Invitation email sending error:', error);
    throw new Error('Failed to send invitation email');
  }
}
