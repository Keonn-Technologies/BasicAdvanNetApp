function View(controller) {
    this.controller = controller;

    this.readerIP = null;
    this.initializeListeners();
    this.initInputValues();

    this.disableSaving();
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

        // Not connected to any reader
        if (!values) {
            that.displayConnectionMessage("notConnected");
            return;
        }

        if (values.antennas.length > 0) {
            that.controller.saveSettings(values);
        }
        else {
            that.displaySaveStatus("noAntennas");
        }
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
        case "netError":
            this.displayOperationStatus("alert-danger", "Network error: device is unreachable. Is CORS enabled?");
            break;
        case "connected":
            this.displayOperationStatus("alert-success", "Connected.");
            break;
        case "notConnected":
            this.displayOperationStatus("alert-danger", "Please, connect to a reader first.");
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
    var saveButtonText = null;

    switch (status) {
        case "RUNNING":
            bg = baseclasses + "alert-success";
            buttonText = "Stop";
            this.disableSaving();
            this.disableSorting();
            this.disableFiltering();
            this.controller.startInventory(this.readerIP);
            saveButtonText = this.controller.isConnected ? 'Stop the reader to save' : 'Not connected';
            break;
        case "STOPPED":
            bg = baseclasses + "alert-danger";
            buttonText = "Start";
            saveButtonText = 'Save';
            this.enableSaving();
            this.enableSorting();
            this.enableFiltering();
            this.controller.stopInventory();
            break;
        case "CONNECTED":
            bg = baseclasses + "alert-primary";
            buttonText = "Start";
            saveButtonText = 'Save';
            break;
        case "SHUTDOWN":
            bg = baseclasses + "alert-dark";
            buttonText = "Start";
            saveButtonText = 'Shutdown';
            break;
        default:
            bg = baseclasses + "alert-light";
            buttonText = "Start";
            break;
    }

    document.getElementById("saveBtn").innerHTML = saveButtonText;
    document.getElementById("statusBg").className = bg;
    document.getElementById("statusText").innerHTML = status;
    document.getElementById("startStopButton").innerHTML = buttonText;
    document.getElementById("connectBtn").innerHTML = "Update";
}

/*
    Pre: -
    Post: changes the background and text of the alert so that it's no longer visible to the user
*/
View.prototype.closeAlert = function() {
    var alert = document.getElementById("operationStatus");
    alert.innerHTML = '';
    alert.classList = 'alert p-0';
}

/* 
    Pre: an string with the saving process status
    Post: displays the result on the GUI with the corresponding text and color
*/
View.prototype.displaySaveStatus = function(saveStatus) {

    switch (saveStatus) {
        case "OK":
            this.displayOperationStatus("alert-success", "Settings saved.");
            break;
        case "noAntennas":
            this.displayOperationStatus("alert-danger", "Please specify at least one antenna.");
            break;
        default:
            this.displayOperationStatus("alert-danger", "Error saving settings.");
            break;
    }
}

/*
    Pre: - 
    Post: enables the save button and changes its text and cursor pointer
*/
View.prototype.enableSaving = function() {

    //input types
    document.getElementById("sensitivity").disabled = false;
    document.getElementById("power").disabled = false;

    //decrease/increase buttons
    document.getElementById("decreasePower").style.display = 'inline';
    document.getElementById("increasePower").style.display = 'inline';
    document.getElementById("decreaseSensitivity").style.display = 'inline';
    document.getElementById("increaseSensitivity").style.display = 'inline';

    //speaker
    document.getElementById("speaker").style.cursor = 'pointer';

    //save button
    var saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = false;
    saveBtn.style.cursor = 'pointer';
}

/*
    Pre: - 
    Post: disables the save button and changes its text and cursor pointer
*/
View.prototype.disableSaving = function() {

    //input types
    document.getElementById("sensitivity").disabled = true;
    document.getElementById("power").disabled = true;

    //decrease/increase buttons
    document.getElementById("decreasePower").style.display = 'none';
    document.getElementById("increasePower").style.display = 'none';
    document.getElementById("decreaseSensitivity").style.display = 'none';
    document.getElementById("increaseSensitivity").style.display = 'none';

    //speaker
    document.getElementById("speaker").style.cursor = 'default';

    //save button
    var saveBtn = document.getElementById("saveBtn");
    saveBtn.disabled = true;
    saveBtn.style.cursor = 'not-allowed';
}

/*
    Pre: -
    Post: displays the arrows of the table headers to notify the column sorting is enabled
*/
View.prototype.enableSorting = function() {
    var sortingArrows = document.querySelectorAll(".tabulator-arrow");
    for (var arrow = 0; arrow < sortingArrows.length -1; arrow++) {
        sortingArrows[arrow].classList.remove("d-none");
    }
}

/*
    Pre:
    Post: hides the arrows of the table headers to notify the column sorting is disabled
*/
View.prototype.disableSorting = function() {
    var sortingArrows = document.querySelectorAll(".tabulator-arrow");
    for (var arrow = 0; arrow < sortingArrows.length -1; arrow++) {
        sortingArrows[arrow].classList.add("d-none");
    }
}

/*
    Pre: -
    Post: enables the input type search of the table headers so that column filtering is enabled
*/
View.prototype.enableFiltering = function() {
    var filters = document.querySelectorAll("#tagsList input[type=search]");
    for (var i = 0; i < filters.length; i++) {
        filters[i].disabled = false;
    }
}

/*
    Pre: -
    Post: disables the input type search of the table headers so that column filtering is disabled
*/
View.prototype.disableFiltering = function() {
    var filters = document.querySelectorAll("#tagsList input[type=search]");
    for (var i = 0; i < filters.length; i++) {
        filters[i].disabled = true;
    }
}

/* 
    Pre: -
    Post: returns an object containing the modified values to save
*/
View.prototype.getValuesToSave = function() {

    if (!this.controller.isConnected)
        return;

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
    div.innerHTML = text +    
        '<button type="button" id="closeBtn" class="close" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
        '</button>';
    div.className = "p-2 my-3 my-lg-0 alert " + bg;
    var closeBtn = document.getElementById("closeBtn");
    closeBtn.classList.remove("d-none");
    closeBtn.addEventListener("click", (event) => this.closeAlert());
}

/* 
    Pre: the name of the HTML input number
    Post: increases the value of the input number according to its step
*/
View.prototype.increaseInputNumber = function(inputName) {
    if (inputName === "sensitivity")
        document.getElementById(inputName).stepDown();
    else 
        document.getElementById(inputName).stepUp();
}

/* 
    Pre: the name of the HTML input number
    Post: decreases the value of the input number according to its step
*/
View.prototype.decreaseInputNumber = function(inputName) {
    if (inputName === "sensitivity")
        document.getElementById(inputName).stepUp();
    else
        document.getElementById(inputName).stepDown();
}

/*  
    Pre: the IP of the reader
    Post: asks the controller to test the speaker
*/
View.prototype.testSpeaker = function(readerIP) {
    if (!this.controller.isConnected)
        return;

    this.controller.testSpeaker(readerIP);
}
