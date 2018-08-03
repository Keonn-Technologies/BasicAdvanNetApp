function View(controller) {
    this.controller = controller;

    this.readerIP = null;
    this.initializeListeners();
    this.initInputValues();
}

/* 
    Pre: -
    Post: initilizes all buttons so you can press them, increase the power, etc
*/
View.prototype.initializeListeners = function() {

    var that = this;

    // Connect button
    var connectBtn = document.getElementById("connectBtn");
    connectBtn.addEventListener("click", function (event) {
        that.connectToReader();
    });

    // Submit IP when pressing enter
    var readerIPInput = document.getElementById("readerIP");
    readerIPInput.addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {     // enter key
            connectBtn.click();
        }
    });

    // Start/stop button
    var startStopButton = document.getElementById("startStopButton");
    startStopButton.addEventListener("click", function (event) {
        that.toggleStartStop(startStopButton);
    });

    // Save button
    var saveBtn = document.getElementById("saveBtn");
    saveBtn.addEventListener("click", function(event) {
        var values = that.getValuesToSave();
        that.controller.saveSettings(values);
    });

    // Power
    var increasePower = document.getElementById("increasePower");
    increasePower.addEventListener("click", function(event) {
        that.increaseInputNumber("power");
    });

    var decreasePower = document.getElementById("decreasePower");
    decreasePower.addEventListener("click", function(event) {
        that.decreaseInputNumber("power");
    });

    // Sensitivity
    var increaseSensitivity = document.getElementById("increaseSensitivity");
    increaseSensitivity.addEventListener("click", function(event) {
        that.increaseInputNumber("sensitivity");
    });

    var decreaseSensitivity = document.getElementById("decreaseSensitivity");
    decreaseSensitivity.addEventListener("click", function(event) {
        that.decreaseInputNumber("sensitivity");
    });

    // Speaker
    var speaker = document.getElementById("speaker");
    speaker.addEventListener("click", function(event) {
        that.testSpeaker(that.readerIP);
    });
}

/* 
    Pre: -
    Post: initizalize the settings to some random values
*/
View.prototype.initInputValues = function() {
    this.updateDivValue("readerModel", "Reader model");
    this.setInputNumberDefaultValue("power", 25);
    this.setInputNumberDefaultValue("sensitivity", -75);
    this.displayAntennas(4, [1]);
}

/* 
    Pre: the HTML element containing the button to start or stop the reader
    Post: detects if you need to start or stop the reader and asks the controller to do it
*/
View.prototype.toggleStartStop = function(startStopButton) {
    if (!this.controller.isConnected) {
        this.displayOperationStatus("alert-danger", "Unable to start reader. Please, specify an IP first.");
        return;
    }
    var action = startStopButton.innerHTML == "Stop" ? "stop" : "start";
    this.controller.updateReaderStatus(this.readerIP, action);
}

/* 
    Pre: -
    Post: sends the IP written in the input text to the controller
*/
View.prototype.connectToReader = function() {
    this.readerIP = document.getElementById("readerIP").value;
    this.controller.connectToReader(this.readerIP);
}

/* 
    Pre: a string containing the result of the connection to the reader
    Post: writes on the GUI the result with the corresponding color and text
*/
View.prototype.displayConnectionMessage = function(connectionResult) {

    switch (connectionResult) {
        case "emptyIP":
            this.displayOperationStatus("alert-danger", "Please, specify an IP.");
            break;
        case "invalidIP":
            this.displayOperationStatus("alert-danger", "Please, specify a valid IP.");
            break;
        case "notConnected":
            this.displayOperationStatus("alert-danger", "Unable to connect. Does the IP correspond to a reader?");
            break;
        case "connected":
            this.displayOperationStatus("alert-success", "Connected.");
            break;
        default:
            this.displayOperationStatus("alert-danger", "Unknown operation.");
            break;
    }
}

/* 
    Pre: an object containing the RF values of the reader (power, sensitivity...)
    Post: displays the default reader values on the interface
*/
View.prototype.displayReaderValues = function(readerValues) {

    // Status
    this.displayReaderStatus(readerValues.status);

    // Model
    this.updateDivValue("readerModel", readerValues.model);

    // Power
    this.setInputNumberMinValue("power", readerValues.minPower);
    this.setInputNumberMaxValue("power", readerValues.maxPower);
    this.setInputNumberDefaultValue("power", readerValues.readPower);

    // Sensitivity
    this.setInputNumberMinValue("sensitivity", readerValues.maxSensitivity);
    this.setInputNumberMaxValue("sensitivity", readerValues.minSensitivity);
    this.setInputNumberDefaultValue("sensitivity", readerValues.sensitivity);

    // Antennas
    this.displayAntennas(readerValues.numPorts, readerValues.activeAntennas);
}

/* 
    Pre: an HTML element containing an <input type="number"> and the value to assign to this input number
    Post: updates the input type number with the new value
*/
View.prototype.setInputNumberDefaultValue = function(inputNumber, value) {
    var inputNumber = document.getElementById(inputNumber);
    inputNumber.value = value;
}

/* 
    Pre: an HTML element containing an <input type="number"> and the MIN value to assign to this input number
    Post: sets the minimum value to this input
*/
View.prototype.setInputNumberMinValue = function(inputNumber, minvalue) {
    document.getElementById(inputNumber).min = minvalue;
}

/* 
    Pre: an HTML element containing an <input type="number"> and the MAX value to assign to this input number
    Post: sets the maximum value to this input
*/
View.prototype.setInputNumberMaxValue = function(inputNumber, maxvalue) {
    document.getElementById(inputNumber).max = maxvalue;
}

/* 
    Pre: an HTML element containing an <input type="number">
    Post: the value of this input
*/
View.prototype.getInputNumber = function(inputNumber) {
    return document.getElementById(inputNumber).value;
}

/*
    Pre: the ID of a div and the string we want inside the div
    Post: the string is written inside the div
*/
View.prototype.updateDivValue = function(divID, value) {
    document.getElementById(divID).innerHTML = value;
}

/* 
    Pre: the ID of a div
    Post: the HTML content of the div
*/
View.prototype.getDivValue = function(divID) {
    return document.getElementById(divID).innerHTML;
}

/* 
    Pre: -
    Post: returns an array of integers containing the antennas marked as active on the GUI
*/
View.prototype.getActiveAntennas = function() {
    
    var activeAntennas = [];
    var antennas = document.querySelectorAll('#antennasList label');

    for (var i = 0; i < antennas.length; i++) {
        if (antennas[i].classList.contains("active"))
            activeAntennas.push(i + 1);
    }
    return activeAntennas;
}

/* 
    Pre: the number of RF ports of the reader and a vector (of integers) with all the active antennas
    Post: displays all the reader antennas with a checked checkbox if the antenna is active or not checked otherwise
*/
View.prototype.displayAntennas = function(numPorts, activeAntennas) {
    var antennasList = document.getElementById("antennasList");
    var html = '<div class="btn-group btn-group-toggle" data-toggle="buttons">';

    for (var port = 1; port <= numPorts; port++) {
        
        //pre-checked buttons need to have the active class
        var activeAntenna = this.isActiveAntenna(port, activeAntennas);

        html += 
            '<label class="' + activeAntenna + '">' +
                '<input type="checkbox" name="options" id="antennaPort' + port +'" autocomplete="off">' + port +
            '</label>';
    }

    html += '</div>';
    antennasList.innerHTML = html;
}

/*
    Pre: an antenna port and all the active antennas (vector of integers)
    Post: an string containing the CSS classes to add depending on if the port is active or not.
*/
View.prototype.isActiveAntenna = function(port, activeAntennas) {
    for (var a in activeAntennas) {
        if (activeAntennas[a].port == port) 
            return "btn btn-secondary active";
    }
    return "btn btn-secondary";
}

/*
    Pre: the status of the reader (running || stopped || connected || shutdown)
    Post: changes the color of the status background according to the reader status
*/
View.prototype.displayReaderStatus = function(status) {
    
    // Background and text to display
    var bg = null;
    var baseclasses = "col m-3 alert ";
    var buttonText = null;

    switch (status) {
        case "RUNNING":
            bg = baseclasses + "alert-success";
            buttonText = "Stop";
            this.controller.startInventory(this.readerIP);
            break;
        case "STOPPED":
            bg = baseclasses + "alert-danger";
            buttonText = "Start";
            break;
        case "CONNECTED":
            bg = baseclasses + "alert-primary";
            buttonText = "Start";
            break;
        case "SHUTDOWN":
            bg = baseclasses + "alert-dark";
            buttonText = "Start";
            break;
        default:
            bg = baseclasses + "alert-light";
            buttonText = "Start";
            break;
    }

    document.getElementById("statusBg").className = bg;
    document.getElementById("statusText").innerHTML = status;
    document.getElementById("startStopButton").innerHTML = buttonText;
    document.getElementById("connectBtn").innerHTML = "Update";
}

/* 
    Pre: an string with the saving process status
    Post: displays the result on the GUI with the corresponding text and color
*/
View.prototype.displaySaveStatus = function(saveStatus) {

    switch (saveStatus) {
        case "OK":
            this.displayOperationStatus("alert-success", "Settings saved");
            break;
        default:
            this.displayOperationStatus("alert-danger", "Error saving settings");
            break;
    }
}

/* 
    Pre: -
    Post: returns an object containing the modified values to save
*/
View.prototype.getValuesToSave = function() {
    return {
        power: this.getInputNumber("power"),
        sensitivity: this.getInputNumber("sensitivity"),
        antennas: this.getActiveAntennas(),
    }
}

/* 
    Pre: an string containing the color of the background (alert-success || alert-danger...) and the text to display on the GUI
    Post: displays the text on the GUI with the given background color
*/
View.prototype.displayOperationStatus = function(bg, text) {
    var div = document.getElementById("operationStatus");
    div.innerHTML = text;
    div.className = "p-2 my-3 my-lg-0 alert " + bg;
}

/* 
    Pre: the name of the HTML input number
    Post: increases the value of the input number according to its step
*/
View.prototype.increaseInputNumber = function(inputName) {
    if (inputName === "sensitivity")
        document.getElementById(input).stepDown();
    else 
        document.getElementById(input).stepUp();
}

/* 
    Pre: the name of the HTML input number
    Post: decreases the value of the input number according to its step
*/
View.prototype.decreaseInputNumber = function(inputName) {
    if (inputName === "sensitivity")
        document.getElementById(input).stepUp();
    else
        document.getElementById(input).stepDown();
}

/*  
    Pre: the IP of the reader
    Post: asks the controller to test the speaker
*/
View.prototype.testSpeaker = function(readerIP) {
    this.controller.testSpeaker(readerIP);
}
