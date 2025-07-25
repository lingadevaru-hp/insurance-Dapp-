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
      document.getElementById('connectionIndicator').className = 'connection-status connected';

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
      
      // Add loading animation while loading initial data
      showStatus('buyStatus', 'Loading contract data...', 'processing');
      
      // Load initial data
      await loadPolicyCount();
      hideStatus('buyStatus');
      
    } catch (error) {
      console.error("User denied account access or other error", error);
      alert('Error connecting to MetaMask: ' + error.message);
    }

  } else {
    showStatus('buyStatus', 'Please install MetaMask to use this DApp!', 'error');
  }
});

async function loadPolicyCount() {
  try {
    const policyCount = await insuranceContract.methods.policyCount().call();
    document.getElementById('policyCount').textContent = policyCount;
  } catch (error) {
    console.error('Error loading policy count:', error);
    document.getElementById('policyCount').textContent = 'Error loading';
  }
}

async function buyPolicy() {
  const payout = document.getElementById('payout').value;
  const premiumEth = document.getElementById('premium').value;

  if (!payout || !premiumEth) {
    showStatus('buyStatus', 'Please enter both payout and premium.', 'error');
    return;
  }

  if (parseFloat(payout) < parseFloat(premiumEth)) {
    showStatus('buyStatus', 'Payout must be greater than or equal to premium.', 'error');
    return;
  }

  const premiumWei = web3.utils.toWei(premiumEth, 'ether');
  const payoutWei = web3.utils.toWei(payout, 'ether');

  try {
    disableButton('buyButton');
    showStatus('buyStatus', 'Estimating gas and preparing transaction...', 'processing');
    
    // Use legacy gas pricing for Ganache compatibility
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await insuranceContract.methods.buyPolicy(payoutWei).estimateGas({
      from: account,
      value: premiumWei
    });
    
    showStatus('buyStatus', 'Transaction submitted. Please confirm in MetaMask...', 'processing');
    
    const result = await insuranceContract.methods.buyPolicy(payoutWei).send({
      from: account,
      value: premiumWei,
      gas: Math.ceil(gasEstimate * 1.2), // Add 20% buffer
      gasPrice: gasPrice
    });
    
    console.log('Transaction result:', result);
    showStatus('buyStatus', `Policy purchased successfully! Policy ID: ${result.events.PolicyPurchased.returnValues.policyId}`, 'success');
    await loadPolicyCount();
    
    // Clear form
    document.getElementById('payout').value = '';
    document.getElementById('premium').value = '';
    
  } catch (error) {
    console.error('Buy policy failed:', error);
    let errorMsg = 'Transaction failed: ';
    if (error.message.includes('User denied')) {
      errorMsg += 'Transaction was cancelled by user.';
    } else if (error.message.includes('insufficient funds')) {
      errorMsg += 'Insufficient funds in your account.';
    } else {
      errorMsg += error.message;
    }
    showStatus('buyStatus', errorMsg, 'error');
  } finally {
    enableButton('buyButton');
  }
}

async function claimPolicy() {
  const policyId = document.getElementById('policyId').value;

  if (!policyId) {
    showStatus('claimStatus', 'Please enter a policy ID.', 'error');
    return;
  }

  try {
    disableButton('claimButton');
    showStatus('claimStatus', 'Validating policy and estimating gas...', 'processing');
    
    // Use legacy gas pricing for Ganache compatibility
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await insuranceContract.methods.claimPolicy(policyId).estimateGas({
      from: account
    });
    
    showStatus('claimStatus', 'Submitting claim. Please confirm in MetaMask...', 'processing');
    
    const result = await insuranceContract.methods.claimPolicy(policyId).send({
      from: account,
      gas: Math.ceil(gasEstimate * 1.2), // Add 20% buffer
      gasPrice: gasPrice
    });
    
    console.log('Claim result:', result);
    showStatus('claimStatus', 'Policy claim submitted successfully! Payout transferred to your account.', 'success');
    
    // Clear form
    document.getElementById('policyId').value = '';
    
  } catch (error) {
    console.error('Claim policy failed:', error);
    let errorMsg = 'Claim failed: ';
    if (error.message.includes('User denied')) {
      errorMsg += 'Transaction was cancelled by user.';
    } else if (error.message.includes('Not policy holder')) {
      errorMsg += 'You are not the holder of this policy.';
    } else if (error.message.includes('Policy already claimed')) {
      errorMsg += 'This policy has already been claimed.';
    } else if (error.message.includes('Policy is not active')) {
      errorMsg += 'This policy is not active.';
    } else if (error.message.includes('Insufficient funds')) {
      errorMsg += 'Contract has insufficient funds for payout.';
    } else {
      errorMsg += error.message;
    }
    showStatus('claimStatus', errorMsg, 'error');
  } finally {
    enableButton('claimButton');
  }
}

async function viewPolicy() {
  const policyId = document.getElementById('viewPolicyId').value;

  if (!policyId) {
    alert('Please enter a policy ID.');
    return;
  }

  try {
    // First check if the policy ID is valid
    const policyCount = await insuranceContract.methods.policyCount().call();
    if (parseInt(policyId) > parseInt(policyCount) || parseInt(policyId) <= 0) {
      document.getElementById('policyInfo').textContent = `Error: Policy ID ${policyId} does not exist. Valid range: 1-${policyCount}`;
      return;
    }

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
    let errorMsg = 'Error: ';
    if (error.message.includes('execution reverted')) {
      errorMsg += 'Invalid policy ID or policy does not exist.';
    } else if (error.message.includes('Out of Gas')) {
      errorMsg += 'Transaction failed due to gas issues. Please try again.';
    } else {
      errorMsg += error.message;
    }
    document.getElementById('policyInfo').textContent = errorMsg;
  }
}

// Utility functions for better UX
function showStatus(elementId, message, type) {
  const statusElement = document.getElementById(elementId);
  statusElement.textContent = message;
  statusElement.className = `status ${type} show`;
}

function hideStatus(elementId) {
  const statusElement = document.getElementById(elementId);
  statusElement.className = 'status';
}

function disableButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.disabled = true;
  button.innerHTML = '<span class="loading"></span>' + button.textContent;
}

function enableButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.disabled = false;
  button.innerHTML = button.textContent.replace(/^.*?>/, ''); // Remove loading spinner
}

// Add real-time account change detection
if (window.ethereum) {
  window.ethereum.on('accountsChanged', function (accounts) {
    if (accounts.length > 0) {
      account = accounts[0];
      document.getElementById('account').textContent = account;
      document.getElementById('connectionIndicator').className = 'connection-status connected';
      loadPolicyCount();
    } else {
      document.getElementById('account').textContent = 'Not connected';
      document.getElementById('connectionIndicator').className = 'connection-status disconnected';
    }
  });

  window.ethereum.on('chainChanged', function (chainId) {
    // Reload the page when network changes
    window.location.reload();
  });
}
