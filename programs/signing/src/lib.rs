use anchor_lang::prelude::*;

declare_id!("BrxvS3VRqhSeTbWsqJi8RSXqpqYiuyn8AVkJ6EQdz4X7");

#[program]
pub mod signing {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
