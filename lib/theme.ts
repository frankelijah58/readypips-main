import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8C57FF',
      light: '#A379FF',
      dark: '#7E4EE6',
    },
    secondary: {
      main: '#8A8D93',
      light: '#A1A4A9',
      dark: '#7C7F84',
    },
    background: {
      default: '#F4F5FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: 'rgba(58, 53, 65, 0.87)',
      secondary: 'rgba(58, 53, 65, 0.68)',
    },
  },
  typography: {
    fontFamily: '"Inter", "sans-serif", "Arial"',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px 0px rgba(58, 53, 65, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;
