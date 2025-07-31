Write-Host "Testing API endpoint..."

$body = @{
    email = 'test@example.com'
    name = 'Test User'
    password = 'TestPass123!'
} | ConvertTo-Json

Write-Host "Request body: $body"

try {
    Write-Host "Sending POST request to http://localhost:3579/api/developer/register"
$response = Invoke-RestMethod -Uri 'http://localhost:3579/api/developer/register' -Method POST -ContentType 'application/json' -Body $body -Verbose
    Write-Host "Success!"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Error occurred:"
    Write-Host "Exception: $($_.Exception.Message)"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody"
            $reader.Close()
        } catch {
            Write-Host "Could not read response body: $($_.Exception.Message)"
        }
    }
}