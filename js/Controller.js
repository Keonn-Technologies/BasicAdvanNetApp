function Controller() {
    this.view = new View(this);
    this.model = new Model(this);
    this.net = new Network(this);

    this.inventoryRefreshTime = 1000;   //ms
    this.inventoryLoop = null;
    this.isConnected = false;
}

/* 
    Pre: the IP of the reader we want to connect to.
    Post: retrieves the reader relevant info, stores it in the model and displays it on the interface
*/
Controller.prototype.connectToReader = async function(readerIP) {

    try {
        var connectionResult = await this.net.connectToReader(readerIP);
        if (connectionResult.status != "connected") {
            this.displayConnectionMessage(connectionResult.status);
            return;
        }

        this.isConnected = true;
        this.model.setReaderIP(readerIP);
        await this.storeAntennas(readerIP);
        await this.storeReaderInfo(readerIP);
        await this.storeReaderVolume(readerIP);
        await this.storeRFData(connectionResult.data);
        this.displayConnectionMessage(connectionResult.status);
        this.displayReaderValues();
    }
    catch(error) {
        this.displayConnectionMessage("netError");
        throw Error(error);
    }
}

/*
    Pre: a complete XML document with the RF features of the reader (e.g power, sensitivity...)
    Post: saves the relevant values in the model and returns a promise
*/
Controller.prototype.storeRFData = function(XMLRFData) {
    return new Promise(async (resolve, reject) => { 
        try {
            await this.model.storeRFData(XMLRFData);
            resolve();
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader
    Post: obtains the info of the reader and saves it in the model
*/
Controller.prototype.storeReaderInfo = function(readerIP) {
    return new Promise(async (resolve, reject) => { 
        try {
            var xml = await this.net.getReaderInfo(readerIP);
            this.model.storeReaderInfo(xml);
            resolve();
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: a string, e.g "Connected"
    Post: displays the given message on the interface to give feedback to the user
*/
Controller.prototype.displayConnectionMessage = function(connectionMessage) {
    this.view.displayConnectionMessage(connectionMessage);
}

/*
    Pre: the IP of the reader we want to retrieve the volume from
    Post: stores the volume in the model
*/
Controller.prototype.storeReaderVolume = async function(readerIP) {
    return new Promise(async (resolve, reject) => {    
        try {
            var volume = await this.net.getReaderVolume(readerIP);
            this.model.setVolume(volume);
            resolve();
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader we want to store the antennas to
    Post: stores the antennas in the model
*/
Controller.prototype.storeAntennas = function(readerIP) {
    return new Promise(async (resolve, reject) => {    
        try {
            var antennasXML = await this.net.getAntennas(readerIP);
            this.model.storeAntennas(antennasXML);
            resolve();
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: a complete XML document and an Xpath expression
    Post: Array of values that match the given Xpath expression
*/
Controller.prototype.getXMLTagValue = function(xml, xpath) {
    return this.model.getXMLTagValue(xml, xpath);
}

/* 
    Pre: -
    Post: displays all the reader values on the interface
*/
Controller.prototype.displayReaderValues = function() {
    var readerValues = this.model.getReaderValues();
    this.view.displayReaderValues(readerValues);
}

/* 
    Pre: the IP of the reader and the action to perform (start || stop)
    Post: returns a promise with the error if applies
*/
Controller.prototype.updateReaderStatus = function(readerIP, action) {
    return new Promise(async (resolve, reject) => {    
        try {
            if (action == "start") {
                await this.net.startReader(readerIP);
                this.startInventory(readerIP);
            }
            else if (action == "stop") {
                await this.net.stopReader(readerIP);
                this.stopInventory();
            }      
            else if (action == "update") {
                //update the status of the reader but don't display any special message
            }
            else
                reject("unknown operation");
            
            var status = await this.net.getReaderStatus(readerIP);
            this.model.setStatus(status);
            this.view.displayReaderStatus(status);
            resolve();
        }
        catch(error) {
            reject(error);
        }
    });
}

/* 
    Pre: the values to display in the table
    Post: adds the values to the table
*/
Controller.prototype.addRowToTable = function(epc, antenna, mux1, mux2, rssi, date) {
    this.model.addRowToTable(epc, antenna, mux1, mux2, rssi, date);
}

/* 
    Pre: the IP of the reader we want to retrieve the inventory from
    Post: stores the inventory in the table
*/
Controller.prototype.updateInventory = async function (readerIP) {
    try {
        var JSONinventory = await this.net.getInventory(readerIP);
        this.model.clearTable();
        this.model.storeInventory(JSONinventory);
    }
    catch(error) {
        this.view.displayOperationStatus("alert-danger", error);
        this.updateReaderStatus(readerIP, "update");
        this.stopInventory();
        this.stopReader();
        //throw Error(error);
    }
}

/* 
    Pre: the IP of the reader we want to retrieve the inventory from
    Post: runs inventory every inventoryRefreshTime seconds 
*/
Controller.prototype.startInventory = function(readerIP) {
    var that = this;
    if (this.inventoryLoop)
        clearInterval(this.inventoryLoop);
        
    this.inventoryLoop = setInterval(function() {
        that.updateInventory(readerIP);
    }, this.inventoryRefreshTime);
}

/* 
    Pre: -
    Post: stops fetching the inventory
*/
Controller.prototype.stopInventory = function() {
    clearInterval(this.inventoryLoop);
}

/*
    Pre: an object containing the settings to save
    Post: saves the values in the model and displays the save process result on the GUI
*/
Controller.prototype.saveSettings = async function(settings) {
    try {
        var saveStatus = await this.net.saveValues(this.model.readerIP, settings);
        this.model.saveValues(settings);
        this.view.displaySaveStatus(saveStatus);
    }
    catch(error) {
        throw Error(error);
    }    
}

/* 
    Pre: the IP of the reader we want to test
    Post: tests the speaker
*/
Controller.prototype.testSpeaker = async function(readerIP) {
    try {
        await this.net.testSpeaker(readerIP);
    }
    catch(error) {
        throw Error(error);
    }   
}
