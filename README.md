# Web ôn thi LSDCSVN - Sơ đồ tư duy + Quiz

Dự án này được tạo để ôn 8 câu trong file ghi chép LSDCSVN. Mỗi câu có:

- Trang học riêng theo từng câu.
- Sơ đồ tư duy dạng ảnh SVG tự tạo trong `client/public/mindmaps`.
- Phần học chi tiết chia mục rõ ràng, có mẹo nhớ.
- 96 câu quiz trắc nghiệm, trung bình 12 câu/câu ôn tập.
- Backend Express + Prisma ORM + SQLite để lưu Topic và Quiz.

## Công nghệ

- Frontend: React + Vite
- Backend: Node.js + Express.js
- ORM/Database: Prisma ORM + SQLite
- Mindmap: SVG tĩnh, dễ mở trực tiếp hoặc nhúng vào web

## Cách chạy

### 1. Chạy backend

```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Backend chạy ở:

```bash
http://localhost:4000
```

API chính:

```bash
GET  /api/topics
GET  /api/topics/:slug
POST /api/quiz/check
```

### 2. Chạy frontend

Mở terminal khác:

```bash
cd client
npm install
npm run dev
```

Frontend chạy ở:

```bash
http://localhost:5173
```

## Cấu trúc thư mục

```bash
lsd-on-thi-web/
├── client/
│   ├── public/mindmaps/       # 8 ảnh sơ đồ tư duy SVG
│   └── src/                   # React UI
├── server/
│   ├── prisma/schema.prisma   # Prisma schema
│   ├── prisma/seed.js         # Seed database
│   └── src/data/studyData.js  # Dữ liệu 8 câu + quiz
└── README.md
```

## Gợi ý học nhanh

1. Vào từng câu, nhìn sơ đồ tư duy trước.
2. Đọc phần học chi tiết, tập trung các mục: bối cảnh, nội dung, ý nghĩa.
3. Làm quiz ngay sau khi đọc.
4. Nếu sai, đọc phần giải thích rồi làm lại.
5. In trang hoặc bấm “Mở ảnh mindmap” để lưu sơ đồ tư duy từng câu.


## Deploy lên Render + Vercel

Mô hình deploy khuyên dùng:

- Backend Express + Prisma SQLite deploy lên Render.
- Frontend React + Vite deploy lên Vercel.
- Frontend gọi API Render qua biến môi trường `VITE_API_BASE_URL`.

### 1. Đẩy code lên GitHub

```bash
cd lsd-on-thi-web
git init
git add .
git commit -m "Deploy LSD on thi web"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

### 2. Deploy backend trên Render

Tạo Web Service mới trên Render, chọn repo GitHub và cấu hình:

```txt
Root Directory: server
Runtime/Environment: Node
Build Command: npm install && npx prisma generate && npx prisma db push && npm run seed
Start Command: npm start
```

Environment variables:

```txt
DATABASE_URL=file:./dev.db
NODE_ENV=production
CLIENT_ORIGIN=https://YOUR_VERCEL_DOMAIN.vercel.app
```

Sau khi deploy backend xong, Render sẽ cấp URL dạng:

```txt
https://YOUR_RENDER_SERVICE.onrender.com
```

Kiểm tra API:

```txt
https://YOUR_RENDER_SERVICE.onrender.com/api/health
https://YOUR_RENDER_SERVICE.onrender.com/api/topics
```

### 3. Deploy frontend trên Vercel

Import cùng repo GitHub trên Vercel và cấu hình:

```txt
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Environment variable trên Vercel:

```txt
VITE_API_BASE_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
```

Sau khi có domain Vercel thật, quay lại Render sửa `CLIENT_ORIGIN` thành domain đó rồi redeploy backend.

### 4. Lưu ý SQLite

Dữ liệu quiz trong project là dữ liệu học tĩnh, được seed khi build nên có thể dùng SQLite để ôn thi nhanh. Nếu sau này muốn lưu điểm từng người dùng, tài khoản, lịch sử làm bài lâu dài thì nên đổi sang PostgreSQL trên Render.
