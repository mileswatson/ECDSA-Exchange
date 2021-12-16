import "./index.scss";
import * as secp from "@noble/secp256k1";
import * as SHA256 from "crypto-js/sha256";

const server = "http://localhost:3042";

document.getElementById("exchange-address").addEventListener('input', ({ target: { value } }) => {
	if (value === "") {
		document.getElementById("balance").innerHTML = 0;
		return;
	}

	fetch(`${server}/balance/${value}`).then((response) => {
		return response.json();
	}).then(({ balance }) => {
		document.getElementById("balance").innerHTML = balance;
	});
});

document.getElementById("transfer-amount").addEventListener('click', () => {
	const sender = document.getElementById("exchange-address").value;
	const privateKey = document.getElementById("private-key").value;
	const amount = Number(document.getElementById("send-amount").value);
	const recipient = document.getElementById("recipient").value;

	const publicKey = secp.getPublicKey(Uint8Array.from(Buffer.from(privateKey, 'hex')));
	if (Buffer.from(publicKey).toString('hex') !== sender) {
		window.alert("Private key does not match address!");
	}

	if (isNaN(amount)) window.alert("Invalid amount!");

	const transaction = {
		sender,
		recipient,
		amount: Number(amount)
	};

	const hash = SHA256(JSON.stringify(transaction)).toString();
	secp.sign(hash, privateKey, {
		recovered: true
	}).then(([signature, recovery]) => {
		const body = JSON.stringify({
			transaction,
			signature,
			recovery
		});

		const request = new Request(`${server}/send`, { method: 'POST', body });

		fetch(request, { headers: { 'Content-Type': 'application/json' } }).then(response => {
			return response.json();
		}).then(({ balance }) => {
			document.getElementById("balance").innerHTML = balance;
		});
	});
});
