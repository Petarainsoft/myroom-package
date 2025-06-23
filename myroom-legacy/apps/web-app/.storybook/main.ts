import { StorybookConfig } from '@storybook/react-vite';
import path, { dirname, join } from 'path';
import { mergeConfig } from 'vite';
// import '../src/common/styles/_base.scss';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-mdx-gfm"),
    {
      name: '@storybook/preset-scss',
      options: {
        cssLoaderOptions: {
          modules: true,
        },
        sassLoaderOptions: {
          additionalData: (content) => {
            // paths are relative to root dir in this case
            return (
              `
            @import "@/common/styles/_base.scss;
            @import "/src/App.scss";
            ` + content
            ); // content is the individual module.scss file
          },
        },
      },
    },
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  features: {
    storyStoreV7: true,
  },
  core: {},
  // async viteFinal(config, { configType }) {
  //   // because rollup does not respect NODE_PATH, and we have a funky example setup that needs it
  //   config.build.rollupOptions = {
  //     plugins: {
  //       resolveId: function (code) {
  //         if (code === 'react') return path.resolve(require.resolve('react'));
  //       },
  //     },
  //   };
  //   return config;
  // },
  typescript: {
    // fork-ts-checker-webpack-plugin 사용 여부 옵션 (default : false)
    check: false,
    // 위에서 fork-ts-checker-webpack-plugin을 사용한다 설정시, 그에 전달할 옵션들
    // checkOptions: {},
    // 프로세서가 실행시킬 docgen의 종류 ('react-docgen-typescript', 'react-docgen', false)
    reactDocgen: 'react-docgen-typescript',
    // 위에서 react-docgen-typescript를 사용한다 설정시, 전달해줄 옵션들
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },
  docs: {
    autodocs: true,
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
