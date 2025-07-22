// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Insurance is ReentrancyGuard {
    address public insurer;

    struct Policy {
        address payable holder;
        uint premium;
        uint payout;
        bool active;
        bool claimed;
    }

    mapping(uint => Policy) public policies;
    uint public policyCount;

    event PolicyPurchased(uint policyId, address holder);
    event Claimed(uint policyId, address holder);

    constructor() {
        insurer = msg.sender;
    }
    
    function buyPolicy(uint _payout) public payable nonReentrant {
        require(msg.value > 0, "Premium must be greater than 0");
        require(_payout > 0, "Payout must be greater than 0");
        require(_payout >= msg.value, "Payout must be at least equal to premium");

        policyCount++;
        policies[policyCount] = Policy(
            payable(msg.sender),
            msg.value,
            _payout,
            true,
            false
        );

        emit PolicyPurchased(policyCount, msg.sender);
    }

    function claimPolicy(uint _policyId) public nonReentrant {
        require(_policyId > 0 && _policyId <= policyCount, "Invalid policy ID");
        Policy storage policy = policies[_policyId];

        require(policy.active, "Policy is not active");
        require(!policy.claimed, "Policy already claimed");
        require(msg.sender == policy.holder, "Not policy holder");
        require(address(this).balance >= policy.payout, "Insufficient funds");

        policy.claimed = true;
        policy.active = false;

        (bool success, ) = policy.holder.call{value: policy.payout}("");
        require(success, "Transfer failed");
        
        emit Claimed(_policyId, msg.sender);
    }

    function getPolicy(uint _policyId) public view returns (
        address holder,
        uint premium,
        uint payout,
        bool active,
        bool claimed
    ) {
        require(_policyId > 0 && _policyId <= policyCount, "Invalid policy ID");
        Policy memory policy = policies[_policyId];
        return (policy.holder, policy.premium, policy.payout, policy.active, policy.claimed);
    }

    function fundContract() public payable {
        require(msg.sender == insurer, "Only insurer can fund");
    }
}
