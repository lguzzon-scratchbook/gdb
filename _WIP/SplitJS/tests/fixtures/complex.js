// Complex test fixture with dependencies and closures

const DEFAULT_TIMEOUT = 5000
const CACHE = new Map()

function validateInput(input) {
  if (!input) throw new Error('Input required')
  return true
}

function logMessage(message, level = 'info') {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${level}: ${message}`)
}

function createCacheKey(id, type) {
  return `${type}:${id}`
}

async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { timeout: DEFAULT_TIMEOUT })
      return response.json()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

function getCachedData(id, type) {
  const key = createCacheKey(id, type)
  if (CACHE.has(key)) {
    logMessage(`Cache hit for ${key}`)
    return CACHE.get(key)
  }
  return null
}

function setCachedData(id, type, data) {
  const key = createCacheKey(id, type)
  CACHE.set(key, data)
  logMessage(`Cache set for ${key}`)
}

async function loadData(id, type) {
  validateInput(id)

  const cached = getCachedData(id, type)
  if (cached) return cached

  try {
    const data = await fetchWithRetry(`/api/${type}/${id}`)
    setCachedData(id, type, data)
    return data
  } catch (error) {
    logMessage(`Failed to load data: ${error.message}`, 'error')
    throw error
  }
}

function transform(data, formatter) {
  return data.map(formatter)
}

const utils = {
  validate: validateInput,
  log: logMessage
}

const addFunc = (a, b) => a + b

export {
  addFunc,
  validateInput,
  logMessage,
  fetchWithRetry,
  loadData,
  getCachedData,
  setCachedData,
  transform,
  utils
}
