// Production-ready email service for ELocalPass
import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

// Email service configuration
const getEmailTransporter = () => {
  // Check which email service is configured
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid configuration
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  } else if (process.env.RESEND_API_KEY) {
    // Resend configuration
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    })
  } else {
    // Gmail SMTP or generic SMTP
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = getEmailTransporter()
    
    const mailOptions = {
      from: options.from || process.env.FROM_EMAIL || process.env.EMAIL_USER || 'noreply@elocalpass.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    console.log(`📧 Sending email to: ${options.to}`)
    console.log(`📧 Subject: ${options.subject}`)
    console.log(`📧 Service: ${getEmailServiceName()}`)
    
    const result = await transporter.sendMail(mailOptions)
    
    console.log(`✅ Email sent successfully: ${result.messageId}`)
    return true
    
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return false
  }
}

const getEmailServiceName = (): string => {
  if (process.env.SENDGRID_API_KEY) return 'SendGrid'
  if (process.env.RESEND_API_KEY) return 'Resend'
  return 'SMTP'
}

// Email templates for production
export const createWelcomeEmailHtml = (data: {
  customerName: string
  qrCode: string
  guests: number
  days: number
  expiresAt: string
  customerPortalUrl?: string
  language: string
  deliveryMethod: string
}) => {
  const isSpanish = data.language === 'es'
  
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .qr-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px dashed #667eea; }
      .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
    </style>
  `
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isSpanish ? 'Tu ELocalPass está listo' : 'Your ELocalPass is Ready'}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ${isSpanish ? 'Tu ELocalPass está listo!' : 'Your ELocalPass is Ready!'}</h1>
        </div>
        
        <div class="content">
          <p>${isSpanish ? `¡Hola ${data.customerName}!` : `Hello ${data.customerName}!`}</p>
          
          <p>${isSpanish ? 'Tu pase local ha sido creado exitosamente.' : 'Your local pass has been created successfully.'}</p>
          
          <div class="details">
            <h3>📋 ${isSpanish ? 'DETALLES DEL PASE' : 'PASS DETAILS'}</h3>
            <ul>
              <li><strong>${isSpanish ? 'Código' : 'Code'}:</strong> ${data.qrCode}</li>
              <li><strong>${isSpanish ? 'Huéspedes' : 'Guests'}:</strong> ${data.guests} ${isSpanish ? 'personas' : 'people'}</li>
              <li><strong>${isSpanish ? 'Válido por' : 'Valid for'}:</strong> ${data.days} ${isSpanish ? 'días' : 'days'}</li>
              <li><strong>${isSpanish ? 'Válido hasta' : 'Valid until'}:</strong> ${data.expiresAt}</li>
            </ul>
          </div>
          
          ${data.customerPortalUrl ? `
            <div class="qr-section">
              <h3>📱 ${isSpanish ? 'PORTAL DEL CLIENTE' : 'CUSTOMER PORTAL'}</h3>
              <p>${isSpanish ? 'Accede a tu código QR en cualquier momento:' : 'Access your QR code anytime:'}</p>
              <a href="${data.customerPortalUrl}" class="button">
                ${isSpanish ? 'Ver Mi Pase' : 'View My Pass'}
              </a>
            </div>
          ` : `
            <div class="qr-section">
              <h3>🎯 ${isSpanish ? 'ACCESO DIRECTO' : 'DIRECT ACCESS'}</h3>
              <p>${isSpanish ? 'Este código te da acceso inmediato a tu experiencia local.' : 'This code gives you immediate access to your local experience.'}</p>
              <p>${isSpanish ? 'Simplemente muestra este código QR en el punto de acceso.' : 'Simply show this QR code at the access point.'}</p>
            </div>
          `}
          
          <div class="footer">
            <p>${isSpanish ? '¡Esperamos que disfrutes tu experiencia local!' : 'We hope you enjoy your local experience!'}</p>
            <p>${isSpanish ? 'Saludos,' : 'Best regards,'}<br>
            ${isSpanish ? 'El Equipo de ELocalPass' : 'The ELocalPass Team'}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
} 