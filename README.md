# ♻️ ReLife AI

> Give Every Item a Second Life with AI

ReLife AI is an AI-powered sustainability platform that analyzes everyday items from an image and recommends the best eco-friendly action—whether to **sell, donate, repair, upcycle, or recycle**. The platform combines Google Gemini Vision with a Flask backend to encourage responsible consumption and reduce waste.

---

## 🌍 Problem Statement

Millions of reusable products end up in landfills because people are unsure of the most sustainable way to dispose of them.

ReLife AI helps users make informed decisions by automatically identifying an item, estimating its condition, and suggesting the most environmentally responsible action.

---

## ✨ Features

- 📸 Upload an image of any household item
- 🤖 AI-powered item recognition using Google Gemini Vision
- 📂 Automatic category detection
- ⭐ Condition estimation
- 💰 Estimated resale value
- 🌱 Eco Score generation
- ♻️ Smart sustainability recommendations
- 📊 Dashboard for tracking analyses
- 📱 Responsive modern UI

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Responsive Design

### Backend
- Python
- Flask
- Google Gemini API

### AI
- Gemini Vision API

---

## 📁 Project Structure

```
ReLife-AI/
│
├── Backend/
│   ├── app.py
│   ├── routes.py
│   ├── recommendation.py
│   ├── sustainability.py
│   ├── item_analysis.py
│   ├── helpers.py
│   ├── gemini_service.py
│   ├── config.py
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── upload.html
│   ├── result.html
│   ├── dashboard.html
│   ├── css/
│   ├── js/
│   └── assets/
│
└── README.md
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/tanishaguptaa115/ReLife-AI.git
```

### Navigate

```bash
cd ReLife-AI
```

### Install Backend Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### Configure Environment

Create a `.env` file inside the Backend folder.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### Start Flask Backend

```bash
python app.py
```

Backend runs on:

```
http://127.0.0.1:5001
```

### Run Frontend

Open the `frontend` folder using VS Code Live Server.

---

## 🔄 Workflow

1. Upload an item image.
2. Image is sent to the Flask backend.
3. Gemini Vision analyzes the item.
4. Backend estimates:
   - Item Name
   - Category
   - Condition
   - Estimated Value
   - Eco Score
5. AI recommends the best sustainable action.
6. Results are displayed with an interactive dashboard.

---

## 🌱 Sustainability Impact

ReLife AI encourages users to:

- Reduce landfill waste
- Promote reuse and donation
- Support the circular economy
- Make environmentally responsible decisions

---

## 📸 Screenshots

### Home
(Add Screenshot)

### Upload
(Add Screenshot)

### Results
(Add Screenshot)

### Dashboard
(Add Screenshot)

---

## 🔮 Future Enhancements

- User authentication
- Marketplace integration
- Nearby donation center locator
- Barcode scanning
- Carbon footprint tracking
- Community sharing
- Mobile application
- Multi-language support

---

## 👩‍💻 Developed By

**Tanisha Gupta**

B.Tech CSE (AI)  
Bennett University

GitHub: https://github.com/tanishaguptaa115

---

## 📜 License

This project is intended for educational, research, and hackathon purposes.
