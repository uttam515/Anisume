import { Resend } from 'resend';

export interface SentEmailRecord {
  to: string;
  subject: string;
  type: 'verification' | 'password_reset';
  token: string;
  sentAt: Date;
}

// In-memory record for testing and development inspection
// In-memory record for testing and inspection
export const sentEmailsLog: SentEmailRecord[] = [];

/**
 * Resolves the Resend client if RESEND_API_KEY is configured.
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey === 'mock_test_key' || apiKey.startsWith('re_placeholder') || apiKey === 're_your_api_key_here') {
    return null;
  }
  return new Resend(apiKey);
}

const DEFAULT_FROM = process.env.EMAIL_FROM || 'Anisume <onboarding@resend.dev>';
const APP_URL = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

function logEmailBox(type: string, to: string, url: string, reason?: string) {
  console.log('\n================================================================================');
  console.log(`📧 [Email Service] Action: ${type}`);
  console.log(`Recipient:   ${to}`);
  console.log(`Action Link: ${url}`);
  if (reason) {
    console.log(`Note:        ${reason}`);
  }
  console.log('================================================================================\n');
}

/**
 * Sends an email verification link to a user.
 */
export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string
): Promise<{ success: boolean; id?: string }> {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your Anisume email address';

  sentEmailsLog.push({
    to,
    subject,
    type: 'verification',
    token,
    sentAt: new Date(),
  });

  const resend = getResendClient();
  if (!resend) {
    console.log(`[Email Service Mock] Verification email to ${to} (${username}): ${verifyUrl}`);
    logEmailBox(
      'Email Verification',
      to,
      verifyUrl,
      'RESEND_API_KEY is not set in .env. Click the link above to verify immediately in dev.'
    );
    return { success: true, id: 'mock-email-id' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [to],
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #08090D; color: #F1F5F9; border-radius: 16px; border: 1px solid #1C2030;">
          <h2 style="color: #A78BFA; margin-bottom: 16px;">Welcome to Anisume, ${username}!</h2>
          <p style="color: #94A3B8; font-size: 15px; line-height: 1.6;">
            Thank you for creating an account. Please click the button below to verify your email address and activate all features.
          </p>
          <div style="margin: 28px 0;">
            <a href="${verifyUrl}" style="background: #7C3AED; color: #FFFFFF; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #64748B; font-size: 13px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <a href="${verifyUrl}" style="color: #A78BFA; word-break: break-all;">${verifyUrl}</a>
          </p>
          <p style="color: #475569; font-size: 12px; margin-top: 32px; border-top: 1px solid #1C2030; padding-top: 16px;">
            This link expires in 24 hours. If you did not create an Anisume account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[Email Service] Resend verification email delivery error:', error);
      logEmailBox(
        'Email Verification (Delivery Fallback)',
        to,
        verifyUrl,
        `Resend returned an error: ${error.message}. (Note: onboarding@resend.dev only delivers to the Resend account owner's email address).`
      );
      return { success: false };
    }

    console.log(`[Email Service] Verification email successfully dispatched to ${to} via Resend (ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('[Email Service] Failed to send verification email:', error);
    logEmailBox('Email Verification (Exception Fallback)', to, verifyUrl, error?.message);
    return { success: false };
  }
}

/**
 * Sends a password reset link to a user.
 */
export async function sendPasswordResetEmail(
  to: string,
  username: string,
  token: string
): Promise<{ success: boolean; id?: string }> {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Reset your Anisume password';

  sentEmailsLog.push({
    to,
    subject,
    type: 'password_reset',
    token,
    sentAt: new Date(),
  });

  const resend = getResendClient();
  if (!resend) {
    console.log(`[Email Service Mock] Password reset email to ${to} (${username}): ${resetUrl}`);
    logEmailBox(
      'Password Reset',
      to,
      resetUrl,
      'RESEND_API_KEY is not set in .env. Click the link above to reset your password immediately in dev.'
    );
    return { success: true, id: 'mock-reset-id' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [to],
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #08090D; color: #F1F5F9; border-radius: 16px; border: 1px solid #1C2030;">
          <h2 style="color: #A78BFA; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="color: #94A3B8; font-size: 15px; line-height: 1.6;">
            Hello ${username}, we received a request to reset your password for your Anisume account.
          </p>
          <div style="margin: 28px 0;">
            <a href="${resetUrl}" style="background: #7C3AED; color: #FFFFFF; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748B; font-size: 13px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #A78BFA; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="color: #475569; font-size: 12px; margin-top: 32px; border-top: 1px solid #1C2030; padding-top: 16px;">
            This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[Email Service] Resend password reset email delivery error:', error);
      logEmailBox(
        'Password Reset (Delivery Fallback)',
        to,
        resetUrl,
        `Resend returned an error: ${error.message}. (Note: onboarding@resend.dev only delivers to the Resend account owner's email address).`
      );
      return { success: false };
    }

    console.log(`[Email Service] Password reset email successfully dispatched to ${to} via Resend (ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error('[Email Service] Failed to send password reset email:', error);
    logEmailBox('Password Reset (Exception Fallback)', to, resetUrl, error?.message);
    return { success: false };
  }
}

