#![no_std]
use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env, Map,
    Symbol, TryIntoVal, Vec, Bytes
};

#[contract]
pub struct MessageGateContract;

#[contracttype]
#[derive(Clone)]
pub struct AccSignature {
    pub public_key: BytesN<32>,
    pub signature: BytesN<64>,
}


#[contracttype]
#[derive(Clone)]
pub struct DisMessage {
    pub to_chain_id: u64,
    pub to: Bytes,
    pub data: Bytes
}

#[contracttype]
#[derive(Clone)]
pub struct RecMessage {
    pub token: Address,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    SignerCnt,
    Signer(BytesN<32>),

}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AccError {
    NotEnoughSigners = 1,
    NegativeAmount = 2,
    BadSignatureOrder = 3,
    UnknownSigner = 4,
    InvalidContext = 5,
}

const DISPATCHMESSAGE: Symbol = symbol_short!("DISPATCH_");
const RECEIVEMESSAGE: Symbol = symbol_short!("_RECEIVE_");

#[contractimpl]
impl MessageGateContract {
    pub fn init(env: Env, signers: Vec<BytesN<32>>) {
        // In reality this would need some additional validation on signers
        // (deduplication etc.).
        for signer in signers.iter() {
            env.storage().instance().set(&DataKey::Signer(signer), &());
        }
        env.storage()
            .instance()
            .set(&DataKey::SignerCnt, &signers.len());
    }
    pub fn dispatch_message(env:Env,to_chain_id: u64, to: Bytes, data: Bytes) {


        let event_msg = DisMessage {to_chain_id, to, data};
        env.events().publish((DISPATCHMESSAGE,symbol_short!("dispatch")),event_msg );

    }
    pub fn receive_message(env: Env, token: Address) -> Result<u64, AccError>{
        // The current contract address is the account contract address and has
        // the same semantics for `require_auth` call as any other account
        // contract address.
        // Note, that if a contract *invokes* another contract, then it would
        // authorize the call on its own behalf and that wouldn't require any
        // user-side verification.
        env.current_contract_address().require_auth();

        Ok(19)

    }
}

impl CustomAccountInterface for MessageGateContract {
    type Signature = Vec<AccSignature>;
    type Error = AccError;

    #[allow(non_snake_case)]
    fn __check_auth(
        env: Env,
        signature_payload: BytesN<32>,
        signatures: Vec<AccSignature>,
        auth_context: Vec<Context>,
    ) -> Result<(), AccError> {
        // Perform authentication.
        authenticate(&env, &signature_payload, &signatures)?;

        let tot_signers: u32 = env
            .storage()
            .instance()
            .get::<_, u32>(&DataKey::SignerCnt)
            .unwrap();
        let all_signed = tot_signers == signatures.len();

        let curr_contract = env.current_contract_address();

        Ok(())
    }
}

fn authenticate(
    env: &Env,
    signature_payload: &BytesN<32>,
    signatures: &Vec<AccSignature>,
) -> Result<(), AccError> {
    for i in 0..signatures.len() {
        let signature = signatures.get_unchecked(i);
        if i > 0 {
            let prev_signature = signatures.get_unchecked(i - 1);
            if prev_signature.public_key >= signature.public_key {
                return Err(AccError::BadSignatureOrder);
            }
        }
        if !env
            .storage()
            .instance()
            .has(&DataKey::Signer(signature.public_key.clone()))
        {
            return Err(AccError::UnknownSigner);
        }
        env.crypto().ed25519_verify(
            &signature.public_key,
            &signature_payload.clone().into(),
            &signature.signature,
        );
    }
    Ok(())
}


mod test;
