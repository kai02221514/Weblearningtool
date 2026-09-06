import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'

const local = JSON.parse(execFileSync('supabase', ['status', '-o', 'json'], {
  encoding: 'utf8',
}))

const password = `Synthetic-${randomUUID()}!`
const functionBase = `${local.FUNCTIONS_URL}/make-server-f3d88633`

async function jsonRequest(url, init = {}) {
  const response = await fetch(url, init)
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { response, body }
}

function publicHeaders(token) {
  return {
    apikey: local.PUBLISHABLE_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  }
}

function serviceHeaders() {
  return {
    apikey: local.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${local.SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function signup(email, displayName) {
  return jsonRequest(`${functionBase}/signup`, {
    method: 'POST',
    headers: publicHeaders(),
    body: JSON.stringify({ email, password, displayName }),
  })
}

async function signin(email) {
  return jsonRequest(`${functionBase}/signin`, {
    method: 'POST',
    headers: publicHeaders(),
    body: JSON.stringify({ email, password }),
  })
}

async function listAuthUsers() {
  const { response, body } = await jsonRequest(`${local.API_URL}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: serviceHeaders(),
  })
  assert.equal(response.status, 200, `Auth user list failed: ${JSON.stringify(body)}`)
  return body.users
}

async function assertAuthEmailAbsent(email, message) {
  const users = await listAuthUsers()
  assert.equal(users.some(user => user.email === email), false, message)
}

async function deleteAuthUser(id) {
  const { response, body } = await jsonRequest(`${local.API_URL}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: serviceHeaders(),
  })
  assert.ok([200, 204].includes(response.status), `Auth cleanup failed: ${JSON.stringify(body)}`)
}

for (const [label, displayName] of [
  ['empty', ''],
  ['spaces', '   '],
  ['fifty-one', '名'.repeat(51)],
  ['newline', '合成\n利用者'],
  ['control', `合成${String.fromCharCode(0x7f)}利用者`],
]) {
  const email = `kai32-invalid-${label}-${randomUUID()}@example.invalid`
  const result = await signup(email, displayName)
  assert.equal(result.response.status, 400, `${label} must fail before Auth creation`)
  await assertAuthEmailAbsent(email, `${label} must not leave an Auth user`)
}

const userA = {
  email: `kai32-a-${randomUUID()}@example.invalid`,
  displayName: '合成利用者A😀',
}
const userB = {
  email: `kai32-b-${randomUUID()}@example.invalid`,
  displayName: '合成利用者B',
}

let result = await signup(userA.email, `  ${userA.displayName}  `)
assert.equal(result.response.status, 200, `signup A failed: ${JSON.stringify(result.body)}`)
assert.equal(result.body.displayName, userA.displayName)
userA.id = result.body.userId

result = await signup(userB.email, userB.displayName)
assert.equal(result.response.status, 200, `signup B failed: ${JSON.stringify(result.body)}`)
userB.id = result.body.userId

const authUsers = await listAuthUsers()
const authA = authUsers.find(user => user.id === userA.id)
assert.ok(authA, 'Auth user A must exist')
assert.equal(authA.user_metadata?.display_name, undefined, 'display name must not persist in Auth metadata')
assert.equal(authA.user_metadata?.name, undefined, 'legacy name metadata must not be written')

result = await signin(userA.email)
assert.equal(result.response.status, 200, `signin A failed: ${JSON.stringify(result.body)}`)
assert.equal(result.body.displayName, userA.displayName)
const tokenA = result.body.accessToken

result = await signin(userB.email)
assert.equal(result.response.status, 200, `signin B failed: ${JSON.stringify(result.body)}`)
assert.equal(result.body.displayName, userB.displayName)
const tokenB = result.body.accessToken

result = await jsonRequest(`${functionBase}/display-name`)
assert.equal(result.response.status, 401, 'display-name API must reject missing bearer tokens')

result = await jsonRequest(`${functionBase}/display-name?userId=${userB.id}`, {
  headers: publicHeaders(tokenA),
})
assert.equal(result.response.status, 400, 'read API must reject request-supplied user IDs')

result = await jsonRequest(`${functionBase}/display-name`, { headers: publicHeaders(tokenA) })
assert.equal(result.response.status, 200)
assert.equal(result.body.profile.displayName, userA.displayName)
const createdAt = result.body.profile.createdAt
const firstUpdatedAt = result.body.profile.updatedAt

await new Promise(resolve => setTimeout(resolve, 20))
result = await jsonRequest(`${functionBase}/display-name`, {
  method: 'PUT',
  headers: publicHeaders(tokenA),
  body: JSON.stringify({ displayName: '  更新済み利用者A  ' }),
})
assert.equal(result.response.status, 200, `display-name update failed: ${JSON.stringify(result.body)}`)
assert.equal(result.body.profile.displayName, '更新済み利用者A')
assert.equal(result.body.profile.createdAt, createdAt)
assert.ok(Date.parse(result.body.profile.updatedAt) > Date.parse(firstUpdatedAt))

for (const accepted of ['名', '名'.repeat(50), 'Unicode😀利用者']) {
  result = await jsonRequest(`${functionBase}/display-name`, {
    method: 'PUT',
    headers: publicHeaders(tokenA),
    body: JSON.stringify({ displayName: accepted }),
  })
  assert.equal(result.response.status, 200, `accepted boundary failed: ${accepted.length}`)
  assert.equal(result.body.profile.displayName, accepted)
}

for (const rejected of ['   ', '名'.repeat(51), '合成\n利用者', `合成${String.fromCharCode(0x1f)}利用者`]) {
  result = await jsonRequest(`${functionBase}/display-name`, {
    method: 'PUT',
    headers: publicHeaders(tokenA),
    body: JSON.stringify({ displayName: rejected }),
  })
  assert.equal(result.response.status, 400, 'invalid update must be rejected by the API')
}

result = await jsonRequest(`${functionBase}/display-name`, {
  method: 'PUT',
  headers: publicHeaders(tokenA),
  body: JSON.stringify({ displayName: 'owner override', userId: userB.id }),
})
assert.equal(result.response.status, 400, 'update API must reject request-supplied owner IDs')

result = await jsonRequest(`${local.REST_URL}/profiles?id=eq.${userA.id}`, {
  headers: publicHeaders(tokenB),
})
assert.equal(result.response.status, 200)
assert.deepEqual(result.body, [], 'user B must not read user A profile')

result = await jsonRequest(`${local.REST_URL}/profiles?id=eq.${userA.id}`, {
  method: 'PATCH',
  headers: { ...publicHeaders(tokenB), Prefer: 'return=representation' },
  body: JSON.stringify({ display_name: '不正な他人更新' }),
})
assert.equal(result.response.status, 200)
assert.deepEqual(result.body, [], 'user B must not update user A profile')

result = await jsonRequest(`${local.REST_URL}/profiles?id=eq.${userA.id}`, {
  method: 'PATCH',
  headers: publicHeaders(tokenA),
  body: JSON.stringify({ created_at: new Date(0).toISOString() }),
})
assert.ok([401, 403].includes(result.response.status), 'protected timestamp update must fail')

result = await jsonRequest(`${local.REST_URL}/profiles?id=eq.${userA.id}`, {
  method: 'DELETE',
  headers: publicHeaders(tokenA),
})
assert.ok([401, 403].includes(result.response.status), 'authenticated profile delete must fail')

result = await jsonRequest(`${local.REST_URL}/profiles?select=*`, {
  headers: publicHeaders(),
})
assert.ok([401, 403].includes(result.response.status), 'anon profile read must fail')

result = await jsonRequest(`${local.REST_URL}/profiles?id=eq.${userB.id}`, {
  method: 'DELETE',
  headers: serviceHeaders(),
})
assert.ok([200, 204].includes(result.response.status), 'synthetic profile deletion setup must succeed')
result = await signin(userB.email)
assert.equal(result.response.status, 409, 'profile-missing accounts must not sign in successfully')

const triggerFailureEmail = `kai32-trigger-failure-${randomUUID()}@example.invalid`
result = await jsonRequest(`${local.API_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: serviceHeaders(),
  body: JSON.stringify({
    email: triggerFailureEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: '   ' },
  }),
})
assert.notEqual(result.response.status, 200, 'profile trigger failure must abort Auth creation')
await assertAuthEmailAbsent(triggerFailureEmail, 'trigger failure must leave no Auth user')
result = await signup(triggerFailureEmail, '修正後の合成利用者')
assert.equal(result.response.status, 200, 'same email must succeed after the failure is corrected')
const retriedUserId = result.body.userId

await deleteAuthUser(userA.id)
result = await jsonRequest(`${local.REST_URL}/profiles?id=eq.${userA.id}`, {
  headers: serviceHeaders(),
})
assert.equal(result.response.status, 200)
assert.deepEqual(result.body, [], 'Auth deletion must cascade to profile')

await deleteAuthUser(userB.id)
await deleteAuthUser(retriedUserId)

console.log('Profile API integration: PASS (synthetic local users A/B)')
