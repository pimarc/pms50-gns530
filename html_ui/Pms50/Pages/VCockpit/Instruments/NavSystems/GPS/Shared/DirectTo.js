class GPS_DirectTo extends NavSystemElement {
    constructor() {
        super();
        this.name = "DRCT";
        this.menuname = "";
    }
    init() {
        this.icao = this.gps.getChildById("DRCTIcao");
        this.airportPrivateLogo = this.gps.getChildById("DRCTAirportPrivateLogoImg");
        this.region = this.gps.getChildById("DRCTRegion");
        this.facilityName = this.gps.getChildById("DRCTFacilityName");
        this.city = this.gps.getChildById("DRCTCity");
        this.fpl = this.gps.getChildById("DRCTFpl");
        this.nrst = this.gps.getChildById("DRCTNrst");
        this.posNS = this.gps.getChildById("DRCTPosNS");
        this.posEW = this.gps.getChildById("DRCTPosEW");
        this.crs = this.gps.getChildById("DRCTCrs");
        this.activate = this.gps.getChildById("DRCTActivate");
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.icao], this.gps, 'WANV');
        this.icaoSearchField.init();
        this.currentFPLWpSelected = 0;
        this.geoCalc = new GeoCalcInfo(this.gps);
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Cancel&nbsp;DirectTo&nbsp;?", this.cancelDirectTo.bind(this), this.DirectToCheck.bind(this))
        ]);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.icao, this.searchField_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.fpl, this.flightPlan_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.activate, this.activateButton_SelectionCallback.bind(this))
        ];
        this.duplicateWaypoints = new NavSystemElementContainer("Duplicate Waypoints", "DuplicateWaypointWindow", new MFD_DuplicateWaypoint());
        this.duplicateWaypoints.setGPS(this.gps);
        this.duplicateWaypoints.element.icaoSearchField = this.icaoSearchField;
        this.initialUpdate = true;
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.currentFPLWpSelected = 0;
        this.gps.currFlightPlan.FillWithCurrentFP();
        if (this.gps.lastRelevantICAO) {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
        }
        else if (this.gps.icaoFromMap) {
            this.icaoSearchField.SetWaypoint(this.gps.icaoFromMap[0], this.gps.icaoFromMap);
        }
        else if(this.gps.currFlightPlanManager.getIsDirectTo() && this.gps.currFlightPlanManager.getDirectToTarget()) {
            var infos = this.gps.currFlightPlanManager.getDirectToTarget().GetInfos();
            if(infos)
                this.icaoSearchField.SetWaypoint(infos.getWaypointType(), infos.icao);
        }
    }
    onUpdate(_deltaTime) {
        if(this.initialUpdate){
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 0;
            this.initialUpdate = false;
        }
        var infos = this.icaoSearchField.getWaypoint() ? this.icaoSearchField.getWaypoint().infos : new WayPointInfo(this.gps);
        if (infos && infos.icao != '') {
            this.icao.textContent = infos.icao;
            var logo = infos.imageFileName();
            if (logo != "") {
                diffAndSetAttribute(this.airportPrivateLogo, "src", "/Pages/VCockpit/Instruments/Shared/Map/Images/" + logo);
            }
            else {
                diffAndSetAttribute(this.airportPrivateLogo, "src", "");
            }
            this.region.textContent = infos.region;
            this.facilityName.textContent = infos.name;
            this.city.textContent = infos.city;
            this.posNS.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            this.posEW.textContent = this.gps.longitudeFormat(infos.coordinates.long);
            this.geoCalc.SetParams(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"), infos.coordinates.lat, infos.coordinates.long, true);
            this.geoCalc.Compute(function () {
                if (this.drctCrs) {
                    this.drctCrs.textContent = fastToFixed(this.geoCalc.bearing, 0);
                }
            }.bind(this));
        }
        else {
            this.icao.textContent = "_____";
            diffAndSetAttribute(this.airportPrivateLogo, "src", "");
            this.region.textContent = "__________";
            this.facilityName.textContent = "______________________";
            this.city.textContent = "______________________";
            this.posNS.textContent = "_ __°__.__'";
            this.posEW.textContent = "____°__.__'";
            this.crs.textContent = "___";
        }
        this.icaoSearchField.Update();
        if (this.currentFPLWpSelected < this.gps.currFlightPlan.wayPoints.length) {
            this.fpl.textContent = this.gps.currFlightPlan.wayPoints[this.currentFPLWpSelected].GetInfos().ident;
        }
    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.initialUpdate = true;
    }
    onEvent(_event) {
        if (_event == "CLR_Push") {
            this.gps.ActiveSelection(this.defaultSelectables);
            if(this.icaoSearchField.isActive){
                this.icaoSearchField.isActive = false;
                this.gps.SwitchToInteractionState(1);
                this.gps.cursorIndex = 0;
            }
            else {
                if (this.gps.popUpElement || this.gps.currentContextualMenu) {
                    this.gps.closePopUpElement();
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 0;
                    if(this.menuname == "fpl"){
                        this.gps.cursorIndex = 1;
                    }
                    if(this.menuname == "search"){
                        this.gps.cursorIndex = 2;
                    }
                    this.menuname = "";
                    this.gps.currentContextualMenu = null;
                }
                else {
                    this.menuname = "";
                    this.gps.SwitchToInteractionState(0);
                    this.gps.leaveEventPage();
                }
            }
        }
        if (_event == "ENT_Push") {
            if((this.gps.currentInteractionState == 0) && (this.gps.cursorIndex == 0) && (this.icaoSearchField.getWaypoint().infos.icao != '')){
                this.gps.cursorIndex = 2;
                this.gps.SwitchToInteractionState(1);
            }
        }
        if (_event == "NavigationPush") {
            // Stay in selection state
            this.gps.requestCall(() => {
                this.gps.ActiveSelection(this.defaultSelectables);
                this.gps.SwitchToInteractionState(1);
                this.gps.cursorIndex = 0;
            });
        }
    }
    searchField_SelectionCallback(_event) {
        if (_event == "ENT_Push") {
            let infos = this.icaoSearchField.getWaypoint() ? this.icaoSearchField.getWaypoint().infos : new WayPointInfo(this.gps);
            if(infos && infos.icao != ''){
                this.gps.lastRelevantICAO = infos.icao;
            }
            if (this.gps.lastRelevantICAO && infos && infos.icao != '') {
                this.icaoSearchField.getWaypoint().SetICAO(this.gps.lastRelevantICAO);
                this.gps.ActiveSelection(this.defaultSelectables);
                this.gps.cursorIndex = 2;
                this.menuname = ""
            }
        }
        if (_event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            let infos = this.icaoSearchField.getWaypoint() ? this.icaoSearchField.getWaypoint().infos : new WayPointInfo(this.gps);
            if (infos && infos.icao != '') {
                this.gps.lastRelevantICAO = infos.icao;
            }
            var entryType = -1;
            if(_event == "RightSmallKnob_Left")
                entryType = 1;
            this.icaoSearchField.StartSearch(this.onSearchEnd.bind(this), entryType);
            this.gps.SwitchToInteractionState(3);
            this.menuname = "search";
        }
    }
    onSearchEnd() {
        if (this.icaoSearchField.duplicates.length > 0) {
            this.gps.switchToPopUpPage(this.duplicateWaypoints, () => {
                if(this.gps.lastRelevantICAO) {
                    this.icaoSearchField.getWaypoint().SetICAO(this.gps.lastRelevantICAO);
                    this.gps.ActiveSelection(this.defaultSelectables);
                    this.gps.cursorIndex = 2;
                    this.menuname = ""
                }
            });
        }
        else {
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 2;
            this.menuname = ""
        }
    }
    flightPlan_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var elements = [];
            var i = 0;
            var wayPointList = this.gps.currFlightPlan.wayPoints;
            wayPointList = wayPointList.concat(this.gps.currFlightPlanManager.getApproachWaypoints());
            for (; i < wayPointList.length; i++) {
                // We add only valid waypoints (not the ones of "user" type)
                if(wayPointList[i].icao.substr(0,2) != 'U '){
                    elements.push(new ContextualMenuElement(wayPointList[i].GetInfos().ident, function (_index) {
                        this.currentFPLWpSelected = _index;
                        this.icaoSearchField.SetWaypoint(wayPointList[_index].type, wayPointList[_index].GetInfos().icao);
                        this.gps.SwitchToInteractionState(1);
                        this.gps.cursorIndex = 2;
                    }.bind(this, i)));
                }
            }
            if (this.gps.currFlightPlan.wayPoints.length > 0) {
                this.gps.ShowContextualMenu(new ContextualMenu("FPL", elements));
                this.menuname = "fpl";
            }
        }
    }
    activateButton_SelectionCallback(_event) {
        if (_event == "ENT_Push") {

            // DirecTO bug correction when direct to an airport
            // FS2020 removes the origin airport (first flight plan index)
            // The direct then works but its not possible any more to select an approach for the new destination airport
            // The correction consists of re-inserting the origin airport at the start of the flight plan
            let waypoint_origin = this.gps.currFlightPlanManager.getWaypoint(0);
            if(this.gps.currFlightPlanManager.isActiveApproach())
            {
                // Check if WP is part of approach
                this.gps.waypointDirectTo = null;
                let wayPointList = this.gps.currFlightPlanManager.getApproachWaypoints();
                for (var i=0; i < wayPointList.length; i++) {
                    if(wayPointList[i].GetInfos().icao == this.icaoSearchField.getWaypoint().GetInfos().icao) {
                        this.gps.waypointDirectTo = this.icaoSearchField.getWaypoint();
                        break;
                    }
                }
            }
            this.gps.currFlightPlanManager.activateDirectTo(this.icaoSearchField.getWaypoint().infos.icao, () => {
                if(waypoint_origin && this.icaoSearchField.getWaypoint().infos instanceof AirportInfo){
                    this.gps.currFlightPlanManager.addWaypoint(waypoint_origin.icao, 0);
                }
                this.gps.SwitchToInteractionState(0);
                this.gps.leaveEventPage();
            });
        }
    }
    DirectToCheck() {
        return !this.gps.currFlightPlanManager.getIsDirectTo();
    }
    cancelDirectTo(){
        this.gps.confirmWindow.element.setTexts("Confirm cancel direct to ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if (this.gps.confirmWindow.element.Result == 1) {
                // Remove any directTo before activating leg
                if(this.gps.currFlightPlanManager.getIsDirectTo()){
                    this.gps.cancelDirectTo();
                    this.gps.SwitchToInteractionState(0);
                    this.gps.leaveEventPage();
                }
            }
        });
    }
}
