import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Signing } from "../target/types/signing";
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import wallet from "./wallet"

describe("signing", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Signing as Program<Signing>;
  const backendNode = Keypair.fromSecretKey(new Uint8Array(wallet));
  const connection = new Connection("https://api.devnet.solana.com")

  it("Is initialized!", async () => {
    try {
      // Frontend Process
      const instruction = await program.methods
        .initialize()
        .accounts({})
        .instruction();

      // Create and configure transaction
      const transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = provider.wallet.publicKey; // Frontend wallet pays fees
      transaction.add(instruction);

      // Frontend signs
      const frontendSignedTx = await provider.wallet.signTransaction(transaction);

      // Serialize the partially signed transaction to send to backend
      const serializedTx = frontendSignedTx.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      // BACKEND PROCESS
      // Deserialize and verify the transaction
      const recoveredTx = Transaction.from(serializedTx);

      // Backend signs
      recoveredTx.partialSign(backendNode);

      // Send and confirm
      const signature = await sendAndConfirmTransaction(
        connection,
        recoveredTx,
        [backendNode],
        {
          commitment: 'confirmed'
        }
      );

      console.log(
        `Success! Check out transaction here: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      );
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
});
