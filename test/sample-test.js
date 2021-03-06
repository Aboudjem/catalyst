const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Catalyst", function () {
  let catalyst;
  let accounts;
  let addresses;

  it("Should return the new contract once it's deployed", async function () {
    const Library = await ethers.getContractFactory("IterableMapping");
    const library = await Library.deploy();
    await library.deployed();

    const Catalyst = await ethers.getContractFactory("Catalyst", {
      libraries: {
        IterableMapping: library.address,
      },
    });
    catalyst = await Catalyst.deploy();
    await catalyst.deployed();
    accounts = await ethers.getSigners();
    addresses = accounts.map((account) => account.address);
  });

  it("Should set new roles", async function () {
    await catalyst.addRole(1, 1);
    expect(await catalyst.getRoleWeight(1)).to.equal(1);

    await catalyst.addRole(2, 2);
    expect(await catalyst.getRoleWeight(2)).to.equal(2);

    await catalyst.addRole(3, 3);
    expect(await catalyst.getRoleWeight(3)).to.equal(3);

    await catalyst.addRole(4, 4);
    expect(await catalyst.getRoleWeight(4)).to.equal(4);

    await catalyst.addRole(5, 1);
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

  it("Should fail to register Voter if already registered", async () => {
    await expect(catalyst.registerVoter(addresses[1], 1)).to.revertedWith(
      "Voter already exists"
    );
  });

  it("Should fail to register Voter if role doesn't exist", async () => {
    await expect(catalyst.registerVoter(addresses[7], 10)).to.revertedWith(
      "Trying to assign a non-existing role"
    );
  });

  it("Should set voters and mint voting tokens", async () => {
    for (let i = 1; i < 7; i++) {
      expect(await catalyst.getVotingPoints(addresses[i])).to.equal(0);
    }
    await catalyst.setVoters();
    for (let i = 1; i < 7; i++) {
      const voterRole = await catalyst.getVoterRole(addresses[i]);
      const roleWeight = await catalyst.getRoleWeight(voterRole);
      expect(await catalyst.getVotingPoints(addresses[i])).to.equal(roleWeight);
    }
  });

  it("Should set new project", async () => {
    await catalyst.createProject("ProjectA");
    await catalyst.createProject("ProjectB");
    await catalyst.createProject("ProjectC");
  });

  it("Should set new project if already exists", async () => {
    await expect(catalyst.createProject("ProjectA")).to.revertedWith(
      "Project already exists"
    );
  });

  it("Should vote for projects", async () => {
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

  it("Should vote for projects", async () => {
    await expect(
      catalyst.connect(accounts[1]).vote("ProjectA", 1)
    ).to.be.revertedWith("Not enough vote");
  });

  it("Should fail to update Voter if role doesn't exist", async () => {
    await expect(catalyst.updateVoter(addresses[1], 10)).to.revertedWith(
      "Trying to assign a non-existing role"
    );
  });

  it("Should fail to update Voter if voter doesn't exist", async () => {
    await expect(catalyst.updateVoter(addresses[8], 1)).to.revertedWith(
      "Voter doesn't exists"
    );
  });

  it("Should fail to remove Voter if voter doesn't exist", async () => {
    await expect(catalyst.updateVoter(addresses[8], 1)).to.revertedWith(
      "Voter doesn't exists"
    );
  });

  it("Should fail to add existing role", async function () {
    await expect(catalyst.addRole(1, 1)).to.revertedWith("Role already exists");
  });

  it("Should fail to set role 0", async function () {
    await expect(catalyst.addRole(0, 1)).to.revertedWith(
      "Cannot assign role 0"
    );
  });

  it("Should update Voter", async () => {
    expect(await catalyst.getVoterRole(addresses[1])).to.equal(1);
    await catalyst.updateVoter(addresses[1], 3);
    expect(await catalyst.getVoterRole(addresses[1])).to.equal(3);
  });

  it("Should prune voters and burn voting tokens", async () => {
    await catalyst.pruneVoters();
    for (let i = 1; i < 7; i++) {
      expect(await catalyst.getVotingPoints(addresses[i])).to.equal(0);
    }
  });

  it("Should remove Voter", async () => {
    await catalyst.removeVoter(addresses[1]);
    expect(await catalyst.getVoterRole(addresses[1])).to.equal(0);
  });

  it("Should fail removing Voter if doesn't exist", async () => {
    expect(await catalyst.getVoterRole(addresses[1])).to.equal(0);
    await expect(catalyst.removeVoter(addresses[1])).to.revertedWith(
      "Voter doesn't exists"
    );
  });

  it("Should close vote on specific project", async () => {
    await catalyst.closeProject("ProjectA");
  });

  it("Should close vote on specific project", async () => {
    await expect(catalyst.closeProject("ProjectA")).to.revertedWith(
      "Vote closed"
    );
  });

  it("Should not be able to vote if vote closed", async () => {
    await catalyst.setVoters();
    await expect(
      catalyst.connect(accounts[4]).vote("ProjectA", 1)
    ).to.revertedWith("Vote closed");
  });

  it("Should get the number of votes for specific project", async () => {
    expect(await catalyst.getProjectVotes("ProjectA")).to.equal("3");
    expect(await catalyst.getProjectVotes("ProjectB")).to.equal("4");
    expect(await catalyst.getProjectVotes("ProjectC")).to.equal("3");
  });

  it("Should fail getting number of votes on non-existing projects", async () => {
    await expect(catalyst.getProjectVotes("ProjectD")).to.revertedWith(
      "Project doesn't exist"
    );
  });
});

describe("Incubation", function () {
  let incubation;
  let accounts;
  let addresses;

  it("Should return the new contract once it's deployed", async function () {
    const Incubation = await ethers.getContractFactory("Incubation");
    incubation = await Incubation.deploy();
    await incubation.deployed();
    accounts = await ethers.getSigners();
    addresses = accounts.map((account) => account.address);
  });

  it("Should send tokens to Proposer", async () => {
    await incubation.sendToProposer(addresses[10], "1000");
    expect(await incubation.balanceOf(addresses[10])).to.equal("1000");
  });

  it("Should fail paying no-expert wallet using transfer", async () => {
    await expect(
      incubation.connect(accounts[10]).transfer(addresses[9], "1000")
    ).to.be.revertedWith("Not a valid expert");
  });

  it("Should fail paying no-expert wallet using transfer", async () => {
    await incubation.connect(accounts[10]).approve(addresses[9], "1000");

    await expect(
      incubation.transferFrom(addresses[10], addresses[9], "1000")
    ).to.be.revertedWith("Not a valid expert");
  });

  it("Should add an expert", async () => {
    await incubation.whitelistExpert(addresses[9], true);
    await incubation.isExpert(addresses[9]);
  });

  it("Should pay 1000 tokens to expert wallet", async () => {
    await incubation.connect(accounts[10]).transfer(addresses[9], "1000");
    expect(await incubation.balanceOf(addresses[9])).to.equal("1000");
  });
});
