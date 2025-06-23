import Profile, { ProfileProps } from '.';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Profile> = {
  title: 'ui/Profiles/Profile',
  component: Profile,
  args: {
    src: 'https://example.com/sample-profile-image.jpg', // or any default image url
  },
};

export default meta;

type Story = StoryObj<ProfileProps>;

export const Default: Story = {
  args: {
    size: 's',
    shape: 'circle',
  },
};
