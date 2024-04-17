const { AeSdk, CompilerHttp, Node } = require('@aeternity/aepp-sdk');
const { utils } = require('@aeternity/aeproject');
const fs = require('fs');
const path = require('path');

const NODE_URL = 'https://testnet.aeternity.io';
const COMPILER_URL = 'https://v7.compiler.aeternity.io';

(async function () {
  console.log('Compiling contracts...');

  const node = new Node(NODE_URL);
  const aeSdk = new AeSdk({
    onCompiler: new CompilerHttp(COMPILER_URL),
    nodes: [{ name: 'testnet', instance: node }],
  });

  const BASIC_DAO_CONTRACT_PATH = path.join(
    __dirname,
    '..',
    'contracts',
    'BasicDAO.aes'
  );
  const BasicDAOSourceCode = utils.getContractContent(BASIC_DAO_CONTRACT_PATH);
  const BasicDAOFileSystem = utils.getFilesystem(BASIC_DAO_CONTRACT_PATH);

  const BasicDAO = await aeSdk.initializeContract({
    sourceCode: BasicDAOSourceCode,
    fileSystem: BasicDAOFileSystem,
  });

  const NUCLEUS_DAO_CONTRACT_PATH = path.join(
    __dirname,
    '..',
    'contracts',
    'NucleusDAO.aes'
  );
  const NucleusDaoSourceCode = utils.getContractContent(
    NUCLEUS_DAO_CONTRACT_PATH
  );
  const NucleusDaoFileSystem = utils.getFilesystem(NUCLEUS_DAO_CONTRACT_PATH);

  const nucleusDAO = await aeSdk.initializeContract({
    sourceCode: NucleusDaoSourceCode,
    fileSystem: NucleusDaoFileSystem,
  });

  const aciPath = path.join(__dirname, '..', 'acis');
  if (!fs.existsSync(aciPath)) {
    fs.mkdirSync(aciPath);
  }
  fs.writeFileSync(
    path.join(aciPath, 'BasicDAO.json'),
    JSON.stringify(BasicDAO._aci)
  );
  fs.writeFileSync(
    path.join(aciPath, 'NucleusDAO.json'),
    JSON.stringify(nucleusDAO._aci)
  );
  console.log('Contracts ACIs saved');
})();
