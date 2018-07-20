function Network(controller)  {
    this.controller = controller;
}

/* 
    Pre: a string
    Post: returns true if the given string is an actual IPv4 or false otherwise
*/
Network.prototype.isValidIP = function(IP) {    
    var regexp = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/;
    return regexp.test(IP);
}



/************ REST API  ************/

/* 
    Pre: an url we want to make the GET request to
    Post: a promise with the XML returned by the GET response or the status of the error
*/
Network.prototype.getRequest = function(url) {
    return new Promise((resolve, reject) => {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", url, true);
        xhttp.onload = () => {
            if (xhttp.status == 200) 
                resolve(xhttp.responseXML);
            else 
                reject(Error(xhttp.statusText));
        }
        xhttp.onerror = () => reject(Error("Network error"));
        xhttp.send();
    });
}


/*  
    Pre: the IP of the reader
    Post: an object containing:
        status of the connection: string (connected || notconnected || invalidIP)
        data obtained on the request: null if something went wrong, XML documnet if everything went OK
    Connect to Keonn reader and obtain the RF data
*/
Network.prototype.connectToReader =  function(readerIP) {
    return new Promise(async (resolve, reject) => {
        var connectionResult = 
            { 
                status: null, 
                data: null
            };

        if (!this.isValidIP(readerIP)) {
            connectionResult.status = "invalidIP";
            resolve(connectionResult);
        }
        try {
            var XMLRFData = await this.getRFData(readerIP);
    
            if (typeof XMLRFData === 'string')  {   //something went wrong
                connectionResult.status = "notconnected";
                resolve(connectionResult);
            }
    
            //at this point, we received the RFData successfully as an XML document
            connectionResult.data = XMLRFData;
            connectionResult.status = "connected";
    
            resolve(connectionResult);
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader we want to get the id from 
    Post: the device ID
    Performs a GET request to get the /devices XML and executes Xpath to find the ID
*/
Network.prototype.getDeviceId =  function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var address = "http://" + readerIP + ":3161/devices";
            var xml = await this.getRequest(address);
            var deviceID = this.controller.getXMLTagValue(xml, "/response/data/devices/device/id")[0];
            resolve(deviceID);
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader we want to get the RFData from 
    Post: returns a promise with the min power, max power... (RF features) from the reader
    It sends a GET request to: http://host_address:3161/devices/{device-id}/reader
*/
Network.prototype.getRFData = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var deviceID = await this.getDeviceId(readerIP);
            var address = "http://" + readerIP + ":3161/devices/" + deviceID + "/reader";
            var XMLRFData = await this.getRequest(address);
            resolve(XMLRFData);
        }
        catch(error) {
            reject(error);
        }       
    });
}

/*
    Pre: IP of the reader we want to retrieve the volume from
    Post: the volume of the reader 
    Sends a GET request to http://host_address:3161/devices/{device-id}/actions and parses the XML response
*/
Network.prototype.getReaderVolume = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var deviceID = await this.getDeviceId(readerIP);
            var address = "http://" + readerIP + ":3161/devices/" + deviceID + "/actions"; 
            var xml = await this.getRequest(address);
            var volume = this.controller.getXMLTagValue(xml, "/response/data/entries/entry/volume")[0];
            resolve(volume);
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader we want to get the info from
    Post: gets the info (family, model, etc) and returns a promise with the XML
*/
Network.prototype.getReaderInfo = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var address = "http://" + readerIP + ":3161/devices/"; 
            var xml = await this.getRequest(address);
            resolve(xml);
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader we want to get the active antennas from
    Post: returns a promise with the XML
*/    
Network.prototype.getAntennas = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var deviceID = await this.getDeviceId(readerIP);
            var address = "http://" + readerIP + ":3161/devices/" + deviceID + "/antennas"; 
            var xml = await this.getRequest(address);
            resolve(xml);
        }
        catch(error) {
            reject(error);
        }
    });
}


/* 
    Pre: the IP of the reader we want to get the status from
    Post: a promise with the status of the reader or the error
*/
Network.prototype.getReaderStatus = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var deviceID = await this.getDeviceId(readerIP);
            var address = "http://" + readerIP + ":3161/devices/" + deviceID; 
            var xml = await this.getRequest(address);
            var status = this.controller.getXMLTagValue(xml, "/response/data/devices/device/status")[0];
            resolve(status);
        }
        catch(error) {
            reject(error);
        }
    });
}


Network.prototype.startReader = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var deviceID = await this.getDeviceId(readerIP);
            var address = "http://" + readerIP + ":3161/devices/" + deviceID + "/start"; 
            var xml = await this.getRequest(address);
            var status = this.controller.getXMLTagValue(xml, "/response/status")[0];
            if (status == "OK") resolve(status);
            else reject("Could not start the reader properly");
        }
        catch(error) {
            reject(error);
        }
    });
}

Network.prototype.stopReader = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var deviceID = await this.getDeviceId(readerIP);
            var address = "http://" + readerIP + ":3161/devices/" + deviceID + "/stop"; 
            var xml = await this.getRequest(address);
            var status = this.controller.getXMLTagValue(xml, "/response/status")[0];
            if (status == "OK") 
                resolve(status);
            else
                reject("Could not stop the reader properly");
        }
        catch(error) {
            reject(error);
        }
    });
}

