import CashCore, { ICashCore } from '@/pages/Room_LEGACY/components/Cash/CashCore';
import HeaderCashCore from '@/pages/Room_LEGACY/components/HeaderCash/HeaderCashCore';
import { Meta, StoryFn } from '@storybook/react';

export default {
  title: 'Components/Cash/Header',
  component: HeaderCashCore,
  argTypes: {
    diamond: {
      type: 'string',
    },
    cube: {
      type: 'string',
    },
  },
} as Meta;

const Template: StoryFn<ICashCore> = (args) => <HeaderCashCore {...args} />;

export const CashHeaderCoreStory = Template.bind({});
CashHeaderCoreStory.args = {
  diamond: '100',
  cube: '50',
};
