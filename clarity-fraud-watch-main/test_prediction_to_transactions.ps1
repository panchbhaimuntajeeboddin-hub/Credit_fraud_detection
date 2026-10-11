$baseUrl = "http://localhost:5173"

function Run-Tests {
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host " STARTING SENTINEL FRAUD AI: PREDICTION TO TRANSACTIONS TESTS     " -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
    $failures = 0
    $ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

    # TEST A: Submit legitimate transaction and verify prediction & DB saving
    Write-Host "`n[TEST A] Submitting legitimate transaction ($42.50 at Starbucks)..." -ForegroundColor Yellow
    $legitTxn = @{
        transactionId = "TXN-TEST-LEGIT-$ts"
        customer = "Bruce Wayne"
        merchant = "Starbucks"
        merchantCategory = "Food & Beverage"
        cardNetwork = "Visa"
        cardLast4 = "1234"
        channel = "In-store"
        location = "Gotham, US"
        amount = 42.50
        time = "09:15"
        features = @(0.05) * 28
    } | ConvertTo-Json

    try {
        $resA = Invoke-RestMethod -Uri "$baseUrl/api/predict" -Method Post -Body $legitTxn -ContentType "application/json"
        if ($resA.success -and $resA.fraud -eq $false -and $resA.status -eq "Approved" -and $resA.transaction.id -eq "TXN-TEST-LEGIT-$ts") {
            Write-Host " PASS: Legitimate transaction predicted as Genuine ($($resA.status)) and saved to DB!" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Unexpected response for legitimate transaction: $($resA | ConvertTo-Json)" -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Test A exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST B: Submit fraudulent transaction and verify prediction & DB saving
    Write-Host "`n[TEST B] Submitting fraudulent transaction ($4,200 at Apple with skewed features)..." -ForegroundColor Yellow
    $fraudFeatures = @(-5, 5, -6, 6, 0, 0, -5, 0, 0, -8, 5, -9, 0, -12, 0, -7, -10, -4, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0)
    $fraudTxn = @{
        transactionId = "TXN-TEST-FRAUD-$ts"
        customer = "Joker"
        merchant = "Apple"
        merchantCategory = "Electronics"
        cardNetwork = "Mastercard"
        cardLast4 = "6666"
        channel = "E-commerce"
        location = "Unknown Proxy, Tor"
        amount = 4200.00
        time = "03:45"
        features = $fraudFeatures
    } | ConvertTo-Json

    try {
        $resB = Invoke-RestMethod -Uri "$baseUrl/api/predict" -Method Post -Body $fraudTxn -ContentType "application/json"
        if ($resB.success -and $resB.fraud -eq $true -and $resB.risk -eq "High" -and $resB.status -eq "Blocked" -and $resB.transaction.id -eq "TXN-TEST-FRAUD-$ts") {
            Write-Host " PASS: Fraud transaction predicted as Fraud ($($resB.status), Risk: $($resB.risk), Prob: $($resB.prob)) and saved to DB!" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Unexpected response for fraud transaction: $($resB | ConvertTo-Json)" -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Test B exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST C: Verify transactions appear in /api/transactions list (Persistence)
    Write-Host "`n[TEST C] Verifying previously predicted transactions exist in /api/transactions..." -ForegroundColor Yellow
    try {
        $listRes = Invoke-RestMethod -Uri "$baseUrl/api/transactions" -Method Get
        $foundLegit = $listRes.transactions | Where-Object { $_.id -eq "TXN-TEST-LEGIT-$ts" }
        $foundFraud = $listRes.transactions | Where-Object { $_.id -eq "TXN-TEST-FRAUD-$ts" }

        if ($foundLegit -and $foundFraud -and $foundLegit.prediction -eq "Genuine" -and $foundFraud.prediction -eq "Fraud") {
            Write-Host " PASS: Both newly predicted transactions successfully retrieved from database via /api/transactions!" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Transactions not found in /api/transactions response. Found Legit=$([bool]$foundLegit), Found Fraud=$([bool]$foundFraud)" -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Test C exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST D & I: User Isolation Verification (User Alpha vs User Beta)
    Write-Host "`n[TEST D & I] User workspace isolation check (User Alpha vs User Beta)..." -ForegroundColor Yellow
    $emailAlpha = "alpha.$ts@wayne.corp"
    $emailBeta = "beta.$ts@queen.ind"

    try {
        # Register User Alpha
        $regAlpha = @{
            firstName = "Alpha"
            lastName = "User"
            email = $emailAlpha
            company = "Wayne Enterprises"
            password = "Password123!"
        } | ConvertTo-Json
        $tokenAlpha = (Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $regAlpha -ContentType "application/json").token
        $headersAlpha = @{ Authorization = "Bearer $tokenAlpha" }

        # Register User Beta
        $regBeta = @{
            firstName = "Beta"
            lastName = "User"
            email = $emailBeta
            company = "Queen Industries"
            password = "Password123!"
        } | ConvertTo-Json
        $tokenBeta = (Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $regBeta -ContentType "application/json").token
        $headersBeta = @{ Authorization = "Bearer $tokenBeta" }

        # User Alpha submits transaction TXN-ALPHA
        $txnAlpha = @{
            transactionId = "TXN-ALPHA-$ts"
            customer = "Alpha Customer"
            merchant = "Amazon"
            amount = 99.99
            time = "11:00"
            features = @(0.01) * 28
        } | ConvertTo-Json
        $predAlpha = Invoke-RestMethod -Uri "$baseUrl/api/predict" -Method Post -Headers $headersAlpha -Body $txnAlpha -ContentType "application/json"

        # User Beta queries their transactions
        $betaTxns = (Invoke-RestMethod -Uri "$baseUrl/api/transactions" -Method Get -Headers $headersBeta).transactions
        # User Alpha queries their transactions
        $alphaTxns = (Invoke-RestMethod -Uri "$baseUrl/api/transactions" -Method Get -Headers $headersAlpha).transactions

        $alphaHasTxn = [bool]($alphaTxns | Where-Object { $_.id -eq "TXN-ALPHA-$ts" })
        $betaHasAlphaTxn = [bool]($betaTxns | Where-Object { $_.id -eq "TXN-ALPHA-$ts" })

        if ($alphaHasTxn -and -not $betaHasAlphaTxn) {
            Write-Host " PASS: Complete user isolation! Alpha's transaction ($($predAlpha.transaction.id)) is visible only to Alpha (count: $($alphaTxns.Count)) and NOT to Beta (count: $($betaTxns.Count))." -ForegroundColor Green
        } else {
            Write-Host " FAIL: Isolation breach! AlphaHasTxn=$alphaHasTxn, BetaHasAlphaTxn=$betaHasAlphaTxn" -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Test D & I exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST E: Timestamps and Last 24h filter
    Write-Host "`n[TEST E] Checking Last 24h filter (?since=24h)..." -ForegroundColor Yellow
    try {
        $allTxns = (Invoke-RestMethod -Uri "$baseUrl/api/transactions" -Method Get).transactions
        $recentTxns = (Invoke-RestMethod -Uri "$baseUrl/api/transactions?since=24h" -Method Get).transactions
        $foundIn24h = [bool]($recentTxns | Where-Object { $_.id -eq "TXN-TEST-LEGIT-$ts" })

        if ($foundIn24h -and $recentTxns.Count -gt 0) {
            Write-Host " PASS: Newly predicted transaction falls within 24h window (returned $($recentTxns.Count) transactions)!" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Recent transaction not returned in 24h filter." -ForegroundColor Red
            $failures++
        }
    } catch {
        Write-Host " FAIL: Test E exception: $_" -ForegroundColor Red
        $failures++
    }

    # TEST G: Simulated ML Failure and Database Failure
    Write-Host "`n[TEST G] Simulating ML model failure and DB failure..." -ForegroundColor Yellow
    # 1. ML Failure simulation
    try {
        $mlFailBody = @{ amount = 100; merchant = "Amazon"; simulateError = "ml" } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "$baseUrl/api/predict" -Method Post -Body $mlFailBody -ContentType "application/json"
        Write-Host " FAIL: Expected ML failure, but request succeeded" -ForegroundColor Red
        $failures++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $err = $stream.ReadToEnd()
        if ($code -eq 500 -and $err -like "*ML Prediction Failed*") {
            Write-Host " PASS: Correctly caught ML failure with HTTP 500 and message: $err" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Unexpected response for ML error: $code, $err" -ForegroundColor Red
            $failures++
        }
    }

    # 2. DB Failure simulation
    try {
        $dbFailBody = @{ amount = 100; merchant = "Amazon"; simulateError = "db" } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "$baseUrl/api/predict" -Method Post -Body $dbFailBody -ContentType "application/json"
        Write-Host " FAIL: Expected DB failure, but request succeeded" -ForegroundColor Red
        $failures++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $stream = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $err = $stream.ReadToEnd()
        if ($code -eq 500 -and $err -like "*Database error*") {
            Write-Host " PASS: Correctly caught DB failure with HTTP 500 and message: $err" -ForegroundColor Green
        } else {
            Write-Host " FAIL: Unexpected response for DB error: $code, $err" -ForegroundColor Red
            $failures++
        }
    }

    # TEST H: Multiple transactions submission and ensuring each is stored once
    Write-Host "`n[TEST H] Submitting multiple distinct transactions..." -ForegroundColor Yellow
    $multiCount = 3
    $multiSuccess = 0
    for ($i = 1; $i -le $multiCount; $i++) {
        $body = @{
            transactionId = "TXN-MULTI-$ts-$i"
            customer = "Multi User $i"
            merchant = "Shell"
            amount = (25.0 * $i)
            time = "14:0$i"
            features = @(0.02 * $i) * 28
        } | ConvertTo-Json
        try {
            $r = Invoke-RestMethod -Uri "$baseUrl/api/predict" -Method Post -Body $body -ContentType "application/json"
            if ($r.success) { $multiSuccess++ }
        } catch {
            Write-Host " Error on multi ${i}: $_" -ForegroundColor Red
        }
    }

    if ($multiSuccess -eq $multiCount) {
        Write-Host " PASS: Successfully predicted and saved all $multiCount multi-transactions uniquely." -ForegroundColor Green
    } else {
        Write-Host " FAIL: Multi prediction count mismatch: Expected $multiCount, got $multiSuccess" -ForegroundColor Red
        $failures++
    }

    Write-Host "`n==================================================================" -ForegroundColor Cyan
    Write-Host " ALL TESTS FINISHED. Total Failures: $failures " -ForegroundColor $(if ($failures -eq 0) { "Green" } else { "Red" })
    Write-Host "==================================================================" -ForegroundColor Cyan
    return $failures
}

Run-Tests
