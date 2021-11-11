class GPS_FlightPlanManager extends FlightPlanManager {
    constructor(_instrument) {
        super(_instrument);
    }
    // Bugfix in SU6 where the active waypoint is always changing
    update(_deltaTime) {
        if (!this._isRegistered) {
            return;
        }
        engine.beginProfileEvent("FlightPlan::doUpdate");
        this._planeCoordinates.lat = Simplane.getCurrentLat();
        this._planeCoordinates.long = Simplane.getCurrentLon();
        this._activeWaypointHasChanged = false;
        let activeWaypointIdent = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
        if (this._gpsActiveWaypointIdent != activeWaypointIdent) {
            this._activeWaypointHasChanged = true;
            this._gpsActiveWaypointIdent = activeWaypointIdent;
        }
        let gpsActiveWaypointIndex = this.computeActiveWaypointIndex();
        if (this._gpsActiveWaypointIndex != gpsActiveWaypointIndex) {
            this._activeWaypointHasChanged = true;
            this._gpsActiveWaypointIndex = gpsActiveWaypointIndex;
        }
        let prevWaypoint = this.getPreviousActiveWaypoint();
        if (prevWaypoint) {
            if (isFinite(this._planeCoordinates.lat) && isFinite(this._planeCoordinates.long)) {
                let dist = Avionics.Utils.computeGreatCircleDistance(this._planeCoordinates, prevWaypoint.infos.coordinates);
                if (isFinite(dist)) {
                    if (this._activeWaypointHasChanged) {
                        this._isGoingTowardPreviousActiveWaypoint = true;
                        this._lastDistanceToPreviousActiveWaypoint = dist;
                    }
                    else if (this._isGoingTowardPreviousActiveWaypoint) {
                        if (dist <= this._lastDistanceToPreviousActiveWaypoint) {
                            this._lastDistanceToPreviousActiveWaypoint = dist;
                        }
                        // SU6 removed the +0.1
                        else if (dist > this._lastDistanceToPreviousActiveWaypoint + 0.1) {
                            this._isGoingTowardPreviousActiveWaypoint = false;
                            this._lastDistanceToPreviousActiveWaypoint = dist;
                        }
                    }
                    else if (!this._isGoingTowardPreviousActiveWaypoint) {
                        if (dist >= this._lastDistanceToPreviousActiveWaypoint) {
                            this._lastDistanceToPreviousActiveWaypoint = dist;
                        }
                        // SU6 removed the -0.1
                        else if (dist < this._lastDistanceToPreviousActiveWaypoint - 0.1) {
                            this._isGoingTowardPreviousActiveWaypoint = true;
                            this._lastDistanceToPreviousActiveWaypoint = dist;
                        }
                    }
                }
            }
        }
        engine.endProfileEvent();
    }
    getActiveWaypoint(useCorrection = false) {
        if (this.getIsDirectTo()) {
            // We change that from the original because of a bug when we have flight plan with 2 WP or less
            // The direct to target is then empty (empty icao)
            let waypoint = this.getDirectToTarget();
            if(waypoint && waypoint.icao.length && waypoint.icao != "U FPIS DRCT")
                return waypoint;
        }
        if (useCorrection && this._isGoingTowardPreviousActiveWaypoint) {
            return this.getPreviousActiveWaypoint();
        }
        if (!this.isActiveApproach()) {
            let index = this.getActiveWaypointIndex();
            let waypoint = this.getWaypoints()[index];
            if (waypoint) {
                return waypoint;
            }
        }
        let ident = this.getActiveWaypointIdent();
        if (this.isActiveApproach()) {
            let waypoint = this.getApproachWaypoints().find(w => { return (w && w.ident === ident); });
            return waypoint;
        }
        let waypoint = this.getWaypoints().find(w => { return (w && w.ident === ident); });
        if (!waypoint) {
            if (!this.isActiveApproach()) {
                if (this.getLastIndexBeforeApproach() >= 0)
                    waypoint = this.getWaypoints()[this.getLastIndexBeforeApproach() + 1];
                else
                    waypoint = this.getWaypoints()[this.getWaypointsCount() - 1];
            }
            else {
                waypoint = this.getApproachWaypoints().find(w => { return (w && w.ident === ident); });
            }
        }
        if (!waypoint && this._directToTarget && ident != "" && ident === this._directToTarget.ident) {
            waypoint = this._directToTarget;
        }
        return waypoint;
    }
    // Changing approach index removes any current direct TO so we must enable it again
    setApproachIndex(index, callback = () => { }, transition = 0, reactivateDirectTo = true) {
        let directToTarget = this.getIsDirectTo() ? this.getDirectToTarget() : null;
        let currentIndex = this.getActiveWaypointIndex();
        super.setApproachIndex(index, () => {
            // Restore direct To if necessary
            if(directToTarget && directToTarget.icao.length) {
                setTimeout(() => {
                    this.activateDirectTo(directToTarget.icao, () => {callback()});
                }, 500);
            }
            else if(!this.isActiveApproach() && currentIndex > 0) {
                let currentIndexNew = this.getActiveWaypointIndex();
                if(currentIndexNew != currentIndex) {
                    this.setActiveWaypointIndex(currentIndex, () => {
                        callback();
                    });
                }
                else
                    callback();
            }
            else
                callback();
        }, transition);
    }
    // Seams buggy in SU6 so we do it ourself
    getLastIndexBeforeApproach() {
        if(!this.isLoadedApproach() || this.isActiveApproach())
            return -1;
        return this.getWaypointsCount() > 1 ? this.getWaypointsCount()-2 : -1;
    }

    // Check if the direct To is part of approach
    isDirectToInApproach() {
        if(!this.getIsDirectTo() || !this.isLoadedApproach()) {
            return false;
        }
        let index = -1;
        let target = this.getDirectToTarget();
        let wayPointList = this.getApproachWaypoints();
        // We check until the wp before the last wp because we'll active the leg to next WP (not usefull if last WP)
        for (var i=0; i < wayPointList.length-1; i++) {
            if(target && wayPointList[i].icao == target.GetInfos().icao) {
                index = i;
                break;
            }
        }
        return index >= 0;
    }
    deactivateApproach(_callback = null) {
        if(this.isActiveApproach()) {
            Coherent.call("DEACTIVATE_APPROACH").then(() => {
                this.updateCurrentApproach(() => {
                    if (_callback)
                    _callback();
                });
            });
        }
        else {
            if (_callback)
            _callback();
        }
    }
}

class GPS_WaypointLine extends MFD_WaypointLine {
    getString() {
        this.emptyLine = '<td class="SelectableElement Select0">_____</td><td>___<div class="Align unit">&nbsp;o<br>&nbsp;M</div></td><td>__._<div class="Align unit">&nbsp;n<br>&nbsp;m</div></td><td>__._<div class="Align unit">&nbsp;n<br>&nbsp;m</div></td>';
        if (this.waypoint) {
            let infos = this.waypoint.GetInfos();
            if(infos && infos.ident) {
                return '<td class="SelectableElement Select0">' + (infos.ident != "" ? infos.ident.slice(0, 8) : this.waypoint.ident.slice(0, 8)) + '</td><td>'
                + this.getDtk() + '<div class="Align unit">&nbsp;o<br>&nbsp;M</div>' + '</td><td>'
                + this.getDistance() + '<div class="Align unit">&nbsp;n<br>&nbsp;m</div></td><td>'
                + this.getCumDistance() + '<div class="Align unit">&nbsp;n<br>&nbsp;m</div>' + '</td>';
            }
            else if (this.element.emptyLine != "")
                return this.element.emptyLine;
            else
                return this.emptyLine;
        }
        else if (this.element && this.element.emptyLine != "") {
            return this.element.emptyLine;
        }
        else {
            return this.emptyLine;
        }
    }
    onEvent(_subIndex, _event) {
        if (this.element.gps.popUpElement == null) {
            switch (_event) {
                case "MENU_Push":
                    this.element.selectedLine = this;
                    break;
                case "ActivateWaypoint":
                    SimVar.SetSimVarValue("C:fs9gps:FlightPlanActiveWaypoint", "number", this.index);
                    break;
                case "ENT_Push":
                    if(this.waypoint) {
                        switch (this.waypoint.icao[0]) {
                            case "A":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "A";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "AirportLocation", true);
                                break;
                            case "V":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "V";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "VOR", true);
                                break;
                            case "N":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "N";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "NDB", true);
                                break;
                            case "W":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "W";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "Intersection", true);
                                break;
                        }
                    }
                    break;
                case "NavigationSmallInc":
                case "NavigationSmallDec":
                    if(this.element.savedFpl.canAdd(this.index)) {
                        this.element.gps.switchToPopUpPage(this.element.waypointWindow, this.element.onWaypointSelectionEnd.bind(this.element));
                        this.element.selectedIndex = this.index;
                        break;
                    }
                    return true;
                case "CLR":
                case "CLR_Push":
// PM Modif: Prevent removing a waypoint after a clear on waypoint window
// And discard removing first waypoint
                    if(!this.waypoint)
                        break;
                    if(!this.element.waypointWindow.element || (this.element.waypointWindow.element.preventRemove == false)) {
                        if(this.index >= 0) {
                            var curIndex  = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                            var gsr = fastToFixed(SimVar.GetSimVarValue("SURFACE RELATIVE GROUND SPEED", "knots"), 0);
                            // Do not remove current leg if aircraft is moving and in nav or approach mode
                            let navmode = 0;
                            if(SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "boolean"))
                                navmode = 1;
                            if(SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean"))
                                navmode = 2;
                            if(gsr > 0 && navmode && (this.index == curIndex || ((this.index + 1) == curIndex))) {
                                // Cannot remove the current leg waypoints
                                // Set a message for 20 seconds
                                this.element.gps.attemptDeleteWpLeg++;
                                setTimeout(() => {
                                    this.element.gps.attemptDeleteWpLeg--;
                                    if(this.element.gps.attemptDeleteWpLeg < 0)
                                        this.element.gps.attemptDeleteWpLeg = 0;
                                }, 20000);
                                this.element.gps.SwitchToInteractionState(1);
                            }
                            else {
                                // Check if this is a enroute waypoint
                                let firstIndex = this.element.gps.currFlightPlanManager.getDepartureWaypointsCount()+1;
                                let lastIndex = firstIndex + this.element.gps.currFlightPlanManager.getEnRouteWaypoints().length;
                                if(this.element.gps.currFlightPlanManager.getArrivalProcIndex() >= 0)
                                    lastIndex--;
                                if((this.index == 0 && firstIndex > 1) || (this.index > 0 && (this.index < firstIndex || this.index > lastIndex)))
                                {
                                    // Cannot remove a procedure waypoint
                                    // Set a message for 20 seconds
                                    this.element.gps.attemptDeleteWpProc++;
                                    setTimeout(() => {
                                        this.element.gps.attemptDeleteWpProc--;
                                        if(this.element.gps.attemptDeleteWpProc < 0)
                                            this.element.gps.attemptDeleteWpProc = 0;
                                    }, 20000);
                                    this.element.gps.SwitchToInteractionState(1);
                                }
                                else if(this.index > 0 && (this.index < firstIndex || this.index > lastIndex))
                                {
                                    // Cannot remove a procedure waypoint
                                    // Set a message for 20 seconds
                                    this.element.gps.attemptDeleteWpProc++;
                                    setTimeout(() => {
                                        this.element.gps.attemptDeleteWpProc--;
                                        if(this.element.gps.attemptDeleteWpProc < 0)
                                            this.element.gps.attemptDeleteWpProc = 0;
                                    }, 20000);
                                    this.element.gps.SwitchToInteractionState(1);
                                }
                                else {
                                    this.element.gps.confirmWindow.element.setTexts("Remove Waypoint ?");
                                    this.element.gps.switchToPopUpPage(this.element.gps.confirmWindow, () => {
                                        if (this.element.gps.confirmWindow.element.Result == 1) {
                                            this.element.removeWaypoint(this.index);
                                            this.element.gps.SwitchToInteractionState(0);
                                        }
                                        this.element.gps.SwitchToInteractionState(0);
                                    });
                                }
                            }
                        }
                    }
                    else{
                        this.element.waypointWindow.element.preventRemove = false;
                    }
// PM Modif: Prevent removing a waypoint after a clear on waypoint window
                    break;
            }
        }
        return false;
    }

    getDtk() {
        var dtk = "___";
        if(!this.element.gps.currFlightPlanManager.isActiveApproach() && !this.element.gps.currFlightPlanManager.getIsDirectTo()) {
            var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
            if(this.index > activeIndex) {
                dtk = this.waypoint.bearingInFP;
            }
            if(this.index == activeIndex) {
                dtk = SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree");
            }
        }
        return isNaN(dtk) ? "___" : fastToFixed(dtk, 0);
    }
    getDistance() {
        var distance = "__._";
        if(!this.element.gps.currFlightPlanManager.isActiveApproach() && !this.element.gps.currFlightPlanManager.getIsDirectTo()){
            var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
            if(activeIndex >= 0) {
                if(activeIndex == this.index) {
                    distance = SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles");
                }
                else if(this.index > activeIndex) {
                    var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                    if(this.index < wayPointList.length)
                        distance = Avionics.Utils.computeDistance(wayPointList[this.index].infos.coordinates, wayPointList[this.index-1].infos.coordinates);
                }
            }
            if(activeIndex == -1) {
                var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                if(this.index > 0 && this.index < wayPointList.length)
                    distance = Avionics.Utils.computeDistance(wayPointList[this.index].infos.coordinates, wayPointList[this.index-1].infos.coordinates);
            }
        }
        return isNaN(distance) ? "__._" : distance.toFixed(1);
    }
    getCumDistance() {
        var cumDistance = "__._";
        if(!this.element.gps.currFlightPlanManager.isActiveApproach() && !this.element.gps.currFlightPlanManager.getIsDirectTo()){
            var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
            if(activeIndex >= 0) {
                if(this.index >= activeIndex) {
                    cumDistance = SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles");
                    if(this.index > activeIndex) {
                        var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                        for(var i=this.index; i > activeIndex; i--) {
                            if(i < wayPointList.length && i > 0) {
                                var distance = Avionics.Utils.computeDistance(wayPointList[i].infos.coordinates, wayPointList[i-1].infos.coordinates);
                                cumDistance += distance;
                            }
                        }
                    }
                }
            }
            if(activeIndex == -1 && this.index > 0) {
                var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                cumDistance = 0;
                for(var i=this.index; i > 0; i--) {
                    if(i < wayPointList.length && i > 0) {
                        var distance = Avionics.Utils.computeDistance(wayPointList[i].infos.coordinates, wayPointList[i-1].infos.coordinates);
                        cumDistance += distance;
                    }
                }
            }
        }
        return isNaN(cumDistance) ? "__._" : cumDistance.toFixed(1);
    }
}
class GPS_ApproachWaypointLine extends MFD_ApproachWaypointLine {
    getString() {
        this.emptyLine = '<td class="SelectableElement Select0">_____</td><td>___<div class="Align unit">&nbsp;o<br>&nbsp;M</div></td><td>__._<div class="Align unit">&nbsp;n<br>&nbsp;m</div></td><td>__._<div class="Align unit">&nbsp;n<br>&nbsp;m</div></td>';
        if (this.waypoint) {
            let infos = this.waypoint.GetInfos();
            if(infos && infos.ident) {
                return '<td class="SelectableElement Select0">' + (infos.ident != "" ? infos.ident.slice(0, 8) : this.waypoint.ident.slice(0, 8)) + '</td><td>'
                    + this.getDtk() + '<div class="Align unit">&nbsp;o<br>&nbsp;M</div>' + '</td><td>'
                    + this.getDistance() + '<div class="Align unit">&nbsp;n<br>&nbsp;m</div></td><td>'
                    + this.getCumDistance() + '<div class="Align unit">&nbsp;n<br>&nbsp;m</div>' + '</td>';
            }
            else if (this.element.emptyLine != "")
                return this.element.emptyLine;
            else
                return this.emptyLine;
        }
        else if (this.element && this.element.emptyLine != "") {
            return this.element.emptyLine;
        }
        else {
            return this.emptyLine;
        }
    }
    onEvent(_subIndex, _event) {
        if (this.element.gps.popUpElement == null) {
            switch (_event) {
                case "ENT_Push":
                    if(this.waypoint) {
                        switch (this.waypoint.icao[0]) {
                            case "A":
                                this.element.gps.lastRelevantICAO =this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "A";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "AirportLocation", true);
                                break;
                            case "V":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "V";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "VOR", true);
                                break;
                            case "N":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "N";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "NDB", true);
                                break;
                            case "W":
                                this.element.gps.lastRelevantICAO = this.waypoint.icao;
                                this.element.gps.lastRelevantICAOType = "W";
                                this.element.gps.SwitchToInteractionState(0);
                                this.element.gps.SwitchToPageName("WPT", "Intersection", true);
                                break;
                        }
                    }
                    break;
                case "NavigationSmallInc":
                case "NavigationSmallDec":
// PM Modif: Prevent adding an approach waypoint for now
//                    this.element.gps.switchToPopUpPage(this.element.waypointWindow, this.element.onWaypointSelectionEnd.bind(this.element));
//                    this.element.selectedIndex = this.index;
//                  return true;
// PM Modif: End Prevent adding an approach waypoint for now
                    break;
                case "CLR":
                case "CLR_Push":
                    // Cannot remove a procedure waypoint
                    // Set a message for 20 seconds
                    this.element.gps.attemptDeleteWpProc++;
                    setTimeout(() => {
                        this.element.gps.attemptDeleteWpProc--;
                        if(this.element.gps.attemptDeleteWpProc < 0)
                            this.element.gps.attemptDeleteWpProc = 0;
                    }, 20000);
// PM Modif: Prevent removing an approach waypoint
//                    this.element.removeWaypoint(this.index);
// PM Modif: End Prevent removing an approach waypoint
                    break;
            }
        }
        return false;
    }
    getDtk() {
        var dtk = "___";
        if(!this.element.gps.currFlightPlanManager.getIsDirectTo()) {
            if(this.element.gps.currFlightPlanManager.isActiveApproach()) {
                var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                if(this.index > activeIndex) {
                    dtk = this.waypoint.bearingInFP;
                }
                if(this.index == activeIndex) {
                    dtk = SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree");
                }
            }
            else {
                if(this.index == 0) {
                    // In this case the DTK is the bearing to first approach WP
                    let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                    let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                    let ll = new LatLong(lat, long);
                    dtk = Avionics.Utils.computeGreatCircleHeading(ll, this.waypoint.infos.coordinates);
                }
                else {
                    dtk = this.waypoint.bearingInFP;
                }
            }
        }
        return isNaN(dtk) ? "___" : fastToFixed(dtk, 0);
    }
    getDistance() {
        var distance = "__._";
        if(!this.element.gps.currFlightPlanManager.getIsDirectTo()){
            if(this.element.gps.currFlightPlanManager.isActiveApproach()) {
                var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                if(activeIndex >= 0) {
                    if(activeIndex == this.index) {
                        distance = SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles");
                    }
                    else if(this.index > activeIndex) {
                        var wayPointList = this.element.gps.currFlightPlanManager.getApproachWaypoints();
                        distance = 0;
                        if(this.index < wayPointList.length)
                            distance = Avionics.Utils.computeDistance(wayPointList[this.index].infos.coordinates, wayPointList[this.index-1].infos.coordinates);
                    }
                }
            }
            else {
                if(this.index == 0) {
                    var wayPointList = this.element.gps.currFlightPlanManager.getWaypoints();
                    var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                    if(wayPointList.length >2 && (activeIndex != wayPointList.length-1)) {
                        // The distance of the first non activated app WP is the one from the last enroute WP
                        // except if the active index is the destination
                        distance = Avionics.Utils.computeDistance(wayPointList[wayPointList.length - 2].infos.coordinates, this.waypoint.infos.coordinates);
                    }
                    else{
                        let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                        let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                        let ll = new LatLong(lat, long);
                        distance = Avionics.Utils.computeDistance(ll, this.waypoint.infos.coordinates);
                    }
                }
                else {
                    var wayPointList = this.element.gps.currFlightPlanManager.getApproachWaypoints();
                    distance = 0;
                    if(this.index < wayPointList.length)
                        distance = Avionics.Utils.computeDistance(wayPointList[this.index].infos.coordinates, wayPointList[this.index-1].infos.coordinates);
                }
            }
        }
        return isNaN(distance) ? "__._" : distance.toFixed(1);
    }
    getCumDistance() {
        var cumDistance = "__._";
        if(!this.element.gps.currFlightPlanManager.getIsDirectTo()) {
            if(this.element.gps.currFlightPlanManager.isActiveApproach()) {
                var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                if(activeIndex >= 0) {
                    if(this.index >= activeIndex) {
                        cumDistance = SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles");
                        if(this.index > activeIndex) {
                            var wayPointList = this.element.gps.currFlightPlanManager.getApproachWaypoints();
                            for(var i=this.index; i > activeIndex; i--) {
                                distance = 0;
                                if(i < wayPointList.length)
                                    var distance = Avionics.Utils.computeDistance(wayPointList[i].infos.coordinates, wayPointList[i-1].infos.coordinates);
                                cumDistance += distance;
                            }
                        }
                    }
                }
            }
            else {
                // If no approach active, the cumulative distance must be taken form the one of the last enroute WP
                let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                let ll = new LatLong(lat, long);
                wayPointList = this.element.gps.currFlightPlanManager.getApproachWaypoints();
                // default base cum distance is form airplane position but should occur only if enroute is max 2 WP
                // or if active index is the destination
                if(wayPointList.length)
                    cumDistance = Avionics.Utils.computeDistance(ll, wayPointList[0].infos.coordinates);
                var activeIndex = this.element.gps.currFlightPlanManager.getActiveWaypointIndex();
                if(activeIndex >= 0 && wayPointList.length) {
                    var wayPointListEnroute = this.element.gps.currFlightPlanManager.getWaypoints();
                    if(wayPointListEnroute.length > 2 && (activeIndex != wayPointListEnroute.length-1)) {
                        // Calculate last enroute WP cum distance
                        // Start from active WP
                        cumDistance = SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles");
                        // Add distance fromlast enroute to first approach WP
                        cumDistance += Avionics.Utils.computeDistance(wayPointListEnroute[wayPointListEnroute.length - 2].infos.coordinates, wayPointList[0].infos.coordinates);
                        for(var i=wayPointListEnroute.length-2; i > activeIndex; i--) {
                            var distance = Avionics.Utils.computeDistance(wayPointListEnroute[i].infos.coordinates, wayPointListEnroute[i-1].infos.coordinates);
                            cumDistance += distance;
                        }
                    }
                }
                if(this.index > 0) {
                    for(var i=this.index; i > 0; i--) {
                        distance = 0;
                        if(i < wayPointList.length)
                            var distance = Avionics.Utils.computeDistance(wayPointList[i].infos.coordinates, wayPointList[i-1].infos.coordinates);
                        cumDistance += distance;
                    }
                }
            }
        }
        return isNaN(cumDistance) ? "__._" : cumDistance.toFixed(1);
    }
}
class GPS_ActiveFPL extends MFD_ActiveFlightPlan_Element {
    constructor(_type = "530") {
        if(_type == "530")
            super(GPS_WaypointLine, GPS_ApproachWaypointLine, 7, 4);
        else
            super(GPS_WaypointLine, GPS_ApproachWaypointLine, 5, 4);
        this.emptyLine = '<td class="SelectableElement Select0">_____</td><td>___<div class="Align unit">&nbsp;o<br>&nbsp;M</div></td><td>___<div class="Align unit">&nbsp;n<br>&nbsp;m</div></td><td>__._<div class="Align unit">&nbsp;n<br>&nbsp;m</div></td>';
    }
    init(_root) {
        super.init(_root);
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Activate&nbsp;Leg?", this.activateLegFromMenu.bind(this), this.isCurrentlySelectedNotALeg.bind(this)),
            new ContextualMenuElement("Crossfill?", this.FPLCrossfill_CB.bind(this), true),
            new ContextualMenuElement("Copy&nbsp;Flight&nbsp;Plan?", this.FPLCopyFlightPlan_CB.bind(this), true),
            new ContextualMenuElement("Invert&nbsp;Flight&nbsp;Plan?", this.FPLInvertFlightPlan_CB.bind(this), this.invertFlightPlanCB.bind(this)),
            new ContextualMenuElement("Delete&nbsp;Flight&nbsp;Plan?", this.FPLDeleteFlightPlan_CB.bind(this)),
            new ContextualMenuElement("Select&nbsp;Approach?", this.FPLSelectApproach_CB.bind(this)),
            new ContextualMenuElement("Select&nbsp;Arrival?", this.FPLSelectArrival_CB.bind(this)),
            new ContextualMenuElement("Select&nbsp;Departure?", this.FPLSelectDeparture_CB.bind(this)),
            new ContextualMenuElement("Remove&nbsp;Approach?", this.FPLRemoveApproach_CB.bind(this), this.removeApproachStateCB.bind(this)),
            new ContextualMenuElement("Remove&nbsp;Arrival?", this.FPLRemoveArrival_CB.bind(this), this.removeArrivalStateCB.bind(this)),
            new ContextualMenuElement("Remove&nbsp;Departure?", this.FPLRemoveDeparture_CB.bind(this), this.removeDepartureStateCB.bind(this)),
            new ContextualMenuElement("Closest&nbsp;Point&nbsp;of&nbsp;FPL?", this.FPLClosestPoint_CB.bind(this), true),
            new ContextualMenuElement("Change&nbsp;Fields?", this.FPLChangeFields_CB.bind(this), true),
            new ContextualMenuElement("Restore&nbsp;Defaults?", this.FPLRestoreDefaults_CB.bind(this), true),
        ]);
        this.newWaypointPage = new NavSystemPage("WaypointSelection", "WaypointSelection", new GPS_FPLWaypointSelection());
        this.newWaypointPage.pageGroup = (this.container).pageGroup;
        this.newWaypointPage.gps = this.gps;
        this.waypointWindow = this.newWaypointPage;
        this.savedFpl = new GPS_FlightPlanForSave(this.gps);
        this._t = 0;
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        if (this.gps.currentInteractionState == 1 && this.lines[this.fplSelectable.getIndex()].waypoint) {
            let infos = this.lines[this.fplSelectable.getIndex()].waypoint.GetInfos();                
            this.gps.lastRelevantICAO = infos.icao;
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this._t++;
        if(this._t > 30) {
            this._t = 0;
            this.savedFpl.save();
        }
        if (this.gps.currentInteractionState != 2) {
            this.selectedLine = null;
        }
        this.fplNumber = this.gps.getChildById("FlightPlanNumber");
        this.fplNumber.textContent = this.gps.fplNumber < 10 ? "0" + this.gps.fplNumber : this.gps.fplNumber;
    }

    onEvent(_event) {
        if (_event == "CLR_Push") {
            // Undisplay the menu
            if(this.gps.currentContextualMenu){
                this.gps.SwitchToInteractionState(0);
                this.gps.currentContextualMenu = null;
            }
        }
    }

    activateStateCB() {
        return this.selectedLine == null;
    }
    activateLegFromMenu() {
        let infos = this.lines[this.fplSelectable.getIndex()].waypoint.GetInfos();
        this.activateLeg(this.lines[this.fplSelectable.getIndex()].getIndex(), infos.icao);
        this.gps.SwitchToInteractionState(0);
    }
    activateLeg(_index, _icao) {
        // Check if the requested index is an approach index
        let is_approach_index = false;
        if (this.gps.currFlightPlanManager.isLoadedApproach() && _index < this.gps.currFlightPlanManager.getApproachWaypoints().length){
            let icao = this.gps.currFlightPlanManager.getApproachWaypoints()[_index].icao;
            if(icao == _icao){
                is_approach_index = true;                
            }
        }
        if(is_approach_index){
            if(!this.gps.currFlightPlanManager.isActiveApproach()){
                this.gps.alertWindow.element.setTexts("Activate approach first", "Ok");
                this.gps.switchToPopUpPage(this.gps.alertWindow, () => {
                    this.gps.SwitchToInteractionState(1);
                });
                return;
            }
        }
        this.gps.confirmWindow.element.setTexts("Confirm activate leg ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if (this.gps.confirmWindow.element.Result == 1) {
                // Remove any direct to before activating leg
                this.gps.cancelDirectTo(() => {
                    if(is_approach_index) {
                        this.gps.currFlightPlanManager.setActiveWaypointIndex(_index);
                    }
                    else {
                        // Activating a leg outside the approach deactive it
                        this.gps.currFlightPlanManager.deactivateApproach(() => {
                            this.gps.currFlightPlanManager.setActiveWaypointIndex(_index);
                        });
                    }
                });
            }
        });
    }
    isCurrentlySelectedNotALeg() {
        return this.lines[this.fplSelectable.getIndex()].getType() == MFD_WaypointType.empty;
    }

    removeApproachStateCB() {
        return this.gps.currFlightPlanManager.getApproachIndex() == -1;
    }
    removeArrivalStateCB() {
        return this.gps.currFlightPlanManager.getArrivalProcIndex() == -1;
    }
    removeDepartureStateCB() {
        return this.gps.currFlightPlanManager.getDepartureProcIndex() == -1;
    }
    FPLActivateLeg_CB() {
        if (this.selectedLine) {
            this.selectedLine.onEvent(0, "ActivateWaypoint");
        }
        this.gps.SwitchToInteractionState(0);
    }
    FPLCrossfill_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    FPLCopyFlightPlan_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    invertFlightPlanCB() {
        return this.gps.currFlightPlanManager.getActiveWaypointIndex() < 0;
    }
    FPLInvertFlightPlan_CB() {
        // Do that only if there is a valid active index (CTD otherwise ex with POI)
        if(this.gps.currFlightPlanManager.getActiveWaypointIndex() >= 0)
        {
            this.gps.currFlightPlanManager.invertActiveFlightPlan(() => {
                this.gps.currFlightPlanManager.updateFlightPlan(this.updateWaypoints.bind(this));
            });
        }
        this.gps.SwitchToInteractionState(0);
    }
    FPLDeleteFlightPlan_CB() {
        this.gps.confirmWindow.element.setTexts("Delete flight plan ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if ((this.gps.confirmWindow.element.Result == 1) && (this.gps.currFlightPlanManager.getApproach() != null)) {
                this.gps.currFlightPlanManager.clearFlightPlan();
                this.gps.SwitchToInteractionState(0);
                if(this.fplSliderGroup)
                    this.fplSliderGroup.updateDisplay();
                this.gps.fplNumber = 0;
            }
        });
    }
    FPLSelectApproach_CB(_param) {
        this.gps.switchToPopUpPage(this.gps.selectApproachPage);
    }
    FPLSelectArrival_CB() {
        this.gps.switchToPopUpPage(this.gps.selectArrivalPage);
    }
    FPLSelectDeparture_CB() {
        this.gps.switchToPopUpPage(this.gps.selectDeparturePage);
    }
    FPLRemoveApproach_CB() {
        this.gps.confirmWindow.element.setTexts("Remove Approach ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if ((this.gps.confirmWindow.element.Result == 1) && (this.gps.currFlightPlanManager.getApproach() != null)) {
                this.gps.currFlightPlanManager.setApproachIndex(-1, () => {
                    // This is to remove some kind of undefined display
                    this.fplSelectable.onSelection("NavigationLargeDec");
                });
            }
            this.gps.SwitchToInteractionState(0);
        });
    }
    FPLRemoveArrival_CB() {
        this.gps.confirmWindow.element.setTexts("Remove Arrival ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if ((this.gps.confirmWindow.element.Result == 1) && (this.gps.currFlightPlanManager.getArrival() != null)) {
                this.gps.currFlightPlanManager.removeArrival(() => {
                    // This is to remove some kind of undefined display
                    this.fplSelectable.onSelection("NavigationLargeDec");
                });
            }
            this.gps.SwitchToInteractionState(0);
        });
    }
    FPLRemoveDeparture_CB() {
        this.gps.confirmWindow.element.setTexts("Remove Departure ?");
        this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
            if ((this.gps.confirmWindow.element.Result == 1) && (this.gps.currFlightPlanManager.getDeparture() != null)) {
                this.gps.currFlightPlanManager.removeDeparture(() => {
                    // This is to remove some kind of undefined display
                    this.fplSelectable.onSelection("NavigationLargeDec");
                });
            }
            this.gps.SwitchToInteractionState(0);
        });
    }
    removeWaypoint(_index) {
        let savedIndex = this.fplSelectable.index;
        let savedOffset = this.fplSelectable.offset;
        this.gps.currFlightPlanManager.removeWaypoint(_index, true, () => {
            this.updateWaypoints.bind(this);
            // This is to remove some kind of undefined display
            this.fplSelectable.onSelection("NavigationLargeDec");
            setTimeout(() => {
                this.fplSelectable.index = savedIndex;
                this.fplSelectable.offset = savedOffset;
            }, 1000);
        });
    }
    FPLClosestPoint_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    FPLChangeFields_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    FPLRestoreDefaults_CB() {
        this.gps.SwitchToInteractionState(0);
    }
    onWaypointSelectionEnd() {
        if (this.gps.lastRelevantICAO) {
            // Workaraound to the insert waypoint broken in sim
            if(this.gps.getConfigKey("wa_add_waypoint_bug", false)) {
                this.savedFpl.save();
                if(this.savedFpl.canAdd(this.selectedIndex, true)) {
                    this.gps.confirmWindow.element.setTexts("Add waypoint ?");
                    this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
                        if (this.gps.confirmWindow.element.Result == 1) {
                            let savedIndex = this.fplSelectable.index;
                            let savedOffset = this.fplSelectable.offset;
                            if(this.savedFpl.AddWaypoint(this.gps.lastRelevantICAO, this.selectedIndex)) {
                                let navmode = 0;
                                if(SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "boolean"))
                                    navmode = 1;
                                if(SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean"))
                                    navmode = 2;
                                this.savedFpl.load(navmode);
                                // Try restoring cursor
                                setTimeout(() => {
                                    this.gps.ActiveSelection(this.defaultSelectables);
                                    this.fplSelectable.index = savedIndex;
                                    this.fplSelectable.incrementIndex();
                                    this.fplSelectable.offset = savedOffset;
                                }, 2000);
                            }
                        }
                    });
                }
            }
            else {
                this.gps.confirmWindow.element.setTexts("Add waypoint ?");
                this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
                    if (this.gps.confirmWindow.element.Result == 1) {
                        this.gps.currFlightPlanManager.addWaypoint(this.gps.lastRelevantICAO, this.selectedIndex, () => {
                            if (!this.gps.popUpElement) {
                                this.updateWaypoints();
                                this.gps.ActiveSelection(this.defaultSelectables);
                                this.fplSelectable.incrementIndex();
                            }
                        });
                    }
                });
            }
        }
        if (!this.gps.popUpElement) {
            this.gps.ActiveSelection(this.defaultSelectables);
        }
    }
    FPLConfirmDeleteYes_CB() {
        SimVar.SetSimVarValue("C:fs9gps:FlightPlanDeleteWaypoint", "number", this.fplSliderGroup.getIndex());
        this.gps.currFlightPlan.FillWithCurrentFP();
        this.gps.SwitchToInteractionState(0);
    }
    FPLConfirmDeleteNo_CB() {
        this.gps.SwitchToInteractionState(0);
    }
}

class GPS_FPLWaypointSelection extends NavSystemElement {
    constructor() {
        super();
        this.name = "WaypointSelection";
        this.preventRemove = false;
    }
    init(_root) {
        this.root = _root;
        this.icao = this.gps.getChildById("WPSIcao");
        this.airportPrivateLogo = this.gps.getChildById("WPSAirportPrivateLogoImg");
        this.region = this.gps.getChildById("WPSRegion");
        this.facilityName = this.gps.getChildById("WPSFacilityName");
        this.city = this.gps.getChildById("WPSCity");
        this.posNS = this.gps.getChildById("WPSPosNS");
        this.posEW = this.gps.getChildById("WPSPosEW");
        this.accept = this.gps.getChildById("WPSAccept");
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.icao], this.gps, "AWNV");
        // No search by facility for now because not working well
        // this.nameSearchField = new SearchFieldWaypointName(this.gps, [this.facilityName], this.gps, "AWNV", this.icaoSearchField);
        this.icaoSearchField.init();
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.icao, this.searchField_SelectionCallback.bind(this)),
            // No search by facility for now because not working well
            // new SelectableElement(this.gps, this.facilityName, this.facilityName_SelectionCallback.bind(this)),
        ];
        this.duplicateWaypoints = new NavSystemElementContainer("Duplicate Waypoints", "DuplicateWaypointWindow", new MFD_DuplicateWaypoint());
        this.duplicateWaypoints.setGPS(this.gps);
        this.duplicateWaypoints.element.icaoSearchField = this.icaoSearchField;
        this.preventRemove = false;
        this.initialUpdate = true;
    }
    onEnter() {
        if (this.gps.lastRelevantICAO) {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
        }
        else if (this.gps.icaoFromMap) {
            this.icaoSearchField.SetWaypoint(this.gps.icaoFromMap[0], this.gps.icaoFromMap);
        }
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.preventRemove = false;
        this.root.setAttribute("state", "Active");
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
        }
        else {
            this.icao.textContent = "_____";
            diffAndSetAttribute(this.airportPrivateLogo, "src", "");
            this.region.textContent = "__________";
            this.facilityName.textContent = "______________________";
            this.city.textContent = "______________________";
            this.posNS.textContent = "_ __°__.__'";
            this.posEW.textContent = "____°__.__'";
        }
        this.icaoSearchField.Update();
        // No search by facility for now because not working well
        // this.nameSearchField.Update();
    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.initialUpdate = true;
        this.root.setAttribute("state", "Inactive");
    }
    onEvent(_event) {
        if (_event == "CLR_Push" || _event == "CLR") {
            this.preventRemove = true;
        }
        if (_event == "DRCT_Push"
            || _event == "FPL_Push"
            || _event == "PROC_Push"
            || _event == "DirectTo_Push"
            || _event == "MSG_Push"
            || _event == "VNAV_Push"
            || _event == "CLR_Push_Long") {
            this.gps.lastRelevantICAO = null;
            this.gps.lastRelevantICAOType = null;
            this.gps.closePopUpElement();
        }
        if (_event == "CLR_Push") {
            if(this.icaoSearchField.isActive){
                this.icaoSearchField.isActive = false;
                this.gps.SwitchToInteractionState(1);
            }
            else {
                this.gps.lastRelevantICAO = null;
                this.gps.lastRelevantICAOType = null;
                this.gps.closePopUpElement();
            }
        }
        if (_event == "NavigationPush" || _event == "MENU_Push") {
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
            var infos = this.icaoSearchField.getUpdatedInfos();
            this.gps.lastRelevantICAO = infos.icao;
            this.gps.lastRelevantICAOType = infos.getWaypointType();
            this.gps.closePopUpElement();
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
        }
    }
    facilityName_SelectionCallback(_event) {
        if (_event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.nameSearchField;
            this.nameSearchField.StartSearch(this.onSearchEnd.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    onSearchEnd() {
        if (this.icaoSearchField.duplicates && this.icaoSearchField.duplicates.length > 0) {
            this.gps.lastRelevantICAO = null;
            this.gps.lastRelevantICAOType = null;
            this.gps.switchToPopUpPage(this.duplicateWaypoints, this.gps.popUpCloseCallback);
        }
        else {
            var infos = this.icaoSearchField.getUpdatedInfos();
            this.gps.lastRelevantICAO = infos.icao;
            this.gps.lastRelevantICAOType = infos.getWaypointType();
            this.gps.closePopUpElement();
        }
    }
    acceptButton_SelectionCallback(_event) {
        if (_event == "ENT_Push") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            this.gps.lastRelevantICAO = infos.icao;
            this.gps.lastRelevantICAOType = infos.getWaypointType();
            this.gps.closePopUpElement();
        }
    }
}


class GPS_FPLCatalog extends NavSystemElement {
    constructor(_type = "530") {
        super();
        this.name = "FPLCatalog";
        this.nbElemsMax = 7;
        if(_type == "430")
            this.nbElemsMax = 5;
        this.fplList = new FPLCatalog();
    }
    init() {
        this.sliderElement = this.gps.getChildById("SliderFPLCatalog");
        this.sliderCursorElement = this.gps.getChildById("SliderFPLCatalogCursor");
        this.used = this.gps.getChildById("FPLCatalogUsed");
        this.empty = this.gps.getChildById("FPLCatalogEmpty");

        this.fplsSliderGroup = new SelectableElementSliderGroup(this.gps, [], this.sliderElement, this.sliderCursorElement);
        for (let i = 0; i < this.nbElemsMax; i++) {
            this.fplsSliderGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("FPL_Catalog_" + i), this.fpl_SelectionCallback.bind(this)));
        }
        this.defaultSelectables = [this.fplsSliderGroup];
        this.realindex = -1;
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.fplList.load();
    }
    onUpdate(_deltaTime) {
        var lines = [];
        var numItems = 0;
        var i = 0;
        for (i = 0; i < 19; i++) {
            let item = this.fplList.fpls[i];
            let itemIndex = item.index < 10 ? "0" + item.index : item.index;
            if(item.xmlFpl != null && item.originIdent != "" && item.destinationIdent != ""){
                var line = '<td class="SelectableElement">' + itemIndex + "</td><td>" + item.originIdent + " / " + item.destinationIdent + "</td>";
                numItems++;
                lines.push(line);
            }
        }
        // Write the blank lines
        for (i = numItems; i < 19; i++) {
            var line = '<td class="SelectableElement">__</td><td>_____ / _____</td>';
            lines.push(line);
        }
        this.fplsSliderGroup.setStringElements(lines);
        this.used.textContent = numItems;
        this.empty.textContent = 19-numItems;

    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onEvent(_event) {
    }
    fpl_SelectionCallback(_event, _index) {
        let fpl = this.fplList.fpls[this.realindex];
        switch (_event) {
            case "ENT_Push":
                this.realindex = this.fplList.getIndexFromDisplay(_index);
                if(this.realindex != -1)
                {
                    this.gps.confirmWindow.element.setTexts("Load flight plan ?");
                    this.gps.switchToPopUpPage(this.gps.confirmWindow, () => {
                        if (this.gps.confirmWindow.element.Result == 1) {
                            this.gps.fplNumber = 0;
                            this.importToGame();
                        }
                    });
                }
                else {
                    this.gps.SwitchToInteractionState(1);
                }
                return true;
        }
    }
    async importToGame(_callback) {
        // Clear flight plan
        await Coherent.call("SET_CURRENT_FLIGHTPLAN_INDEX", 0, false);
        await Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN");

        // Get flight plan
        let fpl = this.fplList.fpls[this.realindex];
        let firstEnrouteWaypointIndex = 0;
        let lastEnrouteWaypointIndex = fpl.icaoWaypoints.length-1;
        let hasOrigin = false;
        let hasDestination = false;
        
        // Set origin
        if(fpl.icaoWaypoints[0][0] == "A") {
            await Coherent.call("SET_ORIGIN", fpl.icaoWaypoints[0], false);
            firstEnrouteWaypointIndex++;
            hasOrigin = true;
        }
        
        // Set destination
        if(fpl.icaoWaypoints[lastEnrouteWaypointIndex][0] == "A") {
            await Coherent.call("SET_DESTINATION", fpl.icaoWaypoints[lastEnrouteWaypointIndex], false);
            lastEnrouteWaypointIndex--;
            hasDestination = true;
        }

        // Set enroute waypoints
        let i = 0;
        for(i=firstEnrouteWaypointIndex; i<=lastEnrouteWaypointIndex; i++){
            if(fpl.icaoWaypoints[i].indexOf(":") == -1) {
                await Coherent.call("ADD_WAYPOINT", fpl.icaoWaypoints[i], i, true);
            }
            else {
                // User waypoint
                // Currently not working
//                 let parts = fpl.icaoWaypoints[i].split(":");
//                 if (parts.length > 1) {
//                     let icao = parts[0];
//     console.log("icao1:" + icao);
//                     let position = parts[1];
//     console.log("position:" + position);
//                     parts = position.split(",");
//     console.log("parts0:" + parts[0]);
//     console.log("parts1:" + parts[1]);
//                     if(parts.length > 1) {
//                         let latitude = fpl.convertDMSToDD(parts[0]);
//                         let longitude = fpl.convertDMSToDD(parts[1]);
// console.log("icao:" + stringToAscii(icao));
// console.log("ident:" + icao.substring(7));
// console.log("latitude:" + latitude);
// console.log("longitude:" + longitude);
//                         const waypoint = new WayPoint(this._instrument);
//                         waypoint.type = 'W';
//                         waypoint.infos = new IntersectionInfo(this._instrument);
//                         waypoint.infos.coordinates = coordinates;
//                         waypoint.infos.magneticVariation = magneticVariation;
//                         waypoint.ident = ident;
//                         waypoint.infos.ident = ident;

//                         await GPS.addUserWaypoint(latitude, longitude, i, "Cust");
//                    }
//                }
            }
        }


        // Set departure
        if(hasOrigin && fpl.departureName.length) {
            let waypoint = await this.gps.currFlightPlanManager.instrument.facilityLoader.getFacility(fpl.icaoWaypoints[0]);
            if(waypoint) {
                let departureIndex = -1;
                let infos = waypoint.GetInfos();
                for (i = 0; i < infos.departures.length; i++) {
                    if(infos.departures[i].name.toUpperCase() == fpl.departureName.toUpperCase()) {
                        departureIndex = i;
                        break;
                    }
                }
                if(departureIndex >= 0) {
                    let departure = infos.departures[departureIndex];
                    let departureRunwayIndex = 0;
                    for (i = 0; i < departure.runwayTransitions.length; i++) {
                        if(departure.runwayTransitions[i].name.trim().toUpperCase() == fpl.departureRunwayName.trim().toUpperCase()) {
                            departureRunwayIndex = i;
                            break;
                        }
                    }
                    let departureTransitionIndex = 0;
                    for (i = 0; i < departure.enRouteTransitions.length; i++) {
                        if(departure.enRouteTransitions[i].name.toUpperCase() == fpl.departureTransitionName.toUpperCase()) {
                            departureTransitionIndex = i;
                            break;
                        }
                    }
                    await Coherent.call("SET_DEPARTURE_RUNWAY_INDEX", departureRunwayIndex);
                    await Coherent.call("SET_DEPARTURE_PROC_INDEX", departureIndex);
                    await Coherent.call("SET_DEPARTURE_ENROUTE_TRANSITION_INDEX", departureTransitionIndex);
                }
            }
        }


        // Set arrrival and approach
        if(hasDestination) {
            let waypoint = await this.gps.currFlightPlanManager.instrument.facilityLoader.getFacility(fpl.icaoWaypoints[fpl.icaoWaypoints.length-1]);
            if(waypoint) {
                let infos = waypoint.GetInfos();
                if(fpl.arrivalName.length) {
                    let arrivalIndex = -1;
                    for (i = 0; i < infos.arrivals.length; i++) {
                        if(infos.arrivals[i].name.toUpperCase() == fpl.arrivalName.toUpperCase()) {
                            arrivalIndex = i;
                            break;
                        }
                    }
                    if(arrivalIndex >= 0) {
                        let arrival = infos.arrivals[arrivalIndex];
                        let arrivalRunwayIndex = 0;
                        for (i = 0; i < arrival.runwayTransitions.length; i++) {
                            if(arrival.runwayTransitions[i].name.trim().toUpperCase() == fpl.arrivalRunwayName.trim().toUpperCase()) {
                                arrivalRunwayIndex = i;
                                break;
                            }
                        }
                        let arrivalTransitionIndex = 0;
                        for (i = 0; i < arrival.enRouteTransitions.length; i++) {
                            if(arrival.enRouteTransitions[i].name.toUpperCase() == fpl.arrivalTransitionName.toUpperCase()) {
                                arrivalTransitionIndex = i;
                                break;
                            }
                        }
                        await Coherent.call("SET_ARRIVAL_RUNWAY_INDEX", arrivalRunwayIndex);
                        await Coherent.call("SET_ARRIVAL_PROC_INDEX", arrivalIndex);
                        await Coherent.call("SET_ARRIVAL_ENROUTE_TRANSITION_INDEX", arrivalTransitionIndex);
                    }
                }
                if(fpl.approachName.length) {
                    let approachNameToSearch = fpl.approachName.toUpperCase();
                    let indexapproach = -1;
                    for (i = 0; i < infos.approaches.length; i++) {
                        if(infos.approaches[i].name.toUpperCase() == approachNameToSearch) {
                            indexapproach = i;
                            break;
                        }
                    }
                    // Bug if the destination runway is a center one
                    if(indexapproach == -1 && approachNameToSearch[approachNameToSearch.length-1] == "C") {
                        approachNameToSearch = approachNameToSearch.slice(0,-1);
                        approachNameToSearch += " ";
                        for (i = 0; i < infos.approaches.length; i++) {
                            if(infos.approaches[i].name.toUpperCase() == approachNameToSearch) {
                                indexapproach = i;
                                break;
                            }
                        }
                    }
                    if(indexapproach >= 0) {
                        let approach = infos.approaches[indexapproach];
                        let indextransition = -1;
                        for (i = 0; i < approach.transitions.length; i++) {
                            if(approach.transitions[i].name.toUpperCase() == fpl.approachTransitionName.toUpperCase()) {
                                indextransition = i;
                                break;
                            }
                        }
                        if(indextransition == -1 && approach.transitions.length) {
                            // Not found by transition name. We should get the nearest transition from last enroute wp
                            indextransition = 0;
                            if(fpl.approachTransitionIcao.length) {
                                let waypoint = await this.gps.currFlightPlanManager.instrument.facilityLoader.getFacility(fpl.approachTransitionIcao);
                                if(waypoint) {
                                    let trCoordinates = waypoint.GetInfos().coordinates;
                                    let distance = 1000;
                                    for (i = 0; i < approach.transitions.length; i++) {
                                        let transitionFirstWp = approach.transitions[i].waypoints[0];
                                        if(transitionFirstWp) {
                                            let distanceTowp = Avionics.Utils.computeDistance(transitionFirstWp.infos.coordinates, trCoordinates);
                                            if(distanceTowp < distance) {
                                                distance = distanceTowp;
                                                indextransition = i;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        await Coherent.call("SET_APPROACH_INDEX", indexapproach).then(() => {
                            if(indextransition >= 0)
                                Coherent.call("SET_APPROACH_TRANSITION_INDEX", indextransition);
                            setTimeout(() => {
                                this.gps.setApproachFrequency();
                            }, 2000);
                        });
                    }
                }
            }
        }

        // Do final stuff
//        await Coherent.call("RECOMPUTE_ACTIVE_WAYPOINT_INDEX");
        this.gps.currFlightPlanManager.updateFlightPlan(() => {
            let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
            if (elem) {
                elem.updateWaypoints();
            }
        });
        this.gps.fplNumber = this.realindex + 1;
        // We must go back to the FPL page
        var pageGroup = null;
        for (let i = 0; i < this.gps.eventLinkedPageGroups.length; i++) {
            if(this.gps.eventLinkedPageGroups[i].pageGroup.name == "FPL") {
                pageGroup = this.gps.eventLinkedPageGroups[i].pageGroup;
                break;
            }
        }
        if(pageGroup != null) {
            for (let i = 0; i < pageGroup.pages.length; i++) {
                if (pageGroup.pages[i].name == "ActiveFPL") {
                    pageGroup.pageIndex = i;
                    break;
                }
            }
            this.gps.currentEventLinkedPageGroup = null;
            this.gps.SwitchToInteractionState(0);
            this.gps.computeEvent("FPL_Push");
        }
    }
}


class FPLCatalog {
    constructor() {
        this.fpls = null;
    }
    load(){
        this.fpls = [];
        for(var i=1; i<20; i++){
            var item = new FPLCatalogItem(i);
            item.load();
            this.fpls.push(item);
        }
    }
    getIndexFromDisplay(displayIndex){
        let index = 0;
        var i;
        for(var i=0; i<19; i++){
            var item = this.fpls[i];
            if(item.xmlFpl != null && item.originIdent != "" && item.destinationIdent != ""){
                if(index == displayIndex)
                    break;
                index++;
            }
        }
        if(i == 19)
            return -1;
        return i;
    }
}


class FPLCatalogItem {
    constructor(_index) {
        this.index = _index;
        this.xmlFpl = null;
        this.originIdent = "";               // Origin name ex LFRK (used for display)
        this.destinationIdent = "";          // Destination name ex LFRN (used for display)
        this.icaoWaypoints = [];             // All Icaos including origin (first), destination(last) and Enroute. No Sid star nor approach here
        this.departureName = "";             // Departure name
        this.departureRunwayName = "";       // Departure runway name
        this.departureTransitionName = "";   // Departure transition name (usually empty)
        this.arrivalName = "";               // Arrival name
        this.arrivalRunwayName = "";         // Arrival runway name
        this.arrivalTransitionName = "";     // Arrival transition name
        this.approachName = "";              // Approach name complete including runway and runway suffix
        this.approachTransitionName = "";    // Approach transition name
        this.approachTransitionIcao = "";    // Approach transition icao (used if fpl from import)
        // this.departure = "";
        // this.destination = "";
        // this.sid = "";
        // this.sidrw = "";
        // this.star = "";
        // this.approach = "";
        // this.approachsuffix = "";
        // this.approachrw = "";
        // this.approachrwdes = "";
        // this.approachtr = "";
        // this.approachtrIcao = "";
        // this.icaoWaypoints = [];
    }
    load(_callback){
        this.xmlFpl = null;
        this.originIdent = "";
        this.destinationIdent = "";
        this.icaoWaypoints = [];
        this.departureName = "";
        this.departureRunwayName = "";
        this.departureTransitionName = "";
        this.arrivalName = "";
        this.arrivalRunwayName = "";
        this.arrivalTransitionName = "";
        this.approachName = "";
        this.approachTransitionName = "";
        this.approachTransitionIcao = "";
        this.loadXml("fpl" + this.index + ".pln").then((xmlFpl) => {
            this.xmlFpl = xmlFpl;
            let fpl = xmlFpl.getElementsByTagName("FlightPlan.FlightPlan");
            if(fpl.length > 0) {
                let lastIdent = "";
                let lastIcao = "";
                this.originIdent = fpl[0].getElementsByTagName("DepartureID")[0] ? fpl[0].getElementsByTagName("DepartureID")[0].textContent : "";
                this.destinationIdent = fpl[0].getElementsByTagName("DestinationID")[0] ? fpl[0].getElementsByTagName("DestinationID")[0].textContent : "";
                let waypoints = fpl[0].getElementsByTagName("ATCWaypoint");
                for (let i = 0; i < waypoints.length; i++) {
                    let waypointroot = waypoints[i];
                    let icao = waypointroot.getElementsByTagName("ICAO")[0];
                    let ident = icao && icao.getElementsByTagName("ICAOIdent")[0] ? icao.getElementsByTagName("ICAOIdent")[0].textContent : "";
                    let type = waypointroot.getElementsByTagName("ATCWaypointType")[0] ? waypointroot.getElementsByTagName("ATCWaypointType")[0].textContent : "";
                    let sid = waypointroot.getElementsByTagName("DepartureFP")[0] ? waypointroot.getElementsByTagName("DepartureFP")[0].textContent : "";
                    if(this.departureName == "" && sid != "") {
                        let departureRunway = waypointroot.getElementsByTagName("RunwayNumberFP")[0] ? waypointroot.getElementsByTagName("RunwayNumberFP")[0].textContent : "";
                        let departureRunwayDesignator = waypointroot.getElementsByTagName("RunwayDesignatorFP")[0] ? waypointroot.getElementsByTagName("RunwayDesignatorFP")[0].textContent : "";
                        let rw = departureRunway;
                        if(departureRunwayDesignator.toUpperCase() != "")
                            rw += departureRunwayDesignator.toUpperCase()[0];
                        else
                            rw += " ";
                        if(rw.length)
                            this.departureRunwayName = "RW" + rw;
                        this.departureTransitionName = waypointroot.getElementsByTagName("DepartureTransitionFP")[0] ? waypointroot.getElementsByTagName("DepartureTransitionFP")[0].textContent : "";
                        this.departureName = sid;
                    }
                    if(sid == "" && this.departureName != "" && this.departureTransitionName == "") {
                        // If not explicitely defined we take the last sid Wp as transition name
                        this.departureTransitionName = lastIdent;
                    }
                    let star = waypointroot.getElementsByTagName("ArrivalFP")[0] ? waypointroot.getElementsByTagName("ArrivalFP")[0].textContent : "";
                    if(this.arrivalName == "" && star != "") {
                        let arrivalRunway = waypointroot.getElementsByTagName("RunwayNumberFP")[0] ? waypointroot.getElementsByTagName("RunwayNumberFP")[0].textContent : "";
                        let arrivalRunwayDesignator = waypointroot.getElementsByTagName("RunwayDesignatorFP")[0] ? waypointroot.getElementsByTagName("RunwayDesignatorFP")[0].textContent : "";
                        let rw = arrivalRunway;
                        if(arrivalRunwayDesignator.toUpperCase() != "")
                            rw += arrivalRunwayDesignator.toUpperCase()[0];
                        else
                            rw += " ";
                        if(rw.length)
                            this.arrivalRunwayName = "RW" + rw;
                        // Arrival transition name may be explicitely defined or this is the first arrival wp 
                        if(!this.arrivalTransitionName)
                            this.arrivalTransitionName = waypointroot.getElementsByTagName("ArrivalTransitionFP")[0] ? waypointroot.getElementsByTagName("ArrivalTransitionFP")[0].textContent : ident;
                        this.arrivalName = star;
                    }
                    if(i==waypoints.length-1) {
                        // Check for approach
                        let approach = waypointroot.getElementsByTagName("ApproachTypeFP")[0] ? waypointroot.getElementsByTagName("ApproachTypeFP")[0].textContent : "";
                        if(approach != "")
                        {
                            let approachRunway = waypointroot.getElementsByTagName("RunwayNumberFP")[0] ? waypointroot.getElementsByTagName("RunwayNumberFP")[0].textContent : "";
                            let approachRunwayDesignator = waypointroot.getElementsByTagName("RunwayDesignatorFP")[0] ? waypointroot.getElementsByTagName("RunwayDesignatorFP")[0].textContent : "";
                            let approachSuffix = waypointroot.getElementsByTagName("SuffixFP")[0] ? waypointroot.getElementsByTagName("SuffixFP")[0].textContent : "";
                            let rw = approachRunway;
                            if(approachRunwayDesignator.toUpperCase() != "")
                                rw += approachRunwayDesignator.toUpperCase()[0];
                            else
                                rw += " ";
                            this.approachName = approach + " " + rw;
                            if(approachSuffix.length)
                                this.approachName += " " + approachSuffix;
        
                            // Transition is the last enroute ident if not given
                            this.approachTransitionName = waypointroot.getElementsByTagName("ApproachTransitionFP")[0] ? waypointroot.getElementsByTagName("ApproachTransitionFP")[0].textContent : "";
                            this.approachTransitionIcao = "";
                            if(!this.approachTransitionName.length) {
                                this.approachTransitionName = lastIdent;
                                this.approachTransitionIcao = lastIcao;
                            }
                        }
                    }
                    if(icao){
                        lastIdent = ident;
                        // Prepare icao format TRRAAAAIIIII each part with right leading 0s (T=Type, R=Region, A=Linked airport I=Ident)
                        while(ident.length < 5)
                            ident += " ";
                        let region = icao.getElementsByTagName("ICAORegion")[0] ? icao.getElementsByTagName("ICAORegion")[0].textContent : "";
                        while(region.length < 2)
                            region += " ";
                        let linkedairport = icao.getElementsByTagName("ICAOAirport")[0] ? icao.getElementsByTagName("ICAOAirport")[0].textContent : "";
                        while(linkedairport.length < 4)
                            linkedairport += " ";
                        let typeletter = "W";
                        type = type.toUpperCase();
                        if(type == "AIRPORT")
                            typeletter = "A";
                        else if(type == "VOR")
                            typeletter = "V";
                        else if(type == "NDB")
                            typeletter = "N";
                        else if(type == "USER")
                            typeletter = "U";
                        let icaoString = typeletter + region + linkedairport + ident;
                        if((sid == "") && (star == "")) {
                            // Do not add waypoints that are part of sid or star
                            this.icaoWaypoints.push(icaoString);
                        }
                        lastIcao = icaoString;
                    }
                    else {
                        // User Waypoint
                        // Curently not working
//                         let ident = waypointroot.id.toUpperCase();
// console.log("ident:" + ident);
//                         if(ident) {
//                             let WorldPosition = waypointroot.getElementsByTagName("WorldPosition")[0].textContent;
// console.log("WorldPosition:" + WorldPosition);
//                             if(WorldPosition) {
//                                 let region = "";
//                                 ident = "";
//                                 while(ident.length < 5)
//                                     ident += " ";
//                                 while(region.length < 6)
//                                     region += " ";
//                                 let icaoString = "U" + region + ident + "_123" + ":" + WorldPosition;
// console.log("icaoString:" + stringToAscii(icaoString));
//                                 this.icaoWaypoints.push(icaoString);
//                             }
//                         }
                    }
                }
            }
            if(_callback)
                _callback();
        });
    }
    loadXml(filename) {
        return new Promise((resolve) => {
            var milliseconds = new Date().getTime().toString();
            this.loadFile("/VFS/fpl530/" + filename + "?id=" + milliseconds, (text) => {
                let parser = new DOMParser();
                let out = parser.parseFromString(text, "text/xml");
                resolve(out);
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
    // Convert lat long to decimal
    // Format N48° 58' 26.88" or W0° 40' 21.30"
    convertDMSToDD(dms) {
        let direction = dms.substring(0,1);
        dms = dms.substring(1);
        let parts = dms.split(/[^\d+(\,\d+)\d+(\.\d+)?\w]+/);
        let degrees = parseFloat(parts[0]);
        let minutes = parseFloat(parts[1]);
        let seconds = parseFloat(parts[2].replace(',','.'));
   
        let dd = degrees + minutes / 60 + seconds / (60 * 60);
   
        if (direction == 'S' || direction == 'W') {
          dd = dd * -1;
        } // Don't do anything for N or E
        return dd;
    }
}

// Used to save and restore flight plan in memory
class GPS_FlightPlanForSave {
    constructor(_gps) {
        this.gps = _gps;
        this.origin;
        this.destination;
        this.enrouteWaypoints;
        this.activeWaypointIndex;
        this.departureIndex;
        this.departureTransitionIndex;
        this.departureRunwayIndex;
        this.arrivalIndex;
        this.arrivalTransitionIndex;
        this.arrivalRunwayIndex;
        this.approachIndex;
        this.approachTransitionIndex;
        this.activateNav = 0;   // 1 is NAV and 2 is APPROACH
        this.indexInEnroute = -1;
        this.changeOrigin = false;
        this.changeDestination = false;
        this.message = "";
    }
    save() {
        if(!this.gps.getConfigKey("wa_add_waypoint_bug", false))
            return;
        this.origin = this.gps.currFlightPlanManager.getOrigin();
        this.destination = this.gps.currFlightPlanManager.getDestination();
        this.enrouteWaypoints = this.gps.currFlightPlanManager.getEnRouteWaypoints();
        this.activeWaypointIndex = this.gps.currFlightPlanManager.getActiveWaypointIndex();
        this.departureIndex = this.gps.currFlightPlanManager.getDepartureProcIndex();
        this.departureTransitionIndex = this.gps.currFlightPlanManager.getDepartureEnRouteTransitionIndex();
        this.departureRunwayIndex = this.gps.currFlightPlanManager.getDepartureRunwayIndex();
        this.arrivalIndex = this.gps.currFlightPlanManager.getArrivalProcIndex();
        this.arrivalTransitionIndex = this.gps.currFlightPlanManager.getArrivalTransitionIndex();
        this.arrivalRunwayIndex = this.gps.currFlightPlanManager.getArrivalRunwayIndex();
        this.approachIndex = this.gps.currFlightPlanManager.getApproachIndex();
        this.approachTransitionIndex = this.gps.currFlightPlanManager.getApproachTransitionIndex();
    }
    async load(activateNav = 0) {
        this.activateNav = activateNav;
        await Coherent.call("SET_CURRENT_FLIGHTPLAN_INDEX", 0, false);
        await Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN");
        this.gps.currFlightPlanManager.updateFlightPlan(() => {
            this.gps.currFlightPlanManager.updateCurrentApproach();
        });

        // Set origin
        var indexfpl= 0;
        if(this.origin) {
            await Coherent.call("SET_ORIGIN", this.origin.icao, false);
            indexfpl++;
        }

        // Set destination
        if(this.destination) {
            await Coherent.call("SET_DESTINATION", this.destination.icao, false);
        }

        // Set enroute waypoints
        for(var i= 0; i<this.enrouteWaypoints.length; i++, indexfpl++) {
            await Coherent.call("ADD_WAYPOINT", this.enrouteWaypoints[i].icao, indexfpl, true);
        }

        // Set departure
        if(this.origin) {
            let infos = this.origin.GetInfos();
            if(infos instanceof AirportInfo && this.departureIndex >= 0)
            {
                await Coherent.call("SET_DEPARTURE_RUNWAY_INDEX", this.departureRunwayIndex);
                await Coherent.call("SET_DEPARTURE_PROC_INDEX", this.departureIndex);
                await Coherent.call("SET_DEPARTURE_ENROUTE_TRANSITION_INDEX", this.departureTransitionIndex);
            }
        }


        // Set arrrival and approach
        if(this.destination) {
            let infos = this.destination.GetInfos();
            if(infos instanceof AirportInfo) {
                if(this.arrivalIndex >= 0) {
                    await Coherent.call("SET_ARRIVAL_RUNWAY_INDEX", this.arrivalRunwayIndex);
                    await Coherent.call("SET_ARRIVAL_PROC_INDEX", this.arrivalIndex);
                    await Coherent.call("SET_ARRIVAL_ENROUTE_TRANSITION_INDEX", this.arrivalTransitionIndex);
                }
                if(this.approachIndex >= 0 && this.approachTransitionIndex >= 0) {
                    await Coherent.call("SET_APPROACH_INDEX", this.approachIndex).then(() => {
                        Coherent.call("SET_APPROACH_TRANSITION_INDEX", this.approachTransitionIndex);
                    });
                }
            }
        }
        // Do final stuff
//        await Coherent.call("RECOMPUTE_ACTIVE_WAYPOINT_INDEX");
        this.gps.currFlightPlanManager.updateFlightPlan(() => {
            let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
            if (elem) {
                elem.updateWaypoints();
            }
            this.setNav();
        });
    }

    // To be called before load
    AddWaypoint(icao, index) {
        if(!this.canAdd(index))
            return false;
        if(this.changeOrigin) {
            // If changing origin, the old origin becomes the first enroute wp 
            let newicao = "";
            if (this.origin)
                newicao = this.origin.icao;
            else
                this.origin = new WayPoint(this.gps);
            this.origin.icao = icao;
            this.origin.UpdateInfos();
            icao = newicao;
            if(!icao.length)
                return true;
            this.indexInEnroute = 0;
        }
        if(this.changeDestination) {
            // If changing destination, the old destination becomes the last enroute wp 
            let newicao = "";
            if (this.destination)
                newicao = this.destination.icao;
            else
                this.destination = new WayPoint(this.gps);
            this.destination.icao = icao;
            this.destination.UpdateInfos();
            icao = newicao;
            if(!icao.length)
                return true;
            this.indexInEnroute = this.enrouteWaypoints.length;
        }
        if(this.indexInEnroute >= 0 && icao.length) {
            var waypoint = new WayPoint(this.gps);
            waypoint.icao = icao;
            waypoint.UpdateInfos();
            if(this.indexInEnroute >= this.enrouteWaypoints.length) {
                // Add at the end of enroute
                this.enrouteWaypoints.push(waypoint);
                return true;
            }
            else {
                // Insert at given index
                this.enrouteWaypoints.splice(this.indexInEnroute, 0, waypoint);
                return true;
            }
        }
        return false;
    }

    canAdd(index, withMessage = false) {
        if(!this.gps.getConfigKey("wa_add_waypoint_bug", false))
            return true;
        this.indexInEnroute = -1;
        this.changeOrigin = false;
        this.changeDestination = false;
        this.message = "";
//        console.log("index:" + index);
        // If no origin , the flight plan is empty
        // We can add at index 0
        if(!this.origin)
        {
//            console.log("no origin");
            if(index == 0) {
//                console.log("no origin, adding origin");
                this.changeOrigin = true;
                return true;
            }
            this.message = "Add waypoint: bad index";
//            console.log("no origin, can only add at index 0");
            if(withMessage)
                this.setMessage();
            return false;
        }
        // If no destination , the flight plan has just one item
        // We can add at index 0 and 1
        if(!this.destination)
        {
//            console.log("no destination");
            if(index > 1) {
                this.message = "Add waypoint: bad index";
//                console.log("no destination, can only add at index 0 and 1");
                if(withMessage)
                    this.setMessage();
                return false;
            }
            if(index == 0) {
                this.changeOrigin = true;
//                console.log("no destination, changing origin and destination");
            }
            if(index == 1) {
//                console.log("no destination, adding destination");
                this.indexInEnroute = 0;
            }
            return true;
        }
        // Now we have origin and destination

        // Case insert before origin (new origin)
        if(index == 0) {
            if(this.departureIndex >= 0) {
                this.message = "Add waypoint: remove departure first";
//                console.log("cannot change origin if departure");
                if(withMessage)
                    this.setMessage();
                return false;
            }
//            console.log("new origin");
            this.changeOrigin = true;
            return true;
        }
//        console.log("depwpcount:" + this.gps.currFlightPlanManager.getDepartureWaypointsCount());
//        console.log("enroutewpcount:" + this.gps.currFlightPlanManager.getEnRouteWaypoints().length);
        let firstIndex = this.gps.currFlightPlanManager.getDepartureWaypointsCount()+1;
        let lastIndex = firstIndex + this.gps.currFlightPlanManager.getEnRouteWaypoints().length+1;
//        console.log("firstIndex:" + firstIndex);
//        console.log("lastIndex:" + lastIndex);
        // Case insert after destination
        if(index >= lastIndex){
            if(this.arrivalIndex >= 0 || this.approachIndex >= 0) {
                this.message = "Add waypoint: remove dep/arr first";
//                console.log("cannot add after destination if arrival or approach");
                if(withMessage)
                    this.setMessage();
                return false;
            }
            if(index > lastIndex + 1) {
                this.message = "Add waypoint: bad index";
//                console.log("index greater than last index");
                if(withMessage)
                    this.setMessage();
                return false;
            }
        }
//        console.log("depwpcount:" + this.gps.currFlightPlanManager.getDepartureWaypointsCount());
//        console.log("enroutewpcount:" + this.gps.currFlightPlanManager.getEnRouteWaypoints().length);
        // We can add to enroute only, not in procedure
        if(index < firstIndex || index > lastIndex) {
            this.message = "Add waypoint: bad index";
//            console.log("can add only into enroute");
            if(withMessage)
                this.setMessage();
            return false;
        }
        this.indexInEnroute = index-firstIndex;
        if(this.indexInEnroute > this.gps.currFlightPlanManager.getEnRouteWaypoints().length) {
//            console.log("Changing destination");
            this.changeDestination = true;
            this.indexInEnroute = -1;
        }
//        console.log("numenroutewp:" + this.gps.currFlightPlanManager.getEnRouteWaypoints().length);
//        console.log("indexInEnroute:" + this.indexInEnroute);
        return true;
    }
    setMessage() {
        this.gps.attemptAddWp++;
        setTimeout(() => {
            this.gps.attemptAddWp--;
            if(this.gps.attemptAddWp < 0)
                this.gps.attemptAddWp = 0;
        }, 20000);
    }

    setNav() {
        if(this.activateNav) {
            if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean"))
                return;
            SimVar.SetSimVarValue("L:AP_LNAV_ACTIVE", "number", 1);
            if(this.activateNav == 1)
                SimVar.SetSimVarValue("K:AP_NAV1_HOLD_ON", "number", 1);
            if(this.activateNav == 2)
                SimVar.SetSimVarValue("K:AP_APR_HOLD_ON", "number", 1);
        }
    }

}

/**
 * Methods for interacting with the FS9GPS subsystem.
 */
class GPS {
    /**
     * Clears the FS9GPS flight plan.
     */
    static async clearPlan() {
        const totalGpsWaypoints = SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointsNumber', 'number');
        for (var i = 0; i < totalGpsWaypoints; i++) {
            //Always remove waypoint 0 here, which shifts the rest of the waypoints down one
            await GPS.deleteWaypoint(0);
        }
    }
    /**
     * Adds a waypoint to the FS9GPS flight plan by ICAO designation.
     * @param icao The MSFS ICAO to add to the flight plan.
     * @param index The index of the waypoint to add in the flight plan.
     */
    static async addIcaoWaypoint(icao, index) {
        await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointICAO', 'string', icao);
        await SimVar.SetSimVarValue('C:fs9gps:FlightPlanAddWaypoint', 'number', index);
    }
    /**
     * Adds a user waypoint to the FS9GPS flight plan.
     * @param lat The latitude of the user waypoint.
     * @param lon The longitude of the user waypoint.
     * @param index The index of the waypoint to add in the flight plan.
     * @param ident The ident of the waypoint.
     */
    static async addUserWaypoint(lat, lon, index, ident) {
        await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointLatitude', 'degrees', lat);
        await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointLongitude', 'degrees', lon);
        if (ident) {
            await SimVar.SetSimVarValue('C:fs9gps:FlightPlanNewWaypointIdent', 'string', ident);
        }
        await SimVar.SetSimVarValue('C:fs9gps:FlightPlanAddWaypoint', 'number', index);
    }
    /**
     * Deletes a waypoint from the FS9GPS flight plan.
     * @param index The index of the waypoint in the flight plan to delete.
     */
    static async deleteWaypoint(index) {
        await SimVar.SetSimVarValue('C:fs9gps:FlightPlanDeleteWaypoint', 'number', index);
    }
    /**
     * Sets the active FS9GPS waypoint.
     * @param {Number} index The index of the waypoint to set active.
     */
    static async setActiveWaypoint(index) {
        await SimVar.SetSimVarValue('C:fs9gps:FlightPlanActiveWaypoint', 'number', index);
    }
    /**
     * Gets the active FS9GPS waypoint.
     */
    static getActiveWaypoint() {
        return SimVar.GetSimVarValue('C:fs9gps:FlightPlanActiveWaypoint', 'number');
    }
    /**
     * Logs the current FS9GPS flight plan.
     */
    static async logCurrentPlan() {
        const waypointIdents = [];
        const totalGpsWaypoints = SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointsNumber', 'number');
        for (var i = 0; i < totalGpsWaypoints; i++) {
            await SimVar.SetSimVarValue('C:fs9gps:FlightPlanWaypointIndex', 'number', i);
            waypointIdents.push(SimVar.GetSimVarValue('C:fs9gps:FlightPlanWaypointIdent', 'string'));
        }
        console.log(`GPS Plan: ${waypointIdents.join(' ')}`);
    }
}
