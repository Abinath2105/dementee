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

export async function sendMentorInvitationEmail(email: string, mentorName: string, invitationToken: string): Promise<void> {
  try {
    // Construct Replit domain from available environment variables
    let baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    if (process.env.REPLIT_DEV_DOMAIN) {
      baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      baseUrl = `https://${process.env.REPL_SLUG}--${process.env.REPL_OWNER}.repl.co`;
    } else if (process.env.REPLIT_DOMAIN) {
      baseUrl = `https://${process.env.REPLIT_DOMAIN}`;
    }
    const invitationLink = `${baseUrl}/mentor/setup?token=${invitationToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to VideoLearn Pro - Mentor Invitation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #2563EB; margin: 0;">VideoLearn Pro</h1>
            <p style="color: #64748B; margin: 5px 0;">Video Learning Management Platform</p>
          </div>
          
          <h2 style="color: #1E293B;">Welcome to Our Mentor Team!</h2>
          
          <p>Dear ${mentorName},</p>
          
          <p>Congratulations! You have been invited to join <strong>VideoLearn Pro</strong> as a mentor. Our team believes you will be a valuable addition to help students learn and grow.</p>
          
          <div style="background-color: #F8FAFC; border-left: 4px solid #2563EB; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2563EB; margin-top: 0;">What you can do as a mentor:</h3>
            <ul style="color: #1E293B; line-height: 1.6;">
              <li>Add and manage educational videos</li>
              <li>Manage student enrollments</li>
              <li>Access mentor dashboard and analytics</li>
              <li>Collaborate with other mentors</li>
            </ul>
          </div>
          
          <p>To get started, please click the button below to set up your account password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #2563EB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Set Up My Account
            </a>
          </div>
          
          <p style="color: #64748B; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563EB; font-size: 14px;">${invitationLink}</p>
          
          <div style="border-top: 1px solid #E2E8F0; margin-top: 30px; padding-top: 20px; color: #64748B; font-size: 12px;">
            <p><strong>Important:</strong> This invitation link will expire in 7 days. If you have any questions or need assistance, please contact our support team.</p>
            <p>Welcome aboard!</p>
            <p><strong>The VideoLearn Pro Team</strong></p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Mentor invitation email error:', error);
    throw new Error('Failed to send mentor invitation email');
  }
}
