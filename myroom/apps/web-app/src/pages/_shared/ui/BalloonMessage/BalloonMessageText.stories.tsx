import { Meta, StoryFn } from '@storybook/react';
import BalloonMessage, { IBalloonMessage } from '.';
import { BalloonMessageArgTypes } from './BalloonMessageArgTypes';

export default {
  title: 'ui/BalloonMessage/Text',
  component: BalloonMessage,
  argTypes: BalloonMessageArgTypes,
} as Meta<IBalloonMessage>;

const Template: StoryFn<IBalloonMessage> = (args) => (
  <BalloonMessage {...args} />
);

export const BalloonMessageTextStory = Template.bind({});
BalloonMessageTextStory.args = {
  messageText: '메세지 텍스트',
};
