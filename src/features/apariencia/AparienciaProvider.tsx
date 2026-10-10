import {createContext,useContext,useEffect,type ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {inicial,variables,type Tema} from './tema';
export const TemaContext=createContext<Tema>(inicial);
export const useApariencia=()=>useContext(TemaContext);
export function AparienciaProvider({children}:{children:ReactNode}){
 const q=useQuery({queryKey:['apariencia-publicada'],queryFn:async()=>(await apiClient.get<Tema>('/apariencia/publica')).data,staleTime:30000,refetchInterval:60000,retry:1});
 const t=q.data??inicial;
 useEffect(()=>{document.documentElement.classList.toggle('sicom-personalizado',t.activo);const css=variables(t) as Record<string,string>;for(const [k,v] of Object.entries(css))document.documentElement.style.setProperty(k,v);},[t]);
 return <TemaContext.Provider value={t}>{children}</TemaContext.Provider>;
}
