// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

contract Project {
    string name;
    bool status;
    uint votes;

    constructor(string memory name_) {
        name = name_;
        status = true;
        votes = 0;
    }

    function getStatus() external view returns (bool) {
        return status;
    }

    function closeVote(uint amount) public {
        status = false;
        votes = amount;
    }
}
