$jsonContent = '[{"name": "Imported Item 1", "quantity": 50, "price": 75, "category": "imported"}, {"name": "Imported Item 2", "quantity": 30, "price": 150, "category": "imported"}]'
$jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonContent)

Add-Type -AssemblyName System.Net.Http

$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent

$byteContent = New-Object System.Net.Http.ByteArrayContent(, $jsonBytes)
$byteContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/json")
$content.Add($byteContent, "file", "test_import.json")

try {
    $result = $client.PostAsync("http://127.0.0.1:3000/api/v1/inventory/import", $content).GetAwaiter().GetResult()
    Write-Host $result.StatusCode
    Write-Host $result.Content.ReadAsStringAsync().GetAwaiter().GetResult()
} catch {
    Write-Host $_.Exception.Message
}
