import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'bolclick.official@gmail.com',
        pass: 'qjti qafk xhku hweo',
      },
    });
  }

  async sendRegistrationEmail(email: string, tenantName: string) {
    try {
      const info = await this.transporter.sendMail({
        from: '"BolClick" <bolclick.official@gmail.com>',
        to: email,
        subject: `¡Bienvenido a BolClick, ${tenantName}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg;">
            <h2 style="color: #ff5100; margin-bottom: 20px;">¡Hola ${tenantName}! 🚀</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #1a202c;">Tu cuenta comercial ha sido creada exitosamente. Hemos recibido tu solicitud para abrir un espacio en BolClick.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #1a202c;">Actualmente, tu tienda está en estado <strong>PENDIENTE</strong>. Nuestro equipo administrador revisará tu solicitud a la brevedad.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #1a202c;">Te notificaremos por este medio en cuanto sea aprobada.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #718096; text-align: center;">Saludos,<br>El equipo de BolClick</p>
          </div>
        `,
      });
      this.logger.log(
        `Email de registro enviado a ${email}: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error('Error enviando email de registro', error);
    }
  }

  async sendApprovalEmail(email: string, tenantName: string) {
    try {
      const info = await this.transporter.sendMail({
        from: '"BolClick" <bolclick.official@gmail.com>',
        to: email,
        subject: `✅ ¡Tu tienda ${tenantName} ha sido Aprobada!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg;">
            <h2 style="color: #48bb78; margin-bottom: 20px;">¡Felicidades, ${tenantName}! 🎉</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #1a202c;">Tu cuenta comercial ha sido <strong>APROBADA</strong> por nuestro equipo.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #1a202c;">Ya puedes iniciar sesión y comenzar a usar todas las herramientas de BolClick para digitalizar tu negocio.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/login" style="background-color: #ff5100; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">Iniciar Sesión</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #718096; text-align: center;">Saludos,<br>El equipo de BolClick</p>
          </div>
        `,
      });
      this.logger.log(
        `Email de aprobación enviado a ${email}: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error('Error enviando email de aprobación', error);
    }
  }

  async sendStatusEmail(email: string, tenantName: string, status: string) {
    let subject = '';
    let body = '';

    if (status === 'REJECTED') {
      subject = `❌ Solicitud de tienda rechazada`;
      body = `<p style="font-size: 16px; line-height: 1.6; color: #1a202c;">Lamentamos informarte que la solicitud para tu tienda <strong>${tenantName}</strong> ha sido <strong>RECHAZADA</strong>.</p>
              <p style="font-size: 16px; line-height: 1.6; color: #1a202c;">Por favor, comunícate con soporte para más información.</p>`;
    } else if (status === 'SUSPENDED') {
      subject = `⚠️ Tu tienda ha sido bloqueada/suspendida`;
      body = `<p style="font-size: 16px; line-height: 1.6; color: #1a202c;">Te informamos que tu tienda <strong>${tenantName}</strong> ha sido <strong>SUSPENDIDA</strong> temporalmente.</p>
              <p style="font-size: 16px; line-height: 1.6; color: #1a202c;">El acceso al sistema está restringido hasta nuevo aviso. Contáctanos para solucionar esta situación.</p>`;
    } else {
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"BolClick Soporte" <bolclick.official@gmail.com>',
        to: email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg;">
            <h2 style="color: #e53e3e; margin-bottom: 20px;">Aviso importante sobre ${tenantName}</h2>
            ${body}
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #718096; text-align: center;">Saludos,<br>El equipo de Soporte de BolClick</p>
          </div>
        `,
      });
      this.logger.log(
        `Email de estado (${status}) enviado a ${email}: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Error enviando email de estado (${status})`, error);
    }
  }
}
