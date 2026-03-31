# API Documentation (curl)

Base URL:

- `http://127.0.0.1:8000`

## 1) Health Check

### Request

```bash
curl -X GET "http://127.0.0.1:8000/health"
```

### Response

```json
{
  "status": "ok",
  "message": "healthy"
}
```

## 2) Sentiment Analysis

### Request

```bash
curl -X POST "http://127.0.0.1:8000/sentiment" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"यो movie ramro cha 😊 10/10\"}"
```

### Response

```json
{
  "sentiment": "semi_positive",
  "label_id": 3,
  "confidence": 0.8831,
  "model": "sentiment_5class_model.pkl"
}
```

Sentiment labels now support:

- `negative` (0)
- `semi_negative` (1)
- `neutral` (2)
- `semi_positive` (3)
- `positive` (4)

Frontend integration map:

```json
{
  "0": "negative",
  "1": "semi_negative",
  "2": "neutral",
  "3": "semi_positive",
  "4": "positive"
}
```

Suggested UI severity map:

```json
{
  "negative": "high_risk",
  "semi_negative": "warning",
  "neutral": "neutral",
  "semi_positive": "good",
  "positive": "excellent"
}
```

Frontend should read:

- `sentiment`: display label
- `label_id`: stable numeric mapping
- `confidence`: show score/progress bar
- `model`: can be logged for diagnostics

### Frontend Fetch Example

```bash
curl -X POST "http://127.0.0.1:8000/sentiment" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"यो नीतिमा केही सुधार चाहिन्छ तर पूर्ण नराम्रो छैन\"}"
```

## 3) Spell Correction

### Request (suggest-only)

```bash
curl -X POST "http://127.0.0.1:8000/spell-correct" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"म नेपाल जाान्छु।\",\"suggest_only\":true}"
```

### Response

```json
{
  "original_text": "म नेपाल जाान्छु।",
  "corrected_text": "म नेपाल जाान्छु।",
  "suggestions": [
    {
      "index": 2,
      "from": "जाान्छु",
      "suggest": "जान्छु",
      "edit_distance": 1
    }
  ]
}
```

### Request (auto-correct)

```bash
curl -X POST "http://127.0.0.1:8000/spell-correct" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"म नेपाल जाान्छु।\",\"suggest_only\":false}"
```

## 4) Word Prediction

### Request

```bash
curl -X POST "http://127.0.0.1:8000/word-predict" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"नेपाल एक\",\"top_k\":5}"
```

### Response

```json
{
  "context": "नेपाल एक",
  "predictions": [
    {
      "word": "सुन्दर",
      "probability": 0.42
    },
    {
      "word": "देश",
      "probability": 0.27
    },
    {
      "word": "राम्रो",
      "probability": 0.18
    }
  ]
}
```

## 5) Error Response

```json
{
  "detail": "text must not be empty"
}
```

## Run Server

```bash
uvicorn app:app --reload
```

OpenAPI Docs:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`
