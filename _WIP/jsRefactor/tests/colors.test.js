/**
 * Tests for the colors utility module
 */

import { chalk, colors } from '../utils/colors.js'
import { runner } from './test-runner.js'

// Test basic color functions
runner.test('chalk.red should colorize text red', () => {
  const result = chalk.red('test')
  if (!result.includes('\x1b[31m')) {
    throw new Error('Red color code not found')
  }
  if (!result.includes('test')) {
    throw new Error('Original text not found')
  }
  if (!result.includes('\x1b[0m')) {
    throw new Error('Reset code not found')
  }
})

runner.test('chalk.bold.blue should colorize text bold blue', () => {
  const result = chalk.bold.blue('test')
  if (!result.includes('\x1b[1m\x1b[34m')) {
    throw new Error('Bold blue color codes not found')
  }
  if (!result.includes('test')) {
    throw new Error('Original text not found')
  }
})

runner.test('chalk.gray should colorize text gray', () => {
  const result = chalk.gray('test')
  if (!result.includes('\x1b[90m')) {
    throw new Error('Gray color code not found')
  }
})

runner.test('colors.colorize should work with custom colors', () => {
  const result = colors.colorize('test', '\x1b[32m')
  if (!result.includes('\x1b[32mtest\x1b[0m')) {
    throw new Error('Custom colorization failed')
  }
})

runner.test('colors.isSupported should return boolean', () => {
  const result = colors.isSupported()
  if (typeof result !== 'boolean') {
    throw new Error('isSupported should return boolean')
  }
})

runner.test('all basic colors should be available', () => {
  const basicColors = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'gray'
  ]
  for (const color of basicColors) {
    const result = chalk[color]('test')
    if (!result || typeof result !== 'string') {
      throw new Error(`Color ${color} not working properly`)
    }
  }
})

runner.test('all style functions should be available', () => {
  const styles = ['bold', 'dim', 'italic', 'underline']
  for (const style of styles) {
    const result = chalk[style]('test')
    if (!result || typeof result !== 'string') {
      throw new Error(`Style ${style} not working properly`)
    }
  }
})

runner.test('chained bold colors should work', () => {
  const boldColors = [
    'blue',
    'green',
    'yellow',
    'red',
    'cyan',
    'gray',
    'white',
    'magenta',
    'black'
  ]
  for (const color of boldColors) {
    const result = chalk.bold[color]('test')
    if (!result || typeof result !== 'string') {
      throw new Error(`Bold ${color} not working properly`)
    }
  }
})

runner.test('empty string should be handled gracefully', () => {
  const result = chalk.red('')
  if (!result.includes('\x1b[31m') || !result.includes('\x1b[0m')) {
    throw new Error('Empty string not handled properly')
  }
})

runner.test('special characters should be preserved', () => {
  const specialText = 'Hello © World ® 2023'
  const result = chalk.blue(specialText)
  if (!result.includes(specialText)) {
    throw new Error('Special characters not preserved')
  }
})
