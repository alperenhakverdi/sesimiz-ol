import { extendTheme } from '@chakra-ui/react'

// Modern, minimal color palette
const colors = {
  // Primary colors - Charcoal and Snow White
  primary: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923'
  },
  
  // Single accent color - Purple
  accent: {
    50: '#FAF5FF',
    100: '#E9D8FD',
    200: '#D6BCFA',
    300: '#B794F6',
    400: '#9F7AEA',
    500: '#805AD5',
    600: '#6B46C1',
    700: '#553C9A',
    800: '#44337A',
    900: '#322659'
  },
  
  // Semantic colors - minimal usage
  success: {
    50: '#F0FFF4',
    100: '#C6F6D5',
    500: '#38A169',
    600: '#2F855A'
  },
  
  error: {
    50: '#FED7D7',
    100: '#FEB2B2',
    500: '#E53E3E',
    600: '#C53030'
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#D69E2E',
    600: '#B7791F'
  },
  
  // Neutral grays for backgrounds and borders
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B'
  },
  
  // Brand colors (legacy support)
  brand: {
    50: '#FAF5FF',
    100: '#E9D8FD',
    200: '#D6BCFA',
    300: '#B794F6',
    400: '#9F7AEA',
    500: '#805AD5',
    600: '#6B46C1',
    700: '#553C9A',
    800: '#44337A',
    900: '#322659'
  }
}

// Typography
const fonts = {
  heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`
}

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: 'lg'
    },
    variants: {
      solid: {
        bg: 'accent.500',
        color: 'white',
        _hover: {
          bg: 'accent.600',
          transform: 'translateY(-1px)',
          boxShadow: 'lg'
        },
        _active: {
          bg: 'accent.700',
          transform: 'translateY(0)'
        }
      },
      outline: {
        borderColor: 'accent.500',
        color: 'accent.500',
        _hover: {
          bg: 'accent.50',
          borderColor: 'accent.600',
          transform: 'translateY(-1px)'
        }
      },
      ghost: {
        color: 'primary.700',
        _hover: {
          bg: 'neutral.100',
          color: 'primary.800'
        }
      }
    }
  },
  
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        borderRadius: 'xl',
        border: '1px solid',
        borderColor: 'neutral.200',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)',
        _hover: {
          borderColor: 'neutral.300',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)'
        }
      }
    }
  },
  
  Input: {
    baseStyle: {
      field: {
        borderRadius: 'lg',
        border: '1px solid',
        borderColor: 'neutral.300',
        bg: 'neutral.50',
        _hover: {
          borderColor: 'neutral.400',
          bg: 'white'
        },
        _focus: {
          borderColor: 'accent.500',
          bg: 'white',
          boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)'
        }
      }
    }
  },
  
  Alert: {
    variants: {
      subtle: {
        container: {
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'neutral.200'
        }
      }
    }
  },
  
  Heading: {
    baseStyle: {
      color: 'primary.800',
      fontWeight: 'bold'
    }
  },
  
  Text: {
    baseStyle: {
      color: 'primary.700'
    }
  }
}

// Global styles
const styles = {
  global: {
    body: {
      bg: 'neutral.50',
      color: 'primary.700',
      fontSize: 'md',
      lineHeight: 'base'
    },
    '*::placeholder': {
      color: 'neutral.400'
    },
    '*, *::before, &::after': {
      borderColor: 'neutral.200'
    }
  }
}

// Breakpoints
const breakpoints = {
  base: '0em',
  sm: '30em',
  md: '48em',
  lg: '62em',
  xl: '80em',
  '2xl': '96em'
}

// Shadows
const shadows = {
  xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  outline: '0 0 0 3px rgba(128, 90, 213, 0.6)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
}

const theme = extendTheme({
  colors,
  fonts,
  components,
  styles,
  breakpoints,
  shadows,
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem'
  },
  radii: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  }
})

export default theme