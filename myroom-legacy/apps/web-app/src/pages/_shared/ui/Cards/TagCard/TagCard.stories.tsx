// TagCard.stories.tsx

import React from 'react';
import { Meta, Story } from '@storybook/react';
import TagCard from '.';

// Import your TagCard component
// import { TagCard } from './path-to-your-TagCard-component';

type TagCardProps = {
    hashtag: string;
    htCode: string;
    itemCount?: number;
    pingCount?: number;
    className?: string;
};

export default {
    title: 'ui/Cards/TagCard', // the path where the story will appear in the Storybook UI
    component: TagCard,
} as Meta;

const Template: Story<TagCardProps> = (args) => <TagCard {...args} />;

export const Default = Template.bind({});
Default.args = {
    hashtag: 'example',
    htCode: 'EX1234',
    itemCount: 10,
    pingCount: 5,
};

export const WithoutCounts = Template.bind({});
WithoutCounts.args = {
    hashtag: 'noCounts',
    htCode: 'NC5678',
};