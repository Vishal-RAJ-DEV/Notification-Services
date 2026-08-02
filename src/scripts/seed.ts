import mongoose from 'mongoose';
import { notificationRepository } from '../repositories/notification.repository.js';
import { deliveryRepository } from '../repositories/delivery.repository.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/notifications';

const userId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

const samples: Array<{
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data: { deepLink: string } | null;
  channels: Array<'push' | 'email' | 'sms'>;
  status: 'pending' | 'completed' | 'failed';
  priority: 'high' | 'normal' | 'low';
}> = [
  {
    userId,
    type: 'welcome',
    title: 'Welcome to the platform',
    body: 'Thank you for joining! We are thrilled to have you.',
    data: { deepLink: '/dashboard' },
    channels: ['push', 'email'],
    status: 'completed',
    priority: 'high',
  },
  {
    userId,
    type: 'alert',
    title: 'Suspicious login detected',
    body: 'Someone logged into your account from a new device.',
    data: { deepLink: '/security' },
    channels: ['email', 'sms'],
    status: 'pending',
    priority: 'high',
  },
  {
    userId,
    type: 'reminder',
    title: 'Your subscription expires soon',
    body: 'Your premium plan will renew in 3 days.',
    data: { deepLink: '/billing' },
    channels: ['email'],
    status: 'pending',
    priority: 'normal',
  },
  {
    userId,
    type: 'promotion',
    title: 'Flash sale \u2014 40% off',
    body: 'Limited time offer on all premium plans.',
    data: { deepLink: '/pricing' },
    channels: ['push', 'email', 'sms'],
    status: 'failed',
    priority: 'low',
  },
  {
    userId,
    type: 'update',
    title: 'New feature released',
    body: 'Check out our new dark mode and export tools.',
    data: { deepLink: '/changelog' },
    channels: ['push'],
    status: 'completed',
    priority: 'normal',
  },
];

async function seed(): Promise<void> {
  console.log(`Connecting to ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  for (const note of samples) {
    const created = await notificationRepository.create(note);
    console.log(`[${note.type}] ${note.title} \u2014 ${created._id}`);

    for (const channel of note.channels) {
      const delivery = await deliveryRepository.create({
        notificationId: created._id,
        channel,
        status: note.status === 'completed' ? 'sent' : 'queued',
        attempts: 0,
      });
      console.log(`  \u2514\u2500 delivery (${channel}) \u2014 ${delivery._id}`);
    }
  }

  console.log('\nUnread count for user:', await notificationRepository.getUnreadCount(userId));

  await mongoose.disconnect();
  console.log('\nDone. Disconnected.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
