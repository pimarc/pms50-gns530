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
        this.weatherRadar = false;
        this.weatherRadarLegend = false;
        this.debug = false;
        this.metar_avwx_token = false;
        this.icaoFromMap = null;
        //PM Modif: Add debugging tool WebUI-DevKit (must be on the community folder)
        this.loadConfig(() => {
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
            if(this.gpsType == "530" || !this.state530)
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

            removeWaypointForApproachMethod(() => {
                    Coherent.call("ACTIVATE_APPROACH").then(() => {
                        this.currFlightPlanManager._approachActivated = true;
                        this.currFlightPlanManager.updateCurrentApproach();
                        this.setApproachFrequency();
                    });
            });
        callback();
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
                    SimVar.SetSimVarValue("K:NAV" + this.navIndex + "_STBY_SET", "Frequency BCD16", waypoint.infos.frequencyBcd16);
                    break;
                }
            }
        }
        else {
            let approachFrequency = this.currFlightPlanManager.getApproachNavFrequency();
            if (!isNaN(approachFrequency)) {
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
                let data = JSON.parse(text);
                this.weatherRadar = false;
                this.weatherRadarLegend = false;
                this.debug = false;
                if(data.weather_radar && data.weather_radar.toUpperCase() == "ON")
                    this.weatherRadar = true;
                if(data.weather_legend && data.weather_legend.toUpperCase() == "ON")
                    this.weatherRadarLegend = true;
                if(data.debug && data.debug.toUpperCase() == "ON")
                    this.debug = true
                if(data.metar_avwx_token)
                    this.metar_avwx_token = data.metar_avwx_token;

                callback();
                resolve();
            });
        });
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
                var url = "https://avwx.rest/api/metar/" + ident + "?options=info&airport=true&reporting=true&format=json&onfail=cache";
                let httpRequest = new XMLHttpRequest();
                httpRequest.open("GET", url);
                httpRequest.setRequestHeader('Authorization', this.metar_avwx_token);
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

class GPS_Map extends MapInstrumentElement {
    constructor() {
        super(...arguments);
    }
    onUpdate(_deltaTime) {
        if (this.instrumentLoaded) {
            this.instrument.update(_deltaTime);
            let range = this.instrument.getWeatherRange();
            if (this.weatherTexts) {
                let ratio = 1.0 / this.weatherTexts.length;
                for (let i = 0; i < this.weatherTexts.length; i++) {
                    this.weatherTexts[i].textContent = fastToFixed(range * ratio * (i + 1), 2);
                }
            }
            if (this.weatherAltTexts && this.weatherAltTexts.length >= 2) {
                this.weatherAltTexts[0].textContent = "+" + fastToFixed(range * 1200, 0) + "ft";
                this.weatherAltTexts[1].textContent = "-" + fastToFixed(range * 1200, 0) + "ft";
            }
        }
    }
    setWeather(_mode, _legend = true) {
        this.instrument.showWeather(_mode);
        let svgRoot = this.instrument.weatherSVG;
        if (svgRoot) {
            Utils.RemoveAllChildren(svgRoot);
            this.weatherTexts = null;
            if (_mode == EWeatherRadar.HORIZONTAL || _mode == EWeatherRadar.VERTICAL) {
                var circleRadius = 575;
                var dashNbRect = 10;
                var dashWidth = 8;
                var dashHeight = 6;
                if (_mode == EWeatherRadar.HORIZONTAL) {
                    this.instrument.setBingMapStyle("10.3%", "-13.3%", "127%", "157%");
                    var coneAngle = 90;
                    svgRoot.setAttribute("viewBox", "0 0 400 400");
                    var trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    trsGroup.setAttribute("transform", "translate(-125, 29) scale(1.63)");
                    svgRoot.appendChild(trsGroup);
                    let viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
                    viewBox.setAttribute("viewBox", "-600 -600 1200 1200");
                    trsGroup.appendChild(viewBox);
                    var circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    circleGroup.setAttribute("id", "Circles");
                    viewBox.appendChild(circleGroup);
                    {
                        let rads = [0.25, 0.50, 0.75, 1.0];
                        for (let r = 0; r < rads.length; r++) {
                            let rad = circleRadius * rads[r];
                            let startDegrees = -coneAngle * 0.5;
                            let endDegrees = coneAngle * 0.5;
                            while (Math.floor(startDegrees) <= endDegrees) {
                                let line = document.createElementNS(Avionics.SVG.NS, "rect");
                                let degree = (180 + startDegrees + 0.5);
                                line.setAttribute("x", "0");
                                line.setAttribute("y", rad.toString());
                                line.setAttribute("width", dashWidth.toString());
                                line.setAttribute("height", dashHeight.toString());
                                line.setAttribute("transform", "rotate(" + degree + " 0 0)");
                                line.setAttribute("fill", "white");
                                circleGroup.appendChild(line);
                                startDegrees += coneAngle / dashNbRect;
                            }
                        }
                    }
                    var lineGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    lineGroup.setAttribute("id", "Lines");
                    viewBox.appendChild(lineGroup);
                    {
                        var coneStart = 180 - coneAngle * 0.5;
                        var coneStartLine = document.createElementNS(Avionics.SVG.NS, "line");
                        coneStartLine.setAttribute("x1", "0");
                        coneStartLine.setAttribute("y1", "0");
                        coneStartLine.setAttribute("x2", "0");
                        coneStartLine.setAttribute("y2", circleRadius.toString());
                        coneStartLine.setAttribute("transform", "rotate(" + coneStart + " 0 0)");
                        coneStartLine.setAttribute("stroke", "white");
                        coneStartLine.setAttribute("stroke-width", "4");
                        lineGroup.appendChild(coneStartLine);
                        var coneEnd = 180 + coneAngle * 0.5;
                        var coneEndLine = document.createElementNS(Avionics.SVG.NS, "line");
                        coneEndLine.setAttribute("x1", "0");
                        coneEndLine.setAttribute("y1", "0");
                        coneEndLine.setAttribute("x2", "0");
                        coneEndLine.setAttribute("y2", circleRadius.toString());
                        coneEndLine.setAttribute("transform", "rotate(" + coneEnd + " 0 0)");
                        coneEndLine.setAttribute("stroke", "white");
                        coneEndLine.setAttribute("stroke-width", "4");
                        lineGroup.appendChild(coneEndLine);
                    }
                    var textGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    textGroup.setAttribute("id", "Texts");
                    viewBox.appendChild(textGroup);
                    {
                        this.weatherTexts = [];
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "125");
                        text.setAttribute("y", "-85");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "225");
                        text.setAttribute("y", "-185");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "325");
                        text.setAttribute("y", "-285");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "380");
                        text.setAttribute("y", "-430");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                    }
                }
                else if (_mode == EWeatherRadar.VERTICAL) {
                    this.instrument.setBingMapStyle("-75%", "-88%", "201%", "250%");
                    var coneAngle = 51.43;
                    svgRoot.setAttribute("viewBox", "0 0 400 400");
                    var trsGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    trsGroup.setAttribute("transform", "translate(402, -190) scale(1.95) rotate(90)");
                    svgRoot.appendChild(trsGroup);
                    let viewBox = document.createElementNS(Avionics.SVG.NS, "svg");
                    viewBox.setAttribute("viewBox", "-600 -600 1200 1200");
                    trsGroup.appendChild(viewBox);
                    var circleGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    circleGroup.setAttribute("id", "Circles");
                    viewBox.appendChild(circleGroup);
                    {
                        let rads = [0.25, 0.50, 0.75, 1.0];
                        for (let r = 0; r < rads.length; r++) {
                            let rad = circleRadius * rads[r];
                            let startDegrees = -coneAngle * 0.5;
                            let endDegrees = coneAngle * 0.5;
                            while (Math.floor(startDegrees) <= endDegrees) {
                                let line = document.createElementNS(Avionics.SVG.NS, "rect");
                                let degree = (180 + startDegrees + 0.5);
                                line.setAttribute("x", "0");
                                line.setAttribute("y", rad.toString());
                                line.setAttribute("width", dashWidth.toString());
                                line.setAttribute("height", dashHeight.toString());
                                line.setAttribute("transform", "rotate(" + degree + " 0 0)");
                                line.setAttribute("fill", "white");
                                circleGroup.appendChild(line);
                                startDegrees += coneAngle / dashNbRect;
                            }
                        }
                    }
                    var limitGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    limitGroup.setAttribute("id", "Limits");
                    viewBox.appendChild(limitGroup);
                    {
                        let endPosY = circleRadius + 50;
                        let posX = -130;
                        let posY = 50;
                        while (posY <= endPosY) {
                            let line = document.createElementNS(Avionics.SVG.NS, "rect");
                            line.setAttribute("x", posX.toString());
                            line.setAttribute("y", (-posY).toString());
                            line.setAttribute("width", dashHeight.toString());
                            line.setAttribute("height", dashWidth.toString());
                            line.setAttribute("fill", "white");
                            limitGroup.appendChild(line);
                            posY += dashWidth * 2;
                        }
                        posX = 130;
                        posY = 50;
                        while (posY <= endPosY) {
                            let line = document.createElementNS(Avionics.SVG.NS, "rect");
                            line.setAttribute("x", posX.toString());
                            line.setAttribute("y", (-posY).toString());
                            line.setAttribute("width", dashHeight.toString());
                            line.setAttribute("height", dashWidth.toString());
                            line.setAttribute("fill", "white");
                            limitGroup.appendChild(line);
                            posY += dashWidth * 2;
                        }
                    }
                    var lineGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    lineGroup.setAttribute("id", "Lines");
                    viewBox.appendChild(lineGroup);
                    {
                        var coneStart = 180 - coneAngle * 0.5;
                        var coneStartLine = document.createElementNS(Avionics.SVG.NS, "line");
                        coneStartLine.setAttribute("x1", "0");
                        coneStartLine.setAttribute("y1", "0");
                        coneStartLine.setAttribute("x2", "0");
                        coneStartLine.setAttribute("y2", circleRadius.toString());
                        coneStartLine.setAttribute("transform", "rotate(" + coneStart + " 0 0)");
                        coneStartLine.setAttribute("stroke", "white");
                        coneStartLine.setAttribute("stroke-width", "3");
                        lineGroup.appendChild(coneStartLine);
                        var coneEnd = 180 + coneAngle * 0.5;
                        var coneEndLine = document.createElementNS(Avionics.SVG.NS, "line");
                        coneEndLine.setAttribute("x1", "0");
                        coneEndLine.setAttribute("y1", "0");
                        coneEndLine.setAttribute("x2", "0");
                        coneEndLine.setAttribute("y2", circleRadius.toString());
                        coneEndLine.setAttribute("transform", "rotate(" + coneEnd + " 0 0)");
                        coneEndLine.setAttribute("stroke", "white");
                        coneEndLine.setAttribute("stroke-width", "3");
                        lineGroup.appendChild(coneEndLine);
                    }
                    var textGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    textGroup.setAttribute("id", "Texts");
                    viewBox.appendChild(textGroup);
                    {
                        this.weatherAltTexts = [];
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = "+60000FT";
                        text.setAttribute("x", "50");
                        text.setAttribute("y", "-140");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherAltTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = "-60000FT";
                        text.setAttribute("x", "50");
                        text.setAttribute("y", "170");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherAltTexts.push(text);
                        this.weatherTexts = [];
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "95");
                        text.setAttribute("y", "105");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "235");
                        text.setAttribute("y", "170");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "350");
                        text.setAttribute("y", "225");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.setAttribute("x", "480");
                        text.setAttribute("y", "290");
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "30");
                        text.setAttribute("transform", "rotate(-90)");
                        textGroup.appendChild(text);
                        this.weatherTexts.push(text);
                    }
                }
                if(_legend) {
                    var legendGroup = document.createElementNS(Avionics.SVG.NS, "g");
                    legendGroup.setAttribute("id", "legendGroup");
                    svgRoot.appendChild(legendGroup);
                    {
                        var x = 2;
                        var y = 330;
                        var w = 65;
                        var h = 125;
                        var titleHeight = 22;
                        var scaleOffsetX = 3;
                        var scaleOffsetY = 3;
                        var scaleWidth = 13;
                        var scaleHeight = 20;
                        var left = x - w * 0.5;
                        var top = y - h * 0.5;
                        var rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("x", left.toString());
                        rect.setAttribute("y", top.toString());
                        rect.setAttribute("width", w.toString());
                        rect.setAttribute("height", h.toString());
                        rect.setAttribute("stroke", "white");
                        rect.setAttribute("stroke-width", "2");
                        rect.setAttribute("stroke-opacity", "1");
                        legendGroup.appendChild(rect);
                        rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("x", left.toString());
                        rect.setAttribute("y", top.toString());
                        rect.setAttribute("width", w.toString());
                        rect.setAttribute("height", titleHeight.toString());
                        rect.setAttribute("stroke", "white");
                        rect.setAttribute("stroke-width", "2");
                        rect.setAttribute("stroke-opacity", "1");
                        legendGroup.appendChild(rect);
                        var text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = "SCALE";
                        text.setAttribute("x", x.toString());
                        text.setAttribute("y", (top + titleHeight * 0.7).toString());
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "13");
                        text.setAttribute("text-anchor", "middle");
                        legendGroup.appendChild(text);
                        var scaleIndex = 0;
                        rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("x", (left + scaleOffsetX).toString());
                        rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                        rect.setAttribute("width", scaleWidth.toString());
                        rect.setAttribute("height", scaleHeight.toString());
                        rect.setAttribute("fill", "magenta");
                        rect.setAttribute("stroke", "white");
                        rect.setAttribute("stroke-width", "1");
                        rect.setAttribute("stroke-opacity", "1");
                        legendGroup.appendChild(rect);
                        scaleIndex++;
                        rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("x", (left + scaleOffsetX).toString());
                        rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                        rect.setAttribute("width", scaleWidth.toString());
                        rect.setAttribute("height", scaleHeight.toString());
                        rect.setAttribute("fill", "red");
                        rect.setAttribute("stroke", "white");
                        rect.setAttribute("stroke-width", "1");
                        rect.setAttribute("stroke-opacity", "1");
                        legendGroup.appendChild(rect);
                        text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = "HEAVY";
                        text.setAttribute("x", (left + scaleOffsetX + scaleWidth + 5).toString());
                        text.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight + scaleHeight * 0.7).toString());
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "13");
                        legendGroup.appendChild(text);
                        scaleIndex++;
                        rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("x", (left + scaleOffsetX).toString());
                        rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                        rect.setAttribute("width", scaleWidth.toString());
                        rect.setAttribute("height", scaleHeight.toString());
                        rect.setAttribute("fill", "yellow");
                        rect.setAttribute("stroke", "white");
                        rect.setAttribute("stroke-width", "1");
                        rect.setAttribute("stroke-opacity", "1");
                        legendGroup.appendChild(rect);
                        scaleIndex++;
                        rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("x", (left + scaleOffsetX).toString());
                        rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                        rect.setAttribute("width", scaleWidth.toString());
                        rect.setAttribute("height", scaleHeight.toString());
                        rect.setAttribute("fill", "green");
                        rect.setAttribute("stroke", "white");
                        rect.setAttribute("stroke-width", "1");
                        rect.setAttribute("stroke-opacity", "1");
                        legendGroup.appendChild(rect);
                        text = document.createElementNS(Avionics.SVG.NS, "text");
                        text.textContent = "LIGHT";
                        text.setAttribute("x", (left + scaleOffsetX + scaleWidth + 5).toString());
                        text.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight + scaleHeight * 0.7).toString());
                        text.setAttribute("fill", "white");
                        text.setAttribute("font-size", "13");
                        legendGroup.appendChild(text);
                        scaleIndex++;
                        rect = document.createElementNS(Avionics.SVG.NS, "rect");
                        rect.setAttribute("x", (left + scaleOffsetX).toString());
                        rect.setAttribute("y", (top + titleHeight + scaleOffsetY + scaleIndex * scaleHeight).toString());
                        rect.setAttribute("width", scaleWidth.toString());
                        rect.setAttribute("height", scaleHeight.toString());
                        rect.setAttribute("fill", "black");
                        rect.setAttribute("stroke", "white");
                        rect.setAttribute("stroke-width", "1");
                        rect.setAttribute("stroke-opacity", "1");
                        legendGroup.appendChild(rect);
                    }
                }
            }
        }
    }
}

//# sourceMappingURL=BaseGPS.js.map