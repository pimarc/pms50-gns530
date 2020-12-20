
class GPS_Procedures extends NavSystemElement {
    init(root) {
        this.ActivateVTF = this.gps.getChildById("ActivateVTF");
        this.ActivateApproach = this.gps.getChildById("ActivateApproach");
        this.SelectApproach = this.gps.getChildById("SelectApproach");
        this.SelectArrival = this.gps.getChildById("SelectArrival");
        this.SelectDeparture = this.gps.getChildById("SelectDeparture");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.ActivateApproach, this.activateApproach_CB.bind(this)),
            new SelectableElement(this.gps, this.SelectApproach, this.selectApproach_CB.bind(this)),
            new SelectableElement(this.gps, this.SelectArrival, this.selectArrival_CB.bind(this)),
            new SelectableElement(this.gps, this.SelectDeparture, this.selectDeparture_CB.bind(this)),
        ];
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
        this.initialupdate = true;
        this.gps.ActiveSelection(this.defaultSelectables);
    }
    onUpdate(_deltaTime) {
        // Unactivate "Activate Approach" element if not relevant and preset selection
        if(this.initialupdate){
            this.gps.SwitchToInteractionState(1);
            this.initialupdate = false;
        }
        this.defaultSelectables[0].setActive(true);
        if (!this.gps.currFlightPlanManager.isLoadedApproach() || this.gps.currFlightPlanManager.isActiveApproach()) {
            this.defaultSelectables[0].setActive(false);
        }
    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onEvent(_event) {
    }
    activateVTF_CB(_event) {
    }
    activateApproach_CB(_event) {
    if (_event == "ENT_Push") {
            this.gps.activateApproach();
            this.gps.closePopUpElement();
            this.gps.SwitchToPageName("NAV", "DefaultNav");
        }
    }

    selectApproach_CB(_event) {
        if (_event == "ENT_Push") {
            this.gps.SwitchToInteractionState(0);
        this.gps.switchToPopUpPage(this.gps.selectApproachPage);
        }
    }
    selectArrival_CB(_event) {
        if (_event == "ENT_Push") {
            this.gps.SwitchToInteractionState(0);
            this.gps.switchToPopUpPage(this.gps.selectArrivalPage);
        }
    }
    selectDeparture_CB(_event) {
        if (_event == "ENT_Push") {
            this.gps.SwitchToInteractionState(0);
            this.gps.switchToPopUpPage(this.gps.selectDeparturePage);
        }
    }
}
class GPS_ApproachSelection extends MFD_ApproachSelection {
    init(root) {
        super.init(root);
        this.approachSelectionGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.approachList.getElementsByClassName("L1")[0], this.approach_CB.bind(this)),
            new SelectableElement(this.gps, this.approachList.getElementsByClassName("L2")[0], this.approach_CB.bind(this)),
            new SelectableElement(this.gps, this.approachList.getElementsByClassName("L3")[0], this.approach_CB.bind(this)),
            new SelectableElement(this.gps, this.approachList.getElementsByClassName("L4")[0], this.approach_CB.bind(this)),
            new SelectableElement(this.gps, this.approachList.getElementsByClassName("L5")[0], this.approach_CB.bind(this)),
            new SelectableElement(this.gps, this.approachList.getElementsByClassName("L6")[0], this.approach_CB.bind(this)),
        ], this.approachList.getElementsByClassName("Slider")[0], this.approachList.getElementsByClassName("SliderCursor")[0]);
        this.approachSelectables = [this.approachSelectionGroup];
        this.transitionSelectionGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L1")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L2")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L3")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L4")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L5")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L6")[0], this.transition_CB.bind(this)),
        ], this.transitionList.getElementsByClassName("Slider")[0], this.transitionList.getElementsByClassName("SliderCursor")[0]);
        this.transitionSelectables = [this.transitionSelectionGroup];
        this._t = 0;
    }
    onEnter(){
        super.onEnter();
        this._t = 0;
        this.mapContainer = this.gps.getChildById("ApproachSelectionMap");
        this.mapElement = this.gps.getElementOfType(GPS_WaypointMap);
        if(this.mapElement)
            this.mapElement.onEnter(this.mapContainer, 7);

        this.gps.cursorIndex = 0;
        let infos = this.icaoSearchField.getUpdatedInfos();
        if ((infos == null) || (infos.icao == "") || (!infos.approaches) || (!infos.approaches.length)) {
            this.gps.cursorIndex = 2;
        }
    }

    getSelectedApproach(airport) {
        if (airport && airport.approaches && this.selectedApproach >= 0 && this.selectedApproach < airport.approaches.length) {
            return airport.approaches[this.selectedApproach];
        }
        return null;
    }
    
    onUpdate(_deltaTime) {
        this._t++;
        if(this._t < 5)
            return;
        this._t = 0;
        super.onUpdate(_deltaTime);
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            this.updateMap(infos);
        }
    }
    updateMap(infos) {
        if(this.icaoSearchField.isActive)
            return;
        let approach = this.getSelectedApproach(infos);
        var waypoints = [];
        if(approach){
            var i = 0;
            if(this.selectedTransition >= 0 && approach.transitions && this.selectedTransition < approach.transitions.length) {
                let wps = approach.transitions[this.selectedTransition].waypoints;
                for(var i=0; i<wps.length; i++) {
                    if(wps[i].icao && wps[i].icao[0] != 'R' && wps[i].infos.coordinates){
                        if(i==0 || wps[i].icao != wps[i-1].icao)
                            waypoints.push(wps[i]);
                    }
                }
            }
            for(var i=0; i<approach.wayPoints.length; i++) {
                if(approach.wayPoints[i].icao && approach.wayPoints[i].icao[0] != 'R' && approach.wayPoints[i].infos.coordinates){
                    if(i>0 && approach.wayPoints[i].icao != approach.wayPoints[i-1].icao)
                        waypoints.push(approach.wayPoints[i]);
                }
            }
        }
        // Add the airport
        let distance = -1;
        if(this.icaoSearchField.getWaypoint()){
            // If no waypoints, add the current airport 2 times for it to be displayed
            if(!waypoints.length){
                waypoints.push(this.icaoSearchField.getWaypoint());
                distance = 10;
            }
            waypoints.push(this.icaoSearchField.getWaypoint());
        }
        if(this.mapElement)
            this.mapElement.updateMap(waypoints, infos.coordinates, distance);
    }

    loadApproach(_event) {
        if (_event == "ENT_Push") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao && infos.approaches && infos.approaches.length) {
                this.gps.currFlightPlanManager.setApproachIndex(this.selectedApproach, () => {
                    let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                    if (elem) {
                        elem.updateWaypoints();
                    }
                    setTimeout(() => {
                        this.gps.setApproachFrequency();
                    }, 2000);
//                    this.gps.loadMetar();
                }, this.selectedTransition);
            }
            this.gps.closePopUpElement();
            // This the way I've found to go to the flight plan page
            this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
            this.gps.currentEventLinkedPageGroup = null;
            this.gps.computeEvent("FPL_Push");
        }
    }
    activateApproach(_event) {
        if (_event == "ENT_Push") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao && infos.approaches.length) {
                this.gps.currFlightPlanManager.setApproachIndex(this.selectedApproach, () => {
                    let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                    if (elem) {
                        elem.updateWaypoints();
                    }
                    this.gps.activateApproach();                   
                }, this.selectedTransition);
                this.gps.closePopUpElement();
                this.gps.SwitchToPageName("NAV", "DefaultNav");
            }
            else {
                this.gps.closePopUpElement();
                // This the way I've found to go to the flight plan page
                this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
                this.gps.currentEventLinkedPageGroup = null;
                this.gps.computeEvent("FPL_Push");
            }
        }
    }
    
    onEvent(_event) {
        super.onEvent(_event);
        if (_event == "DRCT_Push"
            || _event == "FPL_Push"
            || _event == "PROC_Push"
            || _event == "MSG_Push"
            || _event == "VNAV_Push"
            || _event == "CLR_Push_Long"
            || _event == "CLR_Push") {
            this.gps.closePopUpElement();
            if (_event == "PROC_Push") {
                if(this.gps.currentEventLinkedPageGroup)
                    this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
                this.gps.currentEventLinkedPageGroup = null;
                this.gps.computeEvent("PROC_Push");
            }
            if (_event == "CLR_Push") {
                this.gps.SwitchToPageName("NAV", "DefaultNav");
                this.gps.currentEventLinkedPageGroup = null;
            }
        }
    }
    approach_CB(_event, _index) {
        if (_event == "ENT_Push") {
            this.selectApproach(_index, _event);
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 1;
        }
    }
    transition_CB(_event, _index) {
        if (_event == "ENT_Push") {
            this.selectTransition(_index, _event);
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 2;
        }
    }
    openApproachList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                let elems = new Array();
                for (let i = 0; i < infos.approaches.length; i++) {
                    elems.push(infos.approaches[i].name);
                }
                this.approachSelectionGroup.setStringElements(elems);
                if (elems.length > 0) {
                    this.approachList.setAttribute("state", "Active");
                    this.gps.ActiveSelection(this.approachSelectables);
                }
            }
        }
    }
    getSelectedApproach(airport) {
        if (airport && airport.approaches && this.selectedApproach >= 0 && this.selectedApproach < airport.approaches.length) {
            return airport.approaches[this.selectedApproach];
        }
        return null;
    }
    openTransitionList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao && infos.approaches.length) {
                let elems = new Array();
                let approach = this.getSelectedApproach(infos);
                if (approach) {
                    for (let i = 0; i < approach.transitions.length; i++) {
                        elems.push(approach.transitions[i].name);
                    }
                }
                this.transitionSelectionGroup.setStringElements(elems);
                if (elems.length > 0) {
                    this.transitionList.setAttribute("state", "Active");
                    this.gps.ActiveSelection(this.transitionSelectables);
                }
            }
        }
    }
    onExit() {
        if(this.mapElement)
            this.mapElement.onExit();
        super.onExit();
        this.approachList.setAttribute("state", "Inactive");
        this.transitionList.setAttribute("state", "Inactive");
    }
}
class GPS_ArrivalSelection extends MFD_ArrivalSelection {
    init(root) {
        super.init(root);
        this.arrivalSelectionGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L1")[0], this.arrival_CB.bind(this)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L2")[0], this.arrival_CB.bind(this)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L3")[0], this.arrival_CB.bind(this)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L4")[0], this.arrival_CB.bind(this)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L5")[0], this.arrival_CB.bind(this)),
            new SelectableElement(this.gps, this.arrivalList.getElementsByClassName("L6")[0], this.arrival_CB.bind(this)),
        ], this.arrivalList.getElementsByClassName("Slider")[0], this.arrivalList.getElementsByClassName("SliderCursor")[0]);
        this.arrivalSelectables = [this.arrivalSelectionGroup];
        this.runwaySelectionGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L1")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L2")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L3")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L4")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L5")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L6")[0], this.runway_CB.bind(this)),
        ], this.runwayList.getElementsByClassName("Slider")[0], this.runwayList.getElementsByClassName("SliderCursor")[0]);
        this.runwaySelectables = [this.runwaySelectionGroup];
        this.transitionSelectionGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L1")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L2")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L3")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L4")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L5")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L6")[0], this.transition_CB.bind(this)),
        ], this.transitionList.getElementsByClassName("Slider")[0], this.transitionList.getElementsByClassName("SliderCursor")[0]);
        this.transitionSelectables = [this.transitionSelectionGroup];
    }
    onEnter(){
        super.onEnter();
        this._t = 0;
        this.mapContainer = this.gps.getChildById("ArrivalSelectionMap");
        this.mapElement = this.gps.getElementOfType(GPS_WaypointMap);
        if(this.mapElement)
            this.mapElement.onEnter(this.mapContainer, 7);
    }
    getSelectedArrival(airport) {
        if (airport && airport.arrivals && this.selectedArrival >= 0 && this.selectedArrival < airport.arrivals.length) {
            return airport.arrivals[this.selectedArrival];
        }
        return null;
    }
    onUpdate(_deltaTime) {
        this._t++;
        if(this._t < 5)
            return;
        this._t = 0;
        super.onUpdate(_deltaTime);
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            this.updateMap(infos);
        }
    }
    updateMap(infos) {
        if(this.icaoSearchField.isActive)
            return;
        let arrival = this.getSelectedArrival(infos);
        var waypoints = [];
        if(arrival){
            if(this.selectedTransition >= 0 && arrival.enRouteTransitions && this.selectedTransition < arrival.enRouteTransitions.length) {
                let enRouteTransition = arrival.enRouteTransitions[this.selectedTransition];
                if (enRouteTransition && enRouteTransition.legs) {
                    for (let i = 0; i < enRouteTransition.legs.length; i++) {
                        let wp = new WayPoint(this.gps);
                        wp.icao = enRouteTransition.legs[i].fixIcao;
                        wp.ident = wp.icao.substr(7);
                        if(wp.icao.replace(/\s+/g, '').length){
                            wp.UpdateInfos();
                            waypoints.push(wp);
                        }
                    }
                }
            }
            if (arrival.commonLegs) {
                for (let i = 0; i < arrival.commonLegs.length; i++) {
                    let wp = new WayPoint(this.gps);
                    wp.icao = arrival.commonLegs[i].fixIcao;
                    wp.ident = wp.icao.substr(7);
                    if(wp.icao.replace(/\s+/g, '').length){
                        wp.UpdateInfos();
                        waypoints.push(wp);
                    }
            }
            }
            if(this.selectedRunway >= 0 && arrival.runwayTransitions && this.selectedRunway < arrival.runwayTransitions.length) {
                let runwayTransition = arrival.runwayTransitions[this.selectedRunway];
                if (runwayTransition && runwayTransition.legs) {
                    for (let i = 0; i < runwayTransition.legs.length; i++) {
                        let wp = new WayPoint(this.gps);
                        wp.icao = runwayTransition.legs[i].fixIcao;
                        wp.ident = wp.icao.substr(7);
                        if(wp.icao.replace(/\s+/g, '').length){
                            wp.UpdateInfos();
                            waypoints.push(wp);
                        }
                    }
                }
            }
        }
        // Add the airport
        let distance = -1;
        if(this.icaoSearchField.getWaypoint()){
            // If no waypoints, add the current airport 2 times for it to be displayed
            if(!waypoints.length){
                waypoints.push(this.icaoSearchField.getWaypoint());
                distance = 10;
            }
            waypoints.push(this.icaoSearchField.getWaypoint());
        }
        if(this.mapElement)
            this.mapElement.updateMap(waypoints, infos.coordinates, distance, false);
    }
    
    onEvent(_event) {
        super.onEvent(_event);
        if (_event == "DRCT_Push"
            || _event == "FPL_Push"
            || _event == "PROC_Push"
            || _event == "MSG_Push"
            || _event == "VNAV_Push"
            || _event == "CLR_Push_Long"
            || _event == "CLR_Push") {
            this.gps.closePopUpElement();
            if (_event == "PROC_Push") {
                if(this.gps.currentEventLinkedPageGroup)
                    this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
                this.gps.currentEventLinkedPageGroup = null;
                this.gps.computeEvent("PROC_Push");
            }
            if (_event == "CLR_Push") {
                this.gps.SwitchToPageName("NAV", "DefaultNav");
                this.gps.currentEventLinkedPageGroup = null;
            }
        }
    }
    loadArrival(_event) {
        super.loadArrival(_event);
        if (_event == "ENT_Push") {
            // This the way I've found to go to the flight plan page
            this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
            this.gps.currentEventLinkedPageGroup = null;
            this.gps.computeEvent("FPL_Push");
        }
    }
    arrival_CB(_event, _index) {
        if (_event == "ENT_Push") {
            this.selectArrival(_index, _event);
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 1;
            let infos = this.icaoSearchField.getUpdatedInfos();
            if ((infos == null) || (infos.icao == "") || (infos.arrivals.length <= this.selectedArrival) || (infos.arrivals[this.selectedArrival].enRouteTransitions.length == 0)) {
                this.gps.cursorIndex = 2;
            }
            if ((infos == null) || (infos.icao == "") || (infos.arrivals.length <= this.selectedArrival) || (infos.arrivals[this.selectedArrival].runwayTransitions.length == 0)) {
                this.gps.cursorIndex = 3;
            }
        }
    }
    runway_CB(_event, _index) {
        if (_event == "ENT_Push") {
            this.selectRunway(_index, _event);
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 3;
        }
    }
    transition_CB(_event, _index) {
        if (_event == "ENT_Push") {
            this.selectTransition(_index, _event);
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 2;
            let infos = this.icaoSearchField.getUpdatedInfos();
            if ((infos == null) || (infos.icao == "") || (infos.arrivals.length <= this.selectedArrival) || (infos.arrivals[this.selectedArrival].runwayTransitions.length == 0)) {
                this.gps.cursorIndex = 3;
            }
        }
    }
    openArrivalList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                let elems = new Array();
                for (let i = 0; i < infos.arrivals.length; i++) {
                    elems.push(infos.arrivals[i].name);
                }
                this.arrivalSelectionGroup.setStringElements(elems);
                if (elems.length > 0) {
                    this.arrivalList.setAttribute("state", "Active");
                    this.gps.ActiveSelection(this.arrivalSelectables);
                }
            }
        }
    }
    getSelectedArrival(airport) {
        if (airport && airport.arrivals && this.selectedArrival >= 0 && this.selectedArrival < airport.arrivals.length) {
            return airport.arrivals[this.selectedArrival];
        }
        return null;
    }
    openRunwaysList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                let elems = new Array();
                let arrival = this.getSelectedArrival(infos);
                if (arrival) {
                    for (let i = 0; i < arrival.runwayTransitions.length; i++) {
                        elems.push(arrival.runwayTransitions[i].name);
                    }
                }
                this.runwaySelectionGroup.setStringElements(elems);
                if (elems.length > 0) {
                    this.runwayList.setAttribute("state", "Active");
                    this.gps.ActiveSelection(this.runwaySelectables);
                }
            }
        }
    }
    openTransitionList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                let elems = new Array();
                let arrival = this.getSelectedArrival(infos);
                if (arrival) {
                    for (let i = 0; i < arrival.enRouteTransitions.length; i++) {
                        elems.push(arrival.enRouteTransitions[i].name);
                    }
                }
                this.transitionSelectionGroup.setStringElements(elems);
                if (elems.length > 0) {
                    this.transitionList.setAttribute("state", "Active");
                    this.gps.ActiveSelection(this.transitionSelectables);
                }
            }
        }
    }
    onExit() {
        if(this.mapElement)
            this.mapElement.onExit();
        super.onExit();
    }
}

class GPS_DepartureSelection extends MFD_DepartureSelection {
    init(root) {
        super.init(root);
        this.departureSelectionGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L1")[0], this.departure_CB.bind(this)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L2")[0], this.departure_CB.bind(this)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L3")[0], this.departure_CB.bind(this)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L4")[0], this.departure_CB.bind(this)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L5")[0], this.departure_CB.bind(this)),
            new SelectableElement(this.gps, this.departureList.getElementsByClassName("L6")[0], this.departure_CB.bind(this)),
        ], this.departureList.getElementsByClassName("Slider")[0], this.departureList.getElementsByClassName("SliderCursor")[0]);
        this.departureSelectables = [this.departureSelectionGroup];
        this.runwaySelectionGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L1")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L2")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L3")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L4")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L5")[0], this.runway_CB.bind(this)),
            new SelectableElement(this.gps, this.runwayList.getElementsByClassName("L6")[0], this.runway_CB.bind(this)),
        ], this.runwayList.getElementsByClassName("Slider")[0], this.runwayList.getElementsByClassName("SliderCursor")[0]);
        this.runwaySelectables = [this.runwaySelectionGroup];
        this.transitionSelectionGroup = new SelectableElementSliderGroup(this.gps, [
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L1")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L2")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L3")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L4")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L5")[0], this.transition_CB.bind(this)),
            new SelectableElement(this.gps, this.transitionList.getElementsByClassName("L6")[0], this.transition_CB.bind(this)),
        ], this.transitionList.getElementsByClassName("Slider")[0], this.transitionList.getElementsByClassName("SliderCursor")[0]);
        this.transitionSelectables = [this.transitionSelectionGroup];
    }
    onEnter(){
        super.onEnter();
        this._t = 0;
        this.mapContainer = this.gps.getChildById("DepartureSelectionMap");
        this.mapElement = this.gps.getElementOfType(GPS_WaypointMap);
        if(this.mapElement)
            this.mapElement.onEnter(this.mapContainer, 7);
    }
    getSelectedDeparture(airport) {
        if (airport && airport.departures && this.selectedDeparture >= 0 && this.selectedDeparture < airport.departures.length) {
            return airport.departures[this.selectedDeparture];
        }
        return null;
    }
    onUpdate(_deltaTime) {
        this._t++;
        if(this._t < 5)
            return;
        this._t = 0;
        super.onUpdate(_deltaTime);
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            this.updateMap(infos);
        }
    }
    updateMap(infos) {
        if(this.icaoSearchField.isActive)
            return;
        let departure = this.getSelectedDeparture(infos);
        var waypoints = [];
        if(departure){
            if(this.selectedRunway >= 0 && departure.runwayTransitions && this.selectedRunway < departure.runwayTransitions.length) {
                let runwayTransition = departure.runwayTransitions[this.selectedRunway];
                if (runwayTransition && runwayTransition.legs) {
                    for (let i = 0; i < runwayTransition.legs.length; i++) {
                        let wp = new WayPoint(this.gps);
                        wp.icao = runwayTransition.legs[i].fixIcao;
                        wp.ident = wp.icao.substr(7);
                        if(wp.icao.replace(/\s+/g, '').length){
                            wp.UpdateInfos();
                            waypoints.push(wp);
                        }
                    }
                }
            }
            if (departure.commonLegs) {
                for (let i = 0; i < departure.commonLegs.length; i++) {
                    let wp = new WayPoint(this.gps);
                    wp.icao = departure.commonLegs[i].fixIcao;
                    wp.ident = wp.icao.substr(7);
                    if(wp.icao.replace(/\s+/g, '').length){
                        wp.UpdateInfos();
                        waypoints.push(wp);
                    }
            }
            }
            if(this.selectedTransition >= 0 && departure.enRouteTransitions && this.selectedTransition < departure.enRouteTransitions.length) {
                let enRouteTransition = departure.enRouteTransitions[this.selectedTransition];
                if (enRouteTransition && enRouteTransition.legs) {
                    for (let i = 0; i < enRouteTransition.legs.length; i++) {
                        let wp = new WayPoint(this.gps);
                        wp.icao = enRouteTransition.legs[i].fixIcao;
                        wp.ident = wp.icao.substr(7);
                        if(wp.icao.replace(/\s+/g, '').length){
                            wp.UpdateInfos();
                            waypoints.push(wp);
                        }
                    }
                }
            }
        }
        // Add the airport
        let distance = -1;
        if(this.icaoSearchField.getWaypoint()){
            // If no waypoints, add the current airport 2 times for it to be displayed
            if(!waypoints.length){
                waypoints.unshift(this.icaoSearchField.getWaypoint());
                distance = 10;
            }
            waypoints.unshift(this.icaoSearchField.getWaypoint());
        }
        if(this.mapElement)
            this.mapElement.updateMap(waypoints, infos.coordinates, distance);
    }

    onEvent(_event) {
        super.onEvent(_event);
        if (_event == "DRCT_Push"
            || _event == "FPL_Push"
            || _event == "PROC_Push"
            || _event == "MSG_Push"
            || _event == "VNAV_Push"
            || _event == "CLR_Push_Long"
            || _event == "CLR_Push") {
            this.gps.closePopUpElement();
            if (_event == "PROC_Push") {
                if(this.gps.currentEventLinkedPageGroup)
                    this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
                this.gps.currentEventLinkedPageGroup = null;
                this.gps.computeEvent("PROC_Push");
            }
            if (_event == "CLR_Push") {
                this.gps.SwitchToPageName("NAV", "DefaultNav");
                this.gps.currentEventLinkedPageGroup = null;
            }
        }
    }
    loadDeparture(_event) {
        super.loadDeparture(_event);
        if (_event == "ENT_Push") {
            // This the way I've found to go to the flight plan page
            this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
            this.gps.currentEventLinkedPageGroup = null;
            this.gps.computeEvent("FPL_Push");
        }
    }

    departure_CB(_event, _index) {
        this.selectDeparture(_index, _event);
        if (_event == "ENT_Push") {
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 1;
            let infos = this.icaoSearchField.getUpdatedInfos();
            if ((infos == null) || (infos.icao == "") || (infos.departures.length <= this.selectedDeparture) || (infos.departures[this.selectedDeparture].enRouteTransitions.length == 0)) {
                this.gps.cursorIndex = 2;
            }
            if ((infos == null) || (infos.icao == "") || (infos.departures.length <= this.selectedDeparture) || (infos.departures[this.selectedDeparture].runwayTransitions.length == 0)) {
                this.gps.cursorIndex = 3;
            }
        }
    }
    runway_CB(_event, _index) {
        this.selectRunway(_index, _event);
        if (_event == "ENT_Push") {
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 3;
        }
    }
    transition_CB(_event, _index) {
        this.selectTransition(_index, _event);
        if (_event == "ENT_Push") {
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 3;
            let infos = this.icaoSearchField.getUpdatedInfos();
            if ((infos == null) || (infos.icao == "") || (infos.departures.length <= this.selectedDeparture) || (infos.departures[this.selectedDeparture].runwayTransitions.length == 0)) {
                this.gps.cursorIndex = 3;
            }
        }
    }
    openDepartureList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                let elems = new Array();
                for (let i = 0; i < infos.departures.length; i++) {
                    elems.push(infos.departures[i].name);
                }
                this.departureSelectionGroup.setStringElements(elems);
                if (elems.length > 0) {
                    this.departureList.setAttribute("state", "Active");
                    this.gps.ActiveSelection(this.departureSelectables);
                }
            }
        }
    }
    openRunwaysList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                let elems = new Array();
                let departure = this.getSelectedDeparture(infos);
                if (departure) {
                    for (let i = 0; i < departure.runwayTransitions.length; i++) {
                        elems.push(departure.runwayTransitions[i].name);
                    }
                }
                this.runwaySelectionGroup.setStringElements(elems);
                if (elems.length > 0) {
                    this.runwayList.setAttribute("state", "Active");
                    this.gps.ActiveSelection(this.runwaySelectables);
                }
            }
        }
    }
    openTransitionList(_event) {
        if (_event == "ENT_Push" || _event == "NavigationSmallInc" || _event == "NavigationSmallDec") {
            let infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                let elems = new Array();
                let departure = this.getSelectedDeparture(infos);
                if (departure) {
                    for (let i = 0; i < departure.enRouteTransitions.length; i++) {
                        elems.push(departure.enRouteTransitions[i].name);
                    }
                }
                this.transitionSelectionGroup.setStringElements(elems);
                if (elems.length > 0) {
                    this.transitionList.setAttribute("state", "Active");
                    this.gps.ActiveSelection(this.transitionSelectables);
                }
            }
        }
    }
    onExit() {
        if(this.mapElement)
            this.mapElement.onExit();
        super.onExit();
    }
}
