const {
  AeSdk,
  Node,
  MemoryAccount,
  CompilerHttp,
} = require('@aeternity/aepp-sdk');
const { utils } = require('@aeternity/aeproject');
const path = require('path');

const NODE_URL = 'https://testnet.aeternity.io';
const COMPILER_URL = 'https://v7.compiler.aeternity.io';

const node = new Node(NODE_URL);
const aeSdk = new AeSdk({
  onCompiler: new CompilerHttp(COMPILER_URL),
  nodes: [{ name: 'testnet', instance: node }],
});

const CONTRACT = path.join(__dirname, '..', 'contracts', 'NucleusDAO.aes');
const sourceCode = utils.getContractContent(CONTRACT);
const fileSystem = utils.getFilesystem(CONTRACT);
const DAO_CONTRACT = path.join(__dirname, '..', 'contracts', 'BasicDAO.aes');
const daoSourceCode = utils.getContractContent(DAO_CONTRACT);
const daoFileSystem = utils.getFilesystem(DAO_CONTRACT);

(async function () {
  const contract = await aeSdk.initializeContract({ sourceCode, fileSystem });
  const daoContract = await aeSdk.initializeContract({
    sourceCode: daoSourceCode,
    fileSystem: daoFileSystem,
  });
  const daoACI = daoContract._aci;
  const secretKey = process.env.SECRET_KEY;
  console.log(secretKey);
  if (!secretKey) {
    throw Error('Missing SECRET_KEY environment variable');
  }
  const senderAccount = new MemoryAccount(secretKey);
  const senderAddress = senderAccount.address;

  console.log(`Deploying with account: ${senderAddress}`);

  aeSdk.addAccount(senderAccount, { select: true });

  // deploy
  const deployment = await contract.$deploy([]);
  console.log(`Contract successfully deployed!`);
  console.log(`Contract address: ${deployment.address}`);

  console.log('Creating a dao...');
  const res = await contract.createDAO(
    'Hexdee DAO',
    'hexdee-dao',
    'My personal DAO',
    'https://tse3.mm.bing.net/th?id=OIP.NtaJNxfrjFBLd5fNGM0-sgHaI5',
    [],
    [],
    100,
    60 * 60 * 24 * 3,
    50,
    { amount: 100 }
  );
  console.log('DAO created!');
  const myDao = res.decodedResult;
  console.log({ myDao });
  console.log((await contract.getDAO('hexdee-dao')).decodedResult);
  const daos = (await contract.getDAOs()).decodedResult;
  console.log({ daos });

  const daoInstance = await aeSdk.initializeContract({
    aci: daoACI,
    address: daos[0].contractAddress,
  });
  console.log('Creating proposal...');
  const proposal = (
    await daoInstance.createProposal(
      'transfer',
      'Pay Hexdee',
      10,
      senderAddress
    )
  ).decodedResult;
  console.log('Proposal created!', proposal);
  console.log((await daoInstance.getProposal(proposal.id)).decodedResult);
  const proposals = (await daoInstance.getProposals()).decodedResult;
  console.log({ proposals });
  console.log('Voting for proposal...');
  await daoInstance.voteAgainst(proposal.id);
  console.log((await daoInstance.getProposal(proposal.id)).decodedResult);
  await daoInstance.voteFor(proposal.id);
  console.log((await daoInstance.getProposal(proposal.id)).decodedResult);
})();
