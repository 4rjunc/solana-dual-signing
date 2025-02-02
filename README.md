## Need to install solana cli, rust and anchor : [HERE](https://solana.com/pt/docs/intro/installation) 

## Generate Keypairs for user and backend (off-chain node)

```bash
solana-keygen new -o user.json # for user
solana-keygen new -o backend.json # for offchain node
```

## Fund the wallets
```bash
solana airdrop -k user.json 2
solana airdrop -k backend.json 2
```
