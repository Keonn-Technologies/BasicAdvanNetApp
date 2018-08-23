function Model(controller) {
    this.controller = controller;

    this.table = new Table();

    /********* device features *********/
    this.readerIP = null;

    //power 
    this.minPower = null;
    this.maxPower = null;

    //Ports/Antennas
    this.numPorts = null;

    //Sensitivity
    this.minSensitivity = null;
    this.maxSensitivity = null;

    /********* current values *********/
    this.model = null;            // code + revision + family
    this.code = null;
    this.revision = null;
    this.family = null;
    this.status = null;
    
    this.readPower = null;
    this.sensitivity = null;
    this.activeAntennas = [];     // vector of integers
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

    // Reset the reader active antennas
    this.activeAntennas = [];

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
    Pre: an XML and an Xpath expression
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

/* 
    Pre: -
    Post: an object containing the reader values to display on the interface
*/
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

/* 
    Pre: an object containing the values we want to save in the model
    Post: the values are stored in the model
*/
Model.prototype.saveValues = function(values) {
    this.setReadPower(values.power);
    this.setSensitivity(values.sensitivity);
    this.antennas = [];
    for (var a in values.antennas)
        this.setAntenna(values.antennas[a]);
    this.setVolume(values.volume);
}

/* 
    Pre: an inventory in JSON
    Post: stores the inventory in the table
*/
Model.prototype.storeInventory = function(JSONinventory) {
    this.table.storeInventory(JSONinventory);
}

/* 
    Pre: -
    Post: clears the table data
*/
Model.prototype.clearTable = function() {
    this.table.clearTable();
}

/********* Setters *********/
Model.prototype.setMinPower = function(minPower)        {   this.minPower = minPower;         }
Model.prototype.setMaxPower = function(maxPower)        {   this.maxPower = maxPower;         }
Model.prototype.setNumPorts = function(numPorts)        {   this.numPorts = numPorts;         }
Model.prototype.setMinSensitivity = function(minSens)   {   this.minSensitivity = minSens;    }
Model.prototype.setMaxSensitivity = function(maxSens)   {   this.maxSensitivity = maxSens;    }
Model.prototype.setReadPower = function(readPower)      {   this.readPower = readPower;       }
Model.prototype.setWritePower = function(writePower)    {   this.writePower = writePower;     }
Model.prototype.setSensitivity = function(sens)         {   this.sensitivity = sens;          }
Model.prototype.setAntenna = function(antenna)          {   this.activeAntennas.push(antenna);}
Model.prototype.setVolume = function(volume)            {   this.volume = volume;             }
Model.prototype.setCode = function(code)                {   this.code = code;                 }
Model.prototype.setRevision = function(revision)        {   this.revision = revision;         }
Model.prototype.setFamily = function(family)            {   this.family = family;             }
Model.prototype.setModel = function(model)              {   this.model = model;               }
Model.prototype.setStatus = function(status)            {   this.status = status;             }
Model.prototype.setReaderIP = function(readerIP)        {   this.readerIP = readerIP;         }

/********* Getters *********/
Model.prototype.getNumPorts = function()                {   return this.numPorts;       }
Model.prototype.getMinPower = function()                {   return this.minPower;       }
Model.prototype.getMaxPower = function()                {   return this.maxPower;       }
Model.prototype.getReadPower = function()               {   return this.readPower;      }
Model.prototype.getMinSensitivity = function()          {   return this.minSensitivity; }
Model.prototype.getMaxSensitivity = function()          {   return this.maxSensitivity; }
Model.prototype.getSensitivity = function()             {   return this.sensitivity;    }
Model.prototype.getVolume = function()                  {   return this.volume;         }
Model.prototype.getModel = function()                   {   return this.model;          }
Model.prototype.getCode = function()                    {   return this.code;           }
Model.prototype.getRevision = function()                {   return this.revision;       }
Model.prototype.getFamily = function()                  {   return this.family;         }
Model.prototype.getActiveAntennas = function()          {   return this.activeAntennas; }
Model.prototype.getStatus = function()                  {   return this.status;         }


/**************** Advanced EPC Table ****************/
function Table() {

    this.tableName = "#tagsList";   // table div ID
    this.defaultIndex = "epc";      
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
        //data: this.defaultData,       // uncomment if you want to add data by default in the table
        index: this.defaultIndex,       // column used as an "id"
        responsiveLayout: "hide",
        height: 400,                    // set height of table
        layout: "fitColumns",           // fit columns to width of table (optional)
        columns: [                      // define Table Columns
            { title:"EPC", field:"epc", topCalc:"count", sorter:"string", width:240, headerFilter:"input", responsive:0 },
            { title:"Port", field:"antenna", sorter:"number", width: 82, headerFilter:"input", responsive: 0 },
            { title:"Mux1", field:"mux1", sorter:"number", width: 95, headerFilter:"input" },
            { title:"Mux2", field:"mux2", sorter:"number", width: 95, headerFilter:"input" },
            { title:"RSSI", field:"rssi", sorter:"number", width: 90, headerFilter:"input", responsive: 0 },
            { title:"Date", field:"date", headerFilter: false, responsive: 0 }
        ]
    };

    this.initializeTable(this.tableSettings);
    this.hideCalcsHolder();
}

/* 
    Pre: an object containing the settings of the table
    Post: initializes the table
*/
Table.prototype.initializeTable = function(tableSettings) {
    $(this.tableName).tabulator(tableSettings);
    this.initHeaders();
    this.removeDateArrow();
}

/* 
    Pre: -
    Post: adds bootstrap CSS class to the table headers
*/
Table.prototype.initHeaders = function() {
    var filterBoxes = document.querySelectorAll("#tagsSection input[type=search]");
    for (var i = 0; i < filterBoxes.length; i++) {
        filterBoxes[i].classList.add("form-control");
        filterBoxes[i].placeholder = "filter...";
    }
}

/* 
    Pre: -
    Post: removes the arrow from the date column
*/
Table.prototype.removeDateArrow = function() {
    var arrows = document.querySelectorAll(".tabulator-arrow");
    arrows[arrows.length-1].classList.add("d-none");
}

/* 
    Pre: an object with data
    Post: if the data exists, it updates it or adds it otherwise
*/
Table.prototype.populateTable = function(data) {
    $(this.tableName).tabulator("updateOrAddData", data);
}

/* 
    Pre: values of the EPC and reader to display in the table as a row
    Post: updates the row if the EPC exists or creates a new row otherwise
*/ 
Table.prototype.addRowToTable = function(epc, antenna = 1, mux1 = 0, mux2 = 0, rssi = 0, date) {
    $(this.tableName).tabulator("updateOrAddRow", epc, { epc: epc, antenna: antenna, mux1: mux1, mux2: mux2, rssi: rssi, date: this.getCurrentTime() });
}

/* 
    Pre: -
    Post: the current time in HH:MM:SS format
*/ 
Table.prototype.getCurrentTime = function() {
    var date = new Date();

    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    // Add a zero when needed
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    return hours + ':' + minutes + ':' + seconds;
}

/* 
    Pre: -
    Post: removes all data from the table
*/ 
Table.prototype.clearTable = function() {
    $(this.tableName).tabulator("clearData");
}

/* 
    Pre: -
    Post: redraws the table 
*/ 
Table.prototype.redrawTable = function() {
    $(this.tableName).tabulator("redraw");
}

/* 
    Pre: -
    Post: refreshes the table every resfreshTime ms
*/
Table.prototype.refreshTable = () => {
    setInterval(() => {
        $(this.tableName).tabulator("redraw");
    },this.refreshTime);
}

/* 
    Pre: -
    Post: writes the EPCs being read in the table header
*/
Table.prototype.writeNumEPC = function() {
    var numEPCs = $('#tagsList').tabulator("getCalcResults").top.epc;
    document.getElementsByClassName("tabulator-col-title")[0].innerHTML = "EPC (" + numEPCs + ")";
}

/* 
    Pre: -
    Post: hides the header created when activating the topCalc functions
*/
Table.prototype.hideCalcsHolder = function() {
    document.getElementsByClassName("tabulator-calcs-holder")[0].hidden = true;
}

/* 
    Pre: array of objects containing the inventory
    Post: displays the inventory in the table, as well as the number of EPCs being read
*/
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
    this.writeNumEPC();
    this.hideCalcsHolder();
}