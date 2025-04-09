// Icon.stories.tsx

import React from 'react';
import { Story, Meta } from '@storybook/react';
import Icon, { IconProps } from '.';

// Icon 컴포넌트를 임포트합니다. 정확한 경로를 제공해야 합니다.
// import { Icon } from 'path_to_your_Icon_component';

export default {
  title: 'components/Icon', // Storybook UI의 경로
  component: Icon,
} as Meta;

const Template: Story<IconProps> = (args) => <Icon {...args} />;

export const Default = Template.bind({});
Default.args = {
  name: 'Keep_S',
  badge: {
    isActive: true,
  },
};

export const WithoutBadge = Template.bind({});
WithoutBadge.args = {
  ...Default.args,
};
