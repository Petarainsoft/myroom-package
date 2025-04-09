// ItemRectCard.stories.tsx
import React from 'react';
import { Meta, Story } from '@storybook/react';
import { ItemRectPlusCard, ItemRectanglePlusCardProps } from '.';

export default {
    title: 'ui/Cards/ItemRectPlusCard',
    component: ItemRectPlusCard,
    argTypes: {
        onClick: { action: 'clicked' }
    }
} as Meta;

const Template: Story<ItemRectanglePlusCardProps> = (args) => <ItemRectPlusCard {...args} />;

export const Default = Template.bind({});
Default.args = {
   
};

