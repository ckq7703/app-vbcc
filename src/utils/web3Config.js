import Web3 from 'web3';

const getWeb3 = () => {
  return new Promise((resolve, reject) => {
    // Modern dapp browsers...
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      resolve(web3);
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      const web3 = new Web3(window.web3.currentProvider);
      resolve(web3);
    }
    // Non-dapp browsers...
    else {
      reject(new Error('No Web3 provider detected. Install MetaMask!'));
    }
  });
};

export default getWeb3;