function baseLayout(title: string, bodyHtml: string): string {
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; background:#f8f7fa; padding:32px;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
        <h1 style="font-size:20px;color:#1f2937;">${title}</h1>
        ${bodyHtml}
        <p style="font-size:12px;color:#9ca3af;margin-top:32px;">Safe Journal — your private space to reflect.</p>
      </div>
    </body>
  </html>`;
}

export function verificationEmailTemplate(name: string, url: string): string {
  return baseLayout(
    'Verify your email',
    `<p style="color:#374151;">Hi ${name},</p>
     <p style="color:#374151;">Please confirm your email address to activate your Safe Journal account.</p>
     <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;margin-top:12px;">Verify Email</a>
     <p style="color:#9ca3af;font-size:12px;margin-top:16px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>`,
  );
}

export function passwordResetEmailTemplate(name: string, url: string): string {
  return baseLayout(
    'Reset your password',
    `<p style="color:#374151;">Hi ${name},</p>
     <p style="color:#374151;">We received a request to reset your password. Click below to choose a new one.</p>
     <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;margin-top:12px;">Reset Password</a>
     <p style="color:#9ca3af;font-size:12px;margin-top:16px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>`,
  );
}

export function welcomeEmailTemplate(name: string): string {
  return baseLayout(
    'Welcome to Safe Journal',
    `<p style="color:#374151;">Hi ${name},</p>
     <p style="color:#374151;">Your account is ready. Start writing your first entry and get to know your patterns over time.</p>`,
  );
}
