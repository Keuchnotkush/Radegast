use poseidon::poseidon::bn254;

fn main(
    balances: [Field; 9],      // PRIVATE - DOES NOT LEAK FROM BROWSER
    prices: [Field; 9],        // PRIVATE
    secret: Field,             // PRIVATE
    threshold: pub Field,      // PUBLIC  $50,000
    commitment: pub Field      // PUBLIC Poseidon hash
) {
    // 1. total = sum(balances[i] * prices[i])
    let mut total: Field = 0;
    for i in 0..9 { total = total + balances[i] * prices[i]; }

    // 2. assert total > threshold
    assert(total as u64 > threshold as u64);

    // 3. commitment = Poseidon(balances, secret)
    let hash = bn254::hash_9(balances);
    assert(commitment == bn254::hash_2([hash, secret]));
}
