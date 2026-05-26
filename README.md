# PawTrace India

A community-driven stray dog directory for Indian cities. Spot, report, and track stray dogs using AI-assisted breed identification and similarity matching.

## Features

- **Home** — landing page with quick actions and recent activity
- **Dog search** — browse and filter sightings by breed, colour, size, or upload a photo for visual similarity matching
- **Report a dog** — photograph a stray or lost pet; AI identifies the breed and checks for duplicates
- **Status tracking** — mark dogs as sighted / being rescued / in shelter / reunited
- **Lost pet flow** — report a missing pet with owner contact details
- **Vaccination records** — log vaccination history per dog
- **Stats** — city-level breakdown of breeds, sightings, and rescue rates
- **Auth** — sign up / sign in via Supabase; profile page per user

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite, port 3002 |
| Backend | FastAPI + Uvicorn, port 5000 |
| Database | Supabase (Postgres + Storage + Auth) |
| ML — detection | YOLOv8n (COCO class 16 — dog) |
| ML — classification | MobileNetV2 fine-tuned on 12 Indian breeds |
| ML — dedup | Dense(128) feature extractor + cosine similarity (threshold 0.85) |
| AI vision (optional) | Anthropic Claude (falls back to mock if key absent) |

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- A [Supabase](https://supabase.com) project (free tier is fine)
- `stray_dog_model.h5` — included in the repo under `straydogs-backend/`

---

## 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL editor** and run the contents of `straydogs/supabase/schema.sql`. This creates the `profiles` and `dogs` tables, RLS policies, triggers, and seed data.
3. In **Project Settings → API**, note your:
   - Project URL (`https://xxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key (backend only — keep private)
4. In **Storage**, create a public bucket named `dog-photos`.

---

## 2. Backend Setup

```bash
cd straydogs-backend
```

### Environment variables

Create a `.env` file (never commit this):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Model files

`stray_dog_model.h5` is included in the repo. The `yolov8n.pt` weights are downloaded automatically by Ultralytics on first run.

### Install dependencies

```bash
pip install -r requirements.txt
```

> TensorFlow + YOLO take ~35 seconds to load on first start — this is expected.

### Start the backend

```bash
python app.py
```

Wait for:
```
Application startup complete.
```

The API is now running at `http://localhost:5000`.  
Interactive docs: `http://localhost:5000/docs`

---

## 3. Frontend Setup

Open a **new terminal**:

```bash
cd straydogs
```

### Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional — leave blank to use mock AI responses
VITE_ANTHROPIC_API_KEY=sk-ant-your-key
```

### Install dependencies

```bash
npm install
```

### Start the frontend

```bash
npm run dev
```

App runs at `http://localhost:3002`.

---

## Project Structure

```
straydogs_main/
├── straydogs/                  # React frontend
│   ├── src/
│   │   ├── App.jsx             # State-machine router (no React Router)
│   │   ├── lib/
│   │   │   ├── data.js         # Supabase queries
│   │   │   ├── supabase.js     # Supabase client
│   │   │   └── vision.js       # Anthropic / mock AI calls
│   │   └── pages/
│   │       ├── Home.jsx        # Landing page
│   │       ├── Feed.jsx        # Browse & filter dog sightings
│   │       ├── Search.jsx      # Visual similarity search
│   │       ├── Report.jsx      # Report a dog (camera + form)
│   │       ├── Dog.jsx         # Individual dog detail
│   │       ├── Stats.jsx       # City statistics
│   │       ├── Profile.jsx     # User profile
│   │       └── Auth.jsx        # Sign in / sign up
│   ├── supabase/schema.sql     # Database schema (run once)
│   └── .env.example
│
├── straydogs-backend/          # FastAPI backend
│   ├── app.py                  # All routes + ML pipeline
│   ├── class_labels.json       # 12 breed label map
│   ├── requirements.txt
│   └── .env                    # SUPABASE_URL + SUPABASE_SERVICE_KEY (not in repo)
│
└── yolov8n.pt                  # YOLO weights (auto-downloaded if missing)
```

---

## Backend API

| Method | Route | Description |
|---|---|---|
| `GET` | `/status` | Health check + model info |
| `POST` | `/analyse` | Run YOLO + MobileNetV2 on a base64 image |
| `POST` | `/analyse-batch` | Analyse multiple images |
| `POST` | `/save` | Save a dog record + feature vector to Supabase |
| `GET` | `/db` | Fetch all dogs from Supabase |
| `POST` | `/search` | Visual + attribute search with geo-ranking (haversine, 70% similarity + 30% proximity) |

---

## Notes

- **No CSS files** — all styles are inline JS objects (`style={{}}`).
- **No React Router** — page state is managed via `useState` in `App.jsx`. Navigate by calling `setPage('pagename')`.
- The backend must be running before the frontend if you want AI breed analysis. The frontend degrades gracefully (mock responses) if the backend is unreachable and no Anthropic key is set.
- If port 5000 is occupied on Windows:
  ```powershell
  $p = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
  if ($p) { Stop-Process -Id $p -Force }
  ```
