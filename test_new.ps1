$csvContent = "name,quantity,price,category`nNew Image Item,10,50,test"
$csvBytes = [System.Text.Encoding]::UTF8.GetBytes($csvContent)

Add-Type -AssemblyName System.Net.Http

$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent

$byteContent = New-Object System.Net.Http.ByteArrayContent(, $csvBytes)
$byteContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("text/csv")
$content.Add($byteContent, "file", "test_new.csv")

$result = $client.PostAsync("http://127.0.0.1:3000/api/v1/items/import", $content).GetAwaiter().GetResult()
$importResult = $result.Content.ReadAsStringAsync().GetAwaiter().GetResult()
Write-Host $importResult
