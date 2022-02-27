// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "./token/ERC20.sol";
import "./access/Ownable.sol";

contract Incubation is ERC20, Ownable {
    constructor() ERC20("Payment Token", "PAY") {}

    mapping(address => bool) private _isExpert;

    event UpdatedExpertStatus(address _expertAddress, bool _status);

    function transfer(address _address, uint _amount)
        public
        virtual
        override
        returns (bool)
    {
        require(_isExpert[_address], "Not a valid expert");
        return super.transfer(_address, _amount);
    }

    function whitelistExpert(address _expertAddress, bool _status)
        external
        onlyOwner
    {
        _isExpert[_expertAddress] = _status;
        emit UpdatedExpertStatus(_expertAddress, _status);
    }

    function sendToProposer(address _proposer, uint _amount)
        external
        onlyOwner
    {
        _mint(_proposer, _amount);
    }

    function isExpert(address _address) external view returns (bool) {
        return _isExpert[_address];
    }
}
