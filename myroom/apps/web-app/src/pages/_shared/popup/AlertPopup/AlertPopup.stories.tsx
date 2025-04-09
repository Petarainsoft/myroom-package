import AlertPopupCore, {
  IAlertPopupCore,
} from '@/pages/_shared/popup/AlertPopup/AlertPopupCore';
import { Meta, StoryFn } from '@storybook/react';

export default {
  title: 'Components/Popup/Alert',
  component: AlertPopupCore,
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
    handleConfirm: {
      type: 'function',
    },
  },
} as Meta;

const Template: StoryFn<IAlertPopupCore> = (args) => (
  <AlertPopupCore {...args} />
);

export const AlertPopupCoreStory = Template.bind({});
AlertPopupCoreStory.args = {
  isOpen: true,
  titleText: 'Title',
  contentText: 'Content',
  confirmText: '확인',
  handleConfirm: undefined,
};
