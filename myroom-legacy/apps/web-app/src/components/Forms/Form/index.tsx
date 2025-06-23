import { useForm,  } from "react-hook-form";


type FormProps = {
    onSubmit: (payload: any) => void;  
    children: React.ReactNode;
}

const Form = ({ onSubmit, children}:FormProps) => {
    const { handleSubmit } = useForm();

    return <form onSubmit={handleSubmit(onSubmit)}>
        {children}
    </form>
}

export default Form;