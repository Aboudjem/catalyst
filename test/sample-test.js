const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Catalyst", function () {

  let catalyst;
  let accounts;
  let addresses;

  it("Should return the new greeting once it's changed", async function () {
    const Library = await ethers.getContractFactory("IterableMapping");
    const library = await Library.deploy();
    await library.deployed();

    const Catalyst = await ethers.getContractFactory("Catalyst", {
      libraries: {
        IterableMapping: library.address
      }
    });
    catalyst = await Catalyst.deploy("Catalyst", "VOTE");
    await catalyst.deployed();
    accounts = await ethers.getSigners();
    addresses = accounts.map((account) => account.address);
  });

  it("Should set new roles", async function () {
    await catalyst.setNewRole(1, 1);
    expect(await catalyst.getRoleWeight(1)).to.equal(1);

    await catalyst.setNewRole(2, 2);
    expect(await catalyst.getRoleWeight(2)).to.equal(2);

    await catalyst.setNewRole(3, 3);
    expect(await catalyst.getRoleWeight(3)).to.equal(3);

    await catalyst.setNewRole(4, 4);
    expect(await catalyst.getRoleWeight(4)).to.equal(4);

    await catalyst.setNewRole(5, 1);
    expect(await catalyst.getRoleWeight(5)).to.equal(1);
  });

  it("Should register Voter", async function () {
    await catalyst.registerVoter(addresses[1], 1);
    await catalyst.registerVoter(addresses[2], 2);
    await catalyst.registerVoter(addresses[3], 2);
    await catalyst.registerVoter(addresses[4], 3);
    await catalyst.registerVoter(addresses[5], 4);
    await catalyst.registerVoter(addresses[6], 5);
  });

  it("Should fail to register Voter if already registered", async() => {
    await expect(catalyst.registerVoter(addresses[1], 1)).to.revertedWith("Voter already exists");
  });

  it("Should fail to register Voter if role doesn't exist", async() => {
    await expect(catalyst.registerVoter(addresses[7], 10)).to.revertedWith("Trying to assign a non-existing role");
  });

  it("Should set voters and mint voting tokens", async() => {
    for(let i = 1; i < 7; i++){
      expect(await catalyst.balanceOf(addresses[i])).to.equal(0);
    }
    await catalyst.setVoters();
    for(let i = 1; i < 7; i++){
      let voterRole = await catalyst.getVoterRole(addresses[i]);
      let roleWeight = await catalyst.getRoleWeight(voterRole);
      expect(await catalyst.balanceOf(addresses[i])).to.equal(roleWeight);
    }
  });

  it("Should set new project", async() => {
    await catalyst.setNewProject("ProjectA");
    await catalyst.setNewProject("ProjectB");
    await catalyst.setNewProject("ProjectC");
  });

  it("Should set new project if already exists", async() => {
    await expect(catalyst.setNewProject("ProjectA")).to.revertedWith("Project already exists");
  });

  it("Should vote for projects", async() => {
    await catalyst.connect(accounts[1]).vote("ProjectA", 1);
    await catalyst.connect(accounts[2]).vote("ProjectB", 1);
    await catalyst.connect(accounts[2]).vote("ProjectC", 1);

    await catalyst.connect(accounts[3]).vote("ProjectA", 1);
    await catalyst.connect(accounts[3]).vote("ProjectB", 1);
    await catalyst.connect(accounts[6]).vote("ProjectC", 1);

    await catalyst.connect(accounts[4]).vote("ProjectA", 1);
    await catalyst.connect(accounts[4]).vote("ProjectB", 2);
    await catalyst.connect(accounts[5]).vote("ProjectC", 1);
  });

  it("Should fail to update Voter if role doesn't exist", async() => {
    await expect(catalyst.updateVoter(addresses[1], 10)).to.revertedWith("Trying to assign a non-existing role");
  });

  it("Should fail to update Voter if voter doesn't exist", async() => {
    await expect(catalyst.updateVoter(addresses[8], 1)).to.revertedWith("Voter doesn't exists");
  });

  it("Should fail to remoev Voter if voter doesn't exist", async() => {
    await expect(catalyst.updateVoter(addresses[8], 1)).to.revertedWith("Voter doesn't exists");
  });

  it("Should fail to add existing role", async function () {
    await expect(catalyst.setNewRole(1, 1)).to.revertedWith("Role already exists");
  });

  it("Should fail to set role 0", async function () {
    await expect(catalyst.setNewRole(0, 1)).to.revertedWith("Cannot assign role 0");
  });

    it("Should update Voter", async() => {
    expect(await catalyst.getVoterRole(addresses[1])).to.equal(1);
    await catalyst.updateVoter(addresses[1], 3);
    expect(await catalyst.getVoterRole(addresses[1])).to.equal(3);
  });

  it("Should prune voters and burn voting tokens", async() => {
    await catalyst.pruneVoters();
    for(let i = 1; i < 7; i++){
      expect(await catalyst.balanceOf(addresses[i])).to.equal(0);
    }
  });

  it("Should remove Voter", async() => {
    await catalyst.removeVoter(addresses[1]);
    expect(await catalyst.getVoterRole(addresses[1])).to.equal(0);
  });

  it("Should fail removing Voter if doesn't exist", async() => {
    expect(await catalyst.getVoterRole(addresses[1])).to.equal(0);
    await expect(catalyst.removeVoter(addresses[1])).to.revertedWith("Voter doesn't exists");
  });

  it("Should close vote on specific project", async() => {
    await catalyst.closeVote("ProjectA");
  })


  it("Should close vote on specific project", async() => {
    await expect(catalyst.closeVote("ProjectA")).to.revertedWith("Vote closed");
  });



  it("Should not be able to vote if vote closed", async() => {
    await catalyst.setVoters();
    await expect(catalyst.connect(accounts[4]).vote("ProjectA", 1)).to.revertedWith("Vote closed");
  })

});
