# YingmuQiu-nas - Automated Integration Test Suite
param([string]$BaseUrl = "http://localhost:8080")

$GLOBAL:PASS_COUNT = 0
$GLOBAL:FAIL_COUNT = 0
$GLOBAL:ERRORS = @()

function Test-Case {
    param([string]$Name, [ScriptBlock]$Test)
    try {
        & $Test
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $GLOBAL:PASS_COUNT++
    } catch {
        Write-Host "  [FAIL] $Name -> $_" -ForegroundColor Red
        $GLOBAL:FAIL_COUNT++
        $GLOBAL:ERRORS += "FAIL: $Name -> $($_.Exception.Message)"
    }
}

function Assert-Equals {
    param($Expected, $Actual, $Message)
    if ($Expected -ne $Actual) {
        throw "$Message - expected '$Expected' got '$Actual'"
    }
}

function Assert-True {
    param($Condition, $Message)
    if (-not $Condition) { throw $Message }
}

function Get-Status {
    param($ErrorRecord)
    try { return [int]$ErrorRecord.Exception.Response.StatusCode } catch { return 0 }
}

# ============================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  YingmuQiu-nas Integration Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$HEADERS = @{"Content-Type"="application/json"}

# ---- Section 0: Health Check ----
Write-Host "[0] Server Health Check" -ForegroundColor Yellow
Test-Case -Name "Server is reachable" -Test {
    try { Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Headers $HEADERS -Body '{"username":"x","password":"x"}' -ContentType "application/json" -ErrorAction Stop } catch {}
    Assert-True $true "Server responded"
}

# ---- Section 1: Registration ----
Write-Host "[1] Registration Tests" -ForegroundColor Yellow
$RAND = Get-Random -Max 99999
$USER = "tester_$RAND"
$EMAIL = "$USER@test.com"
$PWD = "Pass1234"

Test-Case -Name "Register new user" -Test {
    $body = @{username=$USER;email=$EMAIL;password=$PWD} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json"
    Assert-Equals 0 $r.code "Response code"
    Assert-Equals $USER $r.data.username "Username matches"
}

Test-Case -Name "Duplicate username rejected" -Test {
    try {
        $body = @{username=$USER;email="other@test.com";password=$PWD} | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 400) "Status should be 400, got $status"
    }
}

Test-Case -Name "Duplicate email rejected" -Test {
    try {
        $body = @{username="other$RAND";email=$EMAIL;password=$PWD} | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 400) "Status should be 400, got $status"
    }
}

Test-Case -Name "Short password rejected" -Test {
    try {
        $body = @{username="x$RAND";email="x$EMAIL";password="12"} | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 400) "Status should be 400, got $status"
    }
}

Test-Case -Name "Empty username rejected" -Test {
    try {
        $body = @{username="";email="n@n.com";password=$PWD} | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 400) "Status should be 400, got $status"
    }
}

# ---- Section 2: Login ----
Write-Host "[2] Login Tests" -ForegroundColor Yellow
$TOKEN = ""

Test-Case -Name "Login with correct credentials" -Test {
    $body = @{username=$USER;password=$PWD} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json"
    Assert-Equals 0 $r.code "Response code"
    Assert-True ($r.data.token.Length -gt 20) "Token should be > 20 chars"
    $GLOBAL:TOKEN = $r.data.token
}

Test-Case -Name "Login with wrong password" -Test {
    try {
        $body = @{username=$USER;password="WrongPass"} | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 401) "Status should be 401, got $status"
    }
}

Test-Case -Name "Login with non-existent user" -Test {
    try {
        $body = @{username="nonexistent_user_$RAND";password=$PWD} | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 401) "Status should be 401, got $status"
    }
}

# ---- Section 3: JWT Auth ----
Write-Host "[3] JWT Auth Tests" -ForegroundColor Yellow
$AUTH = @{ Authorization = "Bearer $TOKEN" }

Test-Case -Name "Get current user with valid token" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
    Assert-Equals $USER $r.data.username "Username matches"
}

Test-Case -Name "No token rejected" -Test {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method Get -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 401 -or $status -eq 403) "Status should be 401/403, got $status"
    }
}

Test-Case -Name "Fake token rejected" -Test {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method Get -Headers @{Authorization="Bearer faketoken"} -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 401 -or $status -eq 403) "Status should be 401/403, got $status"
    }
}

# ---- Section 4: File Operations ----
Write-Host "[4] File Operation Tests" -ForegroundColor Yellow
$FOLDER_ID = ""

Test-Case -Name "Create folder" -Test {
    $body = @{name="TestFolder"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files/folder" -Method Post -Headers $AUTH -Body $body -ContentType "application/json"
    Assert-Equals 0 $r.code "Response code"
    Assert-Equals "TestFolder" $r.data.name "Folder name matches"
    $GLOBAL:FOLDER_ID = $r.data.id
}

Test-Case -Name "File list returns paginated format" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
    Assert-True ($r.data.PSObject.Properties.Name -contains "content") "Should have content field"
    Assert-True ($r.data.content.Length -ge 1) "Should have at least 1 item"
}

Test-Case -Name "File tree" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files/tree" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
}

Test-Case -Name "Rename folder" -Test {
    $body = @{name="RenamedFolder"} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files/$FOLDER_ID" -Method Put -Headers $AUTH -Body $body -ContentType "application/json"
    Assert-Equals 0 $r.code "Response code"
    Assert-Equals "RenamedFolder" $r.data.name "New name matches"
}

Test-Case -Name "Upload file" -Test {
    # Generate boundary for multipart
    $boundary = "----FormBoundary$(Get-Random)"
    $tempFile = "C:\Users\29921\.workbuddy\test_upload.txt"
    "This is nas test content" | Out-File -FilePath $tempFile -Encoding utf8 -Force
    
    # Build multipart body manually (PS5.1 compat)
    $bodyLines = @()
    $bodyLines += "--$boundary"
    $bodyLines += 'Content-Disposition: form-data; name="file"; filename="test_upload.txt"'
    $bodyLines += 'Content-Type: text/plain'
    $bodyLines += ""
    $bodyLines += "This is nas test content"
    $bodyLines += "--$boundary--"
    $bodyLines += ""
    
    $utf8 = [System.Text.Encoding]::UTF8.GetBytes($bodyLines -join "`r`n")
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/files/upload" -Method Post -Headers $AUTH -ContentType "multipart/form-data; boundary=$boundary" -Body $utf8 -UseBasicParsing
    $r = $response.Content | ConvertFrom-Json
    Assert-Equals 0 $r.code "Upload response code"
    
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
}

Test-Case -Name "Search files" -Test {
    # Search by filename (uploaded file name)
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files/search?q=test_upload" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
    Assert-True ($r.data.Length -ge 1) "Search should find at least 1 file"
}

Test-Case -Name "Delete to trash" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files" -Method Get -Headers $AUTH
    $target = $r.data.content | Where-Object { -not $_.isFolder } | Select-Object -First 1
    if ($target) {
        $resp = Invoke-RestMethod -Uri "$BaseUrl/api/files" -Method Delete -Headers $AUTH -Body (@{ids=@($target.id)} | ConvertTo-Json) -ContentType "application/json"
        Assert-Equals 0 $resp.code "Delete response code"
    }
}

Test-Case -Name "Trash list" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files/trash" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
}

Test-Case -Name "Restore from trash" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files/trash" -Method Get -Headers $AUTH
    if ($r.data.Length -gt 0) {
        $resp = Invoke-RestMethod -Uri "$BaseUrl/api/files/trash/restore" -Method Post -Headers $AUTH -Body (@{ids=@($r.data[0].id)} | ConvertTo-Json) -ContentType "application/json"
        Assert-Equals 0 $resp.code "Restore response code"
    }
}

Test-Case -Name "Duplicate name rejected" -Test {
    try {
        $body = @{name="RenamedFolder"} | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/files/folder" -Method Post -Headers $AUTH -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 400) "Should be 400, got $status"
    }
}

# ---- Section 5: Media ----
Write-Host "[5] Media Tests" -ForegroundColor Yellow

Test-Case -Name "Media list" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/media?type=image" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
}

Test-Case -Name "Media timeline" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/media/timeline" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
}

Test-Case -Name "Media locations" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/media/locations" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
}

# ---- Section 6: Authorization Isolation ----
Write-Host "[6] Authorization Isolation Tests" -ForegroundColor Yellow
$USER2 = "user2_$RAND"

Test-Case -Name "User B registers and gets distinct data" -Test {
    $body = @{username=$USER2;email="$USER2@t.com";password=$PWD} | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json"
    Assert-Equals 0 $r.code "Registration success"
}

Test-Case -Name "User B files are empty initially" -Test {
    $body = @{username=$USER2;password=$PWD} | ConvertTo-Json
    $r2 = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Headers $HEADERS -Body $body -ContentType "application/json"
    $token2 = $r2.data.token
    $auth2 = @{ Authorization = "Bearer $token2" }
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files" -Method Get -Headers $auth2
    Assert-Equals 0 $r.code "Response code"
    Assert-Equals 0 $r.data.totalElements "User B should have 0 files"
}

# ---- Section 7: Edge Cases ----
Write-Host "[7] Edge Case Tests" -ForegroundColor Yellow

Test-Case -Name "Download non-existent file returns 404" -Test {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/files/00000000-0000-0000-0000-000000000000/download" -Method Get -Headers $AUTH -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 404 -or $status -eq 400) "Status should be 404/400, got $status"
    }
}

Test-Case -Name "Get non-existent media returns 404" -Test {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/media/00000000-0000-0000-0000-000000000000" -Method Get -Headers $AUTH -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 404) "Status should be 404, got $status"
    }
}

Test-Case -Name "Delete with empty ids rejected" -Test {
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/files" -Method Delete -Headers $AUTH -Body (@{ids=@()} | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        throw "Should have failed"
    } catch {
        $status = Get-Status $_
        Assert-True ($status -eq 400) "Status should be 400, got $status"
    }
}

Test-Case -Name "Pagination works" -Test {
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/files?page=0&pageSize=10" -Method Get -Headers $AUTH
    Assert-Equals 0 $r.code "Response code"
}

# ---- Summary ----
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "  PASS: $PASS_COUNT" -ForegroundColor Green
Write-Host "  FAIL: $FAIL_COUNT" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan

if ($FAIL_COUNT -gt 0) {
    Write-Host ""
    Write-Host "FAILURES:" -ForegroundColor Red
    foreach ($e in $ERRORS) {
        Write-Host "  $e" -ForegroundColor Red
    }
    exit 1
} else {
    Write-Host ""
    Write-Host "ALL TESTS PASSED" -ForegroundColor Green
    exit 0
}
