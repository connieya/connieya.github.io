import React, { FunctionComponent } from 'react'
import { Global, css } from '@emotion/react'

const defaultStyle = css`
  html[data-theme='light'] {
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f5f5f8;
    --color-bg-tertiary: #f9fafb;
    --color-text-primary: #000000;
    --color-text-secondary: #555555;
    --color-text-tertiary: #666666;
    --color-text-muted: #757575;
    --color-accent: #0E68C8;
    --color-accent-hover: #badcff;
    --color-accent-bg: #e4f1ff;
    --color-border: #e2e5e6;
    --color-border-secondary: #d1d5db;
    --color-footer-text: #aaaaaa;
    --color-footer-bg: #f0f0f0;
    --color-tooltip-bg: #333333;
    --color-tooltip-text: #ffffff;
    --color-shadow: rgba(82, 82, 82, 0.75);
    --color-hr: #000000;
    --color-inline-code-text: #000000;
    --color-inline-code-bg: #e2e5e6;
    --color-blockquote-text: #757575;
    --color-blockquote-border: #e2e5e6;
    --color-category-border: #b5a5a5;
    --color-category-border-active: #909da1;
    --color-category-hover-bg: #b5a5a5;
    --color-category-active-hover-bg: #a0a0a0;
    --color-input-bg: #f9fafb;
    --color-input-border: #d1d5db;
    --color-input-focus-border: #6b7280;
    --color-input-focus-shadow: rgba(107, 114, 128, 0.1);
    --color-btn-primary-bg: #374151;
    --color-btn-primary-hover: #1f2937;
    --color-btn-secondary-bg: #6b7280;
    --color-btn-secondary-hover: #4b5563;
    --color-btn-disabled: #9ca3af;
    --color-error-bg: #fef2f2;
    --color-error-text: #dc2626;
    --color-error-border: #fecaca;
    --color-entry-name: #374151;
    --color-entry-date: #6b7280;
    --color-entry-message: #4b5563;
    --color-loading-text: #6b7280;
    --color-card-bg: #ffffff;
    --color-card-shadow: rgba(0, 0, 0, 0.1);
    --color-card-border: #e5e7eb;
    --color-form-card-bg: #ffffff;
  }

  html[data-theme='dark'] {
    --color-bg-primary: #1a1a2e;
    --color-bg-secondary: #16213e;
    --color-bg-tertiary: #1e293b;
    --color-text-primary: #e2e8f0;
    --color-text-secondary: #cbd5e1;
    --color-text-tertiary: #94a3b8;
    --color-text-muted: #94a3b8;
    --color-accent: #60a5fa;
    --color-accent-hover: #2563eb;
    --color-accent-bg: #1e3a5f;
    --color-border: #334155;
    --color-border-secondary: #475569;
    --color-footer-text: #64748b;
    --color-footer-bg: #0f172a;
    --color-tooltip-bg: #e2e8f0;
    --color-tooltip-text: #1a1a2e;
    --color-shadow: rgba(0, 0, 0, 0.5);
    --color-hr: #334155;
    --color-inline-code-text: #e2e8f0;
    --color-inline-code-bg: #334155;
    --color-blockquote-text: #94a3b8;
    --color-blockquote-border: #334155;
    --color-category-border: #475569;
    --color-category-border-active: #60a5fa;
    --color-category-hover-bg: #334155;
    --color-category-active-hover-bg: #2563eb;
    --color-input-bg: #1e293b;
    --color-input-border: #475569;
    --color-input-focus-border: #60a5fa;
    --color-input-focus-shadow: rgba(96, 165, 250, 0.15);
    --color-btn-primary-bg: #3b82f6;
    --color-btn-primary-hover: #2563eb;
    --color-btn-secondary-bg: #475569;
    --color-btn-secondary-hover: #64748b;
    --color-btn-disabled: #334155;
    --color-error-bg: #451a1a;
    --color-error-text: #fca5a5;
    --color-error-border: #7f1d1d;
    --color-entry-name: #e2e8f0;
    --color-entry-date: #64748b;
    --color-entry-message: #cbd5e1;
    --color-loading-text: #94a3b8;
    --color-card-bg: #16213e;
    --color-card-shadow: rgba(0, 0, 0, 0.3);
    --color-card-border: #334155;
    --color-form-card-bg: #16213e;
  }

  * {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    font-family:
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      Segoe UI,
      Roboto,
      Helvetica Neue,
      Arial,
      Noto Sans,
      sans-serif,
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Color Emoji';
  }

  html,
  body,
  #___gatsby {
    height: 100%;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-family:
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      Segoe UI,
      Roboto,
      Helvetica Neue,
      Arial,
      Noto Sans,
      sans-serif,
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Color Emoji';
  }

  html.theme-transition,
  html.theme-transition *,
  html.theme-transition *::before,
  html.theme-transition *::after {
    transition: background-color 0.3s ease, color 0.3s ease,
      border-color 0.3s ease, box-shadow 0.3s ease !important;
  }

  a,
  a:hover {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
  }
`

const GlobalStyle: FunctionComponent = function () {
  return <Global styles={defaultStyle} />
}

export default GlobalStyle
