const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { getDefaults, sendMail } = require('../utils/mailer');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many contact requests. Please try again later.'
  }
});

// @route   POST /api/contact
// @desc    Send a contact/support message to store owner
// @access  Public
router.post('/',
  contactLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().trim().isLength({ min: 6, max: 30 }).withMessage('Phone must be 6-30 characters'),
    body('subject').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Subject must be 2-120 characters'),
    body('message').trim().isLength({ min: 5, max: 5000 }).withMessage('Message must be 5-5000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { name, email, phone = '', subject = '', message } = req.body;
      const { storeName, ownerEmail, from } = getDefaults();

      const to = process.env.CONTACT_TO_EMAIL || ownerEmail;
      const supportSubject = subject ? `Support: ${subject}` : `Support message from ${name}`;

      if (!to) {
        return res.status(500).json({
          success: false,
          message: 'Contact email is not configured on the server. Set CONTACT_TO_EMAIL or STORE_OWNER_EMAIL.'
        });
      }

      const text = [
        `New contact message (${storeName})`,
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
        subject ? `Subject: ${subject}` : null,
        '',
        message
      ].filter(Boolean).join('\n');

      const html = `
        <h2>New contact message (${storeName})</h2>
        <ul>
          <li><b>Name:</b> ${escapeHtml(name)}</li>
          <li><b>Email:</b> ${escapeHtml(email)}</li>
          ${phone ? `<li><b>Phone:</b> ${escapeHtml(phone)}</li>` : ''}
          ${subject ? `<li><b>Subject:</b> ${escapeHtml(subject)}</li>` : ''}
        </ul>
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
      `.trim();

      const result = await sendMail({
        to,
        subject: supportSubject,
        text,
        html,
        from
      });

      // Optional auto-reply to the user
      const autoReplyEnabled = String(process.env.CONTACT_AUTO_REPLY || '').toLowerCase().trim();
      const shouldAutoReply = autoReplyEnabled === '1' || autoReplyEnabled === 'true' || autoReplyEnabled === 'yes';
      if (shouldAutoReply) {
        try {
          await sendMail({
            to: email,
            subject: `We received your message - ${storeName}`,
            text: `Hi ${name},\n\nThanks for reaching out. We received your message and will get back to you shortly.\n\n— ${storeName}`
          });
        } catch (e) {
          console.warn('Contact auto-reply failed:', e?.message || e);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Message received',
        data: {
          delivered: !result?.skipped,
          provider: result?.provider || (result?.skipped ? 'disabled' : undefined)
        }
      });
    } catch (error) {
      console.error('Contact message error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
      });
    }
  }
);

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = router;
