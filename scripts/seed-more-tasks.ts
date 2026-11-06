// Adds fresh ACTIVE datasets and tasks without wiping anything. Safe to run repeatedly.
// Run with: npx tsx scripts/seed-more-tasks.ts
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const MIN_OWNER_BALANCE_CENTS = 100_000;

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed a production database.');

  const owner =
    (await prisma.user.findUnique({ where: { email: 'client@example.com' } })) ??
    (await prisma.user.findFirst({ where: { role: Role.CLIENT } }));
  if (!owner) throw new Error('No CLIENT user found. Run npm run db:seed first.');

  // Tasks are only served while the owner can pay for them.
  if (owner.balanceCents < MIN_OWNER_BALANCE_CENTS) {
    const amountCents = MIN_OWNER_BALANCE_CENTS - owner.balanceCents;
    await prisma.$transaction([
      prisma.user.update({ where: { id: owner.id }, data: { balanceCents: { increment: amountCents } } }),
      prisma.ledgerEntry.create({ data: { userId: owner.id, type: 'TOP_UP', amountCents, note: 'Seed top-up' } }),
    ]);
  }

  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

  await prisma.dataset.create({
    data: {
      title: `Restaurant review sentiment (${stamp})`,
      description: 'Read the review and decide how the diner feels.',
      dataType: 'TEXT',
      question: 'Is this review positive, negative or neutral?',
      options: ['Positive', 'Negative', 'Neutral'],
      rewardCents: 5,
      requiredVotes: 2,
      status: 'ACTIVE',
      ownerId: owner.id,
      tasks: {
        create: [
          { content: 'The pasta was perfect and the staff remembered our names.' },
          { content: 'Waited 50 minutes for a cold burger. Never again.' },
          { content: 'Decent food, average prices, nothing special.' },
          { content: 'Best ramen in town, the broth is incredible.' },
          { content: 'The table was sticky and the music way too loud.' },
          { content: 'Portions were fine. Service was a bit slow.' },
          { content: 'Dessert alone is worth the trip. Highly recommend.' },
          { content: 'They got my order wrong twice and refused a refund.' },
          { content: 'Fantastic food and friendly service, will come back.', isValidation: true, correctAnswer: 'Positive' },
        ],
      },
    },
  });

  await prisma.dataset.create({
    data: {
      title: `Support ticket topic (${stamp})`,
      description: 'Pick the topic that best matches the customer message.',
      dataType: 'TEXT',
      question: 'What is this message about?',
      options: ['Billing', 'Shipping', 'Account', 'Product issue'],
      rewardCents: 8,
      requiredVotes: 2,
      status: 'ACTIVE',
      ownerId: owner.id,
      tasks: {
        create: [
          { content: 'I was charged twice for my last order, please help.' },
          { content: 'My package says delivered but nothing arrived.' },
          { content: 'I cannot reset my password, the email never comes.' },
          { content: 'The blender stopped working after one week.' },
          { content: 'Can I change the delivery address for order #4412?' },
          { content: 'How do I delete my account and all my data?' },
          { content: 'The screen has a dead pixel right out of the box.' },
          { content: 'Why is there a subscription fee on my card statement?' },
          { content: 'My tracking number has not updated in five days.', isValidation: true, correctAnswer: 'Shipping' },
        ],
      },
    },
  });

  const animals = [
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1000&auto=format&fit=crop',
  ];
  await prisma.dataset.create({
    data: {
      title: `Cat or dog (${stamp})`,
      description: 'Tell us which animal is in the photo.',
      dataType: 'IMAGE',
      question: 'Which animal is in the photo?',
      options: ['Cat', 'Dog', 'Neither'],
      rewardCents: 10,
      requiredVotes: 2,
      status: 'ACTIVE',
      ownerId: owner.id,
      tasks: { create: animals.map((url) => ({ content: url, imageUrls: [url] })) },
    },
  });

  console.log(`Added 3 active datasets (23 tasks) owned by ${owner.email ?? owner.id}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
