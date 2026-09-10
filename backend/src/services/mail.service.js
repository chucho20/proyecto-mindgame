import nodemailer from "nodemailer";

import env from "../config/env.js";

function isSmtpConfigured() {
	return Boolean(env.smtp.host && env.smtp.port && env.smtp.user && env.smtp.password);
}

function shouldUseConsoleFallback() {
	return env.nodeEnv !== "production" || !isSmtpConfigured();
}

let transporter = null;

function getTransporter() {
	if (transporter) {
		return transporter;
	}

	transporter = nodemailer.createTransport({
		host: env.smtp.host,
		port: Number(env.smtp.port),
		secure: Number(env.smtp.port) === 465,
		auth: {
			user: env.smtp.user,
			pass: env.smtp.password,
		},
	});

	return transporter;
}

/**
 * Envía el correo de restablecimiento de contraseña.
 * Si no hay SMTP configurado (o estamos fuera de producción), imprime el enlace
 * en consola en lugar de enviar el correo, para no bloquear el desarrollo local.
 */
export async function sendPasswordResetEmail(to, resetLink) {
	if (!isSmtpConfigured() || shouldUseConsoleFallback()) {
		console.log("=== [mail.service] Enlace de restablecimiento de contraseña (modo consola) ===");
		console.log(`Destinatario: ${to}`);
		console.log(`Enlace: ${resetLink}`);
		console.log("===============================================================================");
		return { delivered: false, mode: "console" };
	}

	try {
		await getTransporter().sendMail({
			from: env.smtp.from,
			to,
			subject: "Restablecer contraseña - MindGame",
			text: `Recibimos una solicitud para restablecer tu contraseña. Usá el siguiente enlace (válido por tiempo limitado): ${resetLink}\n\nSi no solicitaste esto, podés ignorar este correo.`,
			html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${resetLink}">Hacé clic acá para restablecerla</a></p><p>Si no solicitaste esto, podés ignorar este correo.</p>`,
		});

		return { delivered: true, mode: "smtp" };
	} catch (error) {
		console.error(
			"Error al enviar el correo de restablecimiento, se usa fallback de consola:",
			error.message,
		);
		console.log(`Enlace: ${resetLink}`);
		return { delivered: false, mode: "console", error: error.message };
	}
}
