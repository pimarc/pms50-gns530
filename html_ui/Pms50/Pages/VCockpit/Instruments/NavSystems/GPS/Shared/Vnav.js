class GPS_Vnav extends NavSystemElement {
    constructor() {
        super();
        this.name = "VNAV";
        this.menuname = "";
    }
    init() {
        this.altitude = this.gps.getChildById("VnavTargetAltitudeValue");
        this.posdis = this.gps.getChildById("VnavTargetDistanceValue");
        this.posref = this.gps.getChildById("VnavTargetReferenceValue");
        this.poswp = this.gps.getChildById("VnavTargetWaypoint");
        this.profile = this.gps.getChildById("VnavProfileValue");
        this.vsr = this.gps.getChildById("VnavVsrValue");
        this.status = this.gps.getChildById("VnavStatusValue");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.altitude, this.Altitude_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.posdis, this.PosDistance_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.posref, this.PosReference_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.poswp, this.PosWaypoint_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.profile, this.Profile_SelectionCallback.bind(this))
        ];
        this.targetWaypoint = null;
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onUpdate(_deltaTime) {
        var targetInfo = this.GetTargetInfo();
        if(!targetInfo || !targetInfo.length){
            this.vsr.textContent = "_____";
            this.status.textContent = "";
            return;
        }
        this.vsr.textContent =  targetInfo[0];
        var timeToDescent = targetInfo[1];
        var hours = parseInt( timeToDescent / 3600 ) % 24;
        var minutes = parseInt( timeToDescent / 60 ) % 60;
        var seconds = timeToDescent % 60;
        var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);

        hours = Math.floor(timeToDescent / 3600);
        timeToDescent %= 3600;
        minutes = Math.floor(timeToDescent / 60);
        seconds = timeToDescent % 60;
        this.status.textContent = timeToDescent > 20 ? "Begin Descent in " + result : "Descend to target"; 
    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onEvent(_event) {
        if (_event == "CLR_Push") {
            this.gps.ActiveSelection(this.defaultSelectables);
            if (this.gps.popUpElement || this.gps.currentContextualMenu) {
                this.gps.closePopUpElement();
                this.gps.SwitchToInteractionState(1);
                this.gps.cursorIndex = 3;
                this.menuname = "";
                this.gps.currentContextualMenu = null;
            }
            else {
                this.menuname = "";
                this.gps.SwitchToInteractionState(0);
                this.gps.SwitchToPageName("NAV", "DefaultNav");
                this.gps.currentEventLinkedPageGroup = null;
                }
        }
    }
    Altitude_SelectionCallback(_event) {
        if (_event == "RightSmallKnob_Right"){
            var value = parseInt(this.altitude.textContent);
            if(value < 5000)
                value += 100;
            else
                value += 500;
            this.altitude.textContent = value;
        }
        if (_event == "RightSmallKnob_Left"){
            var value = parseInt(this.altitude.textContent);
            if(value <= 5000)
                value -= 100;
            else
                value -= 500;
            if(value < 0)
                value = 0;
            this.altitude.textContent = value;
        }
    }
    PosDistance_SelectionCallback(_event) {
        if (_event == "RightSmallKnob_Right"){
            var value = parseFloat(this.posdis.textContent);
            if(value < 5)
                value += 0.2;
            else if(value < 10)
                value += 0.5;
            else
                value += 1;
            this.posdis.textContent =  value.toFixed(1);
        }
        if (_event == "RightSmallKnob_Left"){
            var value = parseFloat(this.posdis.textContent);
            if(value <= 5)
                value -= 0.2;
            else if(value <= 10)
                value -= 0.5;
            else
                value -= 1;
            if(value < 0)
                value = 0;
            this.posdis.textContent =  value.toFixed(1);
        }
    }
    PosReference_SelectionCallback(_event) {
        if (_event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left")
            this.posref.textContent = this.posref.textContent == "Before" ? "After" : "Before";
    }
    PosWaypoint_SelectionCallback(_event) {
        if (_event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var elements = [];
            var i = 0;

            var wayPointList = this.gps.currFlightPlanManager.getWaypoints();
            wayPointList = wayPointList.concat(this.gps.currFlightPlanManager.getApproachWaypoints());
            for (; i < wayPointList.length; i++) {
                // We add only valid waypoints (not the ones of "user" type)
                if(wayPointList[i].icao.substr(0,2) != 'U '){
                    elements.push(new ContextualMenuElement(wayPointList[i].GetInfos().ident, function (_index) {
                    this.targetWaypoint = wayPointList[_index];
                    this.poswp.textContent = this.targetWaypoint.ident;
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 3;
                    }.bind(this, i)));
                }
            }
            if (wayPointList.length > 0) {
                this.gps.ShowContextualMenu(new ContextualMenu("FPL", elements));
                this.menuname = "fpl";
            }
        }
    }
    Profile_SelectionCallback(_event) {
        if (_event == "RightSmallKnob_Right"){
            var value = parseInt(this.profile.textContent);
                value += 100;
            this.profile.textContent = value;
        }
        if (_event == "RightSmallKnob_Left"){
            var value = parseInt(this.profile.textContent);
            value -= 100;
            if(value < 0)
                value = 0;
            this.profile.textContent = value;
        }
    }
    GetTargetInfo(){
        var targetInfos = [];
        if(this.targetWaypoint == null)
            return targetInfos;
        var groundSpeed = fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0);
        // Do nothing if ground speed too slow
        if(groundSpeed < 35)
            return targetInfos;
        var currentAltitude = fastToFixed(SimVar.GetSimVarValue("GPS POSITION ALT", "feet"), 0);
        var targetAltitude = this.altitude.textContent;

        // Don't calculate anything if near the target altitude
        if(targetAltitude > currentAltitude - 100 && targetAltitude < currentAltitude + 100)
            return targetInfos;
        // Don't use vnav to climb
        if(targetAltitude > currentAltitude)
            return targetInfos;

        var nextWpIdent = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
        if(nextWpIdent == "")
            return targetInfos;

        // Search target in current flight plan
        var DistanceToTarget = 0;
        var wayPointList = this.gps.currFlightPlanManager.getWaypoints();
        wayPointList = wayPointList.concat(this.gps.currFlightPlanManager.getApproachWaypoints());
        var index = -1;
        var tinfo = this.targetWaypoint.GetInfos();
        var cumDistanceNext = 0;
        var nextBeforeTarget = false; // Used to check that the target WP is the next wp or after it
        for (var i=0; i < wayPointList.length; i++) {
            let info = wayPointList[i].GetInfos();
            let waypoint = wayPointList[i];
            if(waypoint.ident == nextWpIdent){
                var nextBeforeTarget = true;
                cumDistanceNext = waypoint.cumulativeDistanceInFP;
            }
            if((info.ident == tinfo.ident) && (info.icao == tinfo.icao) && (info.coordinates == tinfo.coordinates)){
                index = i;
                DistanceToTarget = waypoint.cumulativeDistanceInFP - cumDistanceNext;               
                break;
            }
        }
        if(index == -1 || !nextBeforeTarget){
            // Target not found or target is before next point (possible with a direct to)
            this.targetWaypoint = null;
            return targetInfos;           
        }
        // Add the distance to next WP
        DistanceToTarget += SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles");
        // Add or substract the offset distance to have the complete distance to target
        if(this.posref.textContent == "Before")
            DistanceToTarget -= parseFloat(this.posdis.textContent);
        else
            DistanceToTarget += parseFloat(this.posdis.textContent);

        // We are ok here.
        var difAltitude = currentAltitude- targetAltitude;
        var desrate = (Math.atan(difAltitude / (DistanceToTarget * 6076.115486)) * 180 / Math.PI) / 0.6;
        var vsr = fastToFixed(-desrate * groundSpeed, 0);

        var profileVs = parseInt(this.profile.textContent);
        var profiledesangle = (profileVs / groundSpeed) * 0.6;
        var profileDistanceToTarget = (difAltitude / 100) / profiledesangle;
        var profileDistanceToDescent = DistanceToTarget - profileDistanceToTarget;
        if(profileDistanceToDescent <0)
            profileDistanceToDescent = 0;
        var timeToDescent = fastToFixed((profileDistanceToDescent / groundSpeed) * 3600, 0);
        if(timeToDescent < 0)
            timeToDescent = 0;
        targetInfos = [vsr, timeToDescent];
        return targetInfos;
    }
}
