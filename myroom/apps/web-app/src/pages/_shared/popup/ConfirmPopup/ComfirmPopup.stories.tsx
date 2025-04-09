import { Meta, StoryFn } from '@storybook/react';
import ConfirmPopupCore, { IConfirmPopupCore } from './ConfirmPopupCore';

export default {
  title: 'Components/Popup/Confirm',
  component: ConfirmPopupCore,
  argTypes: {
    isOpen: {
      type: 'boolean',
    },
    titleText: {
      type: 'string',
    },
    contentText: {
      type: 'string',
    },
    confirmText: {
      type: 'string',
    },
    cancelText: {
      type: 'string',
    },
    handleConfirm: {
      type: 'function',
    },
    handleCancel: {
      type: 'function',
    },
  },
} as Meta;

const Template: StoryFn<IConfirmPopupCore> = (args) => (
  <ConfirmPopupCore {...args} />
);

export const ConfirmPopupCoreStory = Template.bind({});
ConfirmPopupCoreStory.args = {
  isOpen: true,
  titleText: 'Title',
  contentText: 'Content',
  confirmText: '확인',
  cancelText: '취소',
  handleConfirm: () => undefined,
  handleCancel: () => undefined,
};
