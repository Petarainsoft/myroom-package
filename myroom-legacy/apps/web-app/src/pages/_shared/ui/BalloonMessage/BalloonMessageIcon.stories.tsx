import { Meta, StoryFn } from '@storybook/react';
import BalloonMessage, { IBalloonMessage } from '.';
import { BalloonMessageArgTypes } from './BalloonMessageArgTypes';
export default {
  title: 'ui/BalloonMessage/Icon',
  component: BalloonMessage,
  argTypes: BalloonMessageArgTypes,
} as Meta<IBalloonMessage>;

const Template: StoryFn<IBalloonMessage> = (args) => (
  <BalloonMessage {...args} />
);

export const BalloonMessageIconStory = Template.bind({});
BalloonMessageIconStory.args = {
  iconName: 'Memo_Noti_M',
  messageText: '메모',
};
