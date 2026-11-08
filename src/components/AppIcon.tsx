import React from 'react';
import { 
  Globe, 
  Play, 
  MessageSquare, 
  Flame, 
  Camera, 
  Music, 
  Send, 
  ShieldCheck, 
  ShoppingBag, 
  Terminal, 
  Cpu, 
  Mail, 
  Share2, 
  Smartphone 
} from 'lucide-react';

interface AppIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  switch (name) {
    case 'chrome':
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
          <Globe size={size} className={className} />
        </div>
      );
    case 'youtube':
      return (
        <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
          <Play size={size} className={className} />
        </div>
      );
    case 'whatsapp':
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
          <MessageSquare size={size} className={className} />
        </div>
      );
    case 'firefox':
      return (
        <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
          <Flame size={size} className={className} />
        </div>
      );
    case 'instagram':
      return (
        <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center border border-pink-500/20">
          <Camera size={size} className={className} />
        </div>
      );
    case 'spotify':
      return (
        <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
          <Music size={size} className={className} />
        </div>
      );
    case 'telegram':
      return (
        <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
          <Send size={size} className={className} />
        </div>
      );
    case 'google_services':
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
          <ShieldCheck size={size} className={className} />
        </div>
      );
    case 'play_store':
      return (
        <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center border border-teal-500/20">
          <ShoppingBag size={size} className={className} />
        </div>
      );
    case 'terminal':
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-slate-500/20">
          <Terminal size={size} className={className} />
        </div>
      );
    case 'android_os':
      return (
        <div className="w-8 h-8 rounded-xl bg-lime-500/10 text-lime-400 flex items-center justify-center border border-lime-500/20">
          <Cpu size={size} className={className} />
        </div>
      );
    case 'mail':
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
          <Mail size={size} className={className} />
        </div>
      );
    case 'reddit':
      return (
        <div className="w-8 h-8 rounded-xl bg-orange-600/10 text-orange-500 flex items-center justify-center border border-orange-600/20">
          <Share2 size={size} className={className} />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
          <Smartphone size={size} className={className} />
        </div>
      );
  }
};
