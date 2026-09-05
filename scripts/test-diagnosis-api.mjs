import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'

const local = JSON.parse(execFileSync('supabase', ['status', '-o', 'json'], {
  encoding: 'utf8',
}))

const password = `Synthetic-${randomUUID()}!`
const users = [randomUUID(), randomUUID()].map((id, index) => ({
  id,
  email: `kai28-synthetic-${index + 1}-${id}@example.invalid`,
}))

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

function authHeaders(token) {
  return {
    apikey: local.PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function createSyntheticUser(user) {
  const { response, body } = await jsonRequest(`${local.API_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: local.SERVICE_ROLE_KEY,
      Authorization: `Bearer ${local.SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { name: `Synthetic User ${user.id.slice(0, 4)}` },
    }),
  })
  assert.equal(response.status, 200, `synthetic user setup failed: ${JSON.stringify(body)}`)
}

async function signIn(user) {
  const { response, body } = await jsonRequest(
    `${local.FUNCTIONS_URL}/make-server-f3d88633/signin`, {
    method: 'POST',
    headers: {
      apikey: local.PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: user.email, password }),
  })
  assert.equal(response.status, 200, `synthetic sign-in failed: ${JSON.stringify(body)}`)
  assert.match(body.name, /^Synthetic User /)
  return body.accessToken
}

const functionUrl = `${local.FUNCTIONS_URL}/make-server-f3d88633/diagnosis`
const answersA1 = {
  programming_experience: 'yes',
  rule_confidence: 'partial',
  knowledge_concept: 'somewhat',
}
const answersA2 = {
  programming_experience: 'no',
  rule_confidence: 'low',
  knowledge_concept: 'visual_only',
}
const answersB = {
  programming_experience: 'yes',
  rule_confidence: 'confident',
  knowledge_concept: 'structure_style',
}

await Promise.all(users.map(createSyntheticUser))
const [tokenA, tokenB] = await Promise.all(users.map(signIn))

let result = await jsonRequest(functionUrl)
assert.equal(result.response.status, 401, 'diagnosis API must reject missing bearer tokens')

result = await jsonRequest(functionUrl, { headers: authHeaders('invalid-token') })
assert.equal(result.response.status, 401, 'diagnosis API must reject invalid bearer tokens')

result = await jsonRequest(functionUrl, { headers: authHeaders(tokenA) })
assert.deepEqual(result.body, { status: 'incomplete', reason: 'missing' })

result = await jsonRequest(`${functionUrl}?userId=${users[1].id}`, {
  headers: authHeaders(tokenA),
})
assert.equal(result.response.status, 400, 'request-supplied owner query parameters must be rejected')

result = await jsonRequest(functionUrl, {
  method: 'PUT',
  headers: authHeaders(tokenA),
  body: JSON.stringify({ answers: answersA1, userId: users[1].id }),
})
assert.equal(result.response.status, 400, 'request-supplied owner IDs must be rejected')

result = await jsonRequest(functionUrl, {
  method: 'PUT',
  headers: authHeaders(tokenA),
  body: JSON.stringify({ answers: { ...answersA1, levelScore: 999 } }),
})
assert.equal(result.response.status, 400, 'extra non-K answers must be rejected')

result = await jsonRequest(functionUrl, {
  method: 'PUT',
  headers: authHeaders(tokenA),
  body: JSON.stringify({ answers: answersA1 }),
})
assert.equal(result.response.status, 200)
assert.equal(result.body.success, true)
assert.deepEqual(result.body.diagnosis.answers, answersA1)
assert.equal(result.body.diagnosis.diagnosisVersion, 'diagnosis-k/v1')
const firstCompletedAt = result.body.diagnosis.completedAt
const firstUpdatedAt = result.body.diagnosis.updatedAt
assert.equal(firstCompletedAt, firstUpdatedAt)

await new Promise(resolve => setTimeout(resolve, 20))
result = await jsonRequest(functionUrl, {
  method: 'PUT',
  headers: authHeaders(tokenA),
  body: JSON.stringify({ answers: answersA2 }),
})
assert.equal(result.response.status, 200)
assert.deepEqual(result.body.diagnosis.answers, answersA2)
assert.ok(Date.parse(result.body.diagnosis.completedAt) > Date.parse(firstCompletedAt))
assert.ok(Date.parse(result.body.diagnosis.updatedAt) > Date.parse(firstUpdatedAt))

result = await jsonRequest(functionUrl, { headers: authHeaders(tokenA) })
assert.equal(result.response.status, 200)
assert.equal(result.body.status, 'complete')
assert.deepEqual(result.body.diagnosis.answers, answersA2)

result = await jsonRequest(functionUrl, {
  method: 'PUT',
  headers: authHeaders(tokenB),
  body: JSON.stringify({ answers: answersB }),
})
assert.equal(result.response.status, 200)

result = await jsonRequest(
  `${local.REST_URL}/user_diagnoses?user_id=eq.${users[0].id}`,
  { headers: authHeaders(tokenB) },
)
assert.equal(result.response.status, 200)
assert.deepEqual(result.body, [], 'user B must not read user A diagnosis')

result = await jsonRequest(`${local.REST_URL}/user_diagnoses`, {
  method: 'POST',
  headers: { ...authHeaders(tokenB), Prefer: 'return=representation' },
  body: JSON.stringify({
    user_id: users[0].id,
    ...answersB,
    diagnosis_version: 'diagnosis-k/v1',
  }),
})
assert.equal(result.response.status, 403, 'user B must not insert for user A')

result = await jsonRequest(
  `${local.REST_URL}/user_diagnoses?user_id=eq.${users[0].id}`,
  {
    method: 'PATCH',
    headers: { ...authHeaders(tokenB), Prefer: 'return=representation' },
    body: JSON.stringify({ rule_confidence: 'none' }),
  },
)
assert.equal(result.response.status, 200)
assert.deepEqual(result.body, [], 'user B must not update user A')

result = await jsonRequest(
  `${local.REST_URL}/user_diagnoses?user_id=eq.${users[1].id}`,
  { method: 'DELETE', headers: authHeaders(tokenB) },
)
assert.ok(
  [401, 403].includes(result.response.status),
  'authenticated users must not delete diagnoses',
)

result = await jsonRequest(`${local.REST_URL}/user_diagnoses?select=*`, {
  headers: { apikey: local.PUBLISHABLE_KEY },
})
assert.ok([401, 403].includes(result.response.status), 'anon must not read diagnoses')

result = await jsonRequest(
  `${local.REST_URL}/user_diagnoses?user_id=eq.${users[0].id}`,
  {
    method: 'PATCH',
    headers: {
      apikey: local.SERVICE_ROLE_KEY,
      Authorization: `Bearer ${local.SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ diagnosis_version: 'diagnosis-k/v0' }),
  },
)
assert.equal(result.response.status, 204)

result = await jsonRequest(functionUrl, { headers: authHeaders(tokenA) })
assert.deepEqual(result.body, { status: 'incomplete', reason: 'incompatible' })

console.log('Diagnosis API integration: PASS (synthetic local users A/B)')
