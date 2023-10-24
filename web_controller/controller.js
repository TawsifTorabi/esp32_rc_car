function dipper(){
    setTimeout(function() {
        sendCommand("dipper");
    }, 500);
    document.getElementById("pressedKey").textContent = "Dipper";
}

function headlight(){
    // Send the joystick key message once if it wasn't already sent
    if (!joystickKeyMessageSent) {
        sendCommand("headlight");
        joystickKeyMessageSent = true; // Set the flag to indicate that the message has been sent
        document.getElementById("pressedKey").textContent = "Headlight";
        document.getElementById("webHeadlightButton").textContent = "Headlight On";
    } else {
        joystickKeyMessageSent = false; // Reset the flag when the button is released
        document.getElementById("webHeadlightButton").textContent = "Headlight Off";
    }
}

function forward(){
    sendCommand("direction:forward,speed:255,255");
    document.getElementById("pressedKey").textContent = "Full Speed Forward";
    return;
} 
function backward(){
    screenTopendCommand("direction:backward,speed:255,255");
    document.getElementById("pressedKey").textContent = "Full Speed Backward";
    return;
} 
function left(){
    sendCommand("direction:left,speed:255,255");
    document.getElementById("pressedKey").textContent = "Full Speed Left";
    return;
} 
function right(){
    sendCommand("direction:right,speed:255,255");
    document.getElementById("pressedKey").textContent = "Full Speed Right";
    return;
} 
function stop(){
    sendCommand("direction:stop,speed:0,0");
    document.getElementById("pressedKey").textContent = "Stop";
    return;
} 
	

let joystickKeyMessageSent = false; // Flag to track whether a message has been sent
			
// Function to poll gamepad input
async function gameLoop() {
    var gamepad = navigator.getGamepads()[0]; // Get the first controller.
    if (gamepad && gamepad.connected) {
        // Check ABXY buttons for full-speed control
        if (gamepad.buttons[0].pressed) { // A button for full-speed forward
            sendCommand("direction:forward,speed:255,255");
            document.getElementById("pressedKey").textContent = "Full Speed Forward";
            return;
        } else if (gamepad.buttons[2].pressed) { // X button for full-speed backward
            sendCommand("direction:backward,speed:255,255");
            document.getElementById("pressedKey").textContent = "Full Speed Backward";
            return;
        } else if (gamepad.buttons[3].pressed) { // Y button for full-speed right
            sendCommand("direction:right,speed:255,255");
            document.getElementById("pressedKey").textContent = "Full Speed Right";
            return;
        } else if (gamepad.buttons[1].pressed) { // B button for full-speed left
            sendCommand("direction:left,speed:255,255");
            document.getElementById("pressedKey").textContent = "Full Speed Left";
            return;
        } else if (gamepad.buttons[7].pressed) { // B button for full-speed left
            setTimeout(function() {
                sendCommand("dipper");
            }, 500);
            document.getElementById("pressedKey").textContent = "Dipper";
            return;
        }

        // Send the joystick key message once if it wasn't already sent
        if (gamepad.buttons[6].pressed && !joystickKeyMessageSent) {
            sendCommand("headlight");
            joystickKeyMessageSent = true; // Set the flag to indicate that the message has been sent
            document.getElementById("pressedKey").textContent = "Headlight";
        } else if (!gamepad.buttons[6].pressed) {
            joystickKeyMessageSent = false; // Reset the flag when the button is released
        }
        
        
        // Calculate motor speed based on joystick input (assuming X and Y axis)
    
        const xValue = gamepad.axes[0]; // X-axis input (-1 to 1)
        const yValue = gamepad.axes[1]; // Y-axis input (-1 to 1)

        // Map joystick input values directly to motor speed within the range of 0 to 255
        let motor1Speed = Math.round(maxSpeed * (yValue + xValue));
        let motor2Speed = Math.round(maxSpeed * (yValue - xValue));

        // When yValue is less than -0.2, adjust the motor speed linearly within the range of 0 to 255
        if (yValue < -0.2) {
            const linearSpeed = Math.round(maxSpeed * (-yValue)); // Linear speed based on joystick position
            motor1Speed = linearSpeed;
            motor2Speed = linearSpeed;
        }

        // Calculate direction based on joystick input
        let direction = "stop";
        if (yValue > 0.2) {
            direction = "backward";
        } else if (yValue < -0.2) {
            direction = "forward";
        } else if (xValue > 0.2) {
            direction = "left";
            motor2Speed = motor1Speed;
        } else if (xValue < -0.2) {
            direction = "right";
            motor1Speed = motor2Speed;
        }

        // Send the command, direction, and motor speed
        
            sendCommand(`direction:${direction},speed:${motor1Speed},${motor2Speed}`);
        
        
        // Update the display
        document.getElementById("pressedKey").textContent = `Speed: ${motor1Speed},${motor2Speed}, Direction: ${direction}`;
    }
}



var game_loop;

		// When a controller is connected, start the game loop to check for button presses
		window.addEventListener("gamepadconnected", function (e) {
			console.log("Gamepad %s connected at %d", e.gamepad.id, e.gamepad.index);
			game_loop = setInterval(gameLoop, PollingRate); // Check if a button was pressed 20 times every second.
		});

		// When a controller is disconnected, stop checking
		window.addEventListener("gamepaddisconnected", function (e) {
			console.log("Gamepad %s disconnected", e.gamepad.id);
			clearInterval(game_loop);
		});

		document.getElementById("stopButton").addEventListener("click", function () {
			sendCommand("stop");
			document.getElementById("pressedKey").textContent = "None";
		});


	
    
    
	