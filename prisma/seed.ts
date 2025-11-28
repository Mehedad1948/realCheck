import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding (Professional Schema)...');

  // -------------------------------------------------------
  // 1. Clean up existing data
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
      telegramId: "dev_user_123", 
      username: "DevWorker",
      balance: 0,
      reputation: 100,
    }
  });
  console.log(`👤 Created Dev User: ${devUser.username}`);

  // -------------------------------------------------------
  // 3. Create Client 1: "TechCorp Inc"
  // -------------------------------------------------------
  const clientTech = await prisma.client.create({
    data: {
      companyName: "TechCorp Inc.",
      email: "admin@techcorp.com",
      contactName: "Alice Manager",
    }
  });

  // --- DATASET 1: Twitter Sentiment (Text) ---
  const sentimentDataset = await prisma.dataset.create({
    data: {
      title: "Twitter Sentiment Analysis - Q4",
      description: "Read the tweet and determine the user's mood.",
      status: "ACTIVE",
      clientId: clientTech.id,
      
      // SCHEMA CHANGE: Logic is now here
      dataType: "TEXT",
      question: "How does the user feel about the product?",
      options: ["Positive", "Negative", "Neutral"],
      reward: 10,

      tasks: {
        create: [
          {
            textContent: "I absolutely love the new update! It fixed all the bugs.",
            isValidation: true,
            correctAnswer: "Positive",
          },
          {
            textContent: "My screen freezes every time I open the app. Terrible.",
            isValidation: false,
          },
          {
            textContent: "It's okay, nothing special but it works.",
            isValidation: false,
          }
        ],
      },
    },
  });
  console.log(`📝 Created Sentiment Dataset (ID: ${sentimentDataset.id})`);

  // --- DATASET 2: Spam Detection (Text) ---
  // (Previously mixed, now separate because the question is different)
  const spamDataset = await prisma.dataset.create({
    data: {
      title: "Email Spam Filter Training",
      description: "Mark messages as Spam or Legit.",
      status: "ACTIVE",
      clientId: clientTech.id,

      dataType: "TEXT",
      question: "Is this message spam?",
      options: ["Spam", "Legit"],
      reward: 5,

      tasks: {
        create: [
          {
            textContent: "CLICK HERE TO WIN A FREE IPHONE NOW!!!",
            isValidation: true,
            correctAnswer: "Spam",
          },
          {
            textContent: "Hey check out this link: http://sketchy-url.com",
            isValidation: false,
          },
          {
            textContent: "Meeting confirmed for Tuesday at 2pm.",
            isValidation: true,
            correctAnswer: "Legit",
          }
        ],
      },
    },
  });
  console.log(`📧 Created Spam Dataset (ID: ${spamDataset.id})`);


  // -------------------------------------------------------
  // 4. Create Client 2: "VisionAI Labs"
  // -------------------------------------------------------
  const clientVision = await prisma.client.create({
    data: {
      companyName: "VisionAI Labs",
      email: "research@visionai.com",
      contactName: "Bob Scientist",
    }
  });

  // --- DATASET 3: Traffic Lights (Image) ---
  const trafficDataset = await prisma.dataset.create({
    data: {
      title: "Autonomous Driving - Traffic Lights",
      description: "Identify the state of the traffic light.",
      status: "ACTIVE",
      clientId: clientVision.id,

      dataType: "IMAGE",
      question: "What color is the traffic light?",
      options: ["Red", "Green", "Yellow", "Off"],
      reward: 25,

      tasks: {
        create: [
          {
            imageUrls: ["https://images.unsplash.com/photo-1565059895283-f6f6b3c9b444?auto=format&fit=crop&w=800"], 
            isValidation: true,
            correctAnswer: "Red",
          },
          {
            imageUrls: ["https://images.unsplash.com/photo-1625126596963-268b92b16621?auto=format&fit=crop&w=800"], // Green light
            isValidation: true,
            correctAnswer: "Green",
          }
        ],
      },
    },
  });
  console.log(`🚦 Created Traffic Dataset (ID: ${trafficDataset.id})`);

  // --- DATASET 4: Thumbnail Comparison (Image) ---
  const thumbnailDataset = await prisma.dataset.create({
    data: {
      title: "YouTube Thumbnail Optimization",
      description: "Which image makes you want to click more?",
      status: "ACTIVE",
      clientId: clientVision.id,

      dataType: "IMAGE",
      question: "Select the best thumbnail.",
      options: ["Image A", "Image B"],
      reward: 15,

      tasks: {
        create: [
          {
            // Simulating comparison (Image A vs Image B)
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
  console.log(`🖼️ Created Thumbnail Dataset (ID: ${thumbnailDataset.id})`);

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
