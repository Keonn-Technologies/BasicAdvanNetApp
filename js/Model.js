function Model(controller) {
    this.controller = controller;

    this.table = new Table();

    /********* device features *********/
    this.readerIP = null;
    //power 
    this.minPower = null;
    this.maxPower = null;
    this.minWritePower = null;  //not used
    this.readPowerOptions = []; // o string? not used

    //Ports/Antennas
    this.numPorts = null;

    //Sensitivity
    this.minSensitivity = null;
    this.maxSensitivity = null;

    /********* current values *********/
    this.model = null;  //code + revision + family
    this.code = null;
    this.revision = null;
    this.family = null;
    this.status = null;
    
    this.readPower = null;
    this.writePower = null;     //not used
    this.sensitivity = null;
    this.RFRegion = null;       //not used
    this.activeAntennas = [];         // vector of integers
    this.volume = null;

}

/* 
    Pre: XML Document containing the RF info (sensitivity, power...)
    Post: XML relevant tag info stored in the model 
*/
Model.prototype.storeRFData = function(RFXML) {

    //obtain all the values from the XML Document
    var numPorts = this.getXMLTagValue(RFXML, "/response/data/params/RF_PORT_NUMBER/result")[0];   
    var minPower = this.getXMLTagValue(RFXML, "/response/data/params/RF_POWER_MIN/result")[0];    
    var maxPower = this.getXMLTagValue(RFXML, "/response/data/params/RF_POWER_MAX/result")[0];
    var readPower = this.getXMLTagValue(RFXML, "/response/data/params/RF_READ_POWER/result")[0];
    var minSensitivity = this.getXMLTagValue(RFXML, "/response/data/params/RF_SENSITIVITY_MIN/result")[0];
    var maxSensitivity = this.getXMLTagValue(RFXML, "/response/data/params/RF_SENSITIVITY_MAX/result")[0];
    var sensitivity = this.getXMLTagValue(RFXML, "/response/data/params/RF_SENSITIVITY/result")[0];

    //store them in the model
    this.setNumPorts(numPorts);
    this.setMinPower(minPower);
    this.setMaxPower(maxPower);
    this.setReadPower(readPower);
    this.setMinSensitivity(minSensitivity);
    this.setMaxSensitivity(maxSensitivity);
    this.setSensitivity(sensitivity);
}

/*
    Pre: an XML containing the reader Info (model,family...)
    Post: stores the info in the model
*/    
Model.prototype.storeReaderInfo = function(readerInfoXML) {
    
    //obtain all the values from the XML Document
    var code = this.getXMLTagValue(readerInfoXML, "/response/data/devices/device/code")[0];
    var revision = this.getXMLTagValue(readerInfoXML, "/response/data/devices/device/revision")[0];
    var family = this.getXMLTagValue(readerInfoXML, "/response/data/devices/device/family")[0];
    var status = this.getXMLTagValue(readerInfoXML, "/response/data/devices/device/status")[0];
    var model = code + " rev. " + revision + " (" + family + ")"; 

    //store them in the model
    this.setCode(code);
    this.setRevision(revision);
    this.setFamily(family);
    this.setModel(model);
    this.setStatus(status);
}

/* 
    Pre: an XML containing all the antennas
    Post: stores the antennas in the model
*/
Model.prototype.storeAntennas = function(antennasXML) {

    //obtain all the antennas
    var antennas = this.getXMLTagValue(antennasXML, "/response/data/entries/entry/def");

    //parse them and store them in the model 
    for (a in antennas) {
        this.setAntenna(this.parseAntenna(antennas[a]));
    }
}

/*
    Pre: a string representing an antenna, i.e "AdvanReader-m4-150,1,0,0,0,antenna1,1,0,0"
    Post: a javascript object with the relevant parts of the antenna
*/
Model.prototype.parseAntenna = function(antenna) {
    var props = antenna.split(",");
    return {
        port: props[1],
        mux1: props[2],
        mux2: props[3]
    }
}

/* 
    Pre: an XML and a Xpath expression
    Post: an array containing the values of the XML tags that match the Xpath expression
    Does not work with IE
*/
Model.prototype.getXMLTagValue = function(xml, xpath) {

    if (xml.evaluate) {
        var node = xml.evaluate(xpath, xml, null, XPathResult.ANY_TYPE, null);

        if (node != null) {     //node matched the xpath expression
            switch (node.resultType) {
                case XPathResult.STRING_TYPE:
                    return node.stringValue;

                case XPathResult.NUMBER_TYPE:
                    return node.numberValue;

                case XPathResult.BOOLEAN_TYPE:
                    return node.booleanValue; 

                case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
                    var result = null;
                    var results = [];
                    result = node.iterateNext();
                    while (result) {
                        results.push(result.innerHTML);
                        result = node.iterateNext();
                    }                    
                    return results;
                default: 
                    throw Error("Error retrieving value from XML tag. The result type is unknown");
            }
        }
        return node;    //no nodes matched XPath expression
    }
}

// Return the reader values to display them on the interface as an object
Model.prototype.getReaderValues = function() {
    var readerValues = {
        status: this.getStatus(),
        model: this.getModel(),
        numPorts: this.getNumPorts(),
        minPower: this.getMinPower(),
        maxPower: this.getMaxPower(),
        readPower: this.getReadPower(),
        minSensitivity: this.getMinSensitivity(),
        maxSensitivity: this.getMaxSensitivity(),
        sensitivity: this.getSensitivity(),
        volume: this.getVolume(),
        activeAntennas: this.getActiveAntennas()
    }
    return readerValues;
}



/* settings is an object 
{ 
    power: valorpower
    sens: sensvalue
    antennas: 
    volume: 
}
*/


//called after pressing the save button
Model.prototype.saveValues = function(values) {
    this.setReadPower(values.power);
    this.setSensitivity(values.sensitivity);
    this.antennas = [];
    for (var a in values.antennas)
        this.setAntenna(values.antennas[a]);
    this.setVolume(values.volume);
}

Model.prototype.storeInventory = function(JSONinventory) {
    this.table.storeInventory(JSONinventory);
}

Model.prototype.clearTable = function() {
    this.table.clearTable();
}

/********* Setters *********/
Model.prototype.setMinPower = function(minPower)    {     this.minPower = minPower;         }
Model.prototype.setMaxPower = function(maxPower)    {     this.maxPower = maxPower;         }
Model.prototype.setNumPorts = function(numPorts)    {     this.numPorts = numPorts;         }
Model.prototype.setMinSensitivity = function(minSens) {   this.minSensitivity = minSens;    }
Model.prototype.setMaxSensitivity = function(maxSens) {   this.maxSensitivity = maxSens;    }
Model.prototype.setReadPower = function(readPower) {      this.readPower = readPower;       }
Model.prototype.setWritePower = function(writePower) {    this.writePower = writePower;     }
Model.prototype.setSensitivity = function(sens) {         this.sensitivity = sens;          }
Model.prototype.setAntenna = function(antenna) {          this.activeAntennas.push(antenna);      }
Model.prototype.setVolume = function(volume) {            this.volume = volume;             }
Model.prototype.setCode = function(code) {                this.code = code;                 }
Model.prototype.setRevision = function(revision) {        this.revision = revision;         }
Model.prototype.setFamily = function(family) {            this.family = family;             }
Model.prototype.setModel = function(model) {              this.model = model;               }
Model.prototype.setStatus = function(status) {            this.status = status;             }
Model.prototype.setReaderIP = function(readerIP) {        this.readerIP = readerIP;         }

/********* Getters *********/
Model.prototype.getNumPorts = function() {  return this.numPorts;    }
Model.prototype.getMinPower = function() {  return this.minPower;    }
Model.prototype.getMaxPower = function() {  return this.maxPower;    }
Model.prototype.getReadPower = function() { return this.readPower;   }
Model.prototype.getMinSensitivity = function() { return this.minSensitivity; }
Model.prototype.getMaxSensitivity = function() { return this.maxSensitivity; }
Model.prototype.getSensitivity = function() { return this.sensitivity; }
Model.prototype.getVolume = function() { return this.volume;        }
Model.prototype.getModel = function() { return this.model;          }
Model.prototype.getCode = function() { return this.code;            }
Model.prototype.getRevision = function() { return this.revision;    }
Model.prototype.getFamily = function() { return this.family;        }
Model.prototype.getActiveAntennas = function() { return this.activeAntennas;    }
Model.prototype.getStatus = function() { return this.status;        }


/**************** Advanced EPC Table ****************/
function Table() {

    this.tableName = "#tagsList";   // table div ID
    this.defaultIndex = "epc";      // column used as an "id"
    this.refreshTime = 5000;

    //default (test) table data
    this.defaultData = [
        { epc:"234234e12a34534f0", antenna:1, mux1:0, mux2:0, rssi:25, date:"1245675543" },
        { epc:"234234e12a34534f1", antenna:1, mux1:0, mux2:0, rssi:23, date:"1242423475543" },
        { epc:"234234e12a34534f2", antenna:2, mux1:0, mux2:0, rssi:43, date:"12456543" },
        { epc:"234234e12a34534f3", antenna:1, mux1:0, mux2:0, rssi:25, date:"143" }
    ]

    //Initialize table columns
    this.tableSettings = {
        //data: this.defaultData,
        index: this.defaultIndex,
        height:450, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        layout:"fitColumns", //fit columns to width of table (optional)
        columns: [   //Define Table Columns
            { title:"EPC", field:"epc", sorter:"string", width:220, headerFilter:"input" },
            { title:"Antenna", field:"antenna", sorter:"number", headerFilter:"input" },
            { title:"Mux 1", field:"mux1", sorter:"number", headerFilter:"input" },
            { title:"Mux 2", field:"mux2", sorter:"number",  headerFilter:"input" },
            { title:"RSSI", field:"rssi", sorter:"number", headerFilter:"input" },
            { title:"Date", field:"date", sorter:"date", headerFilter:"input" }
        ]
    };

    this.initializeTable(this.tableSettings);
    //this.populateTable(this.defaultData);     /// useless as you can specify the default data inside the constructor
}

//Initialize Table as tabulator
Table.prototype.initializeTable = function(tableSettings) {
    $(this.tableName).tabulator(tableSettings);
}


//Fill the table with data
Table.prototype.populateTable = function(data) {
    $(this.tableName).tabulator("updateOrAddData", data);
}

/* 
    Pre: values of the EPC and reader to display in the table as a row
    Post: updates the row if the EPC exists or creates a new row otherwise
*/ 
Table.prototype.addRowToTable = function(epc, antenna = 1, mux1 = 0, mux2 = 0, rssi = 0, date) {
    $(this.tableName).tabulator("updateOrAddRow", epc, { epc: epc, antenna: antenna, mux1: mux1, mux2: mux2, rssi: rssi, date: date });
}

// Remove all data from the table
Table.prototype.clearTable = function() {
    $(this.tableName).tabulator("clearData");
}

// Make sure rows and columns are rendered correctly
Table.prototype.redrawTable = function() {
    $(this.tableName).tabulator("redraw");
}

// Refresh the table every resfreshTime ms
Table.prototype.refreshTable = () => {
    setInterval(() => {
        $(this.tableName).tabulator("redraw");
    },this.refreshTime);
}







//PRe: array of objects
Table.prototype.storeInventory = function(JSONinventory) {
    for (var read in JSONinventory) {
        this.addRowToTable(
            JSONinventory[read].epc, 
            JSONinventory[read].port, 
            JSONinventory[read].mux1, 
            JSONinventory[read].mux2, 
            JSONinventory[read].rssi, 
            JSONinventory[read].ts);
    }

}