import { Meta, StoryFn } from '@storybook/react';
import Icon, { IconProps } from '@/components/Icon';

export default {
  title: 'Components/Icon/Badge',
  component: Icon,
  argTypes: {
    badge: {
      control: 'boolean',
      description: 'badge icon',
    },
    isActive: {
      control: 'boolean',
      description: 'active badge icon',
    },
    name: {
      control: 'text',
      description: 'iconName',
    },
  },
} as Meta<IconProps>;

const Template: StoryFn<IconProps> = (args) => <Icon {...args} />;

export const BadgeIconStory = Template.bind({});
BadgeIconStory.args = {
  badge: { isActive: true },
  name: 'Deco_Figure_S',
};
