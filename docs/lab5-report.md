# Lab 5 Notes

## Endpoints

Examples below can be used in Postman, Bruno, Insomnia, or `curl`.

```bash
curl "http://127.0.0.1:3000/inventory?category=electronics"
curl "http://127.0.0.1:3000/inventory?category=electronics"
curl -X POST "http://127.0.0.1:3000/inventory" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Keyboard\",\"quantity\":10,\"price\":50,\"category\":\"electronics\"}"
curl -X PATCH "http://127.0.0.1:3000/inventory/1" \
  -H "Content-Type: application/json" \
  -d "{\"price\":1299}"
curl -X DELETE "http://127.0.0.1:3000/inventory/3"
curl -OJ "http://127.0.0.1:3000/inventory/export"
curl -X POST "http://127.0.0.1:3000/inventory/import" \
  -F "file=@test_import.csv"
curl -X POST "http://127.0.0.1:3000/inventory/1/image" \
  -F "file=@test_image.png"
```

Image URLs are returned as full absolute links, for example:

```text
http://127.0.0.1:3000/1/image.png
```

## Exceptions Handled

- Missing `data/items/` or `data/version.json` files and directories are created automatically when needed.
- Missing item files return `null` in the repository and `404` in HTTP handlers.
- Atomic write failures clean up `{id}.tmp.json` before rethrowing the original error.
- Unsupported import formats return `400`.
- Invalid CSV or JSON payloads return `400`.
- Import validation errors are collected into a rejection report with file line numbers and reasons.
- Uploads reject unsupported MIME types and files larger than 5 MB.
- Startup continues even if model hash differs; the server only logs a warning and suggests `npm run migrate`.

## Verification

- Run `npm run seed` to recreate the base dataset.
- Run `npm run migrate` to sync stored files with `src/models/item.model.js`.
- Start the server with `npm start`.
- Make one screenshot per endpoint manually in your HTTP client if they are required for submission.
