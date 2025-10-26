// Simple test fixture with basic functions

export function add(a, b) {
  return a + b
}

export function subtract(a, b) {
  return a - b
}

export const multiply = (a, b) => {
  return a * b
}

export async function fetchData(url) {
  const response = await fetch(url)
  return response.json()
}

export function* generatorFunction() {
  yield 1
  yield 2
  yield 3
}

const PI = Math.PI

export function circleArea(radius) {
  return PI * radius * radius
}

export class Calculator {
  constructor(initialValue = 0) {
    this.value = initialValue
  }

  add(n) {
    this.value += n
    return this.value
  }

  multiply(n) {
    this.value *= n
    return this.value
  }
}
