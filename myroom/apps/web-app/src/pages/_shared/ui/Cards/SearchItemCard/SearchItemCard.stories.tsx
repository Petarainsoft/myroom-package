
import React from 'react';
import { Story, Meta } from '@storybook/react';
import SearchItemCard from '.';

// Import the SearchItemCard component. You need to provide the correct path.
// import { SearchItemCard } from 'path_to_your_SearchItemCard_component';

type SearchItemCardProps = {
    itemId: string;
    onAfterClick?: () => void;
    className?: string;
};

export default {
    title: 'ui/Cards/SearchItemCard', // Path in the Storybook UI
    component: SearchItemCard,
} as Meta;

const Template: Story<SearchItemCardProps> = (args) => <SearchItemCard {...args} />;

export const Default = Template.bind({});
Default.args = {
    itemId: 'ITEM001',
};

export const WithAfterClick = Template.bind({});
WithAfterClick.args = {
    itemId: 'ITEM002',
    onAfterClick: () => alert('Function executed after item click'),
};

export const WithCustomClass = Template.bind({});
WithCustomClass.args = {
    itemId: 'ITEM003',
    className: 'custom-class',
};