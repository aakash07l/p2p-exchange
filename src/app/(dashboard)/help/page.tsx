import { ArrowRight, Bot, MessageSquareMore, Play, Search } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="animate-slide-up pt-12 pb-10">
      <section className="relative h-[165px] overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_70%_30%,#3c6ee4,transparent_34%),linear-gradient(125deg,#292079,#140b50)] p-6 text-white"><div className="absolute -left-6 -top-16 h-48 w-48 rotate-12 rounded-[30px] bg-[#7e6bf7]/30"/><span className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white"><Play className="ml-1" fill="currentColor" size={28}/></span><p className="relative mt-3 text-[19px] font-bold">Quick App Tour</p></section>
      <section className="mt-12 flex items-center justify-between rounded-[18px] bg-[#f5f4f5] p-6"><strong className="text-[19px]">Need help?</strong><button className="flex items-center gap-3 rounded-2xl border border-[#5447c7] px-5 py-3 text-[18px] font-semibold text-[#5145c8]"><MessageSquareMore size={22}/>Chat with us <ArrowRight size={19}/></button></section>
      <button className="mt-7 flex w-full items-center gap-4 rounded-2xl bg-[#edf5ff] p-5 text-left text-[18px] font-semibold text-[#5a4bd0]"><Bot size={23}/>Ask AI Assistant <ArrowRight className="ml-auto" size={20}/></button>
      <section className="mt-16"><div className="flex items-center justify-between"><h2 className="text-[26px] font-bold tracking-[-.05em]">Helpful video guides</h2><button className="text-[17px] text-[#125fe8]">See all</button></div><div className="mt-7 grid grid-cols-2 gap-6"><Guide title="App Tour" body="FastX P2P in 60 seconds"/><Guide title="Direct Deposit" body="How to Deposit Supported Tokens"/></div></section>
      <section className="mt-16"><h2 className="text-[27px] font-bold tracking-[-.05em]">FAQs</h2><label className="mt-7 flex items-center gap-3 rounded-xl border border-[#e3e0e6] bg-[#fafafa] px-5 py-4 text-[18px] text-[#77717d]"><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Type your question here..."/><Search size={24} className="text-[#37323d]"/></label></section>
      <button className="fixed bottom-7 right-7 flex h-16 w-16 items-center justify-center rounded-full bg-[#125fe8] text-white shadow-[0_7px_20px_rgba(81,69,239,.35)]"><MessageSquareMore size={30}/></button>
    </div>
  );
}

function Guide({ title, body }: { title: string; body: string }) {
  return <div><div className="flex aspect-[1.33] flex-col justify-end rounded-xl bg-[linear-gradient(135deg,#140d5d,#3525a8,#1e49bc)] p-3 text-white shadow-[0_4px_9px_rgba(38,23,124,.2)]"><small className="text-[10px] text-[#bbb5ff]">App Tour</small><strong className="text-[15px] leading-5">{body}</strong></div><p className="mt-3 text-[17px] font-medium">{title}</p></div>;
}
