import crypto from 'node:crypto'

export const generateContentHash = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12)
}

export const extractHashFromFilename = (filename) => {
  const match = filename.match(/_([a-f0-9]{12})\.js$/)
  return match ? match[1] : null
}

export const extractNameFromFilename = (filename) => {
  return filename.replace(/_[a-f0-9]{12}\.js$/, '')
}

export const buildFilenameWithHash = (sanitizedName, contentHash) => {
  return `${sanitizedName}_${contentHash}.js`
}

export const HashUtil = {
  generateContentHash,
  extractHashFromFilename,
  extractNameFromFilename,
  buildFilenameWithHash
}

export default HashUtil
