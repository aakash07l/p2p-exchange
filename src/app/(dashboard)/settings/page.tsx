'use client';

import { useState } from 'react';
import { ChevronRight, Globe2, Palette, RotateCcw, Smartphone, Volume2, IndianRupee } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const [sounds, setSounds] = useState(true);
  const rows = [
    { icon: IndianRupee, label: 'Currency', value: 'INR' },
    { icon: Globe2, label: 'Language', value: 'English' },
    { icon: Palette, label: 'Theme', value: isDark ? 'Dark' : 'System', action: toggleTheme },
    { icon: Smartphone, label: 'Haptics', value: 'All Haptics' },
  ];
  return <div className="animate-slide-up pt-10"><div className="divide-y divide-[#e2dfe4]">{rows.map(({ icon: Icon, label, value, action }) => <button key={label} onClick={action} className="flex w-full items-center gap-6 py-7 text-left"><Icon size={28} strokeWidth={1.8}/><span className="text-[20px] font-medium">{label}</span><span className="ml-auto text-[18px] font-medium text-[#1e64df]">{value}</span><ChevronRight size={20}/></button>)}<div className="flex w-full items-center gap-6 py-7"><Volume2 size={28} strokeWidth={1.8}/><span className="text-[20px] font-medium">Sounds</span><button onClick={() => setSounds(!sounds)} aria-label="Toggle sounds" className={`ml-auto h-11 w-[76px] rounded-full p-1 transition ${sounds ? 'bg-[#125fe8]' : 'bg-[#d9d6df]'}`}><span className={`block h-9 w-9 rounded-full bg-white shadow transition ${sounds ? 'translate-x-[31px]' : ''}`}/></button></div><button className="flex w-full items-center gap-6 py-7 text-left"><RotateCcw size={28} strokeWidth={1.8}/><span className="text-[20px] font-medium">Reset to Defaults</span><ChevronRight className="ml-auto" size={20}/></button></div></div>;
}
