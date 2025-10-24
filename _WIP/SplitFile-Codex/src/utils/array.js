export const range = (length, mapFn) => {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error(
      `range expects non-negative integer length, received ${length}`
    )
  }
  return Array.from({ length }, mapFn)
}
