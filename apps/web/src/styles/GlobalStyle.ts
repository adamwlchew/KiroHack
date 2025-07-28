import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* CSS Reset */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  html {
    font-size: 16px;
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
  }
  
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f8f9fa;
    color: #212529;
  }
  
  /* Accessibility */
  :focus-visible {
    outline: 2px solid #4a6cfa;
    outline-offset: 2px;
  }
  
  /* Skip to content link */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #4a6cfa;
    color: white;
    padding: 8px;
    z-index: 100;
    
    &:focus {
      top: 0;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  
  /* High contrast mode adjustments */
  @media (forced-colors: active) {
    button, a {
      forced-color-adjust: none;
    }
  }
  
  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-weight: 600;
    line-height: 1.2;
  }
  
  p {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  a {
    color: #4a6cfa;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  /* Form elements */
  button, input, optgroup, select, textarea {
    font-family: inherit;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
  }
  
  button, [type="button"], [type="reset"], [type="submit"] {
    -webkit-appearance: button;
  }
  
  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;

export default GlobalStyle;