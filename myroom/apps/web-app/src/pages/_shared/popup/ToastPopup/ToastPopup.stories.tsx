import ToastPopupCore, {
  IToastPopupCore,
} from '@/pages/_shared/popup/ToastPopup/ToastPopupComponent';
import { Meta, StoryFn } from '@storybook/react';

export default {
  title: 'Components/Popup/ToastPopup',
  component: ToastPopupCore,
  argTypes: {
    text: {
      type: 'string',
    },
    timeoutMs: {
      type: 'number',
    },
    animationTimeoutMS: {
      type: 'number',
    },
  },
} as Meta;

const Template: StoryFn<IToastPopupCore> = (args) => {
  return <ToastPopupCore {...args} />;
};

export const ToastPopupCoreStory = Template.bind({});
ToastPopupCoreStory.args = {
  text: 'ToastPopupTest',
  setState: () => undefined,
  timeoutMs: 3000,
};
