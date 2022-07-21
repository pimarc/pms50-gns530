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
        this.handleKeyIntercepted = (key) => {
            switch (key) {
                case 'VOR1_OBI_INC':
                case 'VOR1_OBI_DEC':
                    this.onVorObsChanged(1);
                    break;
            }
        };
    }
    connectedCallback() {
        super.connectedCallback();
        // We use our own flight plan manager
        this.currFlightPlanManager = new GPS_FlightPlanManager(this);
        this.currFlightPlan = new FlightPlan(this, this.currFlightPlanManager);
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
        this.OBSState = this.getChildById("Obs");
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
        this._tfp = 0;
        this.msg_t = 0;
        this.enableCheckAfterDirectTo = false;
        this.attemptDeleteWpLeg = 0;
        this.attemptDeleteWpProc = 0;
        this.attemptAddWp = 0;
        this.airspaceList = new GPS_NearestAirspaceList(this);
        this.configData = null;
        this.debug = false;
        this.icaoFromMap = null;
        this.dataStore = new WTDataStore(this);
        this.vsr = 0;
        this.keyListener = RegisterViewListener('JS_LISTENER_KEYEVENT', () => {
            this.setupKeyIntercepts();
            Coherent.on('keyIntercepted', this.handleKeyIntercepted);
        });
        this.loadConfig(() => {
            this.debug = this.getConfigKey("debug", false);
            // Set debug mode to datastore in order to retrieve it evrywhere from a static method
            WTDataStore.globalSet("Debug", this.debug)
        });

        // reset OBS
        let state530 = SimVar.GetSimVarValue("L:AS530_State", "number");
        if(this.gpsType == "530" || !state530)
        {
            if(SimVar.GetSimVarValue("GPS OBS ACTIVE", "boolean"))
                this.toggleOBS();
        }
    }
    setupKeyIntercepts() {
        Coherent.call('INTERCEPT_KEY_EVENT', 'VOR1_OBI_INC', 0);
        Coherent.call('INTERCEPT_KEY_EVENT', 'VOR1_OBI_DEC', 0);
    }
    onVorObsChanged(index) {
        SimVar.SetSimVarValue("K:GPS_OBS_SET", "degrees", SimVar.GetSimVarValue("NAV OBS:" + index, "degree"));
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
    Init() {
        super.Init();
        // Get channel spacing from config
        let currentSpacingMode = SimVar.GetSimVarValue("COM SPACING MODE:" + this.comIndex, "Enum");
        this.spacingMode = this.dataStore.get("ChannelSpacingMode", currentSpacingMode);
        if(this.spacingMode != currentSpacingMode)
            SimVar.SetSimVarValue("K:COM_" + this.comIndex + "_SPACING_MODE_SWITCH", "number", 0);
        // Update to storage (useful for first time)
        this.dataStore.set("ChannelSpacingMode", this.spacingMode);
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
        if (_event == "CDI_Push") {
            let cdiSource = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
            if(cdiSource == 1 || cdiSource == 2)             
                SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "number", 0);
            else {
                SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "number", 0);
                SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", this.navIndex);
            }
        }
        if (_event == "OBS_Push") {
            this.toggleOBS();
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this._tfp++;
        if (this._tfp > 30) {
            this.currFlightPlanManager.updateFlightPlan(() => {
                this.currFlightPlanManager.updateCurrentApproach();
            });
            this._tfp = 0;
        }
        // Set CDI mode (GPS or VLOC)
        let vlocSource = SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "number");
        let cdiMode = SimVar.GetSimVarValue("GPS DRIVES NAV1", "boolean") == false ? "VLOC" + (vlocSource > 0 ? vlocSource : "") : "GPS";
        diffAndSetText(this.CDIState, cdiMode);
        this.msg_t++;
        if(this.msg_t > 5)
        {
            this.msg_t = 0;
            let state530 = SimVar.GetSimVarValue("L:AS530_State", "number");
            if(!this.getConfigKey("disable_messaging", false)) {
                if(this.gpsType == "530" || !state530)
                {
                    if(this.messageList) {
                        this.messageList.onUpdate(_deltaTime);
                        if (this.messageList.hasMessages()) {
                            this.msgAlert.setAttribute("style", "visibility: visible");
							SimVar.SetSimVarValue("L:GNS530_HAVE_MESSAGE:" + this.comIndex, "bool", true);
                            if (this.messageList.hasNewMessages()) {
                                this.msgAlert.setAttribute("state", this.blinkGetState(1000, 500) ? "Blink" : "None");
                                SimVar.SetSimVarValue("L:GNS530_HAVE_NEWMESSAGE:" + this.comIndex, "bool", true);
                            }
                            else {
                                this.msgAlert.setAttribute("state", "None");
                                SimVar.SetSimVarValue("L:GNS530_HAVE_NEWMESSAGE:" + this.comIndex, "bool", false);
                            }
                        }
                        else {
                            this.msgAlert.setAttribute("style", "visibility: hidden");
                            SimVar.SetSimVarValue("L:GNS530_HAVE_NEWMESSAGE:" + this.comIndex, "bool", false);
							SimVar.SetSimVarValue("L:GNS530_HAVE_MESSAGE:" + this.comIndex, "bool", false);
                        }
                    }
                }
            }
            else {
                this.msgAlert.setAttribute("style", "visibility: hidden");
            }
        }
        this.OBSState.setAttribute("style", "visibility: " + (SimVar.GetSimVarValue("GPS OBS ACTIVE", "boolean") ? "visible" : "hidden"));
        // Update spacing mode in config if an external software changed it
        let currentSpacingMode = SimVar.GetSimVarValue("COM SPACING MODE:" + this.comIndex, "Enum");
        if(this.spacingMode != currentSpacingMode) {
            this.spacingMode = currentSpacingMode;
            this.dataStore.set("ChannelSpacingMode", this.spacingMode);
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

        // Update VSR if Vcalc used
        if(this.VnavPage)
            this.vsr = this.VnavPage.GetVsr();

        this.pagePos.innerHTML = pagesMenu;
        this.menuTitle.textContent = this.getCurrentPageGroup().name;
        let timeOfDay = SimVar.GetSimVarValue("E:TIME OF DAY", "number");
        let autoBright = (timeOfDay == 1 ? 1 : timeOfDay == 3 ? 0.1 : 0.35);
        SimVar.SetSimVarValue("L:GNS_Brightness", "number", 0.05 + 0.95 * Math.min(1, Math.max(0, autoBright)));
        this.checkAfterDirectTo();
    }
    toggleOBS() {
        SimVar.SetSimVarValue("K:GPS_OBS_SET", "degrees", SimVar.GetSimVarValue("NAV OBS:1", "degree"));
        let previousState = SimVar.GetSimVarValue("GPS OBS ACTIVE", "boolean");
        let activewaypoint = this.currFlightPlanManager.getActiveWaypoint();
        let dist = SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles");
        // This does the switch
        SimVar.SetSimVarValue("K:GPS_OBS", "number", 0);
        if(previousState) {
            // We leave the OBS so we must do a directTo to the target if target distance greater than 2nm
            // except if user waypoint because a direct To a user waypoint is not working
            // in the sim
            // Check also if the target is an airport and not the destination
            let doDirectTo = false;
            if(activewaypoint && activewaypoint.icao.length && activewaypoint.icao[0] != "U" && dist > 2)
                doDirectTo = true;
            if(doDirectTo && activewaypoint.icao[0] == "A") {
                let destination = this.currFlightPlanManager.getDestination();
                if(destination && destination.icao != activewaypoint.icao)
                    doDirectTo = false;
            }
            if(doDirectTo) {
                this.cancelDirectTo(() => {
                    this.enableCheckAfterDirectTo = true;
                    this.currFlightPlanManager.activateDirectTo(activewaypoint.GetInfos().icao);
                });
            }
        }
    }
    checkAfterDirectTo() {
        // Check if we are at the end of a directTo (less than 1nm to the destination WP)
        this._t++;
        // We arm 2 nm before the target approach directTo
        let dist = SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles");
        if(this._t > 20 && this.currFlightPlanManager.getIsDirectTo() && this.enableCheckAfterDirectTo && dist > 0 && dist < 2) {
            this._t = 0;
            this.cancelDirectTo();
        }
    }

    // This is a workaround to a SU5 bug where cancel direct to removes the entire FP if
    // there is an approach loaded and activated
    cancelDirectTo(_callback) {
        this.cancelDirectToNew(_callback);
        return;
        this.enableCheckAfterDirectTo = false;
        if(!this.currFlightPlanManager.getIsDirectTo()) {
            if(_callback)
                _callback();
            return;
        }
        if(this.currFlightPlanManager.isLoadedApproach()) {
            // Check if the directTO is part of the approach (bug that removes the FP)
            // and if the approach was active when doing the directTo (this.enableCheckAfterDirectTo true)
            let index = -1;
            let target = this.currFlightPlanManager.getDirectToTarget();
            let wayPointList = this.currFlightPlanManager.getApproachWaypoints();
            // We check until the wp before the last wp because we'll active the leg to next WP (not usefull if last WP)
            for (var i=0; i < wayPointList.length-1; i++) {
                if(target && wayPointList[i].icao == target.GetInfos().icao) {
                    index = i;
                    if(SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles") < 2)
                        index++;
                    break;
                }
            }
            let targetApproachWaypointIcao = index >= 0 ? wayPointList[index].icao : "";
            // If the target is the first one we don't reactivate the approach
            // because we are at more than 2nm from it
            if(index == 0)
                targetApproachWaypointIcao = "";
            let approachIndex = this.currFlightPlanManager.getApproachIndex();
            let approachTransitionIndex = this.currFlightPlanManager.getApproachTransitionIndex();
            Coherent.call("SET_APPROACH_INDEX", -1).then(() => {
                Coherent.call("SET_APPROACH_TRANSITION_INDEX", 0).then(() => {
                    Coherent.call("CANCEL_DIRECT_TO").then(() => {
                        Coherent.call("SET_APPROACH_INDEX", approachIndex).then(() => {
                            if(approachTransitionIndex >= 0) {
                                Coherent.call("SET_APPROACH_TRANSITION_INDEX", approachTransitionIndex).then(() => {
                                    this.currFlightPlanManager.updateFlightPlan(() => {
                                        this.currFlightPlanManager.updateCurrentApproach(() => {
                                            // We must reactivate the approach and set the leg to target (next waypoint)
                                            if(targetApproachWaypointIcao.length) {
                                                this.activateApproach(() => {
                                                    this.currFlightPlanManager.updateCurrentApproach(() => {
                                                        let targetIndex = this.currFlightPlanManager.getApproachWaypoints().findIndex(w => { return w.infos && w.infos.icao === targetApproachWaypointIcao; });
                                                        if(targetIndex >=0)
                                                            this.currFlightPlanManager.setActiveWaypointIndex(targetIndex);
                                                        if(_callback)
                                                            _callback();
                                                    });
                                                });
                                            }
                                            else {
                                                if(_callback)
                                                    _callback();
                                            }
                                        });
                                    });
                                });
                            }
                        });
                    });
                });
            });
        }
        else {
            // Stil a bug here if the flight plan has only origin and destination or less
            let wayPointList = this.currFlightPlanManager.getWaypoints();
            let origin = this.currFlightPlanManager.getOrigin();
            let destination = this.currFlightPlanManager.getDestination();
            let to_restore = false;
            let navmode = 0;
            if(SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "boolean"))
                navmode = 1;
            if(SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean"))
                navmode = 2;
            if(wayPointList.length <= 2) {
                if(wayPointList.length == 1)
                    destination = null;
                if(wayPointList.length == 0)
                    origin = null;
                to_restore = true;
                if(origin && origin.ident == "USER") {
                    origin = null;
                    destination = null;
                }
                if(origin == null)
                    destination = null;
            }
            let finalize = (_navmode, _callback) => {
                if(_navmode == 1) {
                    SimVar.SetSimVarValue("L:AP_LNAV_ACTIVE", "number", 1);
                    SimVar.SetSimVarValue("K:AP_NAV1_HOLD_ON", "number", 1);
                }
                this.currFlightPlanManager.updateFlightPlan(_callback);
                // if(_callback)
                //     _callback();
            };
            Coherent.call("CANCEL_DIRECT_TO").then(() => {
                if(to_restore) {
                    Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN").then(() => {
                        if(origin) {
                            Coherent.call("SET_ORIGIN", origin.icao, false).then(() => {
                                if(destination) {
                                    Coherent.call("SET_DESTINATION", destination.icao, false).then(() => {
                                        finalize(navmode, _callback)
                                    });
                                }
                                else {
                                    finalize(navmode, _callback)
                                }
                            });
                        }
                        else
                            finalize(navmode, _callback)
                    });
                }
                else {
                    finalize(navmode, _callback)
                }
            });
        }
    }
    // This function contains a workaround to a SU5 bug where cancel direct to removes the entire FP if
    // there is an approach loaded and activated so we must remove it and reload it
    cancelDirectToNew(_callback = EmptyCallback.Void) {
        this.enableCheckAfterDirectTo = false;
        if(!this.currFlightPlanManager.getIsDirectTo()) {
            _callback();
            return;
        }

        let target = this.currFlightPlanManager.getDirectToTarget();

        // Check for eventually restoring FP
        // Bug if the flight plan has only origin and destination or less
        // Then the sim removes all
        let wayPointList = this.currFlightPlanManager.getWaypoints();
        let origin = this.currFlightPlanManager.getOrigin();
        let destination = this.currFlightPlanManager.getDestination();
        let approachIndex = this.currFlightPlanManager.getApproachIndex();
        let approachTransitionIndex = this.currFlightPlanManager.getApproachTransitionIndex();
        let to_restore = false;

        // Get autopilote modes since thes may be lost
        let AutoPilotNav = SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "number");
        let AutoPilotAlt = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "number");
        let AutoPilotApproach = SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "number");

        if(wayPointList.length <= 2 || (wayPointList.length == 3 && target.icao == "U FPIS DRCT")) {
            if(wayPointList.length == 1)
                destination = null;
            if(wayPointList.length == 0)
                origin = null;
            to_restore = true;
            if(origin && origin.ident == "USER") {
                origin = null;
                destination = null;
            }
            if(origin == null)
                destination = null;
            if(target.icao == "U FPIS DRCT")
                destination = null;
        }

        let doRestore = (_callbackRestore = EmptyCallback.Void) => {
            if(to_restore) {
                Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN").then(() => {
                    if(origin) {
                        Coherent.call("SET_ORIGIN", origin.icao, false).then(() => {
                            if(destination) {
                                Coherent.call("SET_DESTINATION", destination.icao, false).then(() => {
                                    if(approachIndex >= 0) {
                                        Coherent.call("SET_APPROACH_INDEX", approachIndex).then(() => {
                                            Coherent.call("SET_APPROACH_TRANSITION_INDEX", approachTransitionIndex).then(() => {
                                                _callbackRestore();
                                            });
                                        });
                                    }
                                    else {
                                        _callbackRestore();
                                    }
                                });
                            }
                            else {
                                _callbackRestore();
                            }
                        });
                    }
                    else
                    _callbackRestore();
                });
            }
            else {
                _callbackRestore();
            }
        };


        if(this.currFlightPlanManager.isLoadedApproach() && this.currFlightPlanManager.getApproachIndex() >= 0) {
            // Check if the directTO is part of the approach
            // If yes we will activate the approach and set the active leg to the next wp
            let index = -1;
            let approachWaypoints = this.currFlightPlanManager.getApproachWaypoints();
            // We check until the wp before the last wp because we'll activate the leg to next WP (not usefull if last WP)
            for (var i=0; i < approachWaypoints.length-1; i++) {
                if(target && approachWaypoints[i].icao == target.GetInfos().icao) {
                    index = i;
                    break;
                }
            }
            // If the target is the first one we don't reactivate the approach
            // if we are at more than 2nm from it
            if(index == 0 && SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles") >= 2)
                index = -1;
            // We activate the next leg if the distance is less than 2nm
            if(index >= 0 && SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles") < 2)
                index++;
            let targetApproachWaypointIcao = index >= 0 ? approachWaypoints[index].icao : "";
            this.currFlightPlanManager.cancelDirectTo(() => {
                // We must reactivate the approach and set the leg to target (next waypoint)
                doRestore(() => {
                    if(AutoPilotNav && !SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "number")) {
                        SimVar.SetSimVarValue("K:AP_LNAV_ACTIVE", "number", 1);
                        SimVar.SetSimVarValue("K:AP_NAV1_HOLD_ON", "number", 1);
                    }
                    if(AutoPilotApproach && !SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "number"))
                        SimVar.SetSimVarValue("K:AP_APR_HOLD", "number", 1);
                    if(AutoPilotAlt && !SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "number")) {
                        SimVar.SetSimVarValue("K:AP_ALT_HOLD_ON", "number", 1);
                    }
                    this.currFlightPlanManager.updateFlightPlan(() => {
                        this.currFlightPlanManager.updateCurrentApproach(() => {
                            if(index >= 0) {
                                this.currFlightPlanManager.activateApproach(() => {
                                    setTimeout(() => {
                                        let approachWaypoints = this.currFlightPlanManager.getApproachWaypoints();
                                        let targetIndex = approachWaypoints.findIndex(w => { return w.infos && w.infos.icao === targetApproachWaypointIcao; });
                                        if(targetIndex == -1 && approachWaypoints.length) {
                                            // Probably a user wp is the target leg so we use the index value
                                            targetIndex = index + 1;
                                        }
                                        if(targetIndex >=0 && index < approachWaypoints.length)
                                            this.currFlightPlanManager.setActiveWaypointIndex(targetIndex);
                                        _callback();
                                    }, 1000);
                                });
                            }
                            else {
                                _callback();
                            }
                        });
                    });
                });
           });
        }
        else {
            this.currFlightPlanManager.cancelDirectTo(() => {
                doRestore(() => {
                    if(AutoPilotNav && !SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "number")) {
                        SimVar.SetSimVarValue("K:AP_LNAV_ACTIVE", "number", 1);
                        SimVar.SetSimVarValue("K:AP_NAV1_HOLD_ON", "number", 1);
                    }
                    if(AutoPilotApproach && !SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "number"))
                        SimVar.SetSimVarValue("K:AP_APR_HOLD", "number", 1);
                    if(AutoPilotAlt && !SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "number")) {
                        SimVar.SetSimVarValue("K:AP_ALT_HOLD_ON", "number", 1);
                    }
                    this.currFlightPlanManager.updateFlightPlan(() => {
                        this.currFlightPlanManager.updateCurrentApproach(_callback);
                    });
                });
            });
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
        this.activateApproachNew();
        return;
        if(this.currFlightPlanManager.isActiveApproach()) {
            callback();
            return;
        }
        let approachIndex = this.currFlightPlanManager.getApproachIndex();
        let approachTransitionIndex = this.currFlightPlanManager.getApproachTransitionIndex();
        if(approachIndex < 0) {
            callback();
            return;
        }
        this.cancelDirectTo(() => {
            // Removed that because if you select the approach before the last enroute wp, the distance displayed on the default nav page
// are not correct and the aircraft continues to follow the enroute WP. SO I prefer to remove enroute WP in any case when activating approach.       
//         if ((this.currFlightPlanManager.getActiveWaypointIndex() != -1) && (this.currFlightPlanManager.getActiveWaypointIndex() <= this.currFlightPlanManager.getLastIndexBeforeApproach())) {
//             Coherent.call("DEACTIVATE_APPROACH").then(() => {
// //                this.currFlightPlanManager.activateApproach();
//                 Coherent.call("ACTIVATE_APPROACH").then(() => {
//                     this.currFlightPlanManager.updateCurrentApproach();
//                 });
//             });
//         }
//         else {
            let removeWaypointForApproachMethod = (callback_here = EmptyCallback.Void) => {
                let i = 1;
                let destinationIndex = this.currFlightPlanManager.getWaypoints().findIndex(w => {
                    return w.icao === (this.currFlightPlanManager.getDestination() ? this.currFlightPlanManager.getDestination().icao : undefined);
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
            if(this.getConfigKey("wa_uturn_bug", false)) {
                this.currFlightPlanManager.setApproachIndex(-1, () => {
                    this.currFlightPlanManager.removeArrival(() => {
                        this.currFlightPlanManager.removeDeparture(() => {
                            removeWaypointForApproachMethod(() => {
                                Coherent.call("SET_APPROACH_INDEX", approachIndex).then(() => {
                                    Coherent.call("SET_APPROACH_TRANSITION_INDEX", approachTransitionIndex).then(() => {
                                        Coherent.call("ACTIVATE_APPROACH").then(() => {
                                            SimVar.SetSimVarValue("L:FLIGHT_PLAN_MANAGER_APPROACH_ACTIVATED", "boolean", true);
                                            this.currFlightPlanManager.setActiveWaypointIndex(1);
                                            this.currFlightPlanManager.updateFlightPlan(() => {
                                                this.currFlightPlanManager.updateCurrentApproach(() => {
                                                    setTimeout(() => {
                                                        this.setApproachFrequency();
                                                    }, 2000);
                                                    callback();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
            else {
                Coherent.call("ACTIVATE_APPROACH").then(() => {
                    SimVar.SetSimVarValue("L:FLIGHT_PLAN_MANAGER_APPROACH_ACTIVATED", "boolean", true);
                    this.currFlightPlanManager.updateFlightPlan(() => {
                        this.currFlightPlanManager.updateCurrentApproach(() => {
                            setTimeout(() => {
                                this.setApproachFrequency();
                            }, 2000);
                            callback();
                        });
                    });
                });
            }
        });
    }
    activateApproachNew(callback = EmptyCallback.Void) {
        if(this.currFlightPlanManager.getApproachIndex() < 0) {
            callback();
            return;
        }
        // Activating an approach is just a direct TO
        // The checkafterdirectto function will really activate the approach
        this.currFlightPlanManager.deactivateApproach(() => {
            setTimeout(() => {
                let firstApproachIcao = this.currFlightPlanManager.getApproachWaypoints()[0].icao;
                this.currFlightPlanManager.activateDirectTo(firstApproachIcao, () => {
                    this.enableCheckAfterDirectTo = true;
                    callback();
                });
            }, 2000);
        });
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
    // Laurin traffic implementation https://github.com/laurinius/MSFSTrafficService
    // See also SvgAirplaneElement.js
    checkLaurinServer() {
        let httpRequest = new XMLHttpRequest();
        httpRequest.timeout = 1000;
        httpRequest.onload = function() {
            try {
                arr = JSON.parse(this.responseText);
            } catch (e) {}
            SimVar.SetSimVarValue("L:GNS530_USE_TRAFFIC_LAURIN", "bool", this.responseText == "true");
        };
        httpRequest.ontimeout = function() {
            SimVar.SetSimVarValue("L:GNS530_USE_TRAFFIC_LAURIN", "bool", false);
        };
        httpRequest.open("GET", "http://localhost:8383/ready");
        httpRequest.send(null);
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