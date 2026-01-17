import { LiveStreamingView } from './components/live-streaming-view';

// The main component for the live streaming page
export default async function LiveStreamingPage({ params }: any) {
  // In a real app, you would fetch stream details based on the id
  const streamDetails = {
    title: 'Evening Kirtan from the Main Temple',
    host: 'ISKCON Vrindavan',
    viewers: 1008,
  };

  return (
    <LiveStreamingView streamDetails={streamDetails} />
  );
}
