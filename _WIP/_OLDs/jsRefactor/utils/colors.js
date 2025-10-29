/**
 * Built-in color utility using ANSI escape codes
 * Replaces external chalk dependency
 */

// ANSI color codes
const RESET = '\x1b[0m'
const BRIGHT = '\x1b[1m'
const BLACK = '\x1b[30m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const MAGENTA = '\x1b[35m'
const CYAN = '\x1b[36m'
const WHITE = '\x1b[37m'
const GRAY = '\x1b[90m'

// Helper function to apply color
const colorize = (text, color) => `${color}${text}${RESET}`

// Basic color functions
const black = (text) => colorize(text, BLACK)
const red = (text) => colorize(text, RED)
const green = (text) => colorize(text, GREEN)
const yellow = (text) => colorize(text, YELLOW)
const blue = (text) => colorize(text, BLUE)
const magenta = (text) => colorize(text, MAGENTA)
const cyan = (text) => colorize(text, CYAN)
const white = (text) => colorize(text, WHITE)
const gray = (text) => colorize(text, GRAY)

// Style functions
const _bold = (text) => colorize(text, BRIGHT)
const dim = (text) => colorize(text, '\x1b[2m')
const italic = (text) => colorize(text, '\x1b[3m')
const underline = (text) => colorize(text, '\x1b[4m')

// Combined styles
const boldBlue = (text) => colorize(text, BRIGHT + BLUE)
const boldGreen = (text) => colorize(text, BRIGHT + GREEN)
const boldYellow = (text) => colorize(text, BRIGHT + YELLOW)
const boldRed = (text) => colorize(text, BRIGHT + RED)
const boldCyan = (text) => colorize(text, BRIGHT + CYAN)
const boldGray = (text) => colorize(text, BRIGHT + GRAY)
const boldWhite = (text) => colorize(text, BRIGHT + WHITE)
const boldMagenta = (text) => colorize(text, BRIGHT + MAGENTA)
const boldBlack = (text) => colorize(text, BRIGHT + BLACK)

// Export chalk-like object for easy migration
export const chalk = {
  // Basic colors
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  dim,
  italic,
  underline,

  // Styles

  // Combined styles (chaining)
  get bold() {
    return {
      get blue() {
        return boldBlue
      },
      get green() {
        return boldGreen
      },
      get yellow() {
        return boldYellow
      },
      get red() {
        return boldRed
      },
      get cyan() {
        return boldCyan
      },
      get gray() {
        return boldGray
      },
      get white() {
        return boldWhite
      },
      get magenta() {
        return boldMagenta
      },
      get black() {
        return boldBlack
      }
    }
  }
}

// Export individual colors for advanced usage
export const colors = {
  reset: RESET,
  bright: BRIGHT,
  black: BLACK,
  red: RED,
  green: GREEN,
  yellow: YELLOW,
  blue: BLUE,
  magenta: MAGENTA,
  cyan: CYAN,
  white: WHITE,
  gray: GRAY,
  colorize,
  isSupported: () =>
    process.stdout?.isTTY &&
    process.env.NODE_ENV !== 'test' &&
    process.env.NO_COLOR !== '1'
}
