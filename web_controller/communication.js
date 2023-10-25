let webSocket = null;
let pingStart;
let pingInterval;
let BatteryInterval;
let lowbatteryCounter = 0;


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
		BatteryInterval = setInterval(() => {
			webSocket.send("batlvl");
		}, 3000); // Send Battery Data Request every 3 second
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
		if (event.data.split(":")[0] === "battery") {
			document.getElementById("batteryVoltage").textContent = event.data.split(":")[1];
			console.log(event.data);
			if(parseFloat(event.data.split(":")[1]) < batteryLowVoltage){
				lowbatteryCounter++;
				if(lowbatteryCounter > 3){
					alertLowBattery();
					console.log('Yes');
				}
			}else{
				console.log('No');
				lowbatteryCounter = 0;
				alertLowBatteryCancel();
			}
		}
	};
}

function closeWebSocket() {
	if (webSocket) {
		webSocket.close();
		clearInterval(pingInterval);
		clearInterval(BatteryInterval);
	}
	userClosedConnection = true;
}

function alertLowBattery(){
	document.getElementById("batteryArea").classList.remove('battery');
	document.getElementById("batteryArea").classList.add('lowbattery');
	// Call the function to start continuous beeping for 5 seconds with a 200ms interval
	beepContinuously(1000, 500);
}

function alertLowBatteryCancel(){
	document.getElementById("batteryArea").classList.remove('lowbattery');
	document.getElementById("batteryArea").classList.add('battery');
}


function beepContinuously(duration, interval) {
	const audioContext = new (window.AudioContext || window.webkitAudioContext)();
	
	function beep() {
	  const oscillator = audioContext.createOscillator();
	  oscillator.connect(audioContext.destination);
	  oscillator.type = 'sine';
	  oscillator.frequency.setValueAtTime(760, audioContext.currentTime);
	  oscillator.start();
	  oscillator.stop(audioContext.currentTime + 0.2);
	}
  
	const beepInterval = setInterval(beep, interval);
  
	setTimeout(() => {
	  clearInterval(beepInterval);
	}, duration);
  }