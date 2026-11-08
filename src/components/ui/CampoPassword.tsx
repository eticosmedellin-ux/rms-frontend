import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const CampoPassword = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  function CampoPassword({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return <span className="relative block">
      <input {...props} ref={ref} type={visible ? 'text' : 'password'} className={className} style={{paddingRight:'2.5rem',...props.style}} />
      <button type="button" aria-pressed={visible} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-2 opacity-75 hover:opacity-100"
        onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
    </span>;
  },
);
