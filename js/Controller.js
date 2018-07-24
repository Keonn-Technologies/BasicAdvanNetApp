function Controller() {
    this.view = new View(this);
    this.model = new Model(this);
    this.net = new Network(this);

    this.inventoryRefreshTime = 1000;   //ms
    this.inventoryLoop = null;
}

/* 
    Pre: the IP of the reader we want to connect to.
    Post: retrieves the reader relevant info, stores it in the model and displays it on the interface
*/
Controller.prototype.connectToReader = async function(readerIP) {

    try {
        var connectionResult = await this.net.connectToReader(readerIP);
        if (connectionResult.status != "connected")
            return;
        await this.storeAntennas(readerIP);
        await this.storeReaderInfo(readerIP);
        await this.storeReaderVolume(readerIP);
        await this.storeRFData(connectionResult.data);
        this.displayConnectionMessage(connectionResult.status);
        this.displayReaderValues();
    }
    catch(error) {
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


/* Dynamic table stuff */
Controller.prototype.addRowToTable = function(epc, antenna, mux1, mux2, rssi, date) {
    this.model.addRowToTable(epc, antenna, mux1, mux2, rssi, date);
}


Controller.prototype.updateInventory = function (readerIP) {
    var inventory = this.net.getInventory(readerIP);
    this.model.storeInventory(inventory);
}

//run inventory every X seconds
Controller.prototype.startInventory = function(readerIP) {
    var that = this;
    this.inventoryLoop = setInterval(function() {
        that.updateInventory(readerIP);
    }, this.inventoryRefreshTime);
}

//stop fetching inventory
Controller.prototype.stopInventory = function() {
    clearInterval(this.inventoryLoop);
}
