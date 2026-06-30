# ReLife AI — Backend

AI-powered sustainability platform. Upload a photo of any unused item.
Gemini Vision identifies it, assesses its condition, estimates its resale value in INR,
and tells you whether to Sell, Donate, Repair, or Recycle it.

---

## Stack

- Python 3.11+
- Flask 3.x
- Google Gemini Vision API (`gemini-1.5-flash`)
- Pillow (image handling)
- python-dotenv

---

## Setup (5 steps)

### 1. Clone / copy the project

```bash
cd ReLifeAI-Backend
```

### 2. Create a virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set your Gemini API key:

```
GEMINI_API_KEY=your_actual_key_here
```

Get a free key at: https://aistudio.google.com/app/apikey

### 5. Run the server

```bash
python app.py
```

Server starts at `http://localhost:5000`

---

## API Endpoints

### `GET /`
Returns app info and list of available endpoints.

---

### `GET /health`
Health check.

**Response:**
```json
{
  "status": "ok",
  "message": "ReLife AI backend is running"
}
```

---

### `POST /analyze`
Upload an image. Get full item analysis.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `image` (file — PNG, JPG, JPEG, WEBP, GIF)

**Response:**
```json
{
  "item_name": "Wooden Chair",
  "category": "Furniture",
  "condition": "Good",
  "estimated_value": "₹2500",
  "recommendation": "Sell",
  "eco_score": 82,
  "reason": "The chair is in good condition with minor scratches. It has strong resale potential on platforms like OLX."
}
```

---

### `POST /sustainability-score`
Upload an image. Get detailed sustainability metrics.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `image` (file)

**Response:**
```json
{
  "item_name": "Wooden Chair",
  "waste_reduction_score": 85,
  "carbon_impact": "Medium",
  "carbon_impact_kg": 12.5,
  "circular_economy_score": 78,
  "landfill_risk": "Low",
  "recommended_action": "Sell",
  "environmental_benefit": "Reselling this chair prevents approximately 12.5 kg of CO2 emissions from new furniture production."
}
```

---

### `POST /recommendation`
Upload an image. Get a lightweight recommendation only.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `image` (file)

**Response:**
```json
{
  "item_name": "Old Laptop",
  "condition": "Fair",
  "recommendation": "Repair",
  "eco_score": 55,
  "reason": "Screen has cracks but internals appear functional. Repair is more sustainable than disposal.",
  "source": "gemini_vision"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "short_error_type",
  "message": "Human-readable explanation"
}
```

| Code | Meaning |
|------|---------|
| 400  | Bad request — missing file, wrong format |
| 502  | Gemini returned unparseable output |
| 500  | Unexpected server error |

---

## Condition → Recommendation Logic

| Condition | Recommendation |
|-----------|----------------|
| Excellent | Sell           |
| Good      | Sell / Donate  |
| Fair      | Repair         |
| Poor      | Recycle        |

---

## Testing with cURL

```bash
# Full analysis
curl -X POST http://localhost:5000/analyze \
  -F "image=@/path/to/your/image.jpg"

# Sustainability score
curl -X POST http://localhost:5000/sustainability-score \
  -F "image=@/path/to/your/image.jpg"

# Recommendation only
curl -X POST http://localhost:5000/recommendation \
  -F "image=@/path/to/your/image.jpg"
```

---

## Testing with Postman

1. New request → POST → `http://localhost:5000/analyze`
2. Body tab → form-data
3. Add key: `image`, type: File
4. Select your image file
5. Send

---

## Project Structure

```
ReLifeAI-Backend/
├── app.py                  # Flask app factory + entry point
├── config.py               # Environment variable loading
├── gemini_service.py       # All Gemini Vision API calls + prompts
├── routes.py               # Blueprint registration
├── requirements.txt
├── .env.example
├── README.md
├── uploads/                # Temp image storage (auto-cleaned)
├── services/
│   ├── item_analysis.py    # POST /analyze
│   ├── sustainability.py   # POST /sustainability-score
│   └── recommendation.py  # POST /recommendation
├── models/
│   └── schemas.py          # Response shape definitions
└── utils/
    └── helpers.py          # File validation, saving, cleanup
```

---

## Notes

- Uploaded images are deleted immediately after Gemini processing completes.
- Gemini temperature is set to `0.2` for consistent, factual output.
- All JSON from Gemini is sanitized — markdown code fences are stripped before parsing.
- Max upload size: 16 MB (configurable via `MAX_UPLOAD_SIZE_MB` in `.env`).
