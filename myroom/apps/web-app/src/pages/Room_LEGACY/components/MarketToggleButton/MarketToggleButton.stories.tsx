import { Meta, StoryFn } from '@storybook/react';
import MarketToggleButton, { IMarketToggleButton } from '.';

export default {
  title: 'Components/Button/Default',
  component: MarketToggleButton,
  argTypes: {
    onClickToggle: {
      type: 'function',
    },
    editMode: {
      type: 'string',
      options: ['MY', 'COORDI-MY'],
      control: { type: 'radio' },
    },
  },
} as Meta;

const Template: StoryFn<IMarketToggleButton> = (args) => (
  <MarketToggleButton {...args} />
);

export const MarketToggleButtonStory = Template.bind({});
MarketToggleButtonStory.args = {
  onClickToggle: () => undefined,
  editMode: 'MY',
};
