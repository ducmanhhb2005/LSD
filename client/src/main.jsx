import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function App() {
  const [topics, setTopics] = useState([]);
  const [activeSlug, setActiveSlug] = useState('');
  const [topic, setTopic] = useState(null);
  const [tab, setTab] = useState('mindmap');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadTopics() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/topics`);
        if (!res.ok) throw new Error('Không gọi được API /api/topics');
        const data = await res.json();
        setTopics(data);
        setActiveSlug(data[0]?.slug || '');
      } catch (err) {
        setError('Chưa tải được dữ liệu. Hãy chạy backend Express và seed Prisma theo README.md.');
      } finally {
        setLoading(false);
      }
    }
    loadTopics();
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    async function loadTopic() {
      try {
        setTopic(null);
        setAnswers({});
        setSubmitted(false);
        const res = await fetch(`${API}/topics/${activeSlug}`);
        if (!res.ok) throw new Error('Không tìm thấy câu ôn tập');
        const data = await res.json();
        setTopic(data);
      } catch (err) {
        setError('Không tải được nội dung câu này. Kiểm tra server hoặc database.');
      }
    }
    loadTopic();
  }, [activeSlug]);

  const filteredSections = useMemo(() => {
    if (!topic) return [];
    const keyword = search.trim().toLowerCase();
    if (!keyword) return topic.sections;
    return topic.sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.toLowerCase().includes(keyword) || section.heading.toLowerCase().includes(keyword))
      }))
      .filter((section) => section.items.length > 0);
  }, [topic, search]);

  const score = useMemo(() => {
    if (!topic?.quizzes?.length) return { correct: 0, total: 0 };
    const correct = topic.quizzes.reduce((sum, quiz) => {
      return sum + (Number(answers[quiz.id]) === quiz.correctIndex ? 1 : 0);
    }, 0);
    return { correct, total: topic.quizzes.length };
  }, [topic, answers]);

  function chooseTopic(slug) {
    setActiveSlug(slug);
    setTab('mindmap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) {
    return <Shell><div className="empty">Đang tải bộ ôn thi...</div></Shell>;
  }

  if (error && !topics.length) {
    return (
      <Shell>
        <div className="error-box">
          <h2>Chưa chạy được dữ liệu</h2>
          <p>{error}</p>
          <pre>cd server{`\n`}npm install{`\n`}cp .env.example .env{`\n`}npx prisma db push{`\n`}npm run seed{`\n`}npm run dev</pre>
          <pre>cd client{`\n`}npm install{`\n`}npm run dev</pre>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-icon">📚</div>
          <div>
            <h1>LSDCSVN</h1>
            <p>Mindmap + Quiz</p>
          </div>
        </div>

        <div className="sidebar-note">
          Chọn bất kỳ câu nào để ôn. Mỗi câu có sơ đồ tư duy SVG, ý chính, mẹo nhớ và quiz.
        </div>

        <nav className="topic-list">
          {topics.map((item) => (
            <button
              key={item.slug}
              className={item.slug === activeSlug ? 'topic-card active' : 'topic-card'}
              onClick={() => chooseTopic(item.slug)}
            >
              <span className="topic-number">Câu {item.number}</span>
              <strong>{item.title.replace(/^Câu \d+\.\s*/, '')}</strong>
              <small>{item.quizCount || 12} câu quiz</small>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        {!topic ? (
          <div className="empty">Đang mở câu ôn tập...</div>
        ) : (
          <>
            <section className="hero">
              <div>
                <span className="pill">Câu {topic.number}</span>
                <h2>{topic.title}</h2>
                <p>{topic.subtitle}</p>
              </div>
              <div className="hero-actions">
                <button onClick={() => window.print()} className="ghost-btn">In / lưu PDF</button>
                <a className="primary-btn" href={topic.mindmapUrl} target="_blank" rel="noreferrer">Mở ảnh mindmap</a>
              </div>
            </section>

            <div className="tabs">
              <button className={tab === 'mindmap' ? 'tab active' : 'tab'} onClick={() => setTab('mindmap')}>🧠 Sơ đồ tư duy</button>
              <button className={tab === 'notes' ? 'tab active' : 'tab'} onClick={() => setTab('notes')}>📝 Học chi tiết</button>
              <button className={tab === 'quiz' ? 'tab active' : 'tab'} onClick={() => setTab('quiz')}>✅ Quiz ({topic.quizzes.length})</button>
            </div>

            {tab === 'mindmap' && (
              <section className="panel">
                <div className="mindmap-wrap">
                  <img src={topic.mindmapUrl} alt={`Sơ đồ tư duy câu ${topic.number}`} />
                </div>
                <div className="two-col">
                  <div className="card">
                    <h3>Ý chính cần nắm</h3>
                    <ul className="clean-list">
                      {topic.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
                    </ul>
                  </div>
                  <div className="card mnemonic">
                    <h3>Mẹo nhớ lâu</h3>
                    <p>{topic.mnemonic}</p>
                  </div>
                </div>
              </section>
            )}

            {tab === 'notes' && (
              <section className="panel">
                <div className="overview-card">
                  <h3>Tổng quan</h3>
                  <p>{topic.overview}</p>
                </div>
                <div className="toolbar">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm nhanh trong bài, ví dụ: lực lượng, ý nghĩa, nhiệm vụ..."
                  />
                  {search && <button onClick={() => setSearch('')} className="ghost-btn small">Xóa tìm kiếm</button>}
                </div>
                <div className="section-list">
                  {filteredSections.map((section, index) => (
                    <details key={section.heading} open={index < 2 || Boolean(search)} className="lesson-section">
                      <summary>{section.heading}</summary>
                      <ul>
                        {section.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {tab === 'quiz' && (
              <section className="panel quiz-panel">
                <div className="quiz-head">
                  <div>
                    <h3>Luyện trắc nghiệm Câu {topic.number}</h3>
                    <p>Chọn đáp án rồi bấm nộp để xem điểm và giải thích từng câu.</p>
                  </div>
                  <div className="score-box">
                    <span>{submitted ? `${score.correct}/${score.total}` : `${Object.keys(answers).length}/${topic.quizzes.length}`}</span>
                    <small>{submitted ? 'điểm đúng' : 'đã làm'}</small>
                  </div>
                </div>

                <div className="progress">
                  <div style={{ width: `${((submitted ? score.correct : Object.keys(answers).length) / topic.quizzes.length) * 100}%` }} />
                </div>

                <div className="quiz-list">
                  {topic.quizzes.map((quiz, index) => {
                    const selected = answers[quiz.id];
                    const isCorrect = Number(selected) === quiz.correctIndex;
                    return (
                      <article key={quiz.id} className="quiz-card">
                        <div className="quiz-meta">
                          <span>Câu hỏi {index + 1}</span>
                          <em>{quiz.difficulty}</em>
                        </div>
                        <h4>{quiz.prompt}</h4>
                        <div className="options">
                          {quiz.options.map((option, optionIndex) => {
                            let className = 'option';
                            if (Number(selected) === optionIndex) className += ' selected';
                            if (submitted && optionIndex === quiz.correctIndex) className += ' correct';
                            if (submitted && Number(selected) === optionIndex && !isCorrect) className += ' wrong';
                            return (
                              <button
                                key={option}
                                className={className}
                                onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [quiz.id]: optionIndex }))}
                                disabled={submitted}
                              >
                                <span>{String.fromCharCode(65 + optionIndex)}</span>
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {submitted && (
                          <div className={isCorrect ? 'explain correct-text' : 'explain wrong-text'}>
                            <strong>{isCorrect ? 'Đúng rồi.' : 'Sai rồi.'}</strong> {quiz.explanation}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                <div className="quiz-actions">
                  <button
                    className="primary-btn"
                    onClick={() => setSubmitted(true)}
                    disabled={Object.keys(answers).length < topic.quizzes.length}
                  >
                    Nộp bài
                  </button>
                  <button
                    className="ghost-btn"
                    onClick={() => { setAnswers({}); setSubmitted(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Làm lại câu này
                  </button>
                  {Object.keys(answers).length < topic.quizzes.length && !submitted && (
                    <p className="hint">Bạn còn {topic.quizzes.length - Object.keys(answers).length} câu chưa chọn đáp án.</p>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="app-shell">{children}</div>;
}

createRoot(document.getElementById('root')).render(<App />);
