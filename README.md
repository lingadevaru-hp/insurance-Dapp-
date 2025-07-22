# Blockchain Insurance DApp

## Quick Start Commands

### Terminal 1 - Start Blockchain
```bash
cd /home/thoshan/insurance
npx ganache --port 7545 --deterministic --accounts 10
```

### Terminal 2 - Deploy Contracts
```bash
cd /home/thoshan/insurance
npm run migrate
```

### Terminal 3 - Start Frontend
```bash
cd /home/thoshan/insurance/src
python3 -m http.server 8080
```

## Access the App
- Open: http://localhost:8080
- Connect MetaMask to: localhost:7545
- Import account using private key: `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1`

## Test the Contract
```bash
cd /home/thoshan/insurance
npx truffle exec test_contract.js --network development
```

## Project Structure
- `contracts/Insurance.sol` - Smart contract
- `src/index.html` - Frontend interface  
- `src/app.js` - Web3 integration
- `truffle-config.js` - Blockchain configuration

## Features
✅ Buy insurance policies
✅ Submit claims  
✅ View policy details
✅ Secure reentrancy protection
✅ Modern Solidity 0.8.x# insurance-Dapp-
