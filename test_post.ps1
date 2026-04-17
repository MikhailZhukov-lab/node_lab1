$body = @"
{
  "name": "Keyboard",
  "quantity": 10,
  "price": 50,
  "category": "electronics"
}
"@
curl.exe -s -X POST "http://127.0.0.1:3000/api/v1/inventory" -H "Content-Type: application/json" -d $body
