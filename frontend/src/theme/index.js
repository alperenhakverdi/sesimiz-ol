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
      colorScheme: 'brand',
    },
    variants: {
      solid: {
        borderRadius: 'md',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'lg',
        },
        transition: 'all 0.2s ease-in-out',
      },
      outline: {
        borderRadius: 'md',
        borderWidth: '2px',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'md',
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
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: 'md',
        },
        transition: 'all 0.2s ease-in-out',
      }
    }
  },
  Input: {
    defaultProps: {
      focusBorderColor: 'brand.400',
    },
    variants: {
      outline: {
        field: {
          borderRadius: 'md',
          _focus: {
            borderColor: 'brand.400',
            boxShadow: '0 0 0 1px #AB47BC',
          },
        },
      },
    },
  },
  Textarea: {
    defaultProps: {
      focusBorderColor: 'brand.400',
    },
    variants: {
      outline: {
        borderRadius: 'md',
        _focus: {
          borderColor: 'brand.400',
          boxShadow: '0 0 0 1px #AB47BC',
        },
      },
    },
  },
};

// Global styles
const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
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