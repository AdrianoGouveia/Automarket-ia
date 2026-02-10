/**
 * Email Notification Service
 * 
 * This service handles sending email notifications for various events:
 * - New messages
 * - New reviews
 * - Transaction status changes
 * - Car status changes (sold, price drop)
 * 
 * In production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Supabase Edge Functions with email triggers
 */

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  type: 'NEW_MESSAGE' | 'NEW_REVIEW' | 'TRANSACTION_UPDATE' | 'CAR_SOLD' | 'PRICE_DROP';
}

/**
 * Send email notification
 * Currently logs to console - replace with actual email service in production
 */
export async function sendEmailNotification(notification: EmailNotification): Promise<boolean> {
  try {
    console.log('[Email Notification]', {
      to: notification.to,
      subject: notification.subject,
      type: notification.type,
      timestamp: new Date().toISOString(),
    });

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: notification.to,
    //   from: 'noreply@automarket.ai',
    //   subject: notification.subject,
    //   html: notification.body,
    // });

    // Example with Supabase Edge Function:
    // await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-email`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(notification),
    // });

    return true;
  } catch (error) {
    console.error('[Email Notification Error]', error);
    return false;
  }
}

/**
 * Notify user about new message
 */
export async function notifyNewMessage(params: {
  recipientEmail: string;
  senderName: string;
  carTitle: string;
  messagePreview: string;
}) {
  return await sendEmailNotification({
    to: params.recipientEmail,
    subject: `Nova mensagem sobre ${params.carTitle}`,
    body: `
      <h2>Você recebeu uma nova mensagem!</h2>
      <p><strong>De:</strong> ${params.senderName}</p>
      <p><strong>Sobre:</strong> ${params.carTitle}</p>
      <p><strong>Mensagem:</strong> ${params.messagePreview}</p>
      <p><a href="https://automarket.ai/messages">Ver mensagem completa</a></p>
    `,
    type: 'NEW_MESSAGE',
  });
}

/**
 * Notify seller about new review
 */
export async function notifyNewReview(params: {
  sellerEmail: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  carTitle: string;
}) {
  return await sendEmailNotification({
    to: params.sellerEmail,
    subject: `Nova avaliação recebida - ${params.rating} estrelas`,
    body: `
      <h2>Você recebeu uma nova avaliação!</h2>
      <p><strong>De:</strong> ${params.reviewerName}</p>
      <p><strong>Veículo:</strong> ${params.carTitle}</p>
      <p><strong>Avaliação:</strong> ${'⭐'.repeat(params.rating)}</p>
      ${params.comment ? `<p><strong>Comentário:</strong> ${params.comment}</p>` : ''}
      <p><a href="https://automarket.ai/profile">Ver avaliações</a></p>
    `,
    type: 'NEW_REVIEW',
  });
}

/**
 * Notify buyer about transaction status change
 */
export async function notifyTransactionUpdate(params: {
  buyerEmail: string;
  carTitle: string;
  status: string;
  message: string;
}) {
  return await sendEmailNotification({
    to: params.buyerEmail,
    subject: `Atualização da transação - ${params.carTitle}`,
    body: `
      <h2>Sua transação foi atualizada!</h2>
      <p><strong>Veículo:</strong> ${params.carTitle}</p>
      <p><strong>Status:</strong> ${params.status}</p>
      <p>${params.message}</p>
      <p><a href="https://automarket.ai/transactions">Ver detalhes</a></p>
    `,
    type: 'TRANSACTION_UPDATE',
  });
}

/**
 * Notify interested users about car sold
 */
export async function notifyCarSold(params: {
  userEmail: string;
  carTitle: string;
  similarCarsUrl: string;
}) {
  return await sendEmailNotification({
    to: params.userEmail,
    subject: `Veículo vendido - ${params.carTitle}`,
    body: `
      <h2>O veículo que você favoritou foi vendido</h2>
      <p><strong>Veículo:</strong> ${params.carTitle}</p>
      <p>Não se preocupe! Temos outros veículos similares que podem te interessar.</p>
      <p><a href="${params.similarCarsUrl}">Ver veículos similares</a></p>
    `,
    type: 'CAR_SOLD',
  });
}

/**
 * Notify interested users about price drop
 */
export async function notifyPriceDrop(params: {
  userEmail: string;
  carTitle: string;
  oldPrice: number;
  newPrice: number;
  carUrl: string;
}) {
  const discount = ((params.oldPrice - params.newPrice) / params.oldPrice * 100).toFixed(1);
  
  return await sendEmailNotification({
    to: params.userEmail,
    subject: `Preço reduzido! ${discount}% de desconto - ${params.carTitle}`,
    body: `
      <h2>🎉 Boa notícia! O preço caiu!</h2>
      <p><strong>Veículo:</strong> ${params.carTitle}</p>
      <p><strong>Preço anterior:</strong> R$ ${params.oldPrice.toLocaleString('pt-BR')}</p>
      <p><strong>Novo preço:</strong> R$ ${params.newPrice.toLocaleString('pt-BR')}</p>
      <p><strong>Desconto:</strong> ${discount}%</p>
      <p><a href="${params.carUrl}">Ver anúncio</a></p>
    `,
    type: 'PRICE_DROP',
  });
}

/**
 * Batch send notifications
 * Useful for sending multiple notifications at once
 */
export async function sendBatchNotifications(notifications: EmailNotification[]): Promise<{
  sent: number;
  failed: number;
}> {
  const results = await Promise.allSettled(
    notifications.map(n => sendEmailNotification(n))
  );

  const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - sent;

  return { sent, failed };
}
