import { StoryFn, Meta } from '@storybook/react';
import ToggleCore, { IToggleCore } from './ToggleCore';

export default {
  title: 'Components/Toggle',
  component: ToggleCore,
  argTypes: {
    isActive: {
      type: 'boolean',
      options: [true, false],
      control: { type: 'radio' },
    },
    handleIsActive: {
      type: 'function',
    },
  },
} as Meta<typeof ToggleCore>;

type NewType = IToggleCore;

const Template: StoryFn<NewType> = (args: IToggleCore) => (
  <ToggleCore {...args} />
);

export const DefaultIcon = Template.bind({});
DefaultIcon.args = {
  isActive: false,
  handleIsActive: () => undefined,
};
