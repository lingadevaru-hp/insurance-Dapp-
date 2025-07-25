let web3;
let insuranceContract;
let account;
let deferredPrompt;

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

  // Convert to string to avoid BigInt issues
  const premiumWei = web3.utils.toWei(premiumEth.toString(), 'ether').toString();
  const payoutWei = web3.utils.toWei(payout.toString(), 'ether').toString();

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
      gas: Math.ceil(Number(gasEstimate) * 1.2), // Add 20% buffer
      gasPrice: gasPrice.toString()
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
      gas: Math.ceil(Number(gasEstimate) * 1.2), // Add 20% buffer
      gasPrice: gasPrice.toString()
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
      Premium: ${web3.utils.fromWei(policy[1].toString(), 'ether')} ETH
      Payout: ${web3.utils.fromWei(policy[2].toString(), 'ether')} ETH
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

// PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const installPrompt = document.getElementById('installPrompt');
  const installBtn = document.getElementById('installBtn');
  
  if (installPrompt && installBtn) {
    installPrompt.style.display = 'block';
    
    installBtn.addEventListener('click', () => {
      installPrompt.style.display = 'none';
      deferredPrompt.prompt();
      
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    });
  }
});

// PWA installed event
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  const installPrompt = document.getElementById('installPrompt');
  if (installPrompt) {
    installPrompt.style.display = 'none';
  }
});

// Enhanced error handling with retry functionality
function showStatusWithRetry(elementId, message, type, retryFn) {
  const statusElement = document.getElementById(elementId);
  statusElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span>${message}</span>
      ${retryFn ? '<button onclick="' + retryFn.name + '()" style="width: auto; padding: 5px 10px; margin-left: 10px; font-size: 12px;">Retry</button>' : ''}
    </div>
  `;
  statusElement.className = `status ${type} show`;
}

// Network status detection
function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const statusElements = document.querySelectorAll('.status');
  
  if (!isOnline) {
    statusElements.forEach(el => {
      if (!el.textContent.includes('offline')) {
        showStatus(el.id, '📱 You are offline. Some features may not work.', 'warning');
      }
    });
  }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// Enhanced touch interactions for mobile
if ('ontouchstart' in window) {
  document.body.classList.add('touch-device');
  
  // Add haptic feedback for button clicks
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  });
}

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart);
    }, 0);
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case '1':
        e.preventDefault();
        document.getElementById('payout').focus();
        break;
      case '2':
        e.preventDefault();
        document.getElementById('policyId').focus();
        break;
      case '3':
        e.preventDefault();
        document.getElementById('viewPolicyId').focus();
        break;
    }
  }
});

// Auto-save form data to localStorage
function saveFormData() {
  const formData = {
    payout: document.getElementById('payout').value,
    premium: document.getElementById('premium').value,
    timestamp: Date.now()
  };
  localStorage.setItem('insuranceFormData', JSON.stringify(formData));
}

function loadFormData() {
  const savedData = localStorage.getItem('insuranceFormData');
  if (savedData) {
    const data = JSON.parse(savedData);
    // Only restore if data is less than 1 hour old
    if (Date.now() - data.timestamp < 3600000) {
      document.getElementById('payout').value = data.payout || '';
      document.getElementById('premium').value = data.premium || '';
    }
  }
}

// Auto-save on input
['payout', 'premium'].forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('input', saveFormData);
  }
});

// Load saved data on page load
window.addEventListener('load', loadFormData);
