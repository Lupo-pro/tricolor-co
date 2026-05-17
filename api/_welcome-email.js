/* ============================================
   Welcome email template — sent on POST /api/subscribe.
   Underscore-prefixed file so Vercel doesn't expose it as a route.
   Inline-styled for cross-client compatibility (Gmail/Outlook strip
   <style> blocks frequently). Fonts use serif/sans-serif system
   stacks because web fonts are unreliable in email.
   ============================================ */

const SITE = 'https://latricolor.co';
const CODE = 'TRIBUNA10';
const DISCOUNT = '-10%';

function renderWelcomeEmail({ email } = {}) {
  // Personalization is intentionally minimal — we don't yet collect
  // first-name, and "cafetera" is the brand-affirming default.
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bienvenida a La Tribuna</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:Georgia,'Times New Roman',serif;color:#0A0A0A;">

<!-- Preheader (hidden in body, visible in inbox preview) -->
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
  Tu calendario Mundial + un -10% extra que solo está en este email.
</div>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#0A0A0A" style="background:#0A0A0A;">
  <tr>
    <td align="center" style="padding:28px 12px;">

      <!-- Main card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#F0EBE0;border:4px solid #0A0A0A;box-shadow:8px 8px 0 #FFD300;">

        <!-- Tricolor top bar -->
        <tr>
          <td style="padding:0;font-size:0;line-height:0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td bgcolor="#FFD300" width="33.33%" style="height:10px;background:#FFD300;font-size:0;line-height:0;">&nbsp;</td>
                <td bgcolor="#0033A0" width="33.33%" style="height:10px;background:#0033A0;font-size:0;line-height:0;">&nbsp;</td>
                <td bgcolor="#E63946" width="33.34%" style="height:10px;background:#E63946;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Brand line · TRICOLOR 3-color logo -->
        <tr>
          <td align="center" style="padding:24px 24px 8px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:900;letter-spacing:-1px;line-height:1;text-transform:uppercase;">
            <span style="color:#FFD300;text-shadow:2px 2px 0 #0A0A0A;">Tri</span><span style="color:#0033A0;text-shadow:2px 2px 0 #0A0A0A;">co</span><span style="color:#E63946;text-shadow:2px 2px 0 #0A0A0A;">lor</span>
          </td>
        </tr>

        <!-- Eyebrow -->
        <tr>
          <td align="center" style="padding:18px 24px 0;">
            <span style="display:inline-block;background:#E63946;color:#F0EBE0;padding:6px 14px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;border:2px solid #FFD300;">
              ★ Bienvenida a La Tribuna ★
            </span>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td align="center" style="padding:18px 24px 6px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:40px;font-weight:900;letter-spacing:-0.5px;color:#0A0A0A;line-height:1;text-transform:uppercase;">
              Hola Cafetera
            </h1>
          </td>
        </tr>

        <!-- Body copy -->
        <tr>
          <td style="padding:14px 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:#2A2A28;">
            <p style="margin:0 0 12px;">
              Acabás de unirte a la <strong>hinchada femenina más fiera</strong> del continente.
            </p>
            <p style="margin:0 0 6px;">A partir de hoy vas a recibir:</p>
            <ul style="margin:0 0 12px;padding-left:18px;">
              <li style="margin:0 0 4px;">Alertas <strong>2h antes</strong> de cada partido de Colombia</li>
              <li style="margin:0 0 4px;"><strong>Outfit recomendado</strong> para cada match</li>
              <li style="margin:0 0 4px;">Ofertas exclusivas solo para La Tribuna</li>
            </ul>
            <p style="margin:0;">Y como regalo de bienvenida, tu primer bonus:</p>
          </td>
        </tr>

        <!-- TRIBUNA10 code box -->
        <tr>
          <td align="center" style="padding:18px 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td align="center" style="background:#0A0A0A;border:3px solid #0A0A0A;padding:18px 16px;">
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:3px;color:#FFD300;text-transform:uppercase;margin-bottom:6px;">
                    ★ Tu código de bienvenida ★
                  </div>
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:900;letter-spacing:6px;color:#F0EBE0;line-height:1;">
                    ${CODE}
                  </div>
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#FFD300;letter-spacing:1px;margin-top:8px;">
                    ${DISCOUNT} adicional en tu primer pedido
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA button -->
        <tr>
          <td align="center" style="padding:6px 24px 28px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td bgcolor="#FFD300" style="background:#FFD300;border:3px solid #0A0A0A;box-shadow:6px 6px 0 #E63946;">
                  <a href="${SITE}/#collection" style="display:inline-block;padding:16px 32px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:900;letter-spacing:2px;color:#0A0A0A;text-decoration:none;text-transform:uppercase;">
                    Ver la Colección →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Mundial calendar nudge -->
        <tr>
          <td style="padding:0 28px 24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#E8E0CF;border:2px dashed #0A0A0A;">
              <tr>
                <td style="padding:14px 16px;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#2A2A28;line-height:1.5;">
                  <strong style="color:#E63946;">📅 Tu calendario Mundial:</strong>
                  <a href="${SITE}/mundial" style="color:#0033A0;text-decoration:underline;">latricolor.co/mundial</a> — todos los partidos de la Tricolor con el outfit recomendado.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Signature -->
        <tr>
          <td align="center" style="padding:0 24px 28px;font-family:Georgia,'Times New Roman',serif;color:#0A0A0A;">
            <p style="margin:0;font-size:14px;letter-spacing:3px;text-transform:uppercase;">
              Sé Fuerte. Sé Fiera.
              <strong style="color:#E63946;">Sé Tricolor.</strong>
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:#8A867E;letter-spacing:2px;">
              — La Tricolor 🇨🇴
            </p>
          </td>
        </tr>

        <!-- Tricolor bottom bar -->
        <tr>
          <td style="padding:0;font-size:0;line-height:0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td bgcolor="#E63946" width="33.33%" style="height:10px;background:#E63946;font-size:0;line-height:0;">&nbsp;</td>
                <td bgcolor="#0033A0" width="33.33%" style="height:10px;background:#0033A0;font-size:0;line-height:0;">&nbsp;</td>
                <td bgcolor="#FFD300" width="33.34%" style="height:10px;background:#FFD300;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Footer outside card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;">
        <tr>
          <td align="center" style="padding:18px 12px 8px;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:2px;color:#8A867E;text-transform:uppercase;">
            ${escapeHtml(email)}
            &nbsp;·&nbsp;
            <a href="${SITE}" style="color:#FFD300;text-decoration:none;">latricolor.co</a>
            &nbsp;·&nbsp;
            <a href="https://instagram.com/latricolor.co" style="color:#FFD300;text-decoration:none;">@latricolor.co</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 12px 18px;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:1px;color:#8A867E;">
            Te suscribiste a las alertas Mundial en latricolor.co/mundial.
            ¿Ya no las querés? Respondé este email con "Salir" y te quitamos.
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

module.exports = { renderWelcomeEmail, CODE, DISCOUNT, SITE };
