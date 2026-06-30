# ReLife AI — Frontend (Phase 1 + Phase 2)

> **Give Every Item a Second Life**

AI-powered sustainability platform that analyses household items via a Flask backend and recommends the most eco-friendly action: Sell, Donate, Repair, or Recycle.

---

## 📁 Folder Structure

```
ReLifeAI-Frontend/
├── index.html           ← Home / Landing page
├── upload.html          ← Upload & drag-and-drop + API call
├── result.html          ← Dynamic AI result display
├── dashboard.html       ← Sustainability dashboard (Phase 2)
│
├── css/
│   └── style.css        ← All styles (tokens, components, pages, dashboard)
│
├── js/
│   └── app.js           ← All JS (nav, upload, API, results, dashboard)
│
├── assets/
│   ├── logo.svg         ← Gradient wordmark SVG
│   └── icons/
│       └── icons.svg    ← SVG icon sprite (22 icons)
│
└── README.md
```

---

## 🚀 Local Setup

### 1. Start the Flask backend

```bash
# In your Flask project directory:
pip install flask flask-cors pillow

python app.py
# → Running on http://127.0.0.1:5001
```

Your Flask app must accept:

```
POST http://127.0.0.1:5001/analyze
Content-Type: multipart/form-data
Field: image  (the uploaded file)
```

And return JSON:

```json
{
  "item_name":       "Vintage Denim Jacket",
  "category":        "Clothing & Apparel",
  "condition":       "Very Good",
  "estimated_value": "$45 – $80",
  "recommendation":  "sell",
  "eco_score":       "78",
  "reason":          "Vintage denim is trending on resale platforms..."
}
```

### 2. Open the frontend

```bash
# Option A — open directly (no server needed for basic use)
open index.html

# Option B — local dev server (required for fetch() to work without CORS issues)
npx serve .
# → http://localhost:3000

# Option C — Python server
python3 -m http.server 8080
# → http://localhost:8080
```

### 3. Enable CORS on Flask

```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # allow requests from your frontend origin
```

---

## ⚙️ Configuration

Edit the top of `js/app.js`:

```javascript
const CONFIG = {
  API_URL:     'http://127.0.0.1:5001/analyze', // Flask endpoint
  API_TIMEOUT: 30000,                            // ms before timeout
  USE_MOCK:    false,                            // true = always use demo data
};
```

| Setting | Default | Description |
|---------|---------|-------------|
| `API_URL` | `http://127.0.0.1:5001/analyze` | Flask backend URL |
| `API_TIMEOUT` | `30000` | Request timeout in milliseconds |
| `USE_MOCK` | `false` | Force demo mode (bypasses real API) |

---

## 📄 Pages

### `index.html` — Home
- Fixed glassmorphism navbar + mobile hamburger with smooth transitions
- Full-viewport hero with animated gradient headline
- Animated stat counters triggered by IntersectionObserver
- 3-step How It Works cards with hover microinteractions
- Impact CTA with glow effects

### `upload.html` — Upload & Analyse
- Drag-and-drop zone with live visual feedback
- File picker fallback; image preview with remove button
- **Live API mode badge** showing Flask connection status
- **Real fetch() call** to `POST /analyze` with FormData
- Multi-step loading overlay with concurrent API + animation
- **Error banner** with specific messages:
  - Flask not running → "Cannot reach backend"
  - Timeout → "Request timed out"
  - Server error → HTTP status + message
- **Auto-fallback** to demo mode on error (with toast notification)

### `result.html` — Results
- Restores uploaded image from sessionStorage
- **API mode badge** — Live / Demo indicator
- Animated SVG eco-score ring (green/yellow/red by score)
- All fields dynamically populated from Flask response
- **AI Reason** row shows Flask's explanation text
- Condition rendered as 5-dot visual scale
- 4 recommendation cards; best match highlighted + first in order
- Share (Web Share API) / Print / Dashboard / New Scan actions
- Auto-saves result to localStorage for dashboard

### `dashboard.html` — Sustainability Dashboard *(Phase 2)*
- 4 KPI cards: Items Scanned · CO₂ Saved · Waste Diverted · Circularity Score
- Animated progress bars (IntersectionObserver triggered)
- **Live SVG line chart** — CO₂ savings by day (last 7 days, from history)
- **Donut chart** — Actions breakdown (Sell/Donate/Repair/Recycle)
- Monthly goals with animated progress bars
- Top categories bar chart
- Recent scans activity feed (last 8 items, from localStorage)
- Community impact banner (global stats)
- Clear history button

---

## 🔌 API Integration Details

### Request

```javascript
const formData = new FormData();
formData.append('image', file);  // the File object from input

const response = await fetch('http://127.0.0.1:5001/analyze', {
  method: 'POST',
  body: formData,
  signal: AbortController.signal,  // timeout handling
});
```

### Response mapping

| Flask field | Internal field | Used in |
|-------------|---------------|---------|
| `item_name` | `name` | Result page title |
| `category` | `category` | Detail row + dashboard |
| `condition` | `condition` (1–5 mapped) | Dot scale |
| `estimated_value` | `estimatedValue` | Value badge |
| `recommendation` | `bestMatch` | Best card highlight |
| `eco_score` | `ecoScore` | Animated ring |
| `reason` | `reason` | AI Reason row |

### Condition string → dot score mapping

| Flask string | Dot score |
|-------------|-----------|
| `Poor` | 1 |
| `Fair` | 2 |
| `Good` | 3 |
| `Very Good` | 4 |
| `Excellent` | 5 |

---

## 🎨 Design System

### Colour Tokens
| Token | Hex | Use |
|-------|-----|-----|
| `--ocean` | `#0A1628` | Background |
| `--green` | `#1DB954` | Primary / eco |
| `--sky` | `#0EA5E9` | Secondary accent |
| `--violet` | `#7C3AED` | Tertiary / repair |
| `--glass-bg` | `rgba(255,255,255,0.06)` | Card backgrounds |

### Typography
- **Sora** — Display, headings, KPI numbers (700–800 weight)
- **Inter** — Body, UI labels, metadata (400–600 weight)

### Signature element
The **Eco Aura** — dual pulsing radial gradient orbs fixed to the page background. Breathes life into every screen without any image assets.

---

## 🗃️ Data Persistence

Results are saved to `localStorage` under the key `relife_history` after every successful analysis. The dashboard reads this to build all charts, KPIs, and the activity feed.

```javascript
// Manual access from browser console:
JSON.parse(localStorage.getItem('relife_history'))
```

Each entry stores:
```json
{
  "id": 1719123456789,
  "timestamp": "2025-06-13T14:22:00.000Z",
  "name": "Vintage Denim Jacket",
  "category": "Clothing & Apparel",
  "ecoScore": 78,
  "value": "$45 – $80",
  "bestMatch": "sell",
  "condition": 4
}
```

---

## ♿ Accessibility

- Semantic HTML5 landmarks on every page
- `aria-label`, `aria-live`, `aria-modal`, `role` attributes throughout
- Keyboard-navigable upload zone (`tabindex="0"`, `onkeydown`)
- Toast notifications use `aria-live="assertive"` / `"polite"`
- All charts have `role="img"` with descriptive `aria-label`
- Focus styles from browser defaults preserved

---

## 🗺️ Roadmap

- [ ] Phase 3: User accounts + cloud-synced history
- [ ] Real-time platform deep-links (Depop, eBay, Goodwill locator by postcode)
- [ ] PWA manifest + service worker for offline support
- [ ] Email report generation (weekly impact digest)
- [ ] Multi-item batch upload
- [ ] Community leaderboard

---

*ReLife AI · Phase 2 · HTML5 + CSS3 + Vanilla JS · Flask backend on :5001*
