export const BalloonMessageArgTypes = {
  messageText: {
    control: 'text',
    description: 'Main message text',
  },
  subText: {
    control: 'text',
    description: 'sub text for URL link',
  },
  url: {
    control: 'text',
    description: 'URL for the link',
  },
  iconName: {
    control: 'text',
    description: 'Name of the icon to display',
  },
  urlCallback: {
    action: 'clicked',
    description: 'Callback function for the URL click',
  },
  profileImage: {
    control: 'object',
    description: 'Profile image JSX element',
  },
  className: {
    control: 'text',
    description: 'Additional class names for styling',
  },
  isRoomMemo: {
    control: 'boolean',
  },
};
