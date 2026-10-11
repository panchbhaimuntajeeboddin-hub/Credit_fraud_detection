$baseUrl = "http://localhost:5173"

function Run-Tests {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host " STARTING COMPREHENSIVE AUTHENTICATION VERIFICATION TESTS " -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    $failures = 0

    # Clean up test users from db first if needed, or use unique timestamped emails
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $emailA = "sarah.connor.$ts@cyberdyne.io"
    $emailB = "james.holden.$ts@rocinante.org"
    $emailDup = "elena.dup.$ts@nova.tech"

    # TEST 1: New Account Registration (Sarah Connor)
    Write-Host "`n[TEST 1] New account registration for Sarah Connor..." -ForegroundColor Yellow
    $userA = @{
        firstName = "Sarah"
        lastName = "Connor"
        email = $emailA
        company = "Cyberdyne Systems"
        password = "Password123!"
    } | ConvertTo-Json
    
    try {
        $resA = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $userA -ContentType "application/json"
        if ($resA.success -and $resA.user.email -eq $emailA -and $resA.token -and $resA.user.firstName -eq "Sarah") {
            Write-Host " PASS: Account A registered successfully. User ID: $($resA.user.id)" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Unexpected registration response" -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Test 1 exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST 2: Existing / Duplicate Email Registration
    Write-Host "`n[TEST 2] Duplicate email registration for Sarah Connor (should fail with 409)..." -ForegroundColor Yellow
    try {
        $dupRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $userA -ContentType "application/json"
        Write-Host " FAIL: Expected 409 Conflict, but request succeeded" -ForegroundColor Red
        $failures++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $stream.ReadToEnd() | ConvertFrom-Json
        if ($code -eq 409 -and $body.error -like "*already exists*") {
            Write-Host " PASS: Rejected duplicate email with status 409: '$($body.error)'" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Wrong status or message: $code, $($body.error)" -ForegroundColor Red
            $failures++
        }
    }

    # TEST 3: Duplicate Registration with Different Casing (case-insensitivity check)
    Write-Host "`n[TEST 3] Duplicate email with uppercase casing (should also fail with 409)..." -ForegroundColor Yellow
    $userAUpper = @{
        firstName = "Sarah"
        lastName = "Connor"
        email = $emailA.ToUpper()
        company = "Cyberdyne Systems"
        password = "Password123!"
    } | ConvertTo-Json
    try {
        $dupResUpper = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $userAUpper -ContentType "application/json"
        Write-Host " FAIL: Expected 409 Conflict for uppercase email, but request succeeded" -ForegroundColor Red
        $failures++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $stream.ReadToEnd() | ConvertFrom-Json
        if ($code -eq 409 -and $body.error -like "*already exists*") {
            Write-Host " PASS: Case-insensitive check passed with 409: '$($body.error)'" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Case-insensitive registration check failed: $code" -ForegroundColor Red
            $failures++
        }
    }

    # TEST 4: Separate Account Registration & Session Isolation
    Write-Host "`n[TEST 4] Register separate Account B (James Holden) and verify Session Isolation..." -ForegroundColor Yellow
    $userB = @{
        firstName = "James"
        lastName = "Holden"
        email = $emailB
        company = "Rocinante Logistics"
        password = "Password456!"
    } | ConvertTo-Json

    try {
        $resB = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $userB -ContentType "application/json"
        $tokenB = $resB.token

        # Query /api/auth/me for User A
        $headersA = @{ Authorization = "Bearer " + $resA.token }
        $meA = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headersA

        # Query /api/auth/me for User B
        $headersB = @{ Authorization = "Bearer " + $tokenB }
        $meB = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headersB

        if ($meA.user.email -eq $emailA -and $meB.user.email -eq $emailB -and $meA.user.id -ne $meB.user.id -and $meA.user.firstName -eq "Sarah" -and $meB.user.firstName -eq "James") {
            Write-Host " PASS: Account A ($($meA.user.firstName) / $($meA.user.company)) and Account B ($($meB.user.firstName) / $($meB.user.company)) are completely isolated!" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Account isolation failed! Me(A)=$($meA.user.email), Me(B)=$($meB.user.email)" -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Test 4 exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST 5: Login with Account B credentials
    Write-Host "`n[TEST 5] Login with Account B credentials..." -ForegroundColor Yellow
    $loginB = @{
        email = $emailB
        password = "Password456!"
    } | ConvertTo-Json

    try {
        $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginB -ContentType "application/json"
        if ($loginRes.success -and $loginRes.user.email -eq $emailB -and $loginRes.user.firstName -eq "James" -and $loginRes.token) {
            Write-Host " PASS: Account B authenticated successfully. Welcome $($loginRes.user.firstName) $($loginRes.user.lastName)!" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Incorrect login result" -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Test 5 exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST 6: Login with invalid password
    Write-Host "`n[TEST 6] Login with incorrect password (should fail with 401)..." -ForegroundColor Yellow
    $invalidLogin = @{
        email = $emailB
        password = "WrongPassword999!"
    } | ConvertTo-Json

    try {
        $badRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $invalidLogin -ContentType "application/json"
        Write-Host " FAIL: Expected 401 Unauthorized, but login succeeded" -ForegroundColor Red
        $failures++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $stream.ReadToEnd() | ConvertFrom-Json
        if ($code -eq 401 -and $body.error -like "*Invalid email or password*") {
            Write-Host " PASS: Rejected invalid password with status 401: '$($body.error)'" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Wrong status or message: $code, $($body.error)" -ForegroundColor Red
            $failures++
        }
    }

    # TEST 7: Input validation checks
    Write-Host "`n[TEST 7] Input validation error handling..." -ForegroundColor Yellow
    $invalidCases = @(
        @{ desc = "Missing first name"; body = @{ firstName = ""; lastName = "Doe"; email = "a@b.com"; company = "C"; password = "Password123!" }; expected = "First name is required." },
        @{ desc = "Missing last name"; body = @{ firstName = "John"; lastName = ""; email = "a@b.com"; company = "C"; password = "Password123!" }; expected = "Last name is required." },
        @{ desc = "Invalid email format"; body = @{ firstName = "John"; lastName = "Doe"; email = "invalid-email"; company = "C"; password = "Password123!" }; expected = "valid work email" },
        @{ desc = "Missing company"; body = @{ firstName = "John"; lastName = "Doe"; email = "john@example.com"; company = ""; password = "Password123!" }; expected = "Company name is required." },
        @{ desc = "Password under 8 chars"; body = @{ firstName = "John"; lastName = "Doe"; email = "john@example.com"; company = "C"; password = "short" }; expected = "at least 8 characters" }
    )

    foreach ($case in $invalidCases) {
        $json = $case.body | ConvertTo-Json
        try {
            $r = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $json -ContentType "application/json"
            Write-Host " FAIL: Invalid input '$($case.desc)' unexpectedly succeeded: $json" -ForegroundColor Red
            $failures++
        } catch {
            $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errBody = $stream.ReadToEnd()
            if ($errBody -like "*$($case.expected)*") {
                Write-Host " PASS: $($case.desc) -> Correctly rejected with: $($case.expected)" -ForegroundColor Green
            } else {
                Write-Host " FAIL: $($case.desc) -> Unexpected error response: $errBody" -ForegroundColor Red
                $failures++
            }
        }
    }

    # TEST 8: Logout endpoint
    Write-Host "`n[TEST 8] Logout endpoint test..." -ForegroundColor Yellow
    try {
        $logoutRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" -Method Post
        if ($logoutRes.success) {
            Write-Host " PASS: Logout endpoint responded with success and cleared session cookie." -ForegroundColor Green
        } else {
            Write-Host " FAIL: Logout returned unexpected response" -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Logout exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST 9: Concurrency & Race Condition Check (4 concurrent registrations for same email)
    Write-Host "`n[TEST 9] Concurrency check: 4 simultaneous registrations with email $emailDup..." -ForegroundColor Yellow
    $userDup = @{
        firstName = "Elena"
        lastName = "Rostova"
        email = $emailDup
        company = "Nova Tech"
        password = "Password999!"
    } | ConvertTo-Json

    $jobs = 1..4 | ForEach-Object {
        Start-Job -ScriptBlock {
            param($url, $b)
            try {
                $r = Invoke-RestMethod -Uri "$url/api/auth/register" -Method Post -Body $b -ContentType "application/json"
                return @{ Success = $true; Status = 201 }
            } catch {
                return @{ Success = $false; Status = $_.Exception.Response.StatusCode.value__ }
            }
        } -ArgumentList $baseUrl, $userDup
    }

    $jobs | Wait-Job | Out-Null
    $results = @($jobs | ForEach-Object { Receive-Job -Job $_ })
    $jobs | Remove-Job -Force
    $successes = @($results | Where-Object { [int]$_.Status -eq 201 }).Count
    $conflicts = @($results | Where-Object { [int]$_.Status -eq 409 }).Count

    if ($successes -eq 1 -and $conflicts -ge 3) {
        Write-Host " PASS: Concurrency test passed! Exactly 1 succeeded (201) and $conflicts rejected with 409 Conflict." -ForegroundColor Green
    } else {
        Write-Host " FAIL: Concurrency anomaly! Successes=$successes, Conflicts=$conflicts" -ForegroundColor Red
        $failures++
    }

    # TEST 10: Pre-seeded users login check (Aarav Kapoor and Priya Menon)
    Write-Host "`n[TEST 10] Default pre-seeded accounts login check..." -ForegroundColor Yellow
    $seedLogin = @{
        email = "aarav@northbank.io"
        password = "Password123!"
    } | ConvertTo-Json
    try {
        $seedRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $seedLogin -ContentType "application/json"
        if ($seedRes.success -and $seedRes.user.email -eq "aarav@northbank.io" -and $seedRes.user.firstName -eq "Aarav") {
            Write-Host " PASS: Default seed account Aarav Kapoor logs in properly." -ForegroundColor Green
        } else {
            Write-Host " FAIL: Seed account login failed." -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Seed login exception: $_" -ForegroundColor Red
        $failures++
    }

    Write-Host "`n==========================================================" -ForegroundColor Cyan
    Write-Host " ALL TESTS FINISHED. Total Failures: $failures " -ForegroundColor $(if ($failures -eq 0) { "Green" } else { "Red" })
    Write-Host "==========================================================" -ForegroundColor Cyan
    return $failures
}

Run-Tests
