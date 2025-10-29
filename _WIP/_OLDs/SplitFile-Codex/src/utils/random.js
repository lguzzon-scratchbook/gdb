const alphabet =
  '0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz'

export const randomString = (length) => {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error(
      `randomString expects positive integer length, received ${length}`
    )
  }
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join(
    ''
  )
}

export const selfId = randomString(20)
