    // Get the slider element and the value span
    const slider = document.getElementById("slider");
    const sliderValue = document.getElementById("sliderValue");

    // Add an event listener to update the displayed value when the slider changes
    slider.addEventListener("input", function() {
        maxSpeed = slider.value;
        sliderValue.textContent = slider.value;
        console.log("Speed Is:"+maxSpeed);
    });

    // Get the slider element and the value span
    const slider2 = document.getElementById("slider2");
    const sliderValue2 = document.getElementById("sliderValue2");

    // Add an event listener to update the displayed value when the slider changes
    slider2.addEventListener("input", function() {
        PollingRate = slider2.value;
        sliderValue2.textContent = slider2.value;
        console.log("PollingRate Is:"+PollingRate);
    });
