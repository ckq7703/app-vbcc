import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

const ConnectWallet = ({ onConnect }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Kiểm tra nếu đã kết nối MetaMask trước đó
    if (window.ethereum) {
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    try {
      const web3Instance = new Web3(window.ethereum);
      const accounts = await web3Instance.eth.getAccounts();
      
      if (accounts.length > 0) {
        const networkId = await web3Instance.eth.net.getId();
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setNetworkId(networkId);
        onConnect(web3Instance, accounts[0]);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask chưa được cài đặt. Vui lòng cài đặt MetaMask để tiếp tục.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Yêu cầu kết nối tài khoản
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const web3Instance = new Web3(window.ethereum);
      const accounts = await web3Instance.eth.getAccounts();
      const networkId = await web3Instance.eth.net.getId();

      if (accounts.length > 0) {
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setNetworkId(networkId);
        onConnect(web3Instance, accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Lỗi kết nối MetaMask: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWeb3(null);
    setAccount(null);
    setNetworkId(null);
    onConnect(null, null);
  };

  const formatAccount = (account) => {
    return account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : '';
  };

  const getNetworkName = (networkId) => {
    const networks = {
      1: 'Mainnet',
      3: 'Ropsten',
      4: 'Rinkeby',
      5: 'Goerli',
      42: 'Kovan',
      1337: 'Localhost',
      5777: 'Ganache'
    };
    return networks[networkId] || `Network ${networkId}`;
  };

  // Lắng nghe sự kiện thay đổi tài khoản
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onConnect(web3, accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        const networkId = parseInt(chainId, 16);
        setNetworkId(networkId);
      });

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', () => {});
          window.ethereum.removeListener('chainChanged', () => {});
        }
      };
    }
  }, [web3, onConnect]);

  return (
    <div className="wallet-connect">
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {!account ? (
        <div className="text-center">
          <div className="mb-3">
            <h5>Kết nối ví MetaMask</h5>
            <p className="text-muted">Vui lòng kết nối MetaMask để sử dụng ứng dụng</p>
          </div>
          
          <button
            className="btn btn-primary"
            onClick={connectWallet}
            disabled={connecting}
          >
            {connecting ? <span className="loading"></span> : null}
            {connecting ? 'Đang kết nối...' : '🦊 Kết nối MetaMask'}
          </button>
        </div>
      ) : (
        <div className="wallet-info">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="wallet-status">
                <span className="status-indicator connected"></span>
                <span className="status-text">Đã kết nối</span>
              </div>
              <div className="wallet-details">
                <div className="account-info">
                  <strong>Tài khoản:</strong> {formatAccount(account)}
                </div>
                <div className="network-info">
                  <strong>Mạng:</strong> {getNetworkName(networkId)}
                </div>
              </div>
            </div>
            
            <button
              className="btn btn-secondary"
              onClick={disconnectWallet}
              title="Ngắt kết nối"
            >
              Ngắt kết nối
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;