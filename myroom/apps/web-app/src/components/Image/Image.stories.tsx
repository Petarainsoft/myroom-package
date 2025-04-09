import Image, { ImageProps } from '@/components/Image/index';
import { StoryFn, Meta } from '@storybook/react';

export default {
  title: 'Components/Image',
  component: Image,
  argType: {
    loading: {
      type: 'boolean',
    },
    skeletonType: {
      control: 'check',
      options: ['circle', 'rect'],
    },
    src: {
      type: 'string',
    },
    alt: {
      type: 'string',
    },
  },
} as Meta<typeof Image>;

const Template: StoryFn<ImageProps> = (args: ImageProps) => <Image {...args} />;

export const DefaultImage = Template.bind({});
