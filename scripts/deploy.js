const {
  AeSdk,
  CompilerHttp,
  MemoryAccount,
  Node,
} = require("@aeternity/aepp-sdk");
const { utils } = require("@aeternity/aeproject");

const shutdown = (varName) => {
  console.error(`Missing ENV variable: ${varName}`);
  process.exit(1);
};

const NODE_URL = "https://testnet.aeternity.io";
const COMPILER_URL = "https://v7.compiler.aeternity.io";

const collectionTemplateEditionData = require("../nfts/collection_templates.json");

(async function () {
  secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    throw error("Missing SECRET_KEY environment variable");
  }
  const senderAccount = new MemoryAccount(secretKey);
  const senderAddress = senderAccount.address;

  console.log(`Deploying with account: ${senderAddress}`);

  const node = new Node(NODE_URL);
  const aeSdk = new AeSdk({
    onCompiler: new CompilerHttp(COMPILER_URL),
    nodes: [{ name: "testnet", instance: node }],
  });
  aeSdk.addAccount(senderAccount, { select: true });

  const CONTRACT = "./contracts/CollectionTemplateEditionNFTs.aes";
  const sourceCode = utils.getContractContent(CONTRACT);
  const fileSystem = utils.getFilesystem(CONTRACT);

  const contract = await aeSdk.initializeContract({ sourceCode, fileSystem });

  // deploy
  const deployment = await contract.$deploy([]);
  console.log(`Contract successfully deployed!`);
  console.log(`Contract address: ${deployment.address}`);
})();
