//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./token/ERC20.sol";
import "./access/Ownable.sol";
import "./utils/IterableMapping.sol";
import "./ICatalyst.sol";

contract Catalyst is ICatalyst, Ownable {
    using IterableMapping for IterableMapping.Map;

    IterableMapping.Map private voters;

    /// Counter, number of vote per voters
    mapping(address => uint) private counters;

    /// Vote weight per role
    mapping(uint8 => uint8) private roles;

    /// Link name of the project to its struct (status, vote)
    mapping(string => Project) private projects;

    /**
     * @notice Register a voter and assign a role
     * @dev update `counters`for `_voterAddress`
     * @param _voterAddress, address to assign role
     * @param _role, id of the role to be affected to this voter
     */
    function registerVoter(address _voterAddress, uint8 _role)
        external
        onlyOwner
    {
        require(voters.get(_voterAddress) == 0, "Voter already exists");
        _assignVoter(_voterAddress, _role);
        emit voterAssigned(_voterAddress, _role);
    }

    /**
     * @notice Update a voter and assign a new role
     * @dev update `counters`for `_voterAddress`, _voterAddress must be a valid voter
     * @param _voterAddress, address to assign role
     * @param _role, id of the role to be affected to this voter
     */
    function updateVoter(address _voterAddress, uint8 _role)
        external
        onlyOwner
    {
        require(voters.get(_voterAddress) != 0, "Voter doesn't exists");
        _assignVoter(_voterAddress, _role);
        emit voterAssigned(_voterAddress, _role);
    }

    /**
     * @notice Remove a voter
     * @dev update `counters`for `_voterAddress` to 0, and remove voter
     * @param _voterAddress, address of the voter to be removed
     */
    function removeVoter(address _voterAddress) external onlyOwner {
        require(voters.get(_voterAddress) != 0, "Voter doesn't exists");
        counters[_voterAddress] = 0;
        voters.remove(_voterAddress);
        emit voterRemoved(_voterAddress);
    }

    /**
     * @notice Set a new Role and number of voting points to be assigned
     * @dev update `roles` for a `_voteWeight`
     * @param _role, id of the role to be created
     * @param _voteWeight, voting points to be assigned to this role
     */
    function addRole(uint8 _role, uint8 _voteWeight) external onlyOwner {
        require(_role > 0, "Cannot assign role 0");
        require(roles[_role] == 0, "Role already exists");
        roles[_role] = _voteWeight;
        emit RoleAdded(_role, _voteWeight);
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
