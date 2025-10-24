const kindCache = new Map()

export const stringHashMod = (value, modulo = Number.MAX_SAFE_INTEGER) => {
  if (typeof value !== 'string') {
    throw new TypeError(
      `stringHashMod expected string, received ${typeof value}`
    )
  }
  return (
    value.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0) %
    modulo
  )
}

export const joinTag = (...parts) => parts.join('@')

export const shuffleDeterministic = (collection, seed) => {
  const values = [...collection]
  let remaining = values.length
  let state = seed
  const random = () => {
    const x = Math.sin(state++) * 10000
    return x - Math.floor(x)
  }
  while (remaining) {
    const index = Math.floor(random() * remaining--)
    ;[values[remaining], values[index]] = [values[index], values[remaining]]
  }
  return values
}

export const stripTrailingSlash = (value) => value.replace(/\/$/, '')

export const unixTime = () => Math.floor(Date.now() / 1000)

export const kindForRoom = (roomId) => {
  const cached = kindCache.get(roomId)
  if (cached !== undefined) return cached
  const kind = stringHashMod(roomId, 10_000) + 20_000
  kindCache.set(roomId, kind)
  return kind
}
