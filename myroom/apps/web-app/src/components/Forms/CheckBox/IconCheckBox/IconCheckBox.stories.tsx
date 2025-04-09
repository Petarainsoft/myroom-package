import { Meta, StoryFn } from '@storybook/react';
import IconCheckBox, { IconCheckBoxProps } from '.';

export default {
  title: 'Components/IconCheckBox',
  component: IconCheckBox,
  argTypes: {
    onChange: { type: 'function' },
    checked: {
      type: 'boolean',
      options: [true, false],
      control: { type: 'radio' },
    },
    icon_on: {
      control: 'text',
      description: 'on icon name',
    },
    icon_off: {
      control: 'text',
      description: 'on icon name',
    },
    color_on: {
      control: 'text',
      description: 'on icon color',
    },
    color_off: {
      control: 'text',
      description: 'on icon color',
    },
    children: {
      control: 'text',
      description: 'tool tip text',
    },
  },
} as Meta<IconCheckBoxProps>;

const Template: StoryFn<IconCheckBoxProps> = (args) => (
  <IconCheckBox {...args} />
);

export const IconCheckboxStory = Template.bind({});
IconCheckboxStory.args = {
  children: '체크 박스',
  icon_on: 'Common_Check_M_On',
  icon_off: 'Common_Check_M',
  color_on: '#FFF',
  color_off: '#FFF',
};
