import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ==========================================
  // 1. CLEANUP (Delete existing data)
  // ==========================================
  // We delete in order to respect foreign key constraints
  await prisma.vote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Previous data cleared.');

  // ==========================================
  // 2. CREATE USERS
  // ==========================================

  // --- Admin User ---
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@example.com',
      role: Role.ADMIN,
      password: 'password123', // In a real app, hash this using bcrypt!
      emailVerified: new Date(),
    },
  });

  // --- Client User (Dataset Owner) ---
  const client = await prisma.user.create({
    data: {
      name: 'Nike Corp',
      email: 'client@nike.com',
      role: Role.CLIENT,
      password: 'password123',
      balance: 1000.00, // Client needs money to pay for datasets
      emailVerified: new Date(),
    },
  });

  // --- Evaluator User 1 ---
  const worker1 = await prisma.user.create({
    data: {
      name: 'John Worker',
      email: 'worker1@example.com',
      username: 'johnny_w',
      telegramId: '123456789',
      role: Role.EVALUATOR,
      password: 'password123',
      reputation: 100,
      balance: 5.50,
    },
  });

  // --- Evaluator User 2 ---
  const worker2 = await prisma.user.create({
    data: {
      name: 'Jane Tasker',
      email: 'worker2@example.com',
      username: 'jane_t',
      telegramId: '987654321',
      role: Role.EVALUATOR,
      password: 'password123',
      reputation: 110,
      balance: 12.00,
    },
  });

  console.log('👥 Users created: Admin, Client, and 2 Evaluators.');

  // ==========================================
  // 3. CREATE DATASETS & TASKS
  // ==========================================

  // --- Dataset A: Sentiment Analysis (Text) ---
  const textDataset = await prisma.dataset.create({
    data: {
      title: 'Nike - Shoe Sentiment Analysis',
      description: 'Read the review and determine if the customer is happy.',
      dataType: 'TEXT',
      question: 'Is this review positive or negative?',
      options: ['Positive', 'Negative', 'Neutral'],
      reward: 50, // 0.50 currency units
      requiredVotes: 2,
      ownerId: client.id,
      tasks: {
        create: [
          {
            content: 'I absolutely love these running shoes! They fit perfectly.',
            status: 'ACTIVE',
            imageUrls: [], // Empty array for text tasks
          },
          {
            content: 'The sole fell apart after two days. Terrible quality.',
            status: 'ACTIVE',
            imageUrls: [],
          },
          {
            content: 'They are okay, but shipping took too long.',
            status: 'ACTIVE',
            imageUrls: [],
          },
        ],
      },
    },
  });

  // --- Dataset B: Image Classification ---
 const imageDataset = await prisma.dataset.create({
    data: {
      title: 'Traffic Light Detection',
      description: 'Select the correct color of the traffic light in the image.',
      dataType: 'IMAGE',
      question: 'What color is the traffic light?',
      options: ['Red', 'Yellow', 'Green', 'Off'],
      reward: 100,
      requiredVotes: 3,
      ownerId: client.id,
      tasks: {
        create: [
          {
            content: 'Traffic Cam #404 - Intersection A', 
            // REAL RED LIGHT IMAGE
            imageUrls: ['https://images.unsplash.com/photo-1494129935429-873eafa78178?q=80&w=1203&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'], 
            status: 'ACTIVE',
          },
          {
            content: 'Traffic Cam #505 - Intersection B',
            // REAL GREEN LIGHT IMAGE
            imageUrls: ['https://images.unsplash.com/photo-1596263576753-4ef599306614?q=80&w=600&auto=format&fit=crop'],
            status: 'ACTIVE',
          },
        ],
      },
    },
  });

  console.log('📂 Datasets and Tasks created.');

  // ==========================================
  // 4. CREATE VOTES (Simulate Work)
  // ==========================================

  // Retrieve the tasks we just created to get their IDs
  const textTasks = await prisma.task.findMany({
    where: { datasetId: textDataset.id },
  });

  // Worker 1 votes on the first text task
  await prisma.vote.create({
    data: {
      taskId: textTasks[0].id,
      userId: worker1.id,
      selection: 'Positive',
    },
  });
  
  // Update task stats manually (or rely on your app logic triggers later)
  await prisma.task.update({
    where: { id: textTasks[0].id },
    data: { collectedVotes: { increment: 1 } },
  });

  // Worker 2 votes on the same task
  await prisma.vote.create({
    data: {
      taskId: textTasks[0].id,
      userId: worker2.id,
      selection: 'Positive',
    },
  });

  await prisma.task.update({
    where: { id: textTasks[0].id },
    data: { 
        collectedVotes: { increment: 1 },
        status: 'COMPLETED' // Assume 2 votes was enough
    },
  });

  // Worker 1 votes on the negative review
  await prisma.vote.create({
    data: {
      taskId: textTasks[1].id,
      userId: worker1.id,
      selection: 'Negative',
    },
  });

  console.log('🗳️  Votes simulated.');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });