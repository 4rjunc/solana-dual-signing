import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Signing } from "../target/types/signing";
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmRawTransaction,
  SystemProgram,
} from "@solana/web3.js";
import user from "../user.json";
import backend from "../backend.json"

describe("signing", () => {
  // Load the wallet keypair for the frontend user
  const userWallet = Keypair.fromSecretKey(new Uint8Array(user));

  // Create a new keypair for the backend signer
  const backendSigner = Keypair.fromSecretKey(new Uint8Array(backend));
  // Set up the provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Signing as Program<Signing>;
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Log the public keys for debugging
  console.log("User Wallet Public Key:", userWallet.publicKey.toString());
  console.log("Backend Signer Public Key:", backendSigner.publicKey.toString());
  console.log(
    "Provider Wallet Public Key:",
    provider.wallet.publicKey.toString()
  );

  it("Should initialize with user (frontend) signing first, then backend", async () => {
    try {
      // Create the instruction
      const instruction = await program.methods
        .initialize()
        .accounts({
          user: provider.wallet.publicKey,
          offchain: backendSigner.publicKey,
        })
        .instruction();

      // Create and configure transaction
      const transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.wallet.publicKey;
      transaction.add(instruction);

      // Frontend signs first
      let signedTx = await provider.wallet.signTransaction(transaction);

      // Backend signs next
      signedTx.partialSign(backendSigner);

      // Send the fully signed transaction
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      );

      console.log(`Transaction signature: ${signature}`);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });

  // Helper function to airdrop SOL to the backend signer if needed
  async function fundBackendSigner() {
    try {
      const airdropSignature = await connection.requestAirdrop(
        backendSigner.publicKey,
        1_000_000_000 // 1 SOL
      );
      await connection.confirmTransaction(airdropSignature, "confirmed");
      console.log("Airdropped 1 SOL to backend signer");
    } catch (error) {
      console.error("Error funding backend signer:", error);
    }
  }

  // Fund backend signer before running tests
  before(async () => {
    await fundBackendSigner();
  });
});
