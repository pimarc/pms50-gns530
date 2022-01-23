class GPS_NearestAirports extends NavSystemElement {
    constructor(_nbElemsMax = 3) {
        super();
        this.name = "NRSTAirport";
        this.nbElemsMax = _nbElemsMax;
    }
    init() {
        this.sliderElement = this.gps.getChildById("SliderNRSTAirport");
        this.sliderCursorElement = this.gps.getChildById("SliderNRSTAirportCursor");
        this.nearestAirportList = new NearestAirportList(this.gps);
        this.airportsSliderGroup = new SelectableElementSliderGroup(this.gps, [], this.sliderElement, this.sliderCursorElement, 2);
        for (let i = 0; i < this.nbElemsMax; i++) {
            this.airportsSliderGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("NRSTAirport_" + i), this.airportName_SelectionCallback.bind(this)));
            this.airportsSliderGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("NRSTAirport_Freq_" + i), this.airportFrequency_SelectionCallback.bind(this)));
        }
        this.defaultSelectables = [this.airportsSliderGroup];
    }
    onEnter() {
    }
    onUpdate(_deltaTime ) {
        this.nearestAirportList.Update();
        var airportListStrings = [];
        let magvar = SimVar.GetSimVarValue("MAGVAR", "degrees");
        for (var i = 0; i < this.nearestAirportList.airports.length; i++) {
            var firstLine = "";
            var secondLine = "";
            var logo = "";
            if (this.nearestAirportList.airports[i].airportClass == 2 || this.nearestAirportList.airports[i].airportClass == 3) {
                logo = "Airport_Soft.png";
            }
            else if (this.nearestAirportList.airports[i].airportClass == 1) {
                switch (Math.round((this.nearestAirportList.airports[i].longestRunwayDirection % 180) / 45.0)) {
                    case 0:
                    case 4:
                        logo = "Airport_Hard_NS.png";
                        break;
                    case 1:
                        logo = "Airport_Hard_NE_SW.png";
                        break;
                    case 2:
                        logo = "Airport_Hard_EW.png";
                        break;
                    case 3:
                        logo = "Airport_Hard_NW_SE.png";
                        break;
                }
            }
            else if (this.nearestAirportList.airports[i].airportClass == 4) {
                logo = "Helipad.png";
            }
            else if (this.nearestAirportList.airports[i].airportClass == 5) {
                logo = "Private_Airfield.png";
            }

            firstLine += '<td class="SelectableElement">' + this.nearestAirportList.airports[i].ident + '</td>';
            firstLine += '<td><img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/' + logo + '" class="imgSizeM"> </td>';
            firstLine += '<td>' + fastToFixed((this.nearestAirportList.airports[i].bearing - magvar + 360)%360, 0) + '<div class="Align unit">o<br>M</div></td>';
            firstLine += '<td>' + (Math.round((this.nearestAirportList.airports[i].distance*10))/10).toFixed(1) + '<div class="Align unit">n<br>m</div></td>';
            firstLine += '<td>' + this.nearestAirportList.airports[i].bestApproach + '</td>';
            secondLine += '<td>' + this.nearestAirportList.airports[i].frequencyName.toLowerCase() + '</td>';
            //Don't display frequency if it's zero
            secondLine += '<td colspan="2"';
            if(this.nearestAirportList.airports[i].frequencyMHz > 0) {
                secondLine += ' class="SelectableElement"' +'>' + this.gps.frequencyFormat(this.nearestAirportList.airports[i].frequencyMHz, 3);
            }
            else {
                secondLine += '>';
            }
            secondLine += '</td>';
            secondLine += '<td>rwy</td>';
            secondLine += '<td>' + fastToFixed(this.nearestAirportList.airports[i].longestRunwayLength, 0) + '<div class="Align unit">f<br>t</div></td>';
            airportListStrings.push(firstLine);
            console.log(firstLine);
            airportListStrings.push(secondLine);
            console.log(secondLine);
        }
        this.airportsSliderGroup.setStringElements(airportListStrings);
    }
    onExit() {
        if (this.gps.currentInteractionState == 1) {
            this.gps.lastRelevantICAO = this.nearestAirportList.airports[Math.floor(this.airportsSliderGroup.getIndex() / 2)].icao;
            this.gps.lastRelevantICAOType = "A";
        }
    }
    onEvent(_event) {
    }
    airportName_SelectionCallback(_event, _index) {
        switch (_event) {
            case "ENT_Push":
                this.gps.SwitchToPageName("WPT", "AirportLocation");
                this.gps.SwitchToInteractionState(0);
                return true;
        }
    }
    airportFrequency_SelectionCallback(_event, _index) {
        switch (_event) {
            case "ENT_Push":
                if (this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyMHz >= 118) {
                    SimVar.SetSimVarValue("K:COM" + (this.gps.comIndex == 1 ? "" : this.gps.comIndex) + "_STBY_RADIO_SET_HZ", "Hz", this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyMHz * 1000 * 1000);
//                    SimVar.SetSimVarValue("K:COM" + (this.gps.comIndex == 1 ? "" : this.gps.comIndex) + "_STBY_RADIO_SET", "Frequency BCD16", this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyBCD16);
                }
                // Don't display frequency if it's zero
                else if(this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyMHz > 0) {
                    SimVar.SetSimVarValue("K:NAV" + this.gps.navIndex + "_STBY_SET", "Frequency BCD16", this.nearestAirportList.airports[Math.floor(_index / 2)].frequencyBCD16);
                }
                break;
        }
    }
}
class GPS_NearestIntersection extends NavSystemElement {
    constructor(_nbElemsMax = 5) {
        super();
        this.name = "NRSTIntersection";
        this.nbElemsMax = _nbElemsMax;
    }
    init() {
        this.sliderElement = this.gps.getChildById("SliderNRSTIntersection");
        this.sliderCursorElement = this.gps.getChildById("SliderNRSTIntersectionCursor");
        this.nearestIntersectionList = new NearestIntersectionList(this.gps);
        this.intersectionsSliderGroup = new SelectableElementSliderGroup(this.gps, [], this.sliderElement, this.sliderCursorElement);
        for (let i = 0; i < this.nbElemsMax; i++) {
            this.intersectionsSliderGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("NRST_Intersection_" + i), this.intersection_SelectionCallback.bind(this)));
        }
        this.defaultSelectables = [this.intersectionsSliderGroup];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.nearestIntersectionList.Update(50, 100);
        var lines = [];
        let magvar = SimVar.GetSimVarValue("MAGVAR", "degrees");
        for (var i = 0; i < this.nearestIntersectionList.intersections.length; i++) {
            var line = "";
            line += '<td class="SelectableElement">' + this.nearestIntersectionList.intersections[i].ident + '</td>';
            line += '<td><img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + this.nearestIntersectionList.intersections[i].imageFileName() + '"></td>';
            line += '<td>' + Utils.leadingZeros(fastToFixed((this.nearestIntersectionList.intersections[i].bearing - magvar + 360)%360, 0), 3) + '<div class="Align unit">o<br>M</div></td>';
            line += '<td>' + (Math.round((this.nearestIntersectionList.intersections[i].distance*10))/10).toFixed(1) + '<div class="Align unit">n<br>m</div></td>';
            lines.push(line);
        }
        this.intersectionsSliderGroup.setStringElements(lines);
    }
    onExit() {
        if (this.gps.currentInteractionState == 1) {
            this.gps.lastRelevantICAO = this.nearestIntersectionList.intersections[this.intersectionsSliderGroup.getIndex()].icao;
            this.gps.lastRelevantICAOType = "W";
        }
    }
    onEvent(_event) {
    }
    intersection_SelectionCallback(_event, _index) {
        switch (_event) {
            case "ENT_Push":
                this.gps.SwitchToPageName("WPT", "Intersection");
                this.gps.SwitchToInteractionState(0);
                return true;
        }
    }
}
class GPS_NearestNDB extends NavSystemElement {
    constructor(_nbElemsMax = 5) {
        super();
        this.name = "NRSTNDB";
        this.nbElemsMax = _nbElemsMax;
    }
    init() {
        this.sliderElement = this.gps.getChildById("SliderNRSTNDB");
        this.sliderCursorElement = this.gps.getChildById("SliderNRSTNDBCursor");
        this.nearestNDBList = new NearestNDBList(this.gps);
        this.ndbsSliderGroup = new SelectableElementSliderGroup(this.gps, [], this.sliderElement, this.sliderCursorElement);
        for (let i = 0; i < this.nbElemsMax; i++) {
            this.ndbsSliderGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("NRST_NDB_" + i), this.ndb_SelectionCallback.bind(this)));
        }
        this.defaultSelectables = [this.ndbsSliderGroup];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.nearestNDBList.Update();
        var lines = [];
        let magvar = SimVar.GetSimVarValue("MAGVAR", "degrees");
        for (var i = 0; i < this.nearestNDBList.ndbs.length; i++) {
            var line = "";
            line += '<td class="SelectableElement">' + this.nearestNDBList.ndbs[i].ident + '</td>';
            line += '<td><img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + this.nearestNDBList.ndbs[i].imageFileName() + '"></td>';
            line += '<td>' + Utils.leadingZeros(fastToFixed((this.nearestNDBList.ndbs[i].bearing - magvar + 360)%360, 0), 3) + '<div class="Align unit">o<br>M</div></td>';
            line += '<td>' + (Math.round((this.nearestNDBList.ndbs[i].distance*10))/10).toFixed(1) + '<div class="Align unit">n<br>m</div></td>';
            line += '<td>' + fastToFixed(this.nearestNDBList.ndbs[i].frequencyMHz, 1) + '</td>';
            lines.push(line);
        }
        this.ndbsSliderGroup.setStringElements(lines);
    }
    onExit() {
        if (this.gps.currentInteractionState == 1) {
            this.gps.lastRelevantICAO = this.nearestNDBList.ndbs[this.ndbsSliderGroup.getIndex()].icao;
            this.gps.lastRelevantICAOType = "N";
        }
    }
    onEvent(_event) {
    }
    ndb_SelectionCallback(_event, _index) {
        switch (_event) {
            case "ENT_Push":
                this.gps.SwitchToPageName("WPT", "NDB");
                this.gps.SwitchToInteractionState(0);
                return true;
        }
    }
}
class GPS_NearestVOR extends NavSystemElement {
    constructor(_nbElemsMax = 5) {
        super();
        this.name = "NRSTVOR";
        this.nbElemsMax = _nbElemsMax;
    }
    init() {
        this.sliderElement = this.gps.getChildById("SliderNRSTVOR");
        this.sliderCursorElement = this.gps.getChildById("SliderNRSTVORCursor");
        this.nearestVORList = new NearestVORList(this.gps);
        this.vorsSliderGroup = new SelectableElementSliderGroup(this.gps, [], this.sliderElement, this.sliderCursorElement);
        for (let i = 0; i < this.nbElemsMax; i++) {
            this.vorsSliderGroup.addElement(new SelectableElementGroup(this.gps, this.gps.getChildById("NRST_VOR_" + i), [
                this.vor_SelectionCallback.bind(this),
                this.frequency_SelectionCallback.bind(this),
            ]));
        }
        this.defaultSelectables = [this.vorsSliderGroup];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.nearestVORList.Update();
        var lines = [];
        let magvar = SimVar.GetSimVarValue("MAGVAR", "degrees");
        for (var i = 0; i < this.nearestVORList.vors.length; i++) {
            var line = "";
            line += '<td class="SelectableElement Select0">' + this.nearestVORList.vors[i].ident + '</td>';
            var image = this.nearestVORList.vors[i].imageFileName();
            line += '<td> <img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + image + '"></td>';
            line += '<td>' + Utils.leadingZeros(fastToFixed((this.nearestVORList.vors[i].bearing - magvar + 360)%360, 0), 3) + '<div class="Align unit">o<br>M</div></td>';
            line += '<td>' + (Math.round((this.nearestVORList.vors[i].distance*10))/10).toFixed(1) + '<div class="Align unit">n<br>m</div></td>';
            line += '<td class="SelectableElement Select1">' + this.gps.frequencyFormat(this.nearestVORList.vors[i].frequencyMHz, 2) + '</td>';
            lines.push(line);
        }
        this.vorsSliderGroup.setStringElements(lines);
    }
    onExit() {
        if (this.gps.currentInteractionState == 1) {
            this.gps.lastRelevantICAO = this.nearestVORList.vors[this.vorsSliderGroup.getIndex()].icao;
            this.gps.lastRelevantICAOType = "V";
        }
    }
    onEvent(_event) {
    }
    vor_SelectionCallback(_event, _index) {
        switch (_event) {
            case "ENT_Push":
                this.gps.SwitchToPageName("WPT", "VOR");
                this.gps.SwitchToInteractionState(0);
                return true;
        }
    }
    frequency_SelectionCallback(_event, _index) {
        switch (_event) {
            case "ENT_Push":
                SimVar.SetSimVarValue("K:NAV" + this.gps.navIndex + "_STBY_SET", "Frequency BCD16", this.nearestVORList.vors[_index].frequencyBCD16);
                return true;
        }
    }
}
class GPS_NearestAirpaces extends NavSystemElement {
    constructor() {
        super();
        this.name = "NRSTAirspace";
    }
    init() {
        this.nrstAirspaceName1 = this.gps.getChildById("NRST_Airspace_Name_1");
        this.nrstAirspaceStatus1 = this.gps.getChildById("NRST_Airspace_Status_1");
        this.nrstAirspaceName2 = this.gps.getChildById("NRST_Airspace_Name_2");
        this.nrstAirspaceStatus2 = this.gps.getChildById("NRST_Airspace_Status_2");
        this.nrstAirspaceName3 = this.gps.getChildById("NRST_Airspace_Name_3");
        this.nrstAirspaceStatus3 = this.gps.getChildById("NRST_Airspace_Status_3");
        this.nrstAirspaceName4 = this.gps.getChildById("NRST_Airspace_Name_4");
        this.nrstAirspaceStatus4 = this.gps.getChildById("NRST_Airspace_Status_4");
        this.nearestAirspacesList = new GPS_NearestAirspaceList(this.gps);
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.nearestAirspacesList.Update();
        var nbAirspaces = this.nearestAirspacesList.airspaces.length;
        if (nbAirspaces > 0) {
            let airspace = this.nearestAirspacesList.airspaces[0];
            this.nrstAirspaceName1.textContent = airspace.name;
            this.nrstAirspaceStatus1.textContent = this.GetStatus(airspace);
        }
        else {
            this.nrstAirspaceName1.textContent = "____________________";
            this.nrstAirspaceStatus1.textContent = "___________________";
        }
        if (nbAirspaces > 1) {
            let airspace = this.nearestAirspacesList.airspaces[1];
            this.nrstAirspaceName2.textContent = airspace.name;
            this.nrstAirspaceStatus2.textContent = this.GetStatus(airspace);
        }
        else {
            this.nrstAirspaceName2.textContent = "____________________";
            this.nrstAirspaceStatus2.textContent = "___________________";
        }
        if (nbAirspaces > 2) {
            let airspace = this.nearestAirspacesList.airspaces[2];
            this.nrstAirspaceName3.textContent = airspace.name;
            this.nrstAirspaceStatus3.textContent = this.GetStatus(airspace);
        }
        else {
            this.nrstAirspaceName3.textContent = "____________________";
            this.nrstAirspaceStatus3.textContent = "___________________";
        }
        if (this.nrstAirspaceName4) {
            if (nbAirspaces > 3) {
                let airspace = this.nearestAirspacesList.airspaces[3];
                this.nrstAirspaceName4.textContent = airspace.name;
                this.nrstAirspaceStatus4.textContent = this.GetStatus(airspace);
            }
            else {
                this.nrstAirspaceName4.textContent = "____________________";
                this.nrstAirspaceStatus4.textContent = "___________________";
            }
        }
        this.nearestAirspacesList.airspaces;
    }
    onExit() {
    }
    onEvent(_event) {
    }
    GetStatus(airspace) {
        var aheadTime = airspace.aheadTime;
        aheadTime = Math.trunc(aheadTime);
        var displayAheadTime = "" + (aheadTime / 60 < 10 ? "0" : "") + Math.trunc(aheadTime / 60) + ':' + (aheadTime % 60 < 10 ? "0" : "") + aheadTime % 60;
        switch (airspace.status) {
            case 0:
                return "";
            case 1:
                return "Near";
            case 2:
                return "Ahead - " + displayAheadTime;     // Ahead, less than 10 minutes
            case 3:
                return "Near and ahead - " + displayAheadTime;    // Near and ahead
            case 4:
                return "Inside of airspace";    // Inside
            default:
                return "";
        }
    }
}

// Old msfs code for airspace list because the code from 1.18.9.0 is not working
// Added altitude and frequency in result (frequency available only for center type airspace)
// changed the number of airspaces to 25
class GPS_NearestAirspaceList {
    constructor(_instrument) {
        this.instrument = _instrument;
        this.airspaces = [];
        this.batch = new SimVar.SimVarBatch("C:fs9gps:NearestAirspaceItemsNumber", "C:fs9gps:NearestAirspaceCurrentLine");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentName", "string", "string");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentType", "number", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentStatus", "number", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentNearDistance", "nautical mile", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentAheadTime", "seconds", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentGeometry", "number", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentMinAltitude", "feet", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentMaxAltitude", "feet", "number");
        this.batch.add("C:fs9gps:NearestAirspaceCurrentFrequency", "hertz", "number");
    }
    Update(_nbMax = 25, _milesDistance = 200) {
        this.nbMax = _nbMax;
        this.milesDistance = _milesDistance;
        if (GPS_NearestAirspaceList.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
            this.needUpdate = false;
        }
        else {
            this.needUpdate = true;
        }
    }
    LoadData() {
        var instrId = this.instrument.instrumentIdentifier;
        switch (this.loadState) {
            case 0:
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceCurrentLatitude", "degree latitude", SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceCurrentLongitude", "degree longitude", SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceCurrentAltitude", "meter", SimVar.GetSimVarValue("GPS POSITION ALT", "meter", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceTrueGroundTrack", "degree", SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceGroundSpeed", "meter per second", SimVar.GetSimVarValue("GPS GROUND SPEED", "meter per second", instrId), instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceNearDistance", "nautical mile", 2, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceNearAltitude", "feet", 200, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceAheadTime", "minute", 10, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceMaximumItems", "number", this.nbMax, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceMaximumDistance", "nautical miles", this.milesDistance, instrId);
                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceQuery", "number", 0xEFC038, instrId);
//                SimVar.SetSimVarValue("C:fs9gps:NearestAirspaceQuery", "number", 0xFFFFFE, instrId);
                this.loadState++;
                break;
            case 1:
                SimVar.GetSimVarArrayValues(this.batch, function (_Values) {
                    this.airspaces = [];
                    for (var i = 0; i < _Values.length && i < 100; i++) {
                        var airspace = new NearestAirspace();
                        airspace.name = Utils.Translate(_Values[i][0]);
                        airspace.ident = (airspace.name + "_" + i).replace(new RegExp(" ", "g"), "");
                        airspace.ident = airspace.ident.replace(new RegExp("/", "g"), "");
                        airspace.type = _Values[i][1];
                        airspace.status = _Values[i][2];
                        airspace.nearDistance = _Values[i][3];
                        airspace.aheadTime = _Values[i][4];
                        airspace.geometry = _Values[i][5];
                        airspace.minAltitude = Math.floor(_Values[i][6]);
                        airspace.maxAltitude = Math.min(60000, Math.floor(_Values[i][7]));
                        airspace.frequency = _Values[i][8];
                        this.airspaces.push(airspace);
                    }
                    this.loadState++;
                }.bind(this), instrId);
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 3;
    }
    EndLoad() {
        if (this.needUpdate) {
            this.Update(this.nbMax, this.milesDistance);
        }
    }
}
GPS_NearestAirspaceList.readManager = new InstrumentDataReadManager();
