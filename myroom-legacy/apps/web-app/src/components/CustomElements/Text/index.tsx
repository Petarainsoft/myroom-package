import r2wc from '@r2wc/react-to-web-component';

interface CustomTextProps {
  color: string | undefined;
  bold: string | undefined;
  italic: string | undefined;
  deco: string | undefined;
  value: string | undefined;
}
const rootStyle = document.documentElement.style;
const themaColors = ['primary', 'secondary', 'tertiary', 'fail'];
const grayScalePrefix = 'gray-scale-';
const CustomText = ({
  color,
  bold,
  italic,
  deco = undefined,
  value,
}: CustomTextProps) => {
  const colorStyle = () => {
    if (rootStyle && color) {
      if (themaColors.includes(color))
        return (
          rootStyle.getPropertyValue(`--${color}-color`) ??
          rootStyle.getPropertyValue('--gray-scale-700') ??
          '#000'
        );
      if (color.match(grayScalePrefix))
        return (
          rootStyle.getPropertyValue(`--${color}`) ??
          rootStyle.getPropertyValue('--gray-scale-700') ??
          '#000'
        );
    }
    return color ?? '#000';
  };
  const fontWeight = () => {
    return bold === undefined || bold === null ? 'normal' : 'bold';
  };
  const fontStyle = () => {
    return italic === undefined || italic === null ? 'normal' : 'italic';
  };

  return (
    <span
      style={{
        color: colorStyle(),
        fontWeight: fontWeight(),
        fontStyle: fontStyle(),
        textDecoration: deco,
      }}
    >
      {value}
    </span>
  );
};

export const WebCustomText = r2wc(CustomText, {
  props: {
    color: 'string',
    bold: 'string',
    italic: 'string',
    deco: 'string',
    value: 'string',
  },
});
