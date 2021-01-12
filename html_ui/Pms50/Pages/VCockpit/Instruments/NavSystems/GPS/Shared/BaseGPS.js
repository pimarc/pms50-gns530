// Stack trace. To callit: console.log(stackTrace());
// Console must be activated in NavSystem.js;
function stackTrace() {
    var err = new Error();
    return err.stack;
 }

// Usefull for icao console log
// because the console log concatenate spaces
 function stringToAscii(str) {
    var bytes = []; // char codes
    var bytesv2 = []; // char codes

    for (var i = 0; i < str.length; ++i) {
        var code = str.charCodeAt(i);
        bytes = bytes.concat([code]);
    }
    return bytes.join(', ');
}

class BaseGPS extends NavSystem {
    constructor() {
        super();
        this.currentlySelectedFreq = 0;
        this.navIndex = 1;
        this.comIndex = 1;
        this.fplNumber = 0;
        this.version = "";
        this.airportWaypointsIcaoSearchField = new SearchFieldWaypointICAO(this, [], this, "A");
        this.addEventAlias("RightSmallKnob_Right", "NavigationSmallInc");
        this.addEventAlias("RightSmallKnob_Left", "NavigationSmallDec");
        this.addEventAlias("RightLargeKnob_Right", "NavigationLargeInc");
        this.addEventAlias("RightLargeKnob_Left", "NavigationLargeDec");
        this.addEventAlias("RightSmallKnob_Push", "NavigationPush");
    }
    connectedCallback() {
        super.connectedCallback();
        this.getVersion();
        this.comActive = this.getChildById("ComActive");
        this.comStandby = this.getChildById("ComStandby");
        this.vlocActive = this.getChildById("VlocActive");
        this.vlocStandby = this.getChildById("VlocStandby");
        this.botRadioPartMid = this.getChildById("BotRadioPartMid");
        this.pagesContainer = this.getChildById("GpsPart");
        this.menuTitle = this.getChildById("MenuTitle");
        this.pagePos = this.getChildById("PagePos");
        this.msgAlert = this.getChildById("MsgAlert");
        this.CDIState = this.getChildById("Gps");
        this.selectApproachPage = new NavSystemElementContainer("ApproachSelection", "ApproachSelection", new GPS_ApproachSelection());
        this.selectApproachPage.setGPS(this);
        this.selectArrivalPage = new NavSystemElementContainer("ArrivalSelection", "ArrivalSelection", new GPS_ArrivalSelection());
        this.selectArrivalPage.setGPS(this);
        this.selectDeparturePage = new NavSystemElementContainer("DepartureSelection", "DepartureSelection", new GPS_DepartureSelection());
        this.selectDeparturePage.setGPS(this);
        this.confirmWindow = new NavSystemElementContainer("ConfirmationWindow", "ConfirmationWindow", new GPS_ConfirmationWindow());
        this.confirmWindow.setGPS(this);
        this.alertWindow = new NavSystemElementContainer("AlertWindow", "AlertWindow", new GPS_AlertWindow());
        this.alertWindow.setGPS(this);
        this._t = 0;
        this.msg_t = 0;
        this.waypointDirectTo = null;
        this.attemptDeleteWpLeg = 0;
        this.attemptDeleteWpProc = 0;
        this.attemptAddWp = 0;
        this.airspaceList = new NearestAirspaceList(this);
        this.configData = null;
        this.debug = false;
        this.icaoFromMap = null;
        this.dataStore = new WTDataStore(this);
        //PM Modif: Add debugging tool WebUI-DevKit (must be on the community folder)
        this.loadConfig(() => {
            this.debug = this.getConfigKey("debug", false);
            // Set debug mode to datastore in order to retrieve it evrywhere from a static method
            WTDataStore.globalSet("Debug", this.debug)
            if(this.debug) {
                Include.addScript("/JS/debug.js", function () {
                    g_modDebugMgr.AddConsole(null);
                });
            }
        });
        //PM Modif: End Add debugging tool WebUI-DevKit (must be on the community folder)
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let comElem = this.instrumentXmlConfig.getElementsByTagName("ComIndex");
            if (comElem.length > 0) {
                this.comIndex = parseInt(comElem[0].textContent);
            }
            let navElem = this.instrumentXmlConfig.getElementsByTagName("NavIndex");
            if (navElem.length > 0) {
                this.navIndex = parseInt(navElem[0].textContent);
            }
        }
    }
    onEvent(_event) {
        super.onEvent(_event);
        if (_event == "LeftSmallKnob_Push") {
            this.currentlySelectedFreq = 1 - this.currentlySelectedFreq;
        }
        if (_event == "LeftSmallKnob_Right") {
            if (this.currentlySelectedFreq == 0) {
                SimVar.SetSimVarValue("K:COM" + (this.comIndex == 1 ? "" : this.comIndex) + "_RADIO_FRACT_INC", "number", 0);
            }
            else {
                SimVar.SetSimVarValue("K:NAV" + this.navIndex + "_RADIO_FRACT_INC", "number", 0);
            }
        }
        if (_event == "LeftSmallKnob_Left") {
            if (this.currentlySelectedFreq == 0) {
                SimVar.SetSimVarValue("K:COM" + (this.comIndex == 1 ? "" : this.comIndex) + "_RADIO_FRACT_DEC", "number", 0);
            }
            else {
                SimVar.SetSimVarValue("K:NAV" + this.navIndex + "_RADIO_FRACT_DEC", "number", 0);
            }
        }
        if (_event == "LeftLargeKnob_Right") {
            if (this.currentlySelectedFreq == 0) {
                SimVar.SetSimVarValue("K:COM" + (this.comIndex == 1 ? "" : this.comIndex) + "_RADIO_WHOLE_INC", "number", 0);
            }
            else {
                SimVar.SetSimVarValue("K:NAV" + this.navIndex + "_RADIO_WHOLE_INC", "number", 0);
            }
        }
        if (_event == "LeftLargeKnob_Left") {
            if (this.currentlySelectedFreq == 0) {
                SimVar.SetSimVarValue("K:COM" + (this.comIndex == 1 ? "" : this.comIndex) + "_RADIO_WHOLE_DEC", "number", 0);
            }
            else {
                SimVar.SetSimVarValue("K:NAV" + this.navIndex + "_RADIO_WHOLE_DEC", "number", 0);
            }
        }
        if (_event == "CLR_Push_Long") {
            this.SwitchToInteractionState(0);
            this.SwitchToPageName("NAV", "DefaultNav");
            this.currentEventLinkedPageGroup = null;
        }
        if (_event == "COMSWAP_Push") {
            SimVar.SetSimVarValue("K:COM" + (this.comIndex == 1 ? "_STBY" : this.comIndex) + "_RADIO_SWAP", "boolean", 0);
        }
        if (_event == "NAVSWAP_Push") {
            SimVar.SetSimVarValue("K:NAV" + this.navIndex + "_RADIO_SWAP", "boolean", 0);
        }
        if (_event == "ID") {
            SimVar.SetSimVarValue("K:RADIO_VOR" + this.navIndex + "_IDENT_TOGGLE", "boolean", 0);
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        Avionics.Utils.diffAndSet(this.CDIState, SimVar.GetSimVarValue("GPS DRIVES NAV1", "boolean") == 0 ? "VLOC" : "GPS");
        this.msg_t++;
        if(this.msg_t > 5)
        {
            this.msg_t = 0;
            let state530 = SimVar.GetSimVarValue("L:AS530_State", "number");
            if(this.gpsType == "530" || !state530)
            {
                if(this.messageList) {
                    this.messageList.onUpdate(_deltaTime);
                    if (this.messageList.hasMessages()) {
                        this.msgAlert.setAttribute("style", "visibility: visible");
                        if (this.messageList.hasNewMessages()) {
                            this.msgAlert.setAttribute("state", this.blinkGetState(1000, 500) ? "Blink" : "None");
                        }
                        else {
                            this.msgAlert.setAttribute("state", "None");
                        }
                    }
                    else {
                        this.msgAlert.setAttribute("style", "visibility: hidden");
                    }
                }
            }
        }
        this.comActive.innerHTML = this.frequencyFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:" + this.comIndex, "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:" + this.comIndex, "Enum") == 0 ? 2 : 3);
        this.comStandby.innerHTML = this.frequencyFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:" + this.comIndex, "MHz"), SimVar.GetSimVarValue("COM SPACING MODE:" + this.comIndex, "Enum") == 0 ? 2 : 3);
        this.vlocActive.innerHTML = this.frequencyFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + this.navIndex, "MHz"), 2);
        this.vlocStandby.innerHTML = this.frequencyFormat(SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:" + this.navIndex, "MHz"), 2);
        if (this.currentlySelectedFreq == 0) {
            this.comStandby.setAttribute("state", "Selected");
            this.vlocStandby.setAttribute("state", "Unselected");
        }
        else {
            this.vlocStandby.setAttribute("state", "Selected");
            this.comStandby.setAttribute("state", "Unselected");
        }
        if (SimVar.GetSimVarValue("C:fs9gps:FlightPlanIsActiveFlightPlan", "Boolean")) {
            var distance = SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical mile");
            if (SimVar.GetSimVarValue("C:fs9gps:FlightPlanIsActiveApproach", "Boolean")) {
                this.currentMode = 3;
                this.botRadioPartMid.textContent = "APPR";
            }
            else if (SimVar.GetSimVarValue("GPS FLIGHT PLAN WP COUNT", "number") == (SimVar.GetSimVarValue("GPS FLIGHT PLAN WP INDEX", "number") + 1) && distance <= 30) {
                if (distance <= 10) {
                    this.currentMode = 3;
                    this.botRadioPartMid.textContent = "APPR";
                }
                else {
                    this.currentMode = 2;
                    this.botRadioPartMid.textContent = "TERM";
                }
            }
            else {
                this.currentMode = 1;
                this.botRadioPartMid.textContent = "ENR";
            }
        }
        else {
            this.botRadioPartMid.textContent = "ENR";
            this.currentMode = 0;
        }
        var pagesMenu = "";
        for (var i = 0; i < this.getCurrentPageGroup().pages.length; i++) {
            if (i == this.getCurrentPageGroup().pageIndex) {
                pagesMenu += '<div class="PageSelect" state="Active"></div>';
            }
            else {
                pagesMenu += '<div class="PageSelect" state="Inactive"></div>';
            }
        }
        this.pagePos.innerHTML = pagesMenu;
        this.menuTitle.textContent = this.getCurrentPageGroup().name;
        this.checkAfterDirectTo();
    }

    checkAfterDirectTo() {
        // Check if we are at the end of a directTo (less than 1nm to the destination WP)
        this._t++;
        // We arm 1 nm before the target approach directTo
        if(this._t > 20 && this.currFlightPlanManager.getIsDirectTo() && this.currFlightPlanManager.isLoadedApproach() && this.waypointDirectTo != null && SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles") < 2) {
            this._t = 0;
            // Check if the directTO is part of the approach
            let wayPointList = this.currFlightPlanManager.getApproachWaypoints();
            let index = -1;
            // We check until the wp before the last wp because we'll active the leg to next WP (not usefull if last WP)
            for (var i=0; i < wayPointList.length-1; i++) {
                if(wayPointList[i].GetInfos().icao == this.waypointDirectTo.GetInfos().icao) {
                    index = i + 1;
                    break;
                }
            }
            this.waypointDirectTo = null;
            if(index != -1) {
                // We must reactivate the approach and set the leg to index (next waypoint)
                this.currFlightPlanManager.cancelDirectTo();
                this.activateApproach(() => {
                    this.currFlightPlanManager.setActiveWaypointIndex(index);
                });
            }
        }
    }

    closeConfirmWindow() {
        if(this.confirmWindow.element.Active) {
            this.closePopUpElement();
        }
    }
    closeAlertWindow() {
        if(this.alertWindow.element.Active) {
            this.closePopUpElement();
        }
    }

    // This is to avoid the U-turn bug
    // We remove the enroute waypoints before activating approach
    // If we are after the last enroute waypoint
    activateApproach(callback = EmptyCallback.Void) {
        if(this.currFlightPlanManager.getIsDirectTo()){
            this.currFlightPlanManager.cancelDirectTo();
        }
// Removed that because if you select the approach before the last enroute wp, the distance displayed on the default nav page
// are not correct and the aircraft continues to follow the enroute WP. SO I prefer to remove enroute WP in any case when activating approach.       
//         if ((this.currFlightPlanManager.getActiveWaypointIndex() != -1) && (this.currFlightPlanManager.getActiveWaypointIndex() <= this.currFlightPlanManager.getLastIndexBeforeApproach())) {
//             Coherent.call("DEACTIVATE_APPROACH").then(() => {
// //                this.currFlightPlanManager.activateApproach();
//                 Coherent.call("ACTIVATE_APPROACH").then(() => {
//                     this.currFlightPlanManager._approachActivated = true;
//                     this.currFlightPlanManager.updateCurrentApproach();
//                 });
//             });
//         }
//         else {
        let removeWaypointForApproachMethod = (callback_here = EmptyCallback.Void) => {
            let i = 1;
            let destinationIndex = this.currFlightPlanManager.getWaypoints().findIndex(w => {
                return w.icao === this.currFlightPlanManager.getDestination().icao;
            });

            if (i < destinationIndex) {
                this.currFlightPlanManager.removeWaypoint(1, i === destinationIndex, () => {
                    //i++;
                    removeWaypointForApproachMethod(callback_here);
                });
            }
            else {
                callback_here();
            }
        };
        if(this.getConfigKey("wa_uturn_bug", true)) {
            removeWaypointForApproachMethod(() => {
                Coherent.call("ACTIVATE_APPROACH").then(() => {
                    this.currFlightPlanManager._approachActivated = true;
                    this.currFlightPlanManager.updateCurrentApproach();
                    this.setApproachFrequency();
                    callback();
                });
            });
        }
        else {
            Coherent.call("ACTIVATE_APPROACH").then(() => {
                this.currFlightPlanManager._approachActivated = true;
                this.currFlightPlanManager.updateCurrentApproach();
                this.setApproachFrequency();
                callback();
            });
        }
    }

    setApproachFrequency() {
        let approachType = SimVar.GetSimVarValue("GPS APPROACH APPROACH TYPE", "number");
        if(!approachType)
            return;
        if(approachType == 2 || approachType == 8) {
            // VOR approach
            // Try to use the last VOR frequency 
            let approachWaypoints = this.currFlightPlanManager.getApproachWaypoints();
            for(var i=approachWaypoints.length-1; i >= 0; i--)
            {
                let waypoint = approachWaypoints[i];
                if(waypoint.infos.getWaypointType() == "V" && waypoint.infos.frequencyBcd16) {
                    // Check if frequency is not already the active one
                    let currentActiveFrequency = SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + this.navIndex, "Frequency BCD16");
                    if(currentActiveFrequency != waypoint.infos.frequencyBcd16)
                        SimVar.SetSimVarValue("K:NAV" + this.navIndex + "_STBY_SET", "Frequency BCD16", waypoint.infos.frequencyBcd16);
                    break;
                }
            }
        }
        else {
            let approachFrequency = this.currFlightPlanManager.getApproachNavFrequency();
            if (!isNaN(approachFrequency)) {
                let currentActiveFrequency = SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + this.navIndex, "Hertz");
                if(currentActiveFrequency != (approachFrequency.toFixed(3) * 1000000))
                    SimVar.SetSimVarValue("K:NAV" + this.navIndex + "_STBY_SET_HZ", "hertz", approachFrequency * 1000000);
            }
        }
    }
    getDistanceToDestination() {
        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        let ll = new LatLong(lat, long);
        if(!this.currFlightPlanManager.getDestination())
            return NaN;
        return Avionics.Utils.computeDistance(ll, this.currFlightPlanManager.getDestination().infos.coordinates);
    }

    SwitchToPageName(_menu, _page, _keepicao = false) {
        if(!_keepicao) {
            this.lastRelevantICAO = null;
            this.lastRelevantICAOType = null;
        }
        if (this.overridePage) {
            this.closeOverridePage();
        }
        if (this.currentEventLinkedPageGroup) {
            this.currentEventLinkedPageGroup.pageGroup.onExit();
            this.currentEventLinkedPageGroup = null;
        }
        this.pageGroups[this.currentPageGroupIndex].onExit();
        if (this.currentContextualMenu) {
            this.SwitchToInteractionState(0);
        }
        for (let i = 0; i < this.pageGroups.length; i++) {
            if (this.pageGroups[i].name == _menu) {
                this.currentPageGroupIndex = i;
            }
        }
        this.pageGroups[this.currentPageGroupIndex].goToPage(_page, true);
    }
    longitudeFormat(_longitude) {
        var format = "";
        if (_longitude < 0) {
            format += "W";
            _longitude = Math.abs(_longitude);
        }
        else {
            format += "E";
        }
        var degrees = Math.floor(_longitude);
        var minutes = ((_longitude - degrees) * 60);
        format +=  Utils.leadingZeros(fastToFixed(degrees, 0), 3);
        format += "°";
        format +=  Utils.leadingZeros(minutes.toFixed(2), 2);
        format += "'";
        return format;
    }
    latitudeFormat(_latitude) {
        var format = "";
        if (_latitude < 0) {
            format += "S ";
            _latitude = Math.abs(_latitude);
        }
        else {
            format += "N ";
        }
        var degrees = Math.floor(_latitude);
        var minutes = ((_latitude - degrees) * 60);
        format +=  Utils.leadingZeros(fastToFixed(degrees, 0), 2);
        format += "°";
        format +=  Utils.leadingZeros(minutes.toFixed(2), 2);
        format += "'";
        return format;
    }
    getVersion() {
        return new Promise((resolve) => {
            var milliseconds = new Date().getTime().toString();
            this.loadFile("/VFS/ContentInfo/pms50-gns530/info.json" + "?id=" + milliseconds, (text) => {
                let data = JSON.parse(text);
                this.version = data.version;
                resolve();
            });
        });
    }
    loadConfig(callback) {
        return new Promise((resolve) => {
            var milliseconds = new Date().getTime().toString();
            this.loadFile("/VFS/Config/pms50-gns530/config.json" + "?id=" + milliseconds, (text) => {
                this.configData = JSON.parse(text);
                callback();
                resolve();
            });
        });
    }
    getConfigKey(_key, _default = undefined) {
        if(!this.configData || !this.configData[_key])
            return _default;
        if(this.configData[_key].toUpperCase() == "ON")
            return true;
        if(this.configData[_key].toUpperCase() == "OFF")
            return false;
        return this.configData[_key];
    }

    loadFile(file, callbackSuccess) {
        let httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function (data) {
            if (this.readyState === XMLHttpRequest.DONE) {
                let loaded = this.status === 200 || this.status === 0;
                if (loaded) {
                    callbackSuccess(this.responseText);
                }
            }
        };
        httpRequest.open("GET", file);
        httpRequest.send();
    }
    loadMetar(ident, callback) {
        if(ident.length) {
            return new Promise((resolve) => {
                var milliseconds = new Date().getTime().toString();
                var url = "https://avwx.rest/api/metar/" + ident + "?options=translate&airport=true&reporting=true&format=json&onfail=cache";
                let httpRequest = new XMLHttpRequest();
                httpRequest.open("GET", url);
                httpRequest.setRequestHeader('Authorization', this.getConfigKey("metar_avwx_token", ""));
                httpRequest.onreadystatechange = function (data) {
                    if (this.readyState === XMLHttpRequest.DONE) {
                        let loaded = this.status === 200 || this.status === 0;
                        let data = "";
                        if (loaded)
                            data = this.responseText;
                        if(callback)
                            callback(data);
                    }
                };
                httpRequest.send();
            });
        }
        else {
            if(callback)
                callback("");
        }
    }
}


// DataStore Code taken from WorkingTitle g1000 MOD
Include.addScript("/JS/dataStorage.js") // it's required, so why not load it ourselves?
/** class WTDataStore provides an interface to the lower-level storage API */
class WTDataStore {
    constructor(_gps) {
        this.gps = _gps;
    }
    /**
     * Retrieves a key from the datastore, possibly returning the default value
     * @param {string} key The name of the key to retrieve
     * @param {tsring|number|boolean} defaultValue The default value to use if the key does not exist
     * @returns {string|number|boolean} Either the stored value of the key, or the default value
     */
    get(key, defaultValue) {
        var storeKey = SimVar.GetSimVarValue("ATC MODEL", "string") + "::" + this.gps.gpsType + "::" + this.gps.navIndex + "::" + key;
        return WTDataStore.load(storeKey, defaultValue);
    }

    /**
     * Stores a key in the datastore
     * @param {string} key The name of the value to store
     * @param {string|number|boolean} The value to store
     */
    set(key, value) {
        var storeKey = SimVar.GetSimVarValue("ATC MODEL", "string") + "::" + this.gps.gpsType + "::" + this.gps.navIndex + "::" + key;
        return WTDataStore.store(storeKey, value);
    }

    static globalGet(key, defaultValue){
        var storeKey = SimVar.GetSimVarValue("ATC MODEL", "string") + "::" + "Global" + "::" + key;
        return WTDataStore.load(storeKey, defaultValue);
    }

    static globalSet(key, value){
        var storeKey = SimVar.GetSimVarValue("ATC MODEL", "string") + "::" + "Global" + "::" + key;
        return WTDataStore.store(storeKey, value);
    }

    static load(storeKey, defaultValue) {
        try {
            var stringValue = GetStoredData(storeKey);
            if (stringValue == null || stringValue == "") {
                return defaultValue;
            }
        } catch (e) {
            return defaultValue;
        }
        switch (typeof defaultValue) {
            case "string":
                return stringValue;
            case "number":
                return Number(stringValue);
            case "boolean":
                // Unfortunately, Boolean("false") is true.
                if (stringValue == "false") {
                    return false
                }
                return true;
        }
        return defaultValue;
    }
    static store(storeKey, value) {
        switch (typeof value) {
            case "string":
            case "number":
            case "boolean":
                SetStoredData(storeKey, value.toString());
        }
        return value;
    }
};

//# sourceMappingURL=BaseGPS.js.map