import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { studyTopics } from '../src/data/studyData.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.quiz.deleteMany();
  await prisma.topic.deleteMany();

  for (const topic of studyTopics) {
    await prisma.topic.create({
      data: {
        number: topic.number,
        slug: topic.slug,
        title: topic.title,
        subtitle: topic.subtitle,
        overview: topic.overview,
        mnemonic: topic.mnemonic,
        mindmapUrl: topic.mindmapUrl,
        sectionsJson: JSON.stringify(topic.sections),
        keyPointsJson: JSON.stringify(topic.keyPoints),
        quizzes: {
          create: topic.quizzes.map((quiz) => ({
            prompt: quiz.prompt,
            optionsJson: JSON.stringify(quiz.options),
            correctIndex: quiz.correctIndex,
            explanation: quiz.explanation,
            difficulty: quiz.difficulty || 'Cơ bản'
          }))
        }
      }
    });
  }

  console.log(`Seeded ${studyTopics.length} topics and ${studyTopics.reduce((sum, topic) => sum + topic.quizzes.length, 0)} quizzes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
