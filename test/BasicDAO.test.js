const { assert } = require('chai');
const { utils } = require('@aeternity/aeproject');
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');

chai.use(chaiAsPromised);

const BASIC_DAO_SOURCE = './contracts/BasicDAO.aes';

describe('BasicDAO', () => {
  let aeSdk;
  let contract;

  before(async () => {
    aeSdk = utils.getSdk();

    // a filesystem object must be passed to the compiler if the contract uses custom includes
    const fileSystem = utils.getFilesystem(BASIC_DAO_SOURCE);

    // get content of contract
    const sourceCode = utils.getContractContent(BASIC_DAO_SOURCE);

    // initialize the contract instance
    contract = await aeSdk.initializeContract({ sourceCode, fileSystem });
    await contract.init();

    // create a snapshot of the blockchain state
    await utils.createSnapshot(aeSdk);
  });

  // after each test roll back to initial state
  afterEach(async () => {
    await utils.rollbackSnapshot(aeSdk);
  });

  it('should initialize with correct initial state', async () => {
    // Test initialization state
    const initialState = await basicDAO.getInfo();
    expect(initialState.name).to.equal('Nucleaus DAO');
    expect(initialState.description).to.equal('Description');
    expect(initialState.image).to.equal('IMAGE_URL');
    expect(initialState.socials).to.have.lengthOf(1);
    expect(initialState.votingTime).to.equal(10800000);
    expect(initialState.quorum).to.equal(50);
    expect(initialState.proposals).to.be.an('object').that.is.empty;
    expect(initialState.totalProposals).to.equal(0);
    expect(initialState.members).to.have.lengthOf(1);
  });

  it('should allow creation of proposals', async () => {
    // Create a proposal
    const proposalId = await basicDAO.createProposal(
      'transfer',
      'Description',
      100,
      'ak_TVr8Kc11DUH1afHC6bb7RiL97dRHq9nNvt4f8d5nm2ebMxJLC'
    );

    // Check if proposal was created successfully
    const proposal = await basicDAO.getProposal(proposalId);
    expect(proposal.id).to.equal(proposalId);
    expect(proposal.proposer).to.equal(wallet.address); // Assuming wallet is the creator
    expect(proposal.proposalType).to.equal('transfer');
    expect(proposal.description).to.equal('Description');
    expect(proposal.value).to.equal(100);
    expect(proposal.target).to.equal(
      'ak_TVr8Kc11DUH1afHC6bb7RiL97dRHq9nNvt4f8d5nm2ebMxJLC'
    );
    expect(proposal.endTime).to.be.a('number').that.is.above(0);
    expect(proposal.votesFor).to.equal(0);
    expect(proposal.votesAgainst).to.equal(0);
    expect(proposal.isExecuted).to.be.false;
    expect(proposal.hasVoted).to.be.an('object').that.is.empty;
  });

  it('should correctly handle voting on proposals', async () => {
    // Create a proposal
    const proposalId = await basicDAO.createProposal(
      'transfer',
      'Description',
      100,
      'ak_TVr8Kc11DUH1afHC6bb7RiL97dRHq9nNvt4f8d5nm2ebMxJLC'
    );

    // Vote for the proposal
    await basicDAO.voteFor(proposalId);

    // Check if vote for was registered correctly
    let proposal = await basicDAO.getProposal(proposalId);
    expect(proposal.votesFor).to.equal(1);

    // Vote against the proposal
    await basicDAO.voteAgainst(proposalId);

    // Check if vote against was registered correctly
    proposal = await basicDAO.getProposal(proposalId);
    expect(proposal.votesAgainst).to.equal(1);

    // Attempt to vote after proposal end time
    await expect(basicDAO.voteFor(proposalId)).to.be.revertedWith(
      'Proposal has ended!'
    );
  });

  it('should revert when non-member tries to create a proposal', async () => {
    // Attempt to create a proposal from a non-member account
    await expect(
      basicDAO
        .connect(other)
        .createProposal(
          'transfer',
          'Description',
          100,
          'ak_TVr8Kc11DUH1afHC6bb7RiL97dRHq9nNvt4f8d5nm2ebMxJLC'
        )
    ).to.be.revertedWith('You are not a member of this DAO');
  });

  it('should revert when non-member tries to vote on a proposal', async () => {
    // Create a proposal
    const proposalId = await basicDAO.createProposal(
      'transfer',
      'Description',
      100,
      'ak_TVr8Kc11DUH1afHC6bb7RiL97dRHq9nNvt4f8d5nm2ebMxJLC'
    );

    // Attempt to vote on the proposal from a non-member account
    await expect(
      basicDAO.connect(other).voteFor(proposalId)
    ).to.be.revertedWith('You are not a member of this DAO');
  });
});
