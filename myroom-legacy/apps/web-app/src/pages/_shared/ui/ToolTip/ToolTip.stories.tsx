import { Meta, StoryFn } from '@storybook/react';
import ToolTip, { ToolTipProp } from '.';

export default {
  title: 'ui/ToolTip',
  component: ToolTip,
  argTypes: {
    children: {
      control: 'text',
      description: 'tool tip text',
    },
  },
} as Meta<ToolTipProp>;

const Template: StoryFn<ToolTipProp> = (args) => <ToolTip {...args} />;

export const ToolTipStory = Template.bind({});
ToolTipStory.args = {
  children: <>'말풍선 툴팁.'</>,
};
