import Spinner, { SpinnerProps } from '@/components/Spinner';

import { StoryFn, Meta } from '@storybook/react';

export default {
  title: 'Components/Spinner',
  component: Spinner,
  argTypes: {},
} as Meta<typeof Spinner>;

const Template: StoryFn<SpinnerProps> = (args: SpinnerProps) => (
  <Spinner {...args} />
);

export const DefaultSpinner = Template.bind({});
