import React from 'react';
import { Story, Meta } from '@storybook/react';
import SavePurchaseButton, { SavePurchaseButtonProps } from '.'; // 실제 컴포넌트의 경로를 정확하게 지정해주세요.

export default {
  title: 'Components/SavePurchaseButton',
  component: SavePurchaseButton,
  argTypes: {
    onSave: { action: 'onSave clicked' }
  }
} as Meta;

const Template: Story<SavePurchaseButtonProps> = (args) => <SavePurchaseButton {...args} />;

export const Default = Template.bind({});
Default.args = {
  onSave: () => console.log('onSave clicked')
};