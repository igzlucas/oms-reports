
import { redirect } from 'next/navigation';


export default function Home() {
  redirect('/inicio');
  return null; 
}