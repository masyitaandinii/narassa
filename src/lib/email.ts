/**
 * ============================================================================
 *  src/lib/email.ts — LAYANAN PENGIRIMAN EMAIL RESMI NARASSA
 * ============================================================================
 * 
 *  Fitur:
 *  - Mengirim email konfirmasi & terima kasih otomatis kepada:
 *    1. Donatur yang mengunggah bukti donasi
 *    2. Donatur saat donasinya disetujui/diverifikasi oleh admin
 *    3. Relawan yang berhasil mendaftar kegiatan
 * 
 *  Konfigurasi (.env.local opsional):
 *    SMTP_HOST (default: smtp.gmail.com)
 *    SMTP_PORT (default: 465 atau 587)
 *    SMTP_USER
 *    SMTP_PASS
 *    SMTP_FROM (default: "NARASSA Peduli <noreply@narassa.id>")
 * 
 *  Graceful Fallback:
 *    Jika SMTP belum dikonfigurasi, sistem mencatat pesan email di console
 *    tanpa melempar error, sehingga proses transaksi tetap 100% aman dan lancar.
 * ============================================================================
 */

import nodemailer, { type Transporter } from "nodemailer";

interface SmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

function getSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || `"NARASSA Peduli" <noreply@narassa.id>`,
  };
}

let transporter: Transporter | null = null;

function getTransporter() {
  const config = getSmtpConfig();
  if (!config.user || !config.pass) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }
  return transporter;
}

/** Helper pengiriman email dengan fallback aman */
async function sendMailSafe(options: { to: string; subject: string; html: string; text?: string }) {
  const config = getSmtpConfig();
  const mailer = getTransporter();

  if (!mailer || !options.to || !options.to.includes("@")) {
    console.log(
      `\n📧 [EMAIL SIMULASI / LOG] ${new Date().toLocaleTimeString()} -> To: ${options.to}\nSubject: ${options.subject}\n(SMTP_USER / SMTP_PASS belum diset di .env.local, email dicatat dengan aman)\n`
    );
    return { ok: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`✅ [EMAIL TERKIRIM] ID: ${info.messageId} -> ${options.to}`);
    return { ok: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`⚠️ [EMAIL GAGAL TERKIRIM] To: ${options.to} - Error:`, err?.message || err);
    // Jangan lempar error agar tidak memutus flow transaksi pengguna
    return { ok: false, error: err?.message };
  }
}

/* -------------------------------------------------------------------------- */
/* 1. Email: Bukti Donasi Diterima & Menunggu Verifikasi                      */
/* -------------------------------------------------------------------------- */
export async function sendDonationSubmittedEmail(params: {
  to: string;
  donorName: string;
  campaignTitle: string;
  amount: string;
  txId: string;
  method: string;
  reference?: string;
}) {
  const subject = `Terima Kasih Atas Donasi Anda untuk "${params.campaignTitle}"`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0f766e, #0d9488); padding: 32px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 28px; }
    .lead { font-size: 15px; line-height: 1.6; color: #334155; }
    .info-box { background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 700; text-align: right; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
    .amount-highlight { font-size: 20px; color: #0f766e; font-weight: 800; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #0f766e; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>NARASSA Peduli</h1>
      <p>Gerakan Kebaikan dan Solidaritas Sosial</p>
    </div>
    <div class="body">
      <p class="lead">Halo <strong>${params.donorName}</strong>,</p>
      <p class="lead">
        Terima kasih yang sebesar-besarnya atas kebaikan dan kepedulian Anda. Bukti donasi yang Anda kirimkan telah berhasil kami terima dan saat ini sedang dalam proses verifikasi oleh tim administrasi NARASSA.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Program Donasi</span>
          <span class="value">${params.campaignTitle}</span>
        </div>
        <div class="info-row">
          <span class="label">Nominal Donasi</span>
          <span class="value amount-highlight">${params.amount}</span>
        </div>
        <div class="info-row">
          <span class="label">Metode Pembayaran</span>
          <span class="value">${params.method}</span>
        </div>
        ${params.reference ? `
        <div class="info-row">
          <span class="label">No. Referensi Transfer</span>
          <span class="value">${params.reference}</span>
        </div>
        ` : ""}
        <div class="info-row">
          <span class="label">ID Transaksi</span>
          <span class="value">${params.txId}</span>
        </div>
        <div class="info-row">
          <span class="label">Status</span>
          <span class="value"><span class="badge">Menunggu Verifikasi Admin</span></span>
        </div>
      </div>

      <p class="lead" style="font-size: 13px; color: #64748b;">
        Setelah diverifikasi oleh staf admin kami, Anda akan menerima email konfirmasi bahwa dana donasi telah resmi disalurkan ke dalam program terkait.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NARASSA Indonesia. Membina Generasi, Mengukir Kebaikan.</p>
      <p>Pertanyaan atau kendala? Hubungi tim kami di <a href="mailto:support@narassa.id">support@narassa.id</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return sendMailSafe({ to: params.to, subject, html });
}

/* -------------------------------------------------------------------------- */
/* 2. Email: Donasi Dikonfirmasi / Disetujui Admin                            */
/* -------------------------------------------------------------------------- */
export async function sendDonationConfirmedEmail(params: {
  to: string;
  donorName: string;
  campaignTitle: string;
  amount: string;
  txId: string;
}) {
  const subject = `Donasi Anda Telah Terverifikasi – Terima Kasih! (${params.campaignTitle})`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 32px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 28px; }
    .lead { font-size: 15px; line-height: 1.6; color: #334155; }
    .info-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 700; text-align: right; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
    .amount-highlight { font-size: 20px; color: #059669; font-weight: 800; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>✓ Donasi Dikonfirmasi</h1>
      <p>NARASSA Peduli Kemanusiaan</p>
    </div>
    <div class="body">
      <p class="lead">Halo <strong>${params.donorName}</strong>,</p>
      <p class="lead">
        Kabar baik! Donasi Anda telah berhasil <strong>diverifikasi dan disetujui</strong> oleh tim kami. Bantuan Anda kini telah masuk ke dalam dana terkumpul program dan siap disalurkan kepada mereka yang membutuhkan.
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Program Tujuan</span>
          <span class="value">${params.campaignTitle}</span>
        </div>
        <div class="info-row">
          <span class="label">Dana Diterima</span>
          <span class="value amount-highlight">${params.amount}</span>
        </div>
        <div class="info-row">
          <span class="label">ID Transaksi</span>
          <span class="value">${params.txId}</span>
        </div>
        <div class="info-row">
          <span class="label">Status</span>
          <span class="value"><span class="badge">✓ Terkonfirmasi</span></span>
        </div>
      </div>

      <p class="lead" style="font-size: 14px; color: #334155;">
        Setiap rupiah yang Anda titipkan sangat berarti dalam mewujudkan harapan bagi saudara-saudara kita. Semoga kebaikan Anda dibalas dengan keberkahan berlipat ganda.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NARASSA Indonesia. Terima kasih atas ketulusan Anda.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendMailSafe({ to: params.to, subject, html });
}

/* -------------------------------------------------------------------------- */
/* 3. Email: Pendaftaran Relawan (Volunteer) Berhasil                         */
/* -------------------------------------------------------------------------- */
export async function sendVolunteerRegisteredEmail(params: {
  to: string;
  volunteerName: string;
  activityTitle: string;
  category: string;
  date: string;
  location: string;
  volunteerId: string;
}) {
  const subject = `Pendaftaran Relawan Berhasil: ${params.activityTitle} – NARASSA`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #0369a1, #0284c7); padding: 32px 28px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
    .body { padding: 28px; }
    .lead { font-size: 15px; line-height: 1.6; color: #334155; }
    .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 700; text-align: right; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #0284c7; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Selamat Bergabung!</h1>
      <p>Komunitas Relawan NARASSA Indonesia</p>
    </div>
    <div class="body">
      <p class="lead">Halo <strong>${params.volunteerName}</strong>,</p>
      <p class="lead">
        Terima kasih telah bersedia meluangkan waktu dan energi untuk sesama. Pendaftaran Anda untuk kegiatan kerelawanan <strong>"${params.activityTitle}"</strong> telah kami terima!
      </p>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Nama Kegiatan</span>
          <span class="value">${params.activityTitle}</span>
        </div>
        <div class="info-row">
          <span class="label">Kategori</span>
          <span class="value"><span class="badge">${params.category}</span></span>
        </div>
        <div class="info-row">
          <span class="label">Waktu / Tanggal</span>
          <span class="value">${params.date}</span>
        </div>
        <div class="info-row">
          <span class="label">Lokasi</span>
          <span class="value">${params.location}</span>
        </div>
        <div class="info-row">
          <span class="label">ID Relawan</span>
          <span class="value">${params.volunteerId}</span>
        </div>
        <div class="info-row">
          <span class="label">Status Pendaftaran</span>
          <span class="value" style="color: #b45309; font-weight: 700;">Menunggu Seleksi Admin</span>
        </div>
      </div>

      <p class="lead" style="font-size: 13px; color: #64748b;">
        Tim panitia akan meninjau motivasi pendaftaran Anda. Informasi teknis pelaksanaan dan grup koordinasi akan diperbarui melalui dashboard akun NARASSA Anda.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NARASSA Indonesia. Bergerak Bersama Memberi Makna.</p>
      <p>Pertanyaan? Hubungi koordinator di <a href="mailto:relawan@narassa.id">relawan@narassa.id</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return sendMailSafe({ to: params.to, subject, html });
}
