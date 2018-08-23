function Network(controller)  {
    this.controller = controller;

    //params
    this.readPower = "RF_READ_POWER";
    this.sensitivity = "RF_SENSITIVITY";
    this.deviceID = null;
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
                reject(xhttp.statusText);
        }
        xhttp.onerror = () => reject("Network error: cannot perform GET request");
        xhttp.send();
    });
}

/*
    Pre: an url we want to make the PUT request to and the body of the request
    Post: a promise with the XML returned or the status of error
*/
Network.prototype.putRequest = function(url, body) {
    return new Promise((resolve, reject) => {
        var xhttp = new XMLHttpRequest();
        xhttp.open("PUT", url, true);
        xhttp.setRequestHeader("Content-Type", "text/html");
        xhttp.onload = () => {
            if (xhttp.status == 200) 
                resolve(xhttp.responseXML);
            else 
                reject(xhttp.statusText);
        }
        xhttp.onerror = (error) => reject("Network error: cannot perform PUT request: " + error);
        xhttp.send(body);
    });
}

/*  
    Pre: the IP of the reader
    Post: an object containing:
        status of the connection: string (connected || notconnected || invalidIP)
        data obtained on the request: null if something went wrong, XML document if everything went OK
    Connect to Keonn reader and obtain the RF data
*/
Network.prototype.connectToReader =  function(readerIP) {
    return new Promise(async (resolve, reject) => {
        var connectionResult = 
            { 
                status: null, 
                data: null
            };

        if (readerIP == "" || readerIP == null) {
            connectionResult.status = "emptyIP";
            return resolve(connectionResult);
        }
        if (!this.isValidIP(readerIP)) {
            connectionResult.status = "invalidIP";
            return resolve(connectionResult);
        }
        try {
            var XMLRFData = await this.getRFData(readerIP);
    
            if (typeof XMLRFData === 'string')  {   //something went wrong
                connectionResult.status = "notConnected";
                return resolve(connectionResult);
            }
    
            //at this point, we received the RFData successfully as an XML document
            connectionResult.data = XMLRFData;
            connectionResult.status = "connected";
    
            return resolve(connectionResult);
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
            this.deviceID = deviceID;
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
            var address = "http://" + readerIP + ":3161/devices/" + this.deviceID + "/actions"; 
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
    Post: returns a promise with the XML or the error 
*/    
Network.prototype.getAntennas = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var address = "http://" + readerIP + ":3161/devices/" + this.deviceID + "/antennas"; 
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

/*
    Pre: the IP of the reader we want to start
    Post: sends a GET request and returns the status of the reader after performing the operation
*/
Network.prototype.startReader = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var address = "http://" + readerIP + ":3161/devices/" + this.deviceID + "/start"; 
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

/*
    Pre: the IP of the reader we want to stop
    Post: sends a GET request and returns the status of the reader after performing the operation
*/
Network.prototype.stopReader = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var address = "http://" + readerIP + ":3161/devices/" + this.deviceID + "/stop"; 
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

/*
    Pre: the IP of the reader we want to retrieve the inventory (tags being read) from
    Post: array of JSON objects, where each object is a TAG
*/
Network.prototype.getInventory = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var url = "http://" + readerIP + ":3161/devices/" + this.deviceID + "/jsonMinLocation"; 
            var xml = await this.getRequest(url);
            var status = this.controller.getXMLTagValue(xml, "/response/status")[0];
            if (status == "ERROR") {
                var msg = this.controller.getXMLTagValue(xml, "/response/msg")[0];
                reject(msg);
            }
            var jsonItems = JSON.parse(this.controller.getXMLTagValue(xml, "/response/data/result")[0]);
            resolve(jsonItems);
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader and the values, in JSON, we want to save (power, sensitivity...)
    Post: returns a promise with OK if the saving process was successful or the error otherwise
*/
Network.prototype.saveValues = function(readerIP, values) {
    return new Promise(async (resolve, reject) => {
        try {
            await this.savePower(readerIP, values.power);
            await this.saveSensitivity(readerIP, values.sensitivity);
            await this.saveAntennas(readerIP, values.antennas);
            resolve("OK");
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader and the value of the power we want to save
    Post: returns a promise with the status of the operation or the error otherwise
*/
Network.prototype.savePower = function(readerIP, power) {
    return new Promise(async (resolve, reject) => {
        try {
            //http://192.168.1.165:3161/devices/AdvanReader-m4-150/reader/parameter/RF_READ_POWER
            var url =  "http://" + readerIP + ":3161/devices/" + this.deviceID + "/reader/parameter/" + this.readPower;
            var body = power; 
            var xml = await this.putRequest(url, body);
            var status = this.controller.getXMLTagValue(xml, "/response/status")[0];
            if (status == "OK") 
                resolve(status);
            else
                reject("Could not save power");
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader and the value of the sensitivity we want to save
    Post: returns a promise with the status of the operation or the error otherwise
*/
Network.prototype.saveSensitivity = function(readerIP, sensitivity) {
    return new Promise(async (resolve, reject) => {
        try {
            var url =  "http://" + readerIP + ":3161/devices/" + this.deviceID + "/reader/parameter/" + this.sensitivity;
            var body = sensitivity; 
            var xml = await this.putRequest(url, body);
            var status = this.controller.getXMLTagValue(xml, "/response/status")[0];
            if (status == "OK") 
                resolve(status);
            else
                reject("Could not save sensitivity");
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the IP of the reader and an array of integers with the active antennas
    Post: returns a promise with the status of the operation or the error otherwise
*/
Network.prototype.saveAntennas = function(readerIP, activeAntennas) {
    return new Promise(async (resolve, reject) => {
        try {
            var url =  "http://" + readerIP + ":3161/devices/" + this.deviceID + "/antennas";
            var xmlbody = this.createAntennasXML(this.deviceID, activeAntennas); 
            var xmlresponse = await this.putRequest(url, xmlbody);
            var status = this.controller.getXMLTagValue(xmlresponse, "/response/status")[0];
            if (status == "OK") 
                resolve(status);
            else
                reject("Could not save antennas");
        }
        catch(error) {
            reject(error);
        }
    });
}

/*
    Pre: the device ID and an array of integers with the active antennas
    Post: returns a string containing the necessary XML to save the active antennas
*/
Network.prototype.createAntennasXML = function(deviceID, activeAntennas) {
    var xml = '<request>' +
                '<entries>';
    for (var antenna in activeAntennas) {
        xml += '<entry>' +
                    '<class>ANTENNA_DEFINITION</class>' +
                    '<def>' + deviceID + ","  + activeAntennas[antenna] + ",0,0,-1,loc_id,0,0,0</def>" +          //<def>AdvanReader-m4-150,2,0,0,-1,loc_id,40,210,2</def>
                '</entry>';
    }    
    xml +=      '</entries>' +
            '</request>';
    return xml;
}

/*
    Pre: the IP of the reader we want to test 
    Post: makes the speaker beep if it is connected
*/
Network.prototype.testSpeaker = function(readerIP) {
    return new Promise(async (resolve, reject) => {
        try {
            var url =  "http://" + readerIP + ":3161/devices/" + this.deviceID + "/speak/1000/4/200/0/200";
            await this.getRequest(url);
            resolve();
        }
        catch(error) {
            reject(error);
        }
    });
}