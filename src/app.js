let web3;
let insuranceContract;
let account;

window.addEventListener('load', async () => {
  // Modern dapp browsers...
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const accounts = await web3.eth.getAccounts();
      account = accounts[0];
      console.log("Connected account:", account);
      
      // Update UI to show connected account
      document.getElementById('account').textContent = account;

      // Load contract ABI and address
      const contractData = await fetch('Insurance.json').then(res => res.json());
      const networkId = await web3.eth.net.getId();
      const networkInfo = contractData.networks[networkId];

      if (!networkInfo) {
        alert('Smart contract not deployed on the current network (Ganache). Please deploy the contract first.');
        return;
      }

      insuranceContract = new web3.eth.Contract(
        contractData.abi,
        networkInfo.address
      );

      console.log("Contract loaded:", insuranceContract.options.address);
      document.getElementById('contractAddress').textContent = networkInfo.address;
      
      // Load initial data
      await loadPolicyCount();
      
    } catch (error) {
      console.error("User denied account access or other error", error);
      alert('Error connecting to MetaMask: ' + error.message);
    }

  } else {
    alert('Please install MetaMask to use this DApp!');
  }
});

async function loadPolicyCount() {
  try {
    const policyCount = await insuranceContract.methods.policyCount().call();
    document.getElementById('policyCount').textContent = policyCount;
  } catch (error) {
    console.error('Error loading policy count:', error);
  }
}

async function buyPolicy() {
  const payout = document.getElementById('payout').value;
  const premiumEth = document.getElementById('premium').value;

  if (!payout || !premiumEth) {
    alert('Please enter both payout and premium.');
    return;
  }

  const premiumWei = web3.utils.toWei(premiumEth, 'ether');
  const payoutWei = web3.utils.toWei(payout, 'ether');

  try {
    document.getElementById('buyStatus').textContent = 'Processing transaction...';
    
    const result = await insuranceContract.methods.buyPolicy(payoutWei).send({
      from: account,
      value: premiumWei
    });
    
    console.log('Transaction result:', result);
    document.getElementById('buyStatus').textContent = 'Policy purchased successfully!';
    await loadPolicyCount();
    
    // Clear form
    document.getElementById('payout').value = '';
    document.getElementById('premium').value = '';
    
  } catch (error) {
    console.error('Buy policy failed:', error);
    document.getElementById('buyStatus').textContent = 'Transaction failed: ' + error.message;
  }
}

async function claimPolicy() {
  const policyId = document.getElementById('policyId').value;

  if (!policyId) {
    alert('Please enter a policy ID.');
    return;
  }

  try {
    document.getElementById('claimStatus').textContent = 'Processing claim...';
    
    const result = await insuranceContract.methods.claimPolicy(policyId).send({
      from: account
    });
    
    console.log('Claim result:', result);
    document.getElementById('claimStatus').textContent = 'Policy claim submitted successfully!';
    
    // Clear form
    document.getElementById('policyId').value = '';
    
  } catch (error) {
    console.error('Claim policy failed:', error);
    document.getElementById('claimStatus').textContent = 'Claim failed: ' + error.message;
  }
}

async function viewPolicy() {
  const policyId = document.getElementById('viewPolicyId').value;

  if (!policyId) {
    alert('Please enter a policy ID.');
    return;
  }

  try {
    const policy = await insuranceContract.methods.getPolicy(policyId).call();
    
    const policyInfo = `
      Policy ID: ${policyId}
      Holder: ${policy[0]}
      Premium: ${web3.utils.fromWei(policy[1], 'ether')} ETH
      Payout: ${web3.utils.fromWei(policy[2], 'ether')} ETH
      Active: ${policy[3]}
      Claimed: ${policy[4]}
    `;
    
    document.getElementById('policyInfo').textContent = policyInfo;
    
  } catch (error) {
    console.error('Error viewing policy:', error);
    document.getElementById('policyInfo').textContent = 'Error: ' + error.message;
  }
}
