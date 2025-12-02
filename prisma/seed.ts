import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. CLEANUP: Remove existing data to avoid conflicts if you re-run the seed
  // We delete in order to respect foreign key constraints
  await prisma.vote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.user.deleteMany(); // This cascades to Account/Session usually, but good to be safe

  console.log('🧹 Cleaned up existing data.');

  // 2. CREATE USERS
  // Create a CLIENT user (Dataset Owner)
  const clientUser = await prisma.user.create({
    data: {
      name: 'Client User',
      email: 'client@realcheck.io',
      role: Role.CLIENT,
      password: '',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client',
      balance: 1000.0, // Give them some starting funds
    },
  });

  // Create an EVALUATOR user (Worker)
  const evaluatorUser = await prisma.user.create({
    data: {
      name: 'Evaluator User',
      email: 'evaluator@realcheck.io',
      role: Role.EVALUATOR,
      password: '',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=evaluator',
      reputation: 100,
      balance: 0.0,
      telegramId: '123456789', // Example Telegram ID
    },
  });

  console.log(
    `👤 Created Users: Client (${clientUser.id}), Evaluator (${evaluatorUser.id})`
  );

  // 3. CREATE DATASETS
  // Dataset 1: Text Sentiment Analysis (Multiple Choice)
  const textDataset = await prisma.dataset.create({
    data: {
      title: 'Product Review Sentiment',
      description:
        'Analyze customer reviews and determine if they are positive, negative, or neutral.',
      dataType: 'TEXT',
      question: 'What is the sentiment of this review?',
      options: ['Positive', 'Neutral', 'Negative'], // JSON array
      reward: 50,
      requiredVotes: 3,
      status: 'ACTIVE',
      ownerId: clientUser.id,
    },
  });

  // Dataset 2: Image Classification (Boolean/Binary)
  const imageDataset = await prisma.dataset.create({
    data: {
      title: 'Cat vs Dog Image Classification',
      description:
        'Look at the image and decide if it contains a cat or a dog.',
      dataType: 'IMAGE',
      question: 'Is this a Cat or a Dog?',
      options: ['Cat', 'Dog'], // JSON array
      reward: 100,
      requiredVotes: 5,
      status: 'ACTIVE',
      ownerId: clientUser.id,
    },
  });

  console.log(
    `📂 Created Datasets: "${textDataset.title}", "${imageDataset.title}"`
  );

  // 4. CREATE TASKS
  // Tasks for Text Dataset
  // await prisma.task.create({
  //   data: {
  //     datasetId: textDataset.id,
  //     content: { text: 'I absolutely love this product! It changed my life.' }, // JSON content
  //     status: 'ACTIVE',
  //     collectedVotes: 0,
  //   },
  // });

  // await prisma.task.create({
  //   data: {
  //     datasetId: textDataset.id,
  //     content: { text: 'The delivery was late and the box was crushed.' }, // JSON content
  //     status: 'ACTIVE',
  //     collectedVotes: 0,
  //   },
  // });

  // // Tasks for Image Dataset
  // await prisma.task.create({
  //   data: {
  //     datasetId: imageDataset.id,
  //     content: { imageUrl: 'https://placekitten.com/400/300' }, // JSON content
  //     status: 'ACTIVE',
  //     collectedVotes: 0,
  //   },
  // });

  console.log('📝 Created sample tasks for both datasets.');

  // 5. CREATE A SAMPLE VOTE (Optional)
  // Let's pretend the evaluator voted on the first task
  const firstTask = await prisma.task.findFirst({
    where: { datasetId: textDataset.id },
  });

  if (firstTask) {
    await prisma.vote.create({
      data: {
        userId: evaluatorUser.id,
        taskId: firstTask.id,
        selection: 'Positive',
      },
    });

    // Update the task counter
    await prisma.task.update({
      where: { id: firstTask.id },
      data: { collectedVotes: { increment: 1 } },
    });
    console.log('🗳️  Created a sample vote.');
  }

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
