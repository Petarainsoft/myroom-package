// ItemRectCard.stories.tsx
import React from 'react';
import { Meta, Story } from '@storybook/react';
import { ItemRectCard, ItemRectangleCardProps } from '.';

export default {
    title: 'ui/Cards/ItemRectCard',
    component: ItemRectCard,
    argTypes: {
        onClick: { action: 'clicked' }
    }
} as Meta;

const Template: Story<ItemRectangleCardProps> = (args) => <ItemRectCard {...args} />;

export const Default = Template.bind({});
Default.args = {
    thumbnail: 'https://placehold.it/100x100', // 임의의 썸네일 이미지
};
