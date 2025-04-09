import ToggleCore, { IToggleCore } from './ToggleCore';

const Toggle = ({ isActive, handleIsActive, ...rest }: IToggleCore) => {
  return (
    <ToggleCore isActive={isActive} handleIsActive={handleIsActive} {...rest} />
  );
};

export default Toggle;
