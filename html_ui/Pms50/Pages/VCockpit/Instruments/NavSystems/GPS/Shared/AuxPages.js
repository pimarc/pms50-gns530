class GPS_COMSetup extends NavSystemElement {
    init(root) {
        this.channelSpacingValue = this.gps.getChildById("ChannelSpacing_Value");
        this.channelSpacingMenu = new ContextualMenu("SPACING", [
            new ContextualMenuElement("8.33 KHZ", this.channelSpacingSet.bind(this, 1)),
            new ContextualMenuElement("25.0 KHZ", this.channelSpacingSet.bind(this, 0))
        ]);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.channelSpacingValue, this.channelSpacingCB.bind(this))
        ];
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.channelSpacingValue, SimVar.GetSimVarValue("COM SPACING MODE:" + this.gps.comIndex, "Enum") == 0 ? "25.0 KHZ" : "8.33 KHZ");
    }
    onExit() {
    }
    onEvent(_event) {
    }
    channelSpacingCB(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            this.gps.ShowContextualMenu(this.channelSpacingMenu);
        }
    }
    channelSpacingSet(_mode) {
        if (SimVar.GetSimVarValue("COM SPACING MODE:" + this.gps.comIndex, "Enum") != _mode) {
            SimVar.SetSimVarValue("K:COM_" + this.gps.comIndex + "_SPACING_MODE_SWITCH", "number", 0);
        }
        this.gps.SwitchToInteractionState(0);
    }
}

class GPS_METAR extends NavSystemElement {
    constructor(_icaoSearchField) {
        super();
        this.name = "METAR";
        this.icaoSearchField = _icaoSearchField;
    }
    init(root) {
        this.identElement = this.gps.getChildById("APTIdent");
        this.metarElement = this.gps.getChildById("MetarData");
        this.container.defaultMenu = new ContextualMenu("METAR", [
            new ContextualMenuElement("METAR Origin", this.metarOriginSet.bind(this), this.metarOriginSetCB.bind(this)),
            new ContextualMenuElement("METAR Destin.", this.metarDestinationSet.bind(this,), this.metarDestinationSetCB.bind(this,))
        ]);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.searchField_SelectionCallback.bind(this))
        ];
        this.icaoSearchField.elements.push(this.identElement);
        this.metarData = "";
    }
    onEnter() {
        if (this.gps.lastRelevantICAO && this.gps.lastRelevantICAOType == "A") {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
            this.initialIcao = this.gps.lastRelevantICAO;
        }
        else if (this.gps.icaoFromMap && this.gps.icaoFromMap[0] == "A") {
            this.icaoSearchField.SetWaypoint(this.gps.icaoFromMap[0], this.gps.icaoFromMap);
            this.initialIcao = this.gps.icaoFromMap;
        }
        var infos = this.icaoSearchField.getUpdatedInfos();
        if(!infos || !infos.icao) {
            let destination = this.gps.currFlightPlanManager.getDestination();
            if(destination){
                this.icaoSearchField.SetWaypoint("A", destination.icao);
            }
        }
        if(this.icaoSearchField.wayPoint) {
            this.updateMetar(this.icaoSearchField.wayPoint.ident);
        }
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao && infos instanceof AirportInfo) {
        }
        else {
            this.identElement.textContent = "_____";
            this.metarElement.textContent = "";
        }
    }
    onExit() {
    }
    onEvent(_event) {
        if (_event == "ENT_Push") {
            if(this.gps.currentInteractionState == 0 && this.icaoSearchField.wayPoint) {
                this.updateMetar(this.identElement.textContent);
            }
        }
    }
    searchField_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.metarElement.textContent = "";
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(function () {
                if(this.icaoSearchField.wayPoint) {
                    this.updateMetar(this.icaoSearchField.wayPoint.ident);
                }
            }.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    metarOriginSetCB() {
        var origin = this.gps.currFlightPlanManager.getOrigin();
        if(origin && origin.GetInfos().getWaypointType() == "A" )
            return false;
        return true;
    }
    metarDestinationSetCB() {
        var destination = this.gps.currFlightPlanManager.getDestination();
        if(destination && destination.GetInfos().getWaypointType() == "A" )
            return false;
        return true;
    }
    metarOriginSet() {
        this.gps.SwitchToInteractionState(0);
        var origin = this.gps.currFlightPlanManager.getOrigin();
        this.icaoSearchField.SetWaypoint("A", origin.icao);
        this.updateMetar(origin.ident);
    }
    metarDestinationSet() {
        this.gps.SwitchToInteractionState(0);
        var destination = this.gps.currFlightPlanManager.getDestination();
        this.icaoSearchField.SetWaypoint("A", destination.icao);
        this.updateMetar(destination.ident);
    }
    updateMetar(ident) {
        this.metarElement.textContent = "";
        this.gps.loadMetar(ident, (metar_data) => {
            if(metar_data.length) {
                let data = JSON.parse(metar_data);
                if(data && data.sanitized) {
                    // Do display row
                    this.metarElement.innerHTML = data.sanitized.replace(" TEMPO", "<br />TEMPO");
                }
                else
                    this.metarElement.textContent = "No data";
            }
            else
                this.metarElement.textContent = "No data";
        });
    }
}