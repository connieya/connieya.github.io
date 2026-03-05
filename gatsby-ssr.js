const React = require('react')
const { ThemeProvider } = require('./src/context/ThemeContext')

const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`

exports.onRenderBody = ({ setHtmlAttributes, setPreBodyComponents }) => {
  setHtmlAttributes({ lang: 'ko' })
  setPreBodyComponents([
    React.createElement('script', {
      key: 'theme-init',
      dangerouslySetInnerHTML: { __html: themeInitScript },
    }),
  ])
}

exports.wrapRootElement = ({ element }) => {
  return React.createElement(ThemeProvider, null, element)
}
