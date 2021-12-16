const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;

const secp = require("@noble/secp256k1");
const SHA256 = require("crypto-js/sha256");

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {}

for (var i = 0; i < 3; i++) {
	const privateKey = secp.utils.randomPrivateKey();
	const publicKey = secp.getPublicKey(privateKey);
	const address = Buffer.from(publicKey).toString('hex');
	const starting_balance = (i + 1) * 100;

	balances[address] = starting_balance;

	console.log("Private key: " + Buffer.from(privateKey).toString('hex'));
	console.log("Address: " + address);
	console.log();
}

app.get('/balance/:address', (req, res) => {
	const { address } = req.params;
	const balance = balances[address] || 0;
	res.send({ balance });
});

app.post('/send', (req, res) => {
	const { transaction, signature, recovery } = req.body;
	const { sender, recipient, amount } = transaction;

	if (amount >= 0 && balances[sender] >= amount) {
		const hash = SHA256(JSON.stringify(transaction)).toString();
		const publicKey = secp.recoverPublicKey(hash, signature, recovery);
		if (secp.verify(signature, hash, publicKey)) {
			balances[sender] -= amount;
			balances[recipient] = (balances[recipient] || 0) + +amount;
		}
	}
	res.send({ balance: balances[sender] });
});

app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});
