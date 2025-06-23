import { Meta, StoryFn } from '@storybook/react';
import BalloonMessage, { IBalloonMessage } from '.';
import Profile from '@/pages/_shared/ui/Profiles/Profile';
import { BalloonMessageArgTypes } from './BalloonMessageArgTypes';
export default {
  title: 'UI/BalloonMessage/Comment',
  component: BalloonMessage,
  argTypes: BalloonMessageArgTypes,
} as Meta<IBalloonMessage>;

const Template: StoryFn<IBalloonMessage> = (args) => (
  <BalloonMessage {...args} />
);

export const BalloonMessageCommentStory = Template.bind({});
BalloonMessageCommentStory.args = {
  profileImage: (
    <Profile shape={'circle'} size="xs" src={'./icons/Avatar.svg'} />
  ),
  messageText: '메세지 텍스트',
};
