import { Meta, StoryFn } from '@storybook/react';
import BalloonMessage, { IBalloonMessage } from '.';
import { BalloonMessageArgTypes } from './BalloonMessageArgTypes';

export default {
  title: 'ui/BalloonMessage/URL',
  component: BalloonMessage,
  argTypes: BalloonMessageArgTypes,
} as Meta<IBalloonMessage>;

const Template: StoryFn<IBalloonMessage> = (args) => (
  <BalloonMessage {...args} />
);

export const BalloonMessageURLStory = Template.bind({});
BalloonMessageURLStory.args = {
  url: 'https://www.google.com',
  subText: '구글',
};
