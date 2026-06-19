import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, kycDocumentsTable, notificationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../lib/mailer";

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "bonnieprincewill6@gmail.com,setonslight1@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    tier: user.tier,
    theme: user.theme,
    biometricEnabled: user.biometricEnabled,
    liquidity: user.liquidity,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
    adminVerified: user.adminVerified,
    avatarUrl: user.avatarUrl,
    bankName: user.bankName,
    bankAccountNumber: user.bankAccountNumber,
    bankAccountName: user.bankAccountName,
    cryptoWithdrawAddress: user.cryptoWithdrawAddress,
    cryptoWithdrawNetwork: user.cryptoWithdrawNetwork,
  };
}

export function tierFromWealth(wealth: number): string {
  if (wealth >= 500000) return "Diamond Ore";
  if (wealth >= 100000) return "Platinum Ore";
  if (wealth >= 25000) return "Gold Ore";
  if (wealth >= 5000) return "Silver Ore";
  return "Bronze Ore";
}

function pendingAccountEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#0d1419;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#131d26;border:1px solid #1e2d3d;border-radius:8px;overflow:hidden;">
        <tr><td style="height:3px;background:#f2ca50;"></td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e8dcc8;letter-spacing:2px;text-transform:uppercase;">Beta Capital Investment</p>
          <h1 style="margin:0 0 16px;font-size:28px;color:#e8dcc8;">Account Under Review</h1>
          <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Hi ${name},</p>
          <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Thank you for registering with Beta Capital Investment. Your account and KYC documents are currently under review by our compliance team.</p>
          <div style="margin:24px 0;background:#0d1419;border:1px solid #1e2d3d;border-radius:6px;padding:20px;">
            <p style="color:#f2ca50;font-family:sans-serif;font-size:13px;font-weight:700;margin:0 0 8px;">What happens next?</p>
            <ul style="color:#8a9ab5;font-family:sans-serif;font-size:13px;line-height:1.8;margin:0;padding-left:20px;">
              <li>Our team reviews your submitted documents</li>
              <li>Verification typically takes 1–3 business days</li>
              <li>You will receive an email once your account is approved</li>
            </ul>
          </div>
          <p style="color:#4a5a6b;font-family:sans-serif;font-size:11px;margin-top:24px;">Questions? Contact us at support@betacapitalinvestment.com</p>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid #1e2d3d;">
          <p style="margin:0;color:#4a5a6b;font-family:sans-serif;font-size:11px;">&copy; ${new Date().getFullYear()} Beta Capital Investment. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function accountApprovedEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#0d1419;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#131d26;border:1px solid #1e2d3d;border-radius:8px;overflow:hidden;">
        <tr><td style="height:3px;background:#22c55e;"></td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e8dcc8;letter-spacing:2px;text-transform:uppercase;">Beta Capital Investment</p>
          <h1 style="margin:0 0 16px;font-size:28px;color:#e8dcc8;">Account Approved ✓</h1>
          <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Hi ${name},</p>
          <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Great news! Your Beta Capital Investment account has been verified and approved. You can now sign in and start investing.</p>
          <p style="color:#4a5a6b;font-family:sans-serif;font-size:11px;margin-top:24px;">Visit our platform to get started.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export { accountApprovedEmailHtml };

router.post("/auth/signup", async (req: Request, res: Response) => {
  const { email, password, fullName, phoneNumber, kycDocBase64, kycDocName, kycDocType } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({ message: "All fields required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = isAdminEmail(email);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      fullName,
      passwordHash,
      phoneNumber: phoneNumber ?? null,
      isAdmin: admin,
      emailVerified: admin,
      adminVerified: admin,
      tier: "Bronze Ore",
      theme: "sovereign",
      biometricEnabled: false,
      liquidity: 0,
    })
    .returning();

  // Store KYC document if provided
  if (kycDocBase64 && kycDocName && kycDocType && !admin) {
    await db.insert(kycDocumentsTable).values({
      userId: user.id,
      docType: kycDocType,
      fileDataBase64: kycDocBase64,
      fileName: kycDocName,
      mimeType: kycDocName.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      status: "pending",
    });
  }

  const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.insert(notificationsTable).values({
    id: notifId,
    userId: user.id,
    title: admin ? "Welcome to Beta Capital Investment" : "Account Under Review",
    message: admin
      ? "Your admin account is ready. Welcome to the platform."
      : "Your registration is complete. Our team is reviewing your account and KYC documents. You will be notified once approved.",
    timestamp: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    read: false,
    type: "info",
  });

  // Send confirmation email
  if (!admin) {
    try {
      await sendEmail(email, "Your Beta Capital Investment Account is Under Review", pendingAccountEmailHtml(fullName));
    } catch (err) {
      req.log.warn({ err }, "Failed to send pending account email");
    }
  }

  if (admin) {
    // Admin users are immediately verified and logged in
    req.session.userId = user.id;
    res.status(201).json(serializeUser(user));
  } else {
    // Regular users wait for admin verification — no session created
    res.status(201).json({ pending: true, email: user.email });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ message: "Please use email and password to sign in." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // Check admin verification for non-admin users
  if (!user.isAdmin && !user.adminVerified) {
    res.status(403).json({ message: "Your account is pending admin verification. Please wait for approval.", code: "ACCOUNT_PENDING" });
    return;
  }

  // Auto-promote admin emails
  if (isAdminEmail(email) && !user.isAdmin) {
    await db.update(usersTable).set({ isAdmin: true, adminVerified: true }).where(eq(usersTable.id, user.id));
    user.isAdmin = true;
  }

  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
  res.json(serializeUser(user));
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ message: "User not found" });
    return;
  }
  res.json(serializeUser(user));
});

export default router;
export { ADMIN_EMAILS };
