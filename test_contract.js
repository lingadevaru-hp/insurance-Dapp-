const Insurance = artifacts.require("Insurance");

module.exports = async function(callback) {
  try {
    // Get the deployed contract instance
    let insurance = await Insurance.deployed();
    console.log('✅ Contract deployed at:', insurance.address);

    // Get the insurer address
    let insurer = await insurance.insurer();
    console.log('🏢 Insurer address:', insurer);

    // Check initial policy count
    let policyCount = await insurance.policyCount();
    console.log('📋 Initial policy count:', policyCount.toString());

    // Get accounts
    let accounts = await web3.eth.getAccounts();
    console.log('👥 Available accounts:', accounts.slice(0, 3));

    // Buy a policy (0.1 ETH premium, 1 ETH payout)
    console.log('\n💰 Buying insurance policy...');
    let premiumWei = web3.utils.toWei('0.1', 'ether');
    let payoutWei = web3.utils.toWei('1', 'ether');

    let buyResult = await insurance.buyPolicy(payoutWei, {
      from: accounts[1], 
      value: premiumWei
    });

    console.log('✅ Policy purchased! Transaction hash:', buyResult.tx);

    // Check updated policy count
    policyCount = await insurance.policyCount();
    console.log('📋 New policy count:', policyCount.toString());

    // Get policy details
    let policy = await insurance.getPolicy(1);
    console.log('\n📄 Policy #1 details:');
    console.log('  - Holder:', policy[0]);
    console.log('  - Premium:', web3.utils.fromWei(policy[1], 'ether'), 'ETH');
    console.log('  - Payout:', web3.utils.fromWei(policy[2], 'ether'), 'ETH'); 
    console.log('  - Active:', policy[3]);
    console.log('  - Claimed:', policy[4]);

    // Fund the contract so claims can be paid
    console.log('\n💵 Funding contract with 5 ETH...');
    await insurance.fundContract({from: accounts[0], value: web3.utils.toWei('5', 'ether')});

    let contractBalance = await web3.eth.getBalance(insurance.address);
    console.log('💰 Contract balance:', web3.utils.fromWei(contractBalance, 'ether'), 'ETH');

    // Claim the policy
    console.log('\n🔔 Claiming policy...');
    let claimResult = await insurance.claimPolicy(1, {from: accounts[1]});
    console.log('✅ Claim processed! Transaction hash:', claimResult.tx);

    // Check policy status after claim
    policy = await insurance.getPolicy(1);
    console.log('\n📄 Policy #1 after claim:');
    console.log('  - Active:', policy[3]);
    console.log('  - Claimed:', policy[4]);

    // Check final contract balance
    contractBalance = await web3.eth.getBalance(insurance.address);
    console.log('💰 Final contract balance:', web3.utils.fromWei(contractBalance, 'ether'), 'ETH');

    console.log('\n🎉 Insurance contract working perfectly!');
    callback();
  } catch (error) {
    console.error('❌ Error:', error);
    callback(error);
  }
};