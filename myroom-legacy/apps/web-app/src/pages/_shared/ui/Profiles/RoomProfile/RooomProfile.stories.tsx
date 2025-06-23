import { Meta, StoryFn } from '@storybook/react';
import RoomProfile from '.';

export default {
  title: 'ui/Profiles/RoomProfile',
  component: RoomProfile,
  argTypes: {
    src: {
      control: 'text',
      description: 'Main message text',
    },
    name: {
      control: 'text',
      description: 'sub text for URL link',
    },
  },
} as Meta
const Template: StoryFn = (args) => <RoomProfile {...args} />;

export const BalloonMessageURLStory = Template.bind({});
BalloonMessageURLStory.args = {
  src: './icons/Avatar.svg',
  name: '구글',
};
