# 🛡️ Blockchain Insurance DApp

A decentralized insurance application built on Ethereum blockchain that allows users to buy insurance policies, submit claims, and manage their coverage through a secure smart contract.

## 🔥 Features

- 💰 **Buy Insurance Policies** - Purchase coverage with customizable premium and payout amounts
- 📋 **Submit Claims** - File insurance claims directly on the blockchain
- 🔍 **View Policy Details** - Check policy status, premiums, and claim history
- 🛡️ **Security First** - Built with reentrancy protection and modern Solidity 0.8.x
- 🌐 **Web3 Integration** - Connect with MetaMask for seamless blockchain interaction
- ⚡ **Real-time Updates** - Instant transaction confirmations and status updates

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0.0 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **MetaMask Browser Extension** - [Install here](https://metamask.io/)
- **Python 3** (for local server) - [Download here](https://python.org/)

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/lingadevaru-hp/insurance-Dapp-.git
cd insurance-Dapp-
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Local Blockchain
Open a new terminal and run:
```bash
npx ganache --port 7545 --deterministic --accounts 10 --hardfork istanbul --gasLimit 6721975000
```
**Keep this terminal running** - Your local blockchain needs to stay active.

### Step 4: Deploy Smart Contracts
Open another terminal and run:
```bash
npm run migrate
```

### Step 5: Start the Frontend
In a third terminal, run:
```bash
cd src
python3 -m http.server 8080
```

### Step 6: Setup MetaMask
1. Open MetaMask in your browser
2. Add custom network with these settings:
   - **Network Name**: Ganache Local
   - **RPC URL**: http://localhost:7545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH

3. Import a test account using one of these private keys:
   ```
   0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
   0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c
   ```

### Step 7: Access the DApp
Open your browser and go to: **http://localhost:8080**

## 🎮 How to Use

### Buying Insurance
1. Enter your desired payout amount (e.g., 1 ETH)
2. Set your premium amount (e.g., 0.1 ETH)
3. Click "Buy Policy"
4. Confirm the transaction in MetaMask
5. Your policy ID will be displayed

### Claiming Insurance
1. Enter your policy ID number
2. Click "Submit Claim"
3. Confirm the transaction in MetaMask
4. Receive your payout automatically

### Viewing Policies
1. Enter any policy ID
2. Click "View Policy"
3. See complete policy details including status

## 🧪 Testing the Smart Contract

Run the automated test suite:
```bash
npx truffle exec test_contract.js --network development
```

## 📁 Project Structure

```
insurance-Dapp-/
├── contracts/
│   └── Insurance.sol           # Smart contract (Solidity)
├── migrations/
│   └── 1_deploy_contracts.js   # Deployment script
├── src/
│   ├── index.html              # Frontend UI
│   ├── app.js                  # Web3 integration
│   └── Insurance.json          # Contract ABI
├── package.json                # Node.js dependencies
├── truffle-config.js           # Blockchain configuration
└── README.md                   # This file
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run migrate` | Deploy contracts to blockchain |
| `npm run test` | Run contract tests |
| `npm run dev` | Start development server |

## 🔧 Troubleshooting

### Common Issues:

**🔴 "Connection Error"**
- Make sure Ganache is running on port 7545
- Check MetaMask is connected to localhost:7545

**🔴 "Transaction Failed"**
- Ensure you have enough ETH for gas fees
- Check if the contract has sufficient funds for payouts

**🔴 "MetaMask Not Detected"**
- Install MetaMask browser extension
- Refresh the page after installation

**🔴 "Contract Not Deployed"**
- Run `npm run migrate` to deploy contracts
- Make sure Ganache is running first

## 🔒 Security Features

- ✅ **Reentrancy Protection** - Guards against recursive call attacks
- ✅ **Input Validation** - Comprehensive parameter checking
- ✅ **Modern Solidity** - Built with Solidity 0.8.x for enhanced security
- ✅ **Safe Transfers** - Uses `call` instead of deprecated `transfer()`
- ✅ **Access Controls** - Proper permission management

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Make sure all prerequisites are properly installed

## 🎉 Success Indicators

You'll know everything is working when you see:
- ✅ Ganache showing account balances and transaction history
- ✅ MetaMask connected to localhost:7545
- ✅ DApp interface loading at http://localhost:8080
- ✅ Successful policy purchases and claims

---

**Built with ❤️ using Ethereum, Solidity, Web3.js, and Truffle**