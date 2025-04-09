// Tabs.stories.tsx

import { Story, Meta } from '@storybook/react';
import Tabs, { TabsProps } from '.';

export default {
    title: 'Layouts/Tabs', // Storybook UI의 경로
    component: Tabs,
} as Meta;

const Template: Story<TabsProps> = (args) => <Tabs {...args} />;

export const Default = Template.bind({});
Default.args = {
    elements: [
        { textId: "Tab 1", icon: "Keep_S", onClick: () => console.log("Tab 1 clicked") },
        { textId: "Tab 2", icon: "Keep_S", selected: true, onClick: () => console.log("Tab 2 clicked") },
        { textId: "Tab 3", icon: "Keep_S", onClick: () => console.log("Tab 3 clicked") }
    ]
};