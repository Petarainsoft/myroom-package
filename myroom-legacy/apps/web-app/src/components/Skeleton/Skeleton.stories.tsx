// Skeleton.stories.tsx
import React from 'react';
import { Meta, Story } from '@storybook/react';
import Skeleton, { SkeletonProps } from '.';

export default {
    title: 'components/Skeleton',
    component: Skeleton,
} as Meta;

const Template: Story<SkeletonProps> = (args) => <Skeleton {...args} />;

export const Default = Template.bind({});
Default.args = {
    isLoading: false,
    children: <div>Loaded Content</div>,
};