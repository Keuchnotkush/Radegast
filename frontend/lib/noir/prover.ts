// ZK proof generation — heavy WASM packages are loaded at runtime only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _solvency: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _commitment: any = null;

async function loadSolvencyCircuit() {
  if (!_solvency) _solvency = await fetch("/circuits/proof_of_solvency.json").then((r) => r.json());
  return _solvency;
}

async function loadCommitmentCircuit() {
  if (!_commitment) _commitment = await fetch("/circuits/compute_commitment.json").then((r) => r.json());
  return _commitment;
}

export async function computeCommitment(balances: string[], secret: string) {
  const { Noir } = await import("@noir-lang/noir_js");
  const circuit = await loadCommitmentCircuit();
  const noir = new Noir(circuit);
  await noir.init();
  const { returnValue } = await noir.execute({ balances, secret });
  return returnValue as string;
}

export async function generateProof(
  balances: string[],
  prices: string[],
  secret: string,
  threshold: string
) {
  // 1. compute commitment
  const commitment = await computeCommitment(balances, secret);

  // 2. witness
  const { Noir } = await import("@noir-lang/noir_js");
  const circuit = await loadSolvencyCircuit();
  const noir = new Noir(circuit);
  await noir.init();
  const { witness } = await noir.execute({
    balances,
    prices,
    secret,
    threshold,
    commitment,
  });

  // 3. proof — UltraHonkBackend takes bytecode string directly
  const { UltraHonkBackend } = await import("@aztec/bb.js");
  const backend = new UltraHonkBackend(circuit.bytecode);
  const proofData = await backend.generateProof(witness);
  await backend.destroy();

  return { proof: proofData.proof, publicInputs: proofData.publicInputs, commitment };
}
