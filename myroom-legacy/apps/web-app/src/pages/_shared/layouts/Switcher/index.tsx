

type SwitchCompnent<T> = {
    status: T;
    element: React.ReactNode;
}

export type SwitchCompnents<T> = SwitchCompnent<T>[];

type SwitcherProps<T> = {
    status: T;
    elements: SwitchCompnents<T>;
}


const Switcher = <T,>(props: SwitcherProps<T>) => {
    const element = props.elements.find((element) => element.status === props.status);
    return element? element.element : <></>;
} 

export default Switcher;