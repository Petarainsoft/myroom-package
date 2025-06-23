// .storybook/preview.tsx

import React from 'react';

import { Preview } from '@storybook/react';
import InitialStyleComponent from './common/InitialStyleComponent';
import GlobalStyle from './common/GlobalStyle';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <>
        {/**test */}
        <InitialStyleComponent />
        <GlobalStyle />
        <Story />
      </>
    ),
  ],
};

export default preview;
