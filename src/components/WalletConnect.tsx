import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    // Try MetaMask first, then injected
    const metaMaskConnector = connectors.find((c) => c.id === 'metaMask');
    const injectedConnector = connectors.find((c) => c.id === 'injected');
    const connector = metaMaskConnector || injectedConnector;
    
    if (connector) {
      connect({ connector });
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-400 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isPending}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded font-medium text-sm transition-colors"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

