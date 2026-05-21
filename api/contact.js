import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const emailSubject = subject || `Contact Form Submission from ${name}`;
  const notificationText = `📩 **New Contact Form Message**\n\n**Name:** ${name}\n**Email:** ${email}\n**Subject:** ${emailSubject}\n\n**Message:**\n${message}`;

  let sent = false;
  const deliveryErrors = {};

  // 1. DISCORD WEBHOOK INTEGRATION
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: `New Message from ${name}`,
            color: 14210087, // Blue Accent color
            fields: [
              { name: 'Sender Name', value: name, inline: true },
              { name: 'Sender Email', value: email, inline: true },
              { name: 'Subject', value: emailSubject },
              { name: 'Message', value: message }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
      if (response.ok) sent = true;
      else deliveryErrors.discord = `Discord Webhook returned status ${response.status}`;
    } catch (e) {
      deliveryErrors.discord = e.message;
    }
  }

  // 2. TELEGRAM BOT INTEGRATION
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const formattedMessage = `<b>📩 New Contact Message</b>\n\n<b>Name:</b> ${name}\n<b>Email:</b> ${email}\n<b>Subject:</b> ${emailSubject}\n\n<b>Message:</b>\n${message}`;
      const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: formattedMessage,
          parse_mode: 'HTML'
        })
      });
      if (response.ok) sent = true;
      else deliveryErrors.telegram = `Telegram API returned status ${response.status}`;
    } catch (e) {
      deliveryErrors.telegram = e.message;
    }
  }

  // 3. SMTP NODEMAILER EMAIL INTEGRATION
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for others
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const receiver = process.env.CONTACT_RECEIVER_EMAIL || 'vikash07052008@gmail.com';

      await transporter.sendMail({
        from: `"${name}" <${process.env.SMTP_USER}>`,
        to: receiver,
        replyTo: email,
        subject: emailSubject,
        text: `New Contact Message from:\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0ea5e9; margin-top: 0;">New Contact Form Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${emailSubject}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
        </div>`
      });

      sent = true;
    } catch (e) {
      deliveryErrors.email = e.message;
    }
  }

  // 4. ZERO-CONFIG FALLBACK ROUTING (FormSubmit.co AJAX API)
  // If no Telegram bot, Discord Webhook, or SMTP keys are set, this delivers messages
  // directly to your default inbox for free without requiring signup or authentication.
  if (!sent) {
    try {
      const receiver = process.env.CONTACT_RECEIVER_EMAIL || 'vikash07052008@gmail.com';
      const response = await fetch(`https://formsubmit.co/ajax/${receiver}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          subject: emailSubject,
          message: message
        })
      });
      
      const resData = await response.json();
      if (response.ok && (resData.success === 'true' || resData.success === true)) {
        sent = true;
      } else {
        deliveryErrors.fallback = resData.message || `FormSubmit API returned status ${response.status}`;
      }
    } catch (e) {
      deliveryErrors.fallback = e.message;
    }
  }

  if (sent) {
    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } else {
    return res.status(500).json({
      success: false,
      error: 'Failed to deliver message via all configured channels.',
      details: deliveryErrors
    });
  }
}
