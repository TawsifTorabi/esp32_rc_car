let webSocket = null;
let pingStart;
let pingInterval;

// Function to send a command to the RC car
async function sendCommand(command) {
	if (webSocket) {
		if ((webSocket.readyState === WebSocket.CLOSED || webSocket.readyState === WebSocket.CLOSING) && userClosedConnection == false) {
			// If the WebSocket is closed or closing, do not reopen it here
			console.log("WebSocket is closed or closing. Cannot send command.");
			openWebSocket();
		}
		if (webSocket.readyState === WebSocket.OPEN) {
			webSocket.send(command);
			console.log(command);
		}
	} else {
		console.error("WebSocket is not connected.");
	}
}

// Function to open a WebSocket connection
async function openWebSocket() {
	const serverAddress = document.getElementById('serverAddress').value;
	webSocket = new WebSocket(serverAddress);
	webSocket.onopen = function () {
		console.log("WebSocket connected to:", serverAddress);
		document.getElementById("connectionStatus").textContent = "🟢 Connected";
		document.getElementById("connectButton").style.display = "none";
		document.getElementById("disconnectButton").style.display = "inline-block";
		pingInterval = setInterval(() => {
			pingStart = Date.now();
			webSocket.send("ping");
		}, 1000); // Send ping every 1 second
	};
	webSocket.onclose = function () {
		console.log("WebSocket closed.");
		document.getElementById("connectionStatus").textContent = "❌ Not Connected";
		document.getElementById("connectButton").style.display = "inline-block";
		document.getElementById("disconnectButton").style.display = "none";
		clearInterval(pingInterval);
	};
	webSocket.onerror = function (error) {
		console.error("WebSocket error:", error);
	};
	webSocket.onmessage = function (event) {
		if (event.data === "pong") {
			const pingValue = Date.now() - pingStart;
			document.getElementById("pingValue").textContent = pingValue + " ms";
		}
	};
}

function closeWebSocket() {
	if (webSocket) {
		webSocket.close();
		clearInterval(pingInterval);
	}
	userClosedConnection = true;
}