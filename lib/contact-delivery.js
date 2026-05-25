const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const DEFAULT_RECEIVER_EMAIL = 'vikash07052008@gmail.com';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeContactPayload(payload = {}) {
    return {
        name: String(payload.name || '').trim(),
        email: String(payload.email || '').trim().toLowerCase(),
        phone: String(payload.phone || '').trim(),
        subject: String(payload.subject || '').trim(),
        message: String(payload.message || '').trim(),
        website: String(payload.website || '').trim(),
        source: String(payload.source || 'portfolio-site').trim()
    };
}

function validateContactPayload(payload) {
    const errors = {};

    if (!payload.name || payload.name.length < 2) {
        errors.name = 'Name must be at least 2 characters long.';
    } else if (payload.name.length > 80) {
        errors.name = 'Name is too long.';
    }

    if (!payload.email || !EMAIL_PATTERN.test(payload.email)) {
        errors.email = 'A valid email address is required.';
    }

    if (!payload.message || payload.message.length < 10) {
        errors.message = 'Message must be at least 10 characters long.';
    } else if (payload.message.length > 3000) {
        errors.message = 'Message is too long.';
    }

    if (payload.subject && payload.subject.length > 140) {
        errors.subject = 'Subject is too long.';
    }

    if (payload.website) {
        errors.website = 'Spam detection triggered.';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

async function sendDiscordMessage(contact, subject) {
    if (!process.env.DISCORD_WEBHOOK_URL) {
        return { attempted: false };
    }

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [{
                title: `New Message from ${contact.name}`,
                color: 14210087,
                fields: [
                    { name: 'Sender Name', value: contact.name, inline: true },
                    { name: 'Sender Email', value: contact.email, inline: true },
                    { name: 'Phone', value: contact.phone || 'Not provided', inline: true },
                    { name: 'Subject', value: subject },
                    { name: 'Source', value: contact.source },
                    { name: 'Message', value: contact.message.slice(0, 1000) }
                ],
                timestamp: new Date().toISOString()
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`Discord webhook returned status ${response.status}`);
    }

    return { attempted: true, delivered: true };
}

async function sendTelegramMessage(contact, subject) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
        return { attempted: false };
    }

    const text = [
        '📩 New Contact Message',
        `Name: ${contact.name}`,
        `Email: ${contact.email}`,
        `Phone: ${contact.phone || 'Not provided'}`,
        `Subject: ${subject}`,
        `Source: ${contact.source}`,
        '',
        contact.message
    ].join('\n');

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text
        })
    });

    if (!response.ok) {
        throw new Error(`Telegram API returned status ${response.status}`);
    }

    return { attempted: true, delivered: true };
}

async function sendSmtpEmail(contact, subject) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return { attempted: false };
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
        secure: String(process.env.SMTP_PORT) === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const receiver = process.env.CONTACT_RECEIVER_EMAIL || DEFAULT_RECEIVER_EMAIL;

    await transporter.sendMail({
        from: `"${contact.name}" <${process.env.SMTP_USER}>`,
        to: receiver,
        replyTo: contact.email,
        subject,
        text: [
            `New contact submission from ${contact.name}`,
            `Email: ${contact.email}`,
            `Phone: ${contact.phone || 'Not provided'}`,
            `Source: ${contact.source}`,
            '',
            contact.message
        ].join('\n'),
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0ea5e9; margin-top: 0;">New Contact Form Message</h2>
                <p><strong>Name:</strong> ${contact.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
                <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Source:</strong> ${contact.source}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="white-space: pre-wrap; line-height: 1.6;">${contact.message}</p>
            </div>
        `
    });

    return { attempted: true, delivered: true };
}

async function sendFormSubmitFallback(contact, subject) {
    const fallbackEnabled = process.env.ENABLE_FORMSUBMIT_FALLBACK !== 'false';
    if (!fallbackEnabled) {
        return { attempted: false };
    }

    const receiver = process.env.CONTACT_RECEIVER_EMAIL || DEFAULT_RECEIVER_EMAIL;
    const response = await fetch(`https://formsubmit.co/ajax/${receiver}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            name: contact.name,
            email: contact.email,
            subject,
            message: [
                contact.message,
                '',
                `Phone: ${contact.phone || 'Not provided'}`,
                `Source: ${contact.source}`
            ].join('\n')
        })
    });

    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    const success = response.ok && (data.success === 'true' || data.success === true);
    if (!success) {
        const detail = data.message || `FormSubmit fallback returned status ${response.status}`;
        throw new Error(detail);
    }

    return { attempted: true, delivered: true };
}

async function deliverContactMessage(contact) {
    const subject = contact.subject || `Contact Form Submission from ${contact.name}`;
    const deliveryErrors = {};
    const deliveredChannels = [];

    const channels = [
        { name: 'discord', sender: sendDiscordMessage },
        { name: 'telegram', sender: sendTelegramMessage },
        { name: 'email', sender: sendSmtpEmail }
    ];

    for (const channel of channels) {
        try {
            const result = await channel.sender(contact, subject);
            if (result.attempted && result.delivered) {
                deliveredChannels.push(channel.name);
            }
        } catch (error) {
            deliveryErrors[channel.name] = error.message;
        }
    }

    if (deliveredChannels.length === 0) {
        try {
            const fallbackResult = await sendFormSubmitFallback(contact, subject);
            if (fallbackResult.attempted && fallbackResult.delivered) {
                deliveredChannels.push('fallback');
            }
        } catch (error) {
            deliveryErrors.fallback = error.message;
        }
    }

    return {
        sent: deliveredChannels.length > 0,
        deliveredChannels,
        deliveryErrors
    };
}

async function processContactSubmission(rawPayload) {
    const normalized = normalizeContactPayload(rawPayload);
    const validation = validateContactPayload(normalized);

    if (!validation.valid) {
        return {
            ok: false,
            status: 400,
            response: {
                success: false,
                error: 'Validation failed',
                details: validation.errors
            }
        };
    }

    const delivery = await deliverContactMessage(normalized);
    if (delivery.sent) {
        return {
            ok: true,
            status: 200,
            response: {
                success: true,
                message: 'Message sent successfully!',
                channels: delivery.deliveredChannels
            }
        };
    }

    return {
        ok: false,
        status: 500,
        response: {
            success: false,
            error: 'Failed to deliver message via all configured channels.',
            details: delivery.deliveryErrors
        }
    };
}

module.exports = {
    deliverContactMessage,
    normalizeContactPayload,
    processContactSubmission,
    validateContactPayload
};
