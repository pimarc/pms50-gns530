

class GPS_ConfirmationWindow extends NavSystemElement {
    constructor() {
        super();
        this.CurrentText = "Confirm ?";
        this.CurrentButton1Text = "Yes";
        this.CurrentButton2Text = "No";
        this.Result = 0;
        this.Active = false;
    }
    init(root) {
        this.window = this.gps.getChildById("ConfirmationWindow");
        this.text = this.gps.getChildById("CW_ConfirmationWindowText");
        this.button1 = this.gps.getChildById("CW_ConfirmationWindowButton1");
        this.button1Text = this.gps.getChildById("CW_ConfirmationWindowButton1Text");
        this.button2 = this.gps.getChildById("CW_ConfirmationWindowButton2");
        this.button2Text = this.gps.getChildById("CW_ConfirmationWindowButton2Text");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.button1, this.button1_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.button2, this.button2_SelectionCallback.bind(this)),
        ];
    }
    onEnter() {
        this.initialupdate = true;
        this.Result = 0;
        this.gps.ActiveSelection(this.defaultSelectables);
        this.gps.cursorIndex = 0;
        this.Active = true;
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        if(this.initialupdate){
            this.gps.SwitchToInteractionState(1);
            this.initialupdate = false;
        }
        this.defaultSelectables[0].setActive(true);
        this.text.textContent = this.CurrentText;
        this.button1Text.textContent = this.CurrentButton1Text;
        this.button2Text.textContent = this.CurrentButton2Text;
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
        this.Active = false;
    }
    onEvent(_event) {
        if (_event == "CLR_Push") {
            this.Result = 2;
            this.gps.closePopUpElement();
        }
    }
    button1_SelectionCallback(_event) {
        if (_event == "ENT_Push") {
            this.Result = 1;
            this.gps.closePopUpElement();
        }
    }
    button2_SelectionCallback(_event) {
        if (_event == "ENT_Push") {
            this.Result = 2;
            this.gps.closePopUpElement();
        }
    }
    setTexts(WindowText = "Confirm ?", Button1Txt = "Yes", Button2Text = "No") {
        this.CurrentText = WindowText;
        this.CurrentButton1Text = Button1Txt;
        this.CurrentButton2Text = Button2Text;
    }
}

class GPS_AlertWindow extends NavSystemElement {
    constructor() {
        super();
        this.CurrentText = "Alert";
        this.CurrentButtonText = "Ok";
        this.Active = false;
    }
    init(root) {
        this.window = this.gps.getChildById("AlertWindow");
        this.text = this.gps.getChildById("CW_AlertWindowText");
        this.button = this.gps.getChildById("CW_AlertWindowButton");
        this.buttonText = this.gps.getChildById("CW_AlertWindowButtonText");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.button, this.button_SelectionCallback.bind(this)),
        ];
    }
    onEnter() {
        this.initialupdate = true;
        this.gps.ActiveSelection(this.defaultSelectables);
        this.gps.cursorIndex = 0;
        this.Active = true;
        this.window.setAttribute("state", "Active");
    }
    onUpdate(_deltaTime) {
        if(this.initialupdate){
            this.gps.SwitchToInteractionState(1);
            this.initialupdate = false;
        }
        this.defaultSelectables[0].setActive(true);
        this.text.textContent = this.CurrentText;
        this.buttonText.textContent = this.CurrentButtonText;
    }
    onExit() {
        this.window.setAttribute("state", "Inactive");
        this.Active = false;
    }
    onEvent(_event) {
        if (_event == "CLR_Push") {
            this.gps.closePopUpElement();
        }
    }
    button_SelectionCallback(_event) {
        if (_event == "ENT_Push") {
            this.gps.closePopUpElement();
        }
    }
    setTexts(WindowText = "Alert", ButtonTxt = "Ok") {
        this.CurrentText = WindowText;
        this.CurrentButtonText = ButtonTxt;
    }
}

class GPS_Messages extends NavSystemElement {
    constructor() {
        super();
        this.name = "MSG";
        this.annunciations = new GPS_Annunciations();
        this.initialized = false;
    }
    init(root) {
//        this.messages = new MessageList(this.gps);
        if(!this.initialized) {
            this.initialized = true;
            this.messagesWindow = this.gps.getChildById("Messages");
            this.annunciations.setGPS(this.gps);
            this.annunciations.init(root);
        }
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.annunciations.onEnter();
    }
    onUpdate(_deltaTime) {
//        var html = "";
//        this.messagesWindow.innerHTML = html;
        this.annunciations.onUpdate(_deltaTime);
    }
    onExit() {
        this.annunciations.onExit();
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onEvent(_event) {
        this.annunciations.onEvent(_event);
        if (_event == "CLR_Push") {
            this.gps.SwitchToInteractionState(0);
            this.gps.SwitchToPageName("NAV", "DefaultNav");
            this.gps.currentEventLinkedPageGroup = null;
        }
    }
    onSoundEnd(_eventId) {
        this.annunciations.onSoundEnd(_eventId);
    }
    hasMessages() {
        return this.annunciations.hasMessages();
    }
    hasNewMessages() {
        return this.annunciations.hasNewMessages();
    }
}


class GPS_Annunciations extends PFD_Annunciations {
    constructor() {
        super(...arguments);
        this.isActive = false;
        this._t_airspaces = 0;
    }
    init(root) {
        // We have rebuilt all the init in order to discard XML engine alert messages. They should not be displayed in these GPS.
//        super.init(root);
        this.engineType = Simplane.getEngineType();
        if (this.rootElementName != "")
            this.annunciations = this.gps.getChildById(this.rootElementName);
        this.newAnnunciations = this.gps.getChildById("newAnnunciations");
        this.acknowledged = this.gps.getChildById("acknowledged");
        this.addMessage(Annunciation_MessageType.CAUTION, "Invalid waypoint index", this.invalidIndex);
        this.addMessage(Annunciation_MessageType.ADVISORY, "Set course to", this.chekCourse);
        this.addMessage(Annunciation_MessageType.ADVISORY, "Arrival at waypoint", this.arrivalWp);
        this.addMessage(Annunciation_MessageType.WARNING, "Attempt to delete active waypoint", this.deleteWpLeg);
        this.addMessage(Annunciation_MessageType.WARNING, "Attempt to delete proc waypoint", this.deleteWpProc);
        this.addMessage(Annunciation_MessageType.WARNING, "Cannot add waypoint at this place", this.addWp);
        this.addMessage(Annunciation_MessageType.WARNING, "Approach is not active", this.approachNotActive);
        this.addMessage(Annunciation_MessageType.ADVISORY, "Near airspace -- less than 2nm", this.airspaceNear);
        this.addMessage(Annunciation_MessageType.ADVISORY, "Airspace ahead -- less than 10 min", this.airspaceAhead);
        this.addMessage(Annunciation_MessageType.ADVISORY, "Airspace near and ahead", this.airspaceNearAhead);
        this.addMessage(Annunciation_MessageType.ADVISORY, "Inside airspace", this.airspaceInside);
//        this.addMessage(Annunciation_MessageType.WARNING, "Test Obs < 10", this.testObs);
//        this.addMessage(Annunciation_MessageType.ADVISORY, "Test Obs < 10", this.testObs);
//        this.addMessage(Annunciation_MessageType.WARNING, "Test message 1", this.sayTrue);
        // switch (this.engineType) {
        //     case EngineType.ENGINE_TYPE_PISTON:
        //         break;
        //     case EngineType.ENGINE_TYPE_TURBOPROP:
        //     case EngineType.ENGINE_TYPE_JET:
        //         this.addMessageMultipleConditions(Annunciation_MessageType.WARNING, "ITT", [
        //             new Condition(this.itt.bind(this, "1000")),
        //             new Condition(this.itt.bind(this, "870"), 5),
        //             new Condition(this.itt.bind(this, "840"), 20)
        //         ]);
        //         this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["FUEL LOW L", "FUEL LOW R", "FUEL LOW L-R"], this.fuelLowSelector);
        //         break;
        // }
    }
    onEnter() {
        super.onEnter();
        this.isActive = true;
    }
    onExit() {
        super.onExit();
        this.isActive = false;
    }
    onUpdate(_deltaTime) {
        // Set all messages to unacknowledged state here
        if(this.isActive){
            // Set all the visible messages to acknowledged state
            for (let i = 0; i < this.allMessages.length; i++) {
                if (this.allMessages[i].Visible) {
                    this.allMessages[i].Acknowledged = true;
                    this.needReload = true;
                }
            }
        }
        if(this.gps)
            this.gps.airspaceList.Update();
        // this._t_airspaces++;
        // if(this._t_airspaces > 10) {
        //     this._t_airspaces = 0;
        // }
        super.onUpdate(_deltaTime);
    }

    addMessage(_type, _text, _handler) {
        var msg = new Annunciation_Message();
        msg.Type = _type;
        msg.Text = _text;
        msg.gps = this.gps;
        msg.Handler = _handler.bind(msg);
        this.allMessages.push(msg);
    }
    
    // Bug with POI waypoints
    invalidIndex() {
        if(!SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean"))
            return false;
        if(this.gps.currFlightPlanManager.getWaypointsCount() < 2)
            return false;
        if(this.gps.currFlightPlanManager.getActiveWaypointIndex() >= 0)
            return false;
        if(this.gps.currFlightPlanManager.getIsDirectTo())
            return false;
        this.Text = "Invalid waypoint index";
        let nextWaypoint = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
        if(nextWaypoint && nextWaypoint.length)
            this.Text += ": " + nextWaypoint.slice(0, 7);
        return true;
    }
    chekCourse(){
        if(!SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean"))
            return false;
        // No message if near the ground
        if(SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet") < 100)
            return false;
        // No message if autopilot in nav mode
        if(SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "boolean"))
            return false;
        var brg = SimVar.GetSimVarValue("GPS WP BEARING", "degree");
        var trk = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree");
        if(Math.abs(brg-trk) < 10)
            return false;
        this.Text = "Set course to " + Utils.leadingZeros(fastToFixed(brg, 0), 3) + "°";
        return true;
    }
    deleteWpLeg() {
        return this.gps.attemptDeleteWpLeg;      
    }
    deleteWpProc() {
        return this.gps.attemptDeleteWpProc;      
    }
    addWp() {
        return this.gps.attemptAddWp;      
    }
    approachNotActive() {
        // Check if next point is destination and if approach is loaded
        if(this.gps.currFlightPlanManager.isLoadedApproach() && !this.gps.currFlightPlanManager.isActiveApproach() && this.gps.currFlightPlanManager.getDestination()) {
            if(this.gps.currFlightPlanManager.getActiveWaypointIdent() == this.gps.currFlightPlanManager.getDestination().ident) {
                let distance = this.gps.getDistanceToDestination();
                if(distance < 30) {
                    // Set the message
                    return true;
                }
            }
        }
        return false;
    }
    arrivalWp() {
        if(!SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean"))
            return false;
        if(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") < 20)
            return false;
        if(SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles") < 2) {
            this.Text = "Arrival at waypoint " + this.gps.currFlightPlanManager.getActiveWaypointIdent();
            return true;
        }
        return false;        
    }
    airspaceNear() {
        // No message if near the ground
        if(SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet") < 100)
            return false;
        if(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") < 20)
            return false;
        // Disable if approach loaded and distance to destination is less than 30nm
        if(this.gps.currFlightPlanManager.isLoadedApproach() && this.gps.getDistanceToDestination() < 30)
            return false;
        for(var i=0; i < this.gps.airspaceList.airspaces.length; i++) {
            if(this.gps.airspaceList.airspaces[i].status == 1)
                return true;
        }
        return false;
    }
    airspaceAhead() {
        // No message if near the ground
        if(SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet") < 100)
            return false;
        if(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") < 20)
            return false;
        // Disable if approach loaded and distance to destination is less than 30nm
        if(this.gps.currFlightPlanManager.isLoadedApproach() && this.gps.getDistanceToDestination() < 30)
            return false;
        for(var i=0; i < this.gps.airspaceList.airspaces.length; i++) {
            if(this.gps.airspaceList.airspaces[i].status == 2 && this.gps.airspaceList.airspaces[i].aheadTime < 600)
                return true;
        }
        return false;
    }
    airspaceNearAhead() {
        // No message if near the ground
        if(SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet") < 100)
            return false;
        if(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") < 20)
            return false;
        // Disable if approach loaded and distance to destination is less than 30nm
        if(this.gps.currFlightPlanManager.isLoadedApproach() && this.gps.getDistanceToDestination() < 30)
            return false;
        for(var i=0; i < this.gps.airspaceList.airspaces.length; i++) {
            if(this.gps.airspaceList.airspaces[i].status == 3 && this.gps.airspaceList.airspaces[i].nearDistance <= 2)
                return true;
        }
        return false;
    }
    airspaceInside() {
        // No message if near the ground
        if(SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet") < 100)
            return false;
        if(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") < 20)
            return false;
        // Disable if approach loaded and distance to destination is less than 30nm
        if(this.gps.currFlightPlanManager.isLoadedApproach() && this.gps.getDistanceToDestination() < 30)
            return false;
        for(var i=0; i < this.gps.airspaceList.airspaces.length; i++) {
            if(this.gps.airspaceList.airspaces[i].status == 4)
                return true;
        }
        return false;
    }
    testObs() {
        let obs = SimVar.GetSimVarValue("NAV OBS:1", "degrees");
        if(obs < 10)
            return true;
        return false;
    }
    sayTrue() {
        return true;
    }
    
    // itt(_limit = 840) {
    //     let itt = SimVar.GetSimVarValue("TURB ENG ITT:1", "celsius");
    //     return (itt > _limit);
    // }
    // fuelLowSelector() {
    //     let left = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "gallon") < 9;
    //     let right = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "gallon") < 9;
    //     if (left && right) {
    //         return 3;
    //     }
    //     else if (left) {
    //         return 1;
    //     }
    //     else if (right) {
    //         return 2;
    //     }
    //     else {
    //         return 0;
    //     }
    // }
    hasMessages() {
        for (var i = 0; i < this.allMessages.length; i++) {
            if (this.allMessages[i].Visible) {
                return true;
            }
        }
        return false;
    }
    hasNewMessages() {
        // Check if there is a new warning or caution message
        // Used in GPS to blink the MSG indicator
        if(this.isActive)
            return false;
        for (var i = 0; i < this.allMessages.length; i++) {
            if (this.allMessages[i].Visible && !this.allMessages[i].Acknowledged && (this.allMessages[i].Type != Annunciation_MessageType.ADVISORY)) {
                return true;
            }
        }
        return false;
    }
}
