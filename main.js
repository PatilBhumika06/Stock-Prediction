document.getElementById('stockForm').addEventListener('submit', async function(e) {
	e.preventDefault();
	const symbol = document.getElementById('stockSymbol').value.trim();
	const resultDiv = document.getElementById('result');
	resultDiv.textContent = 'Predicting...';
	try {
		const response = await fetch('http://localhost:3000/predict', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ symbol })
		});
		const data = await response.json();
		if (response.ok) {
			resultDiv.textContent = `Prediction for ${symbol}: ${data.prediction}`;
		} else {
			resultDiv.textContent = data.error || 'Prediction failed.';
		}
	} catch (err) {
		resultDiv.textContent = 'Error connecting to server.';
	}
});
