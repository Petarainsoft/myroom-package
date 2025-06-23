import { Meta, StoryFn } from '@storybook/react';
import SelectOffCanvas, { ISelectButton, ISelectOffCanvas } from '.';

export default {
  title: 'offcanvas/SelectOffCanvas/Default',
  component: SelectOffCanvas,
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the off-canvas menu is open or closed',
    },
    onClose: {
      action: 'closed',
      description: 'Callback function when the off-canvas menu is closed',
    },
    isIconButton: {
      control: 'boolean',
      description: 'Icon이 포함된 버튼인지 여부',
    },
    buttonList: {
      control: 'object',
      description: 'List of buttons for the off-canvas menu',
    },
    height: {
      control: 'number',
      description: 'Height of the off-canvas component',
    },
  },
} as Meta<ISelectOffCanvas>;

const Template: StoryFn<ISelectOffCanvas> = (args) => {
  return <SelectOffCanvas {...args} />;
};

export const DefaultSelectOffCanvasStory = Template.bind({});
DefaultSelectOffCanvasStory.args = {
  isOpen: true,
  isIconButton: false,
  buttonList: [
    {
      // icon: 'Profile_M',
      textId: 'GMY.000038',
      onClick: () => {},
      defaultValue: '프로필 보기',
    },
    {
      // icon: 'Edit_M',
      textId: 'GCM.000024',
      onClick: () => {},
      defaultValue: '수정',
    },
    {
      // icon: 'Erase_M',
      textId: 'GCM.000025',
      onClick: () => {},
      defaultValue: '삭제',
    },
  ] as ISelectButton[],
};
