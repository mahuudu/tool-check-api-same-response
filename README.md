## 🔍 API Comparison

This project supports analyzing and comparing two API requests extracted from cURL commands. The comparison includes:

| Field        | API #1                                | API #2                                | Difference                  |
|--------------|----------------------------------------|----------------------------------------|-----------------------------|
| **Method**   | `POST`                                 | `POST`                                 | ✅ No difference             |
| **URL**      | `https://api.example.com/v1/resource`  | `https://api.example.com/v1/resource`  | ✅ No difference             |
| **Headers**  | `Authorization: Bearer ...`            | `Authorization: Bearer ...`            | ✅ No difference             |
| **Payload**  | `{ "a": 1, "b": 2 }`                   | `{ "a": 1, "b": 3 }`                   | `"b"` changed from 2 → 3    |
| **Response** | `{ "status": "ok" }`                   | `{ "status": "ok" }`                   | ✅ No difference             |
