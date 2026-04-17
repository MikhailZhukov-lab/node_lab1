$imagePath = "C:\Users\zukov\OneDrive\Desktop\Lab\lab_1\test_image2.png"
$imageBytes = [System.IO.File]::ReadAllBytes($imagePath)

Add-Type -AssemblyName System.Net.Http

$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent

$byteContent = New-Object System.Net.Http.ByteArrayContent(, $imageBytes)
$byteContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$content.Add($byteContent, "file", "test_image2.png")

$result = $client.PostAsync("http://127.0.0.1:3000/api/v1/items/7/image", $content).GetAwaiter().GetResult()
Write-Host $result.Content.ReadAsStringAsync().GetAwaiter().GetResult()
