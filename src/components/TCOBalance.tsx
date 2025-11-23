import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TCO_TOKEN_ADDRESS, ERC20_ABI } from '../config/web3';

export function TCOBalance() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Read token balance
  const { data: balance, isLoading } = useReadContract({
    address: TCO_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && TCO_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Read token decimals
  const { data: decimals } = useReadContract({
    address: TCO_TOKEN_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: isConnected && !!address && TCO_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!isConnected || !address) {
    return null;
  }

  if (TCO_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="text-xs text-yellow-500">
        TCO address not configured
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-xs text-gray-400">
        Loading TCO...
      </div>
    );
  }

  if (balance === undefined || decimals === undefined) {
    return null;
  }

  const formattedBalance = formatUnits(balance, decimals);
  const displayBalance = parseFloat(formattedBalance).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded border border-gray-700">
      <div className="text-xs text-gray-400">TCO:</div>
      <div className="text-sm font-mono font-bold text-green-400">
        {displayBalance}
      </div>
    </div>
  );
}

