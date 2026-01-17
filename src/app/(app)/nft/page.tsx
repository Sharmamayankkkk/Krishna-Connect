'use client';

import { Wallet, Grid } from 'lucide-react';

// Mock data for NFTs
const mockNfts = [
  { id: '1', name: 'Krishna Divine Form', collection: 'Sacred Art', image: '/images/nft1.jpg' },
  { id: '2', name: 'Radha Grace', collection: 'Sacred Art', image: '/images/nft2.jpg' },
  { id: '3', name: 'Gauranga Mercy', collection: 'Golden Age', image: '/images/nft3.jpg' },
];

export default function NftPage() {
  const isConnected = true; // Mock wallet connection status

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Digital Collectibles</h1>
          <p className="text-muted-foreground">Showcase your unique NFTs on your profile.</p>
        </div>
        {/* <Button> {isConnected ? 'Wallet Connected' : 'Connect Wallet'} </Button> */}
      </div>

      {isConnected ? (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Grid className="mr-2 h-6 w-6" />
            Your Collection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockNfts.map(nft => (
              <div key={nft.id} className="border rounded-lg overflow-hidden">
                <img src={nft.image} alt={nft.name} className="aspect-square object-cover" />
                <div className="p-3">
                  <p className="font-semibold">{nft.name}</p>
                  <p className="text-sm text-primary">{nft.collection}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
          <p className="text-muted-foreground mt-2">Connect your wallet to view and display your digital collectibles.</p>
          {/* <Button className="mt-4">Connect Wallet</Button> */}
        </div>
      )}
    </div>
  );
}
