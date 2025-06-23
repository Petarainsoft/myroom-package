import CashCore, { ICashCore } from '@/pages/Room_LEGACY/components/Cash/CashCore';
import { Meta, StoryFn } from '@storybook/react';

export default {
  title: 'Components/Cash/Default',
  component: CashCore,
  argTypes: {
    diamond: {
      type: 'string',
    },
    cube: {
      type: 'string',
    },
  },
} as Meta;

const Template: StoryFn<ICashCore> = (args) => <CashCore {...args} />;

export const CashCoreStory = Template.bind({});
CashCoreStory.args = {
  diamond: '100',
  cube: '50',
};
