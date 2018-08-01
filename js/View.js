function View(controller) {
    this.controller = controller;

    this.readerIP = null;
    this.initializeListeners();
    this.initInputValues();
}

View.prototype.initializeListeners = function() {

    var that = this;

    // Connect button
    var connectBtn = document.getElementById("connectBtn");
    connectBtn.addEventListener("click", function (event) {
        that.connectToReader();
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

View.prototype.initInputValues = function() {
    this.updateDivValue("readerModel", "Reader model");
    this.setInputNumberDefaultValue("power", 25);
    this.setInputNumberDefaultValue("sensitivity", -75);
    this.displayAntennas(4, [1]);
}


View.prototype.toggleStartStop = function(startStopButton) {
    if (!this.controller.isConnected) {
        this.displayOperationStatus("alert-danger", "Unable to start reader. Please, specify an IP");
        return;
    }
    var action = startStopButton.innerHTML == "Stop" ? "stop" : "start";
    this.controller.updateReaderStatus(this.readerIP, action);
}

/* Connect to reader event */
View.prototype.connectToReader = function() {
    this.readerIP = document.getElementById("readerIP").value;
    this.controller.connectToReader(this.readerIP);
}

View.prototype.displayConnectionMessage = function(connectionResult) {

    switch (connectionResult) {
        case "emptyIP":
            this.displayOperationStatus("alert-danger", "Please, specify an IP");
            break;
        case "invalidIP":
            this.displayOperationStatus("alert-danger", "Please, specify a valid IP");
            break;
        case "notConnected":
            this.displayOperationStatus("alert-danger", "Unable to connect. Does the IP correspond to a reader?");
            break;
        case "connected":
            this.displayOperationStatus("alert-success", "Connected.");
            break;
        default:
            this.displayOperationStatus("alert-danger", "Unknown operation");
            break;
    }
}

// Display reader options default values on the interface
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
    this.setInputNumberMinValue("sensitivity", readerValues.minSensitivity);
    this.setInputNumberMaxValue("sensitivity", readerValues.maxSensitivity);
    this.setInputNumberDefaultValue("sensitivity", readerValues.sensitivity);

    // Antennas
    this.displayAntennas(readerValues.numPorts, readerValues.activeAntennas);
}

View.prototype.setInputNumberDefaultValue = function(inputNumber, value) {
    document.getElementById(inputNumber).value = value;
}

// Set the minimum value of any range reader options
View.prototype.setInputNumberMinValue = function(inputNumber, minvalue) {
    document.getElementById(inputNumber).min = minvalue;
}

// Set the maximum value of any range reader options
View.prototype.setInputNumberMaxValue = function(inputNumber, maxvalue) {
    document.getElementById(inputNumber).max = maxvalue;
}

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

View.prototype.getDivValue = function(divID) {
    return document.getElementById(divID).innerHTML;
}

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
    Pre: the number of RF ports of the reader and a vector with all the active antennas
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
    Pre: an antenna port and all the active antennas
    Post: an string like "checked" if the antenna port is active or an empty string otherwise
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

View.prototype.getValuesToSave = function() {
    return {
        power: this.getInputNumber("power"),
        sensitivity: this.getInputNumber("sensitivity"),
        antennas: this.getActiveAntennas(),
    }
}

View.prototype.displayOperationStatus = function(bg, text) {
    var div = document.getElementById("operationStatus");
    div.innerHTML = text;
    div.className = "mt-3 alert " + bg;
}

View.prototype.increaseInputNumber = function(input) {
    var inputNumber = document.getElementById(input);
    var currentValue = parseInt(inputNumber.value, 10);
    var maxValue = parseInt(inputNumber.max, 10);

    if (currentValue < maxValue)
        inputNumber.value += parseInt(inputNumber.step, 10);
}

View.prototype.decreaseInputNumber = function(input) {
    var inputNumber = document.getElementById(input);
    var currentValue = parseInt(inputNumber.value, 10);
    var minValue = parseInt(inputNumber.min, 10);

    if (currentValue > minValue)
        inputNumber.value -= parseInt(inputNumber.step, 10);
}

View.prototype.testSpeaker = function(readerIP) {
    this.controller.testSpeaker(readerIP);
}