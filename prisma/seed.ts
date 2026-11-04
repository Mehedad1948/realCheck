// Development seed. Wipes all data. Run with: npm run db:seed
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed a production database.');

  await prisma.ledgerEntry.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 12);

  const client = await prisma.user.create({
    data: { name: 'Demo Client', email: 'client@example.com', role: Role.CLIENT, password, balanceCents: 100_000 },
  });
  await prisma.ledgerEntry.create({
    data: { userId: client.id, type: 'TOP_UP', amountCents: 100_000, note: 'Seed balance' },
  });

  await prisma.user.create({
    data: { name: 'System Admin', email: 'admin@example.com', role: Role.ADMIN, password },
  });

  // Matches the mock user the API accepts when NEXT_PUBLIC_TMA_DEV_MOCK=true.
  await prisma.user.create({
    data: { telegramId: '1000001', firstName: 'Dev', username: 'dev_evaluator', role: Role.EVALUATOR },
  });

  await prisma.dataset.create({
    data: {
      title: 'Shoe review sentiment',
      description: 'Read the review and decide how the customer feels.',
      dataType: 'TEXT',
      question: 'Is this review positive, negative or neutral?',
      options: ['Positive', 'Negative', 'Neutral'],
      rewardCents: 5,
      requiredVotes: 2,
      status: 'ACTIVE',
      ownerId: client.id,
      tasks: {
        create: [
          { content: 'I absolutely love these running shoes! They fit perfectly.' },
          { content: 'The sole fell apart after two days. Terrible quality.' },
          { content: 'They are okay, but shipping took too long.' },
          { content: 'Best purchase this year, already ordered a second pair.' },
          { content: 'Returned them. Way too narrow.' },
          // Check question with a known answer.
          { content: 'Fantastic comfort, I wear them every day.', isValidation: true, correctAnswer: 'Positive' },
        ],
      },
    },
  });

  const lights = [
    'https://images.unsplash.com/photo-1494129935429-873eafa78178?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596263576753-4ef599306614?q=80&w=600&auto=format&fit=crop',
  ];
  await prisma.dataset.create({
    data: {
      title: 'Traffic light detection',
      description: 'Select the color of the traffic light in the image.',
      dataType: 'IMAGE',
      question: 'What color is the traffic light?',
      options: ['Red', 'Yellow', 'Green', 'Off'],
      rewardCents: 10,
      requiredVotes: 3,
      status: 'ACTIVE',
      ownerId: client.id,
      tasks: { create: lights.map((url) => ({ content: url, imageUrls: [url] })) },
    },
  });

  console.log('Seeded. Dashboard login: client@example.com / password123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
