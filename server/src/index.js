import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 4000);

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin is not allowed'));
  }
}));
app.use(express.json({ limit: '1mb' }));

function parseTopic(topic, includeQuizzes = false) {
  const base = {
    id: topic.id,
    number: topic.number,
    slug: topic.slug,
    title: topic.title,
    subtitle: topic.subtitle,
    overview: topic.overview,
    mnemonic: topic.mnemonic,
    mindmapUrl: topic.mindmapUrl,
    sections: JSON.parse(topic.sectionsJson || '[]'),
    keyPoints: JSON.parse(topic.keyPointsJson || '[]')
  };

  if (includeQuizzes) {
    base.quizzes = (topic.quizzes || []).map((quiz) => ({
      id: quiz.id,
      topicId: quiz.topicId,
      prompt: quiz.prompt,
      options: JSON.parse(quiz.optionsJson || '[]'),
      correctIndex: quiz.correctIndex,
      explanation: quiz.explanation,
      difficulty: quiz.difficulty
    }));
  }

  return base;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'lsd-on-thi-server' });
});

app.get('/api/topics', async (_req, res, next) => {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        slug: true,
        title: true,
        subtitle: true,
        overview: true,
        mnemonic: true,
        mindmapUrl: true,
        sectionsJson: true,
        keyPointsJson: true,
        _count: { select: { quizzes: true } }
      }
    });

    res.json(topics.map((topic) => ({
      ...parseTopic(topic),
      quizCount: topic._count.quizzes
    })));
  } catch (error) {
    next(error);
  }
});

app.get('/api/topics/:slug', async (req, res, next) => {
  try {
    const topic = await prisma.topic.findUnique({
      where: { slug: req.params.slug },
      include: { quizzes: { orderBy: { id: 'asc' } } }
    });

    if (!topic) {
      return res.status(404).json({ message: 'Không tìm thấy câu ôn tập.' });
    }

    res.json(parseTopic(topic, true));
  } catch (error) {
    next(error);
  }
});

app.post('/api/quiz/check', async (req, res, next) => {
  try {
    const { answers = {} } = req.body;
    const ids = Object.keys(answers).map(Number).filter(Number.isFinite);

    if (!ids.length) {
      return res.json({ total: 0, correct: 0, details: [] });
    }

    const quizzes = await prisma.quiz.findMany({ where: { id: { in: ids } } });
    const details = quizzes.map((quiz) => {
      const selectedIndex = Number(answers[quiz.id]);
      return {
        id: quiz.id,
        selectedIndex,
        correctIndex: quiz.correctIndex,
        isCorrect: selectedIndex === quiz.correctIndex,
        explanation: quiz.explanation
      };
    });

    res.json({
      total: details.length,
      correct: details.filter((item) => item.isCorrect).length,
      details
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Server bị lỗi. Kiểm tra terminal để xem chi tiết.' });
});

app.listen(PORT, () => {
  console.log(`LSD study API is running at http://localhost:${PORT}`);
});
