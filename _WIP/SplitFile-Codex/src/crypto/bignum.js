export const ZERO = 0n
export const ONE = 1n
export const TWO = 2n
export const THREE = 3n
export const FOUR = 4n
export const FIVE = 5n
export const SEVEN = 7n
export const EIGHT = 8n
export const NINE = 9n
export const SIXTEEN = 16n

export const isPositiveBigInt = (value) =>
  typeof value === 'bigint' && value >= ZERO

export const bitMask = (bits) => {
  if (bits < 0) {
    throw new Error('bitMask expects non-negative bits')
  }
  return (ONE << BigInt(bits)) - ONE
}

export const mod = (value, modulo) => {
  const result = value % modulo
  return result >= ZERO ? result : modulo + result
}

export const pow2mod = (value, power, modulo) => {
  let result = value
  let iterations = power
  while (iterations-- > ZERO) {
    result = mod(result * result, modulo)
  }
  return result
}

export const pow = (value, exponent, modulo) => {
  if (exponent < ZERO) {
    throw new Error('pow: negative exponents are not supported')
  }
  let result = ONE
  let base = mod(value, modulo)
  let power = exponent
  while (power > ZERO) {
    if ((power & ONE) === ONE) {
      result = mod(result * base, modulo)
    }
    base = mod(base * base, modulo)
    power >>= ONE
  }
  return result
}

export const invert = (value, modulo) => {
  if (value === ZERO) {
    throw new Error('invert: expected non-zero number')
  }
  if (modulo <= ZERO) {
    throw new Error(`invert: expected positive modulus, got ${modulo}`)
  }
  let a = mod(value, modulo)
  let b = modulo
  let x0 = ZERO
  let x1 = ONE
  let y0 = ONE
  let y1 = ZERO
  while (a !== ZERO) {
    const quotient = b / a
    const remainder = b % a
    const newX = x0 - x1 * quotient
    const newY = y0 - y1 * quotient
    b = a
    a = remainder
    x0 = x1
    x1 = newX
    y0 = y1
    y1 = newY
  }
  if (b !== ONE) {
    throw new Error('invert: does not exist')
  }
  return mod(x0, modulo)
}
