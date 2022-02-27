//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./token/ERC20.sol";
import "./access/Ownable.sol";
import "./utils/IterableMapping.sol";
import "hardhat/console.sol";

//import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

contract Catalyst is ERC20, Ownable {

    using IterableMapping for IterableMapping.Map;

    IterableMapping.Map private voters;


    mapping(string => uint) counters;

    mapping(uint8 => uint8) roles;

    mapping(string => address) projects;

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {

    }

    function registerVoter(address _voterAddress, uint8 _role) public onlyOwner {
        require(voters.get(_voterAddress) == 0, "Voter already exists");
        require(roles[_role] != 0, "Trying to assign a non-existing role");
        voters.set(_voterAddress, _role);
    }

    function updateVoter(address _voterAddress, uint8 _role) public onlyOwner {
        require(voters.get(_voterAddress) != 0, "Voter doesn't exists");
        require(roles[_role] != 0, "Trying to assign a non-existing role");
        voters.set(_voterAddress, _role);
    }

    function removeVoter(address _voterAddress) public onlyOwner {
        require(voters.get(_voterAddress) != 0, "Voter doesn't exists");
        voters.remove(_voterAddress);
    }

    function setNewRole(uint8 _role, uint8 _voteWeight) public onlyOwner {
        require(_role > 0, "Cannot assign role 0");
        require(roles[_role] == 0, "Role already exists");
        roles[_role] = _voteWeight;
    }

    function setNewProject(string memory _name) public onlyOwner {
        require(address(projects[_name]) == address(0), "Project already exists");
        projects[_name] = address(new Project(_name));
    }

    function closeVote(string memory _name) public onlyOwner {
        Project project = Project(projects[_name]);
        require(project.getStatus() == true, "Vote closed");
        uint balance = balanceOf(address(project));
        project.closeVote(balance);
    }

    function setVoters() public onlyOwner {
        for(uint i = 0; i < voters.size(); i++) {
            address voter = voters.getKeyAtIndex(i);
            console.log("Address: '%s' has '%s' vote weight", voter, roles[voters.get(voter)]);
            _mint(voter, roles[voters.get(voter)]);
        }
    }

    function pruneVoters() public onlyOwner {
        for(uint i = 0; i < voters.size(); i++) {
            address voter = voters.getKeyAtIndex(i);
            console.log("Address: '%s' has '%s' vote weight", voter, roles[voters.get(voter)]);
            _burn(voter, balanceOf(voter));
        }
    }

    function vote(string memory _name, uint _amount) public {
        Project project = Project(projects[_name]);
        require(project.getStatus() == true, "Vote closed");
        transfer(projects[_name], _amount);
    }

    function getRoleWeight(uint8 _role) public view returns(uint8) {
        return roles[_role];
    }

    function getVoterRole(address _voterAddress) public view returns(uint8) {
        return voters.get(_voterAddress);
    }

}
