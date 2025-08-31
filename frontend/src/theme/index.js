import { extendTheme } from '@chakra-ui/react';

// "Sesimiz Ol" brand colors from UI_GUIDE.md
const colors = {
  brand: {
    50: '#F3E5F5',
    100: '#E1BEE7', 
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#6A1B9A',  // Primary - Mor (Dayanışma ve Güven)
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C'
  },
  accent: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#F57C00',  // Secondary - Turuncu (Enerji ve Umut)
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100'
  },
  neutral: {
    50: '#F8F9FA',   // Modern neutral - En açık
    100: '#F1F3F4', 
    200: '#E8EAED',  // Badge backgrounds - Daha belirgin
    300: '#DADCE0',  // Borders - Net
    400: '#BDC1C6',  // Button borders - Görünür
    500: '#9AA0A6',  // Secondary text
    600: '#80868B',  // Meta info
    700: '#5F6368',  // Body text - Okunabilir
    800: '#3C4043',  // Headings - Koyu ve net
    900: '#202124'   // En koyu - Max kontrast
  }
};

// Responsive breakpoints
const breakpoints = {
  base: '0px',    // Mobile (320px+)
  sm: '480px',    // Mobile Large
  md: '768px',    // Tablet
  lg: '992px',    // Desktop
  xl: '1280px',   // Large Desktop
  '2xl': '1536px' // Extra Large
};

// Typography - Roboto font system
const fonts = {
  heading: `'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  body: `'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
};

// Component style overrides
const components = {
  Button: {
    defaultProps: {
      colorScheme: 'accent', // Default to orange for actions
    },
    variants: {
      solid: {
        borderRadius: 'md',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
        _active: {
          transform: 'scale(0.95)',
        },
        transition: 'all 0.2s ease-in-out',
      },
      outline: {
        borderRadius: 'md',
        borderWidth: '2px',
        borderColor: 'neutral.400',  // Daha net border
        color: 'neutral.800',        // Daha koyu text
        bg: 'transparent',
        _hover: {
          borderColor: 'accent.500',
          color: 'accent.600',
          transform: 'translateY(-2px)',
          boxShadow: 'md',
        },
        _active: {
          transform: 'scale(0.95)',
        },
        transition: 'all 0.2s ease-in-out',
      }
    }
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'sm',
        bg: 'white',
        borderWidth: '1px',
        borderColor: 'neutral.300',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
          borderColor: 'neutral.300', // Neutral hover, not purple
        },
        transition: 'all 0.2s ease-in-out',
      }
    }
  },
  Input: {
    defaultProps: {
      focusBorderColor: 'accent.500', // Orange focus
    },
    variants: {
      outline: {
        field: {
          borderRadius: 'md',
          borderColor: 'neutral.300',
          _focus: {
            borderColor: 'accent.500',
            boxShadow: '0 0 0 1px #F57C00', // Orange shadow
          },
        },
      },
    },
  },
  Textarea: {
    defaultProps: {
      focusBorderColor: 'accent.500', // Orange focus
    },
    variants: {
      outline: {
        borderRadius: 'md',
        borderColor: 'neutral.300',
        _focus: {
          borderColor: 'accent.500',
          boxShadow: '0 0 0 1px #F57C00', // Orange shadow
        },
      },
    },
  },
  Badge: {
    variants: {
      soft: {
        bg: 'neutral.200',    // Daha belirgin background
        color: 'neutral.800', // Daha koyu, net text
        fontWeight: 'medium',
      },
      warm: {
        bg: 'orange.50',
        color: 'orange.700',
        fontWeight: 'medium',
      },
      subtle: {
        bg: 'neutral.200',    // Konsistent neutral
        color: 'neutral.800',
      }
    }
  },
};

// Global styles
const styles = {
  global: {
    body: {
      bg: 'neutral.50',
      color: 'neutral.800',
    },
  },
};

const theme = extendTheme({
  colors,
  breakpoints,
  fonts,
  components,
  styles,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;