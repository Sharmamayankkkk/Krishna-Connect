'use client';

import { Wifi, Users, Heart, Send } from 'lucide-react';

interface LiveStreamingViewProps {
  streamDetails: {
    title: string;
    host: string;
    viewers: number;
  };
}

export function LiveStreamingView({ streamDetails }: LiveStreamingViewProps) {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-black text-white">
      {/* Video Player Section */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 relative">
        <div className="aspect-video bg-black w-full flex items-center justify-center">
          <p className="text-muted-foreground">Live video stream would be here.</p>
        </div>
        <div className="absolute top-4 left-4 p-4">
            <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-md">
                <Wifi size={16} />
                <span className="text-sm font-semibold">LIVE</span>
            </div>
        </div>
         <div className="absolute top-4 right-4 p-4 flex items-center space-x-2 bg-black/50 rounded-lg">
            <Users size={16} />
            <span className="text-sm">{streamDetails.viewers}</span>
        </div>
        <div className="absolute bottom-4 left-4 p-4">
            <h1 className="text-xl font-bold">{streamDetails.title}</h1>
            <p className="text-sm text-muted-foreground">Hosted by {streamDetails.host}</p>
        </div>
      </div>

      {/* Chat & Reactions Section */}
      <div className="w-full lg:w-80 bg-background border-l border-border flex flex-col">
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Mock chat messages */}
          <div className="text-sm"><b>Radha:</b> Hare Krishna! So beautiful.</div>
          <div className="text-sm"><b>Gopal:</b> All glories to Srila Prabhupada!</div>
          <div className="text-sm"><b>Krishna Das:</b> 🙏🙏🙏</div>
        </div>
        <div className="p-4 border-t border-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Send a message..."
              className="w-full bg-muted rounded-full px-4 py-2 text-sm pr-10"
            />
            <Send size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="flex justify-around mt-4">
              <Heart size={24} className="text-red-500 cursor-pointer hover:scale-110 transition-transform"/>
          </div>
        </div>
      </div>
    </div>
  );
}
