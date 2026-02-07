import { supabaseAdmin } from '../config/supabaseAdmin';
// @ts-ignore - TypeScript can't find types but runtime works fine
import * as brevo from '@getbrevo/brevo';

const brevoApiKey = process.env.BREVO_API_KEY || '';
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || 'shloksagarofficial@gmail.com';
const brevoSenderName = process.env.BREVO_SENDER_NAME || 'ShlokSagar';
const adminEmail = 'shloksagarofficial@gmail.com';

interface ContactMessage {
    name: string;
    email: string;
    phone?: string;
    message: string;
}

export async function createContactMessage(data: ContactMessage) {
    // Save to database
    const { data: message, error } = await supabaseAdmin
        .from('contact_messages')
        .insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            message: data.message,
            status: 'new'
        })
        .select()
        .single();

    if (error) {
        throw new Error('Failed to save contact message: ' + error.message);
    }

    // Send confirmation email to user
    await sendUserConfirmation(data.email, data.name);

    // Send notification to admin
    await sendAdminNotification(data);

    return message;
}

async function sendUserConfirmation(email: string, name: string) {
    if (!brevoApiKey) {
        console.warn('Brevo API key not configured, skipping email');
        return;
    }

    try {
        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email, name }];
        sendSmtpEmail.sender = { email: brevoSenderEmail, name: brevoSenderName };
        sendSmtpEmail.subject = 'Thank you for contacting ShlokSagar';
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f97316;">🙏 Namaste ${name},</h2>
                <p>Thank you for reaching out to us at ShlokSagar.</p>
                <p>We have received your message and our team will get back to you soon.</p>
                <p style="margin-top: 20px;">
                    <strong>What happens next?</strong><br>
                    Our support team reviews all messages and will respond within 24-48 hours.
                </p>
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                    If you have any urgent queries, please reply to this email.<br>
                    <strong>Email:</strong> shloksagarofficial@gmail.com
                </p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 12px;">
                    © ${new Date().getFullYear()} ShlokSagar. All rights reserved.<br>
                    Proudly developed by <a href="https://www.astrasoftinnovations.dev/">AstraSoft Innovations</a>
                </p>
            </div>
        `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
        console.error('Failed to send user confirmation email:', error);
    }
}

async function sendAdminNotification(data: ContactMessage) {
    if (!brevoApiKey) {
        console.warn('Brevo API key not configured, skipping email');
        return;
    }

    try {
        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: adminEmail, name: 'ShlokSagar Admin' }];
        sendSmtpEmail.sender = { email: brevoSenderEmail, name: 'ShlokSagar Contact Form' };
        sendSmtpEmail.subject = `New Contact Message from ${data.name}`;
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f97316;">📧 New Contact Form Submission</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; background: #f5f5f5; font-weight: bold; width: 120px;">Name:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f5f5f5; font-weight: bold;">Email:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f5f5f5; font-weight: bold;">Phone:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.phone || 'Not provided'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f5f5f5; font-weight: bold; vertical-align: top;">Message:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.message.replace(/\n/g, '<br>')}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #f97316;">
                    <strong>Action Required:</strong> Please respond to this inquiry within 24-48 hours.
                </p>
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                    View all messages in the <a href="http://localhost:3001">Admin Dashboard</a>
                </p>
            </div>
        `;

        await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
        console.error('Failed to send admin notification email:', error);
    }
}

export async function getAllContactMessages() {
    const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Failed to fetch contact messages: ' + error.message);
    }

    return data;
}

export async function updateContactMessageStatus(
    id: string,
    status: 'new' | 'in_progress' | 'resolved',
    adminId?: string,
    adminNotes?: string
) {
    const updateData: any = { status };

    if (adminNotes) {
        updateData.admin_notes = adminNotes;
    }

    if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        if (adminId) {
            updateData.resolved_by = adminId;
        }
    }

    const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error('Failed to update contact message: ' + error.message);
    }

    return data;
}
