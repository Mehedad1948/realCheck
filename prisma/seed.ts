import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // -------------------------------------------------------
  // 1. Clean up existing data (Optional, prevents duplicates)
  // -------------------------------------------------------
  await prisma.vote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  console.log('🧹 Database cleaned.');

  // -------------------------------------------------------
  // 2. Create a Dev User (Worker)
  // -------------------------------------------------------
  const devUser = await prisma.user.create({
    data: {
      telegramId: "dev_user_123", // Use this ID for local testing
      username: "DevWorker",
      balance: 0,
      reputation: 100,
    }
  });
  console.log(`👤 Created Dev User: ${devUser.username}`);

  // -------------------------------------------------------
  // 3. Create Client 1: "TechCorp Inc" (Text Focus)
  // -------------------------------------------------------
  const clientTech = await prisma.client.create({
    data: {
      companyName: "TechCorp Inc.",
      email: "admin@techcorp.com",
      contactName: "Alice Manager",
    }
  });

  // --- DATASET 1: Text Labeling (Sentiment) ---
  const textDataset = await prisma.dataset.create({
    data: {
      title: "Twitter Sentiment Analysis - Q4",
      description: "Label tweets as Positive, Negative, or Neutral.",
      status: "ACTIVE",
      clientId: clientTech.id,
      tasks: {
        create: [
          {
            type: "text",
            question: "How does the user feel about the product?",
            options: ["Positive", "Negative", "Neutral"],
            reward: 10,
            textContent: "I absolutely love the new update! It fixed all the bugs.",
            isValidation: true,
            correctAnswer: "Positive", // Validation Task
          },
          {
            type: "text",
            question: "How does the user feel about the product?",
            options: ["Positive", "Negative", "Neutral"],
            reward: 10,
            textContent: "My screen freezes every time I open the app. Terrible.",
            isValidation: false, // Regular Task
          },
          {
            type: "text",
            question: "Is this spam?",
            options: ["Spam", "Legit"],
            reward: 5,
            textContent: "CLICK HERE TO WIN A FREE IPHONE NOW!!!",
            isValidation: true,
            correctAnswer: "Spam",
          },
        ],
      },
    },
  });
  console.log(`📝 Created Text Dataset with ${3} tasks.`);

  // -------------------------------------------------------
  // 4. Create Client 2: "VisionAI Labs" (Image Focus)
  // -------------------------------------------------------
  const clientVision = await prisma.client.create({
    data: {
      companyName: "VisionAI Labs",
      email: "research@visionai.com",
      contactName: "Bob Scientist",
    }
  });

  // --- DATASET 2: Image Labeling ---
  const imageDataset = await prisma.dataset.create({
    data: {
      title: "Autonomous Driving - Traffic Lights",
      description: "Identify the state of the traffic light.",
      status: "ACTIVE",
      clientId: clientVision.id,
      tasks: {
        create: [
          {
            type: "image",
            question: "What color is the traffic light?",
            options: ["Red", "Green", "Yellow", "Off"],
            reward: 25,
            imageUrls: ["https://images.unsplash.com/photo-1565059895283-f6f6b3c9b444?auto=format&fit=crop&w=800"], // Red light image
            isValidation: true,
            correctAnswer: "Red",
          },
          {
            type: "image",
            question: "Is there a pedestrian in this image?",
            options: ["Yes", "No"],
            reward: 20,
            imageUrls: ["https://images.unsplash.com/photo-1556150332-16c9776874dd?auto=format&fit=crop&w=800"], // Empty street
            isValidation: false,
          },
          {
            type: "image",
            question: "Select the best thumbnail for a travel vlog.",
            options: ["Image A", "Image B"],
            reward: 15,
            // Simulating multiple images for comparison
            imageUrls: [
              "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800", 
              "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800"
            ], 
            isValidation: false,
          },
        ],
      },
    },
  });
  console.log(`🖼️ Created Image Dataset with ${3} tasks.`);

  // -------------------------------------------------------
  // 5. Dataset 3: Hybrid / Mixed (Under TechCorp)
  // -------------------------------------------------------
  const mixedDataset = await prisma.dataset.create({
    data: {
      title: "General Knowledge & Visual QA",
      description: "A mix of text and image tasks.",
      status: "ACTIVE",
      clientId: clientTech.id,
      tasks: {
        create: [
          {
            type: "text",
            question: "What is the capital of France?",
            options: ["London", "Berlin", "Paris", "Madrid"],
            reward: 5,
            textContent: "Geography Question #1",
            isValidation: true,
            correctAnswer: "Paris",
          },
          {
            type: "image",
            question: "What animal is shown here?",
            options: ["Cat", "Dog", "Bird"],
            reward: 15,
            imageUrls: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800"], // Cat
            isValidation: true,
            correctAnswer: "Cat",
          }
        ]
      }
    }
  });
  console.log(`🔀 Created Mixed Dataset with ${2} tasks.`);

  console.log('✅ Seeding completed successfully!');
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
