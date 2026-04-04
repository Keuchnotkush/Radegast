use poseidon::poseidon::bn254;

fn main(balances: [Field; 9], secret: Field) -> pub Field {
    let hash = bn254::hash_9(balances);
    bn254::hash_2([hash, secret])
}
