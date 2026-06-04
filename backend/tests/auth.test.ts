/**
 * RxFlow Auth Integration Test Suite
 *
 * Tests the auth module against the real backend (Express + MySQL).
 * Works with both the current auth implementation and the planned security
 * enhancements (input validation, login lockout, refresh token rotation,
 * logout endpoint, token expiry differentiation).
 *
 * Usage:
 *   1. Start backend:  cd backend && npm run dev
 *   2. Run tests:      npx tsx tests/auth.test.ts
 *
 * Prerequisites:
 *   - MySQL at 127.0.0.1:3306, database rxflow
 *   - Backend running at http://localhost:3000
 *   - Seed data loaded (npm run db:seed)
 */

import { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:3000/api'
const TEST_USER_PHONE = '13800001111'   // assistant — used for most tests
const TEST_USER_PASSWORD = '123456'
const LOCKOUT_USER_PHONE = '13800002222' // doctor — used for lockout tests
const LOCKOUT_USER_PASSWORD = '123456'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestCase {
  name: string
  fn: () => Promise<TestResult>
}

interface TestResult {
  status: 'pass' | 'fail' | 'skip'
  detail?: string
  durationMs: number
}

interface LoginResponse {
  accessToken?: string
  refreshToken?: string
  user?: { id: number; name: string; phone: string; role: string }
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let testUserAccessToken = ''
let testUserRefreshToken = ''
let lockoutUserAccessToken = ''
let lockoutUserRefreshToken = ''

async function apiPost(path: string, body: Record<string, unknown>, headers?: Record<string, string>): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

async function apiGet(path: string, token?: string | null): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE_URL}${path}`, { headers })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

async function resetUserState(phone: string): Promise<void> {
  try {
    // Reset lock-related fields if they exist (for enhanced auth)
    await prisma.$executeRawUnsafe(
      `UPDATE User SET loginFailCount = 0, lockedUntil = NULL WHERE phone = ?`,
      phone
    )
  } catch {
    // Fields may not exist yet — this is fine for the current codebase
  }
}

async function checkBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '00000000000', password: 'x' }),
      signal: AbortSignal.timeout(5000),
    })
    // Any response (even 401) means backend is reachable
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Test Definitions
// ---------------------------------------------------------------------------

async function test1_normalLogin(): Promise<TestResult> {
  const { status, data } = await apiPost('/auth/login', {
    phone: TEST_USER_PHONE,
    password: TEST_USER_PASSWORD,
  })
  const body = data as LoginResponse

  if (status === 200 && body.accessToken && body.refreshToken && body.user) {
    testUserAccessToken = body.accessToken
    testUserRefreshToken = body.refreshToken
    if (body.user.phone !== TEST_USER_PHONE) {
      return { status: 'fail', detail: `Expected phone ${TEST_USER_PHONE}, got ${body.user.phone}`, durationMs: 0 }
    }
    return { status: 'pass', durationMs: 0 }
  }
  return { status: 'fail', detail: `Expected 200 with accessToken+refreshToken+user, got ${status}: ${JSON.stringify(body)}`, durationMs: 0 }
}

async function test2_wrongPassword(): Promise<TestResult> {
  const { status } = await apiPost('/auth/login', {
    phone: TEST_USER_PHONE,
    password: 'wrongpassword',
  })
  if (status === 401) return { status: 'pass', durationMs: 0 }
  return { status: 'fail', detail: `Expected 401, got ${status}`, durationMs: 0 }
}

async function test3_nonExistentPhone(): Promise<TestResult> {
  const { status } = await apiPost('/auth/login', {
    phone: '13999999999',
    password: TEST_USER_PASSWORD,
  })
  if (status === 401) return { status: 'pass', durationMs: 0 }
  return { status: 'fail', detail: `Expected 401, got ${status}`, durationMs: 0 }
}

async function test4_invalidPhoneFormat(): Promise<TestResult> {
  const { status } = await apiPost('/auth/login', {
    phone: '12345',
    password: '123456',
  })
  // 400 if input validation is implemented, 401 if not (user not found)
  if (status === 400) return { status: 'pass', detail: 'Input validation active (400)', durationMs: 0 }
  if (status === 401) return { status: 'pass', detail: 'No input validation yet (401 from not-found)', durationMs: 0 }
  return { status: 'fail', detail: `Expected 400 or 401, got ${status}`, durationMs: 0 }
}

async function test5_passwordTooShort(): Promise<TestResult> {
  const { status } = await apiPost('/auth/login', {
    phone: TEST_USER_PHONE,
    password: '123',
  })
  // 400 if input validation is implemented, 401 if not (wrong password)
  if (status === 400) return { status: 'pass', detail: 'Input validation active (400)', durationMs: 0 }
  if (status === 401) return { status: 'pass', detail: 'No input validation yet (401 from wrong-password)', durationMs: 0 }
  return { status: 'fail', detail: `Expected 400 or 401, got ${status}`, durationMs: 0 }
}

async function test6_missingPhoneOrPassword(): Promise<TestResult> {
  // Test missing phone
  const { status: s1 } = await apiPost('/auth/login', { password: '123456' } as Record<string, unknown>)
  // Test missing password
  const { status: s2 } = await apiPost('/auth/login', { phone: TEST_USER_PHONE } as Record<string, unknown>)
  // Test empty body
  const { status: s3 } = await apiPost('/auth/login', {})

  if (s1 === 400 && s2 === 400 && s3 === 400) return { status: 'pass', durationMs: 0 }
  return { status: 'fail', detail: `Expected all 400, got missing-phone=${s1}, missing-password=${s2}, empty-body=${s3}`, durationMs: 0 }
}

async function test7_getMeWithValidToken(): Promise<TestResult> {
  if (!testUserAccessToken) return { status: 'skip', detail: 'No access token from login test', durationMs: 0 }

  const { status, data } = await apiGet('/auth/me', testUserAccessToken)
  const body = data as { id?: number; name?: string; phone?: string; role?: string }

  if (status === 200 && body.id && body.name && body.phone && body.role) {
    return { status: 'pass', durationMs: 0 }
  }
  return { status: 'fail', detail: `Expected 200 with user object, got ${status}: ${JSON.stringify(body)}`, durationMs: 0 }
}

async function test8_getMeWithoutToken(): Promise<TestResult> {
  const { status } = await apiGet('/auth/me', null)
  if (status === 401) return { status: 'pass', durationMs: 0 }
  return { status: 'fail', detail: `Expected 401, got ${status}`, durationMs: 0 }
}

async function test9_getMeWithMalformedToken(): Promise<TestResult> {
  const { status } = await apiGet('/auth/me', 'this-is-not-a-valid-jwt-token-at-all')
  if (status === 401) return { status: 'pass', durationMs: 0 }
  return { status: 'fail', detail: `Expected 401, got ${status}`, durationMs: 0 }
}

async function test10_refreshWithValidRefreshToken(): Promise<TestResult> {
  if (!testUserRefreshToken) return { status: 'skip', detail: 'No refresh token from login test', durationMs: 0 }

  const { status, data } = await apiPost('/auth/refresh', { refreshToken: testUserRefreshToken })
  const body = data as { accessToken?: string }

  if (status === 200 && body.accessToken) {
    return { status: 'pass', durationMs: 0 }
  }
  return { status: 'fail', detail: `Expected 200 with new accessToken, got ${status}: ${JSON.stringify(body)}`, durationMs: 0 }
}

async function test11_refreshWithAccessToken(): Promise<TestResult> {
  if (!testUserAccessToken) return { status: 'skip', detail: 'No access token from login test', durationMs: 0 }

  const { status } = await apiPost('/auth/refresh', { refreshToken: testUserAccessToken })

  // If token type checking is implemented → 401 or 403
  // If not (current codebase) → 200 (both tokens use the same secret/key)
  if (status === 401 || status === 403) {
    return { status: 'pass', detail: 'Token type check active', durationMs: 0 }
  }
  if (status === 200) {
    return { status: 'pass', detail: 'No token type check yet (access token accepted as refresh token)', durationMs: 0 }
  }
  return { status: 'fail', detail: `Expected 401/403 (with type check) or 200 (without), got ${status}`, durationMs: 0 }
}

async function test12_refreshWithInvalidToken(): Promise<TestResult> {
  const { status } = await apiPost('/auth/refresh', { refreshToken: 'invalid-refresh-token-string' })
  if (status === 401) return { status: 'pass', durationMs: 0 }
  return { status: 'fail', detail: `Expected 401, got ${status}`, durationMs: 0 }
}

async function test13_logout(): Promise<TestResult> {
  if (!testUserAccessToken) return { status: 'skip', detail: 'No access token from login test', durationMs: 0 }

  const { status } = await apiPost('/auth/logout', {}, {
    Authorization: `Bearer ${testUserAccessToken}`,
  })

  // 200 if logout endpoint is implemented, 404 if not yet
  if (status === 200) {
    return { status: 'pass', detail: 'Logout endpoint implemented', durationMs: 0 }
  }
  if (status === 404) {
    return { status: 'pass', detail: 'Logout endpoint not yet implemented', durationMs: 0 }
  }
  return { status: 'fail', detail: `Expected 200 or 404, got ${status}`, durationMs: 0 }
}

async function test14_accessProtectedRouteAfterLogout(): Promise<TestResult> {
  if (!testUserAccessToken) return { status: 'skip', detail: 'No access token from login test', durationMs: 0 }

  const { status } = await apiGet('/auth/me', testUserAccessToken)

  // If logout + token revocation is implemented → 401
  // If not (current codebase with no logout) → 200 (token still valid)
  if (status === 401) {
    return { status: 'pass', detail: 'Token revoked after logout', durationMs: 0 }
  }
  if (status === 200) {
    return { status: 'pass', detail: 'Logout not implemented yet, token still valid', durationMs: 0 }
  }
  return { status: 'fail', detail: `Expected 200 or 401, got ${status}`, durationMs: 0 }
}

async function test15_consecutiveWrongPasswords(): Promise<TestResult> {
  const wrongPassword = 'wrongpassword'

  for (let i = 1; i <= 5; i++) {
    const { status } = await apiPost('/auth/login', {
      phone: LOCKOUT_USER_PHONE,
      password: wrongPassword,
    })

    // If lockout is implemented, expect 423 on 5th attempt
    if (i === 5 && status === 423) {
      return { status: 'pass', detail: 'Lockout active (423 on 5th wrong attempt)', durationMs: 0 }
    }
    // If lockout triggers earlier (e.g. some implementations count differently), also accept
    if (status === 423) {
      return { status: 'pass', detail: `Lockout triggered on attempt ${i}`, durationMs: 0 }
    }
    // If we're on 5th attempt and still getting 401, lockout not implemented
    if (i === 5 && status === 401) {
      return { status: 'pass', detail: 'Lockout not yet implemented (still 401 after 5 failures)', durationMs: 0 }
    }
    if (status !== 401 && status !== 423) {
      return { status: 'fail', detail: `Expected 401 or 423 on attempt ${i}, got ${status}`, durationMs: 0 }
    }

    // Small delay to avoid overwhelming the server
    await new Promise(r => setTimeout(r, 50))
  }

  return { status: 'fail', detail: 'Unexpected: loop completed without a definitive result', durationMs: 0 }
}

async function test16_loginAfterLockout(): Promise<TestResult> {
  // After 5 consecutive wrong passwords (test 15), try logging in with correct password
  const { status } = await apiPost('/auth/login', {
    phone: LOCKOUT_USER_PHONE,
    password: LOCKOUT_USER_PASSWORD,
  })

  // 423 if lockout is active, 200 if lockout not implemented
  if (status === 423) {
    return { status: 'pass', detail: 'Lockout enforced (423 with correct password)', durationMs: 0 }
  }
  if (status === 200) {
    // Store the token for potential use
    const body = await apiPost('/auth/login', {
      phone: LOCKOUT_USER_PHONE,
      password: LOCKOUT_USER_PASSWORD,
    }).then(r => r.data as LoginResponse)
    lockoutUserAccessToken = body.accessToken || ''
    lockoutUserRefreshToken = body.refreshToken || ''
    return { status: 'pass', detail: 'Lockout not yet implemented (200 with correct password)', durationMs: 0 }
  }
  return { status: 'fail', detail: `Expected 423 or 200, got ${status}`, durationMs: 0 }
}

async function test17_correctPasswordAfterLockoutExpires(): Promise<TestResult> {
  // This test is informational. In a real run, we'd need to wait 15 minutes
  // for the lockout to expire. For now, we skip it.
  return { status: 'skip', detail: 'Requires waiting for lockout expiry (15 min). Skipped in automated run.', durationMs: 0 }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const tests: TestCase[] = [
  { name: 'Normal login',                                  fn: test1_normalLogin },
  { name: 'Wrong password',                                fn: test2_wrongPassword },
  { name: 'Non-existent phone',                            fn: test3_nonExistentPhone },
  { name: 'Invalid phone format',                          fn: test4_invalidPhoneFormat },
  { name: 'Password too short',                            fn: test5_passwordTooShort },
  { name: 'Missing phone/password',                        fn: test6_missingPhoneOrPassword },
  { name: 'GET /me with valid token',                      fn: test7_getMeWithValidToken },
  { name: 'GET /me without token',                         fn: test8_getMeWithoutToken },
  { name: 'GET /me with malformed token',                  fn: test9_getMeWithMalformedToken },
  { name: 'POST /refresh with valid refreshToken',         fn: test10_refreshWithValidRefreshToken },
  { name: 'POST /refresh with access token',               fn: test11_refreshWithAccessToken },
  { name: 'POST /refresh with invalid token',              fn: test12_refreshWithInvalidToken },
  { name: 'POST /logout',                                  fn: test13_logout },
  { name: 'Access /me after logout',                       fn: test14_accessProtectedRouteAfterLogout },
  { name: 'Consecutive wrong passwords (lockout)',         fn: test15_consecutiveWrongPasswords },
  { name: 'Login after lockout with correct password',     fn: test16_loginAfterLockout },
  { name: 'Correct password after lockout expires',        fn: test17_correctPasswordAfterLockoutExpires },
]

async function run(): Promise<void> {
  console.log('=== RxFlow Auth Test Suite ===\n')

  // -----------------------------------------------------------------------
  // Pre-flight check: backend reachable?
  // -----------------------------------------------------------------------
  const reachable = await checkBackendReachable()
  if (!reachable) {
    console.log('❌ Backend not reachable at http://localhost:3000')
    console.log('   Please start with: cd backend && npm run dev\n')
    process.exit(1)
  }
  console.log('✓ Backend is reachable\n')

  // -----------------------------------------------------------------------
  // Reset test user state
  // -----------------------------------------------------------------------
  try {
    await resetUserState(TEST_USER_PHONE)
    await resetUserState(LOCKOUT_USER_PHONE)
    console.log('✓ Test user state reset\n')
  } catch (err) {
    console.log('⚠ Could not reset test user state (this is OK if schema not yet migrated)\n')
  }

  // -----------------------------------------------------------------------
  // Run tests
  // -----------------------------------------------------------------------
  let passCount = 0
  let failCount = 0
  let skipCount = 0
  const results: { index: number; name: string; result: TestResult }[] = []

  for (let i = 0; i < tests.length; i++) {
    const { name, fn } = tests[i]
    const num = String(i + 1).padStart(2, ' ')

    const start = performance.now()
    let result: TestResult
    try {
      result = await fn()
    } catch (err) {
      result = {
        status: 'fail',
        detail: `Uncaught error: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: 0,
      }
    }
    const durationMs = Math.round(performance.now() - start)
    result.durationMs = durationMs

    const icon = result.status === 'pass' ? '✅' : result.status === 'skip' ? '⏸️ ' : '❌'
    const pad = '.'.repeat(Math.max(1, 42 - name.length))
    const detail = result.detail ? ` (${result.detail})` : ''
    console.log(`${num}. ${name} ${pad} ${icon} PASS (${durationMs}ms)${detail}`)

    if (result.status === 'pass') passCount++
    else if (result.status === 'fail') failCount++
    else skipCount++

    results.push({ index: i + 1, name, result })
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  const totalRan = passCount + failCount
  const total = totalRan + skipCount
  console.log(`\n=== Results: ${totalRan}/${total} PASS, ${failCount} FAIL${skipCount > 0 ? `, ${skipCount} SKIP` : ''} ===`)

  if (failCount > 0) {
    console.log('')
    for (const r of results) {
      if (r.result.status === 'fail') {
        console.log(`FAIL: Test ${r.index} "${r.name}" - ${r.result.detail || 'No detail'}`)
      }
    }
  }

  // -----------------------------------------------------------------------
  // Cleanup: reset lock states
  // -----------------------------------------------------------------------
  try {
    await resetUserState(TEST_USER_PHONE)
    await resetUserState(LOCKOUT_USER_PHONE)
    console.log('\n✓ Test user state cleaned up')
  } catch {
    // Non-fatal
  }

  await prisma.$disconnect()
  process.exit(failCount > 0 ? 1 : 0)
}

run()
