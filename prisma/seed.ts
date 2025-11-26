import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  await prisma.vote.deleteMany();
  await prisma.task.deleteMany();

  // 1. TEXT TASKS
  await prisma.task.createMany({
    data: [
      {
        type: 'text_classification', // Matches your Type string
        question: 'What is the sentiment of this review?',
        options: ['positive', 'negative', 'neutral'],
        reward: 10,
        correctAnswer: 'positive',
        
        // Now valid because we added them to Schema
        textContent: 'This product was awesome', 
        isValidation: true,
      },
      {
        type: 'text_classification',
        question: 'What is the sentiment of this review?',
        options: ['positive', 'negative', 'neutral'],
        reward: 10,
        correctAnswer: 'negative',
        
        textContent: 'I dint like that',
        isValidation: true,
      },
    ],
  });

  // 2. IMAGE TASKS
  await prisma.task.createMany({
    data: [
      {
        type: 'image_labeling', // Matches your Type string
        question: 'Is this image clear and valid?',
        options: ['valid', 'invalid'],
        reward: 15,
        correctAnswer: 'valid',

        // Now valid because we added them to Schema
        imageUrls: ['https://dummyimage.com/600x400/000/fff&text=Cat'], 
        isValidation: true,
      },
    ],
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
