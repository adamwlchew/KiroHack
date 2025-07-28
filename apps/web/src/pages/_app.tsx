import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { store } from '@/store';
import GlobalStyle from '@/styles/GlobalStyle';
import theme from '@/styles/theme';
import Navigation from '@/components/navigation/Navigation';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <Navigation />
        <Component {...pageProps} />
      </ThemeProvider>
    </Provider>
  );
}