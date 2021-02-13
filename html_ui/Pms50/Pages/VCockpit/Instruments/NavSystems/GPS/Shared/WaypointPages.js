class GPS_AirportWaypointLocation extends NavSystemElement {
    constructor(_icaoSearchField) {
        super();
        this.name = "AirportLocation";
        this.icaoSearchField = _icaoSearchField;
    }
    init() {
        this.ident = this.gps.getChildById("APTLocIdent");
        this.privateLogo = this.gps.getChildById("APTLocPrivateLogo");
        this.private = this.gps.getChildById("APTLocPrivate");
        this.facilityName = this.gps.getChildById("APTLocFacilityName");
        this.city = this.gps.getChildById("APTLocCity");
        this.positionNS = this.gps.getChildById("APTLocPositionNS");
        this.positionEW = this.gps.getChildById("APTLocPositionEW");
        this.elev = this.gps.getChildById("APTLocElev");
        this.fuel = this.gps.getChildById("APTLocFuel");
        this.bestApproach = this.gps.getChildById("APTLocBestApproach");
        this.radar = this.gps.getChildById("APTLocRadar");
        this.airspaceType = this.gps.getChildById("APTLocAirspaceType");
        this.region = this.gps.getChildById("APTLocRegion");
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.ident, this.searchField_SelectionCallback.bind(this))
        ];
        this.icaoSearchField.elements.push(this.ident);
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
            if(destination)
                this.icaoSearchField.SetWaypoint("A", destination.icao);
        }
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.privateLogo.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.privateLogo.innerHTML = '';
            }
            switch (infos.privateType) {
                case 0:
                    this.private.textContent = "Unknown";
                    break;
                case 1:
                    this.private.textContent = "Public";
                    break;
                case 2:
                    this.private.textContent = "Military";
                    break;
                case 3:
                    this.private.textContent = "Private";
                    break;
            }
            this.facilityName.textContent = infos.name;
            this.city.textContent = infos.city;
            if (this.region) {
                this.region.textContent = infos.region;
            }
            this.positionNS.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            this.positionEW.textContent = this.gps.longitudeFormat(infos.coordinates.long);
            let altitude = infos.coordinates.alt;
            if(!altitude) {
                // Get altitude of the average runway elevation
                if (infos.runways && infos.runways.length) {
                    for(var i=0; i<infos.runways.length; i++) {
                        altitude += infos.runways[0].elevation;
                    }
                    // Average and convert from meters to feets
                    altitude = (altitude / infos.runways.length) * 3.28084;
                }
            }
            if (altitude) {
                this.elev.textContent = fastToFixed(altitude, 0);
            }
            this.fuel.textContent = infos.fuel;
            var approach = infos.bestApproach;
            // If approach type in not known or empty
            // We try to get it from approach list
            if(approach == "" || approach == "Unknown")
            {
                approach = "";
                var hasILS = false;
                var hasRNAV = false;
                var hasVORDME = false;
                var hasVOR = false;
                var hasNDB = false;
                for (let i = 0; i < infos.approaches.length; i++) {
                    if(infos.approaches[i].name.search("ILS ") == 0)
                        hasILS = true;
                    else if(infos.approaches[i].name.search("RNAV ") == 0)
                        hasRNAV = true;
                    else if(infos.approaches[i].name.search("VORDME ") == 0)
                        hasVORDME = true;
                    else if(infos.approaches[i].name.search("VOR ") == 0)
                        hasVOR = true;
                    else if(infos.approaches[i].name.search("NDB ") == 0)
                        hasNDB = true;
                }
                // We have the place to display 2 approach types (1 on gns430), not more
                // So by priority; ILS, RNAV, VORDME, VOR and NDB
                var maxstrings = 2;
                if(this.gps.gpsType == "430")
                    maxstrings = 1;
                var numstrings = 0;
                if(hasILS){
                    approach = "ILS";
                    numstrings++;
                }
                if(hasRNAV && numstrings < maxstrings){
                    if(numstrings)
                        approach += " - ";
                    approach += "RNAV";
                    numstrings++;
                }
                if(hasVORDME && numstrings < maxstrings){
                    if(numstrings)
                        approach += " - ";
                    approach += "VORDME";
                    numstrings++;
                }
                if(hasVOR && numstrings < maxstrings){
                    if(numstrings)
                        approach += " - ";
                    approach += "VOR";
                    numstrings++;
                }
                if(hasNDB && numstrings < maxstrings){
                    if(numstrings)
                        approach += " - ";
                    approach += "NDB";
                    numstrings++;
                }
            }
            this.bestApproach.textContent = approach;
            switch (infos.radarCoverage) {
                case 0:
                    this.radar.textContent = "";
                    break;
                case 1:
                    this.radar.textContent = "No";
                    break;
                case 2:
                    this.radar.textContent = "Yes";
                    break;
            }
            if(infos.airspaceType > 0)
                this.airspaceType.textContent = infos.airspaceType;
            else
                this.airspaceType.textContent = "";
        }
        else {
            this.private.textContent = "Unknown";
            this.facilityName.textContent = "______________________";
            this.city.textContent = "______________________";
            if (this.region) {
                this.region.textContent = "______";
            }
            this.positionNS.textContent = "_ __°__.__'";
            this.positionEW.textContent = "____°__.__'";
            this.elev.textContent = "____";
            this.fuel.textContent = "";
            this.bestApproach.textContent = "";
            this.radar.textContent = "";
            this.airspaceType.textContent = "";
        }
    }
    onExit() {
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "A";
        }
    }
    onEvent(_event) {
    }
    searchField_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(function () {
                this.icaoSearchField.getWaypoint().UpdateApproaches();
            }.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
}

// Special flight plan manager class to be used with waypoint procedure map
// We just override the isActiveApproach to be always false
// Otherwise, the path between waypoints is not displayed if there is an active approach on the flight plan
class GPS_FlightPlanManagerForWaypointMap extends FlightPlanManager {
    constructor(_instrument) {
        super(...arguments);
    }
    isActiveApproach(forceSimVarCall = false) {
        return false;
    }
}
class GPS_WaypointMap extends MapInstrumentElement {
    constructor() {
        super(...arguments);
    }
    init(root) {
        this.instrument = root.querySelector("map-instrument");
        if (this.instrument) {
            TemplateElement.callNoBinding(this.instrument, () => {
                this.onTemplateLoaded();
            });
        }
        this.range = root.querySelector("#Range4");
        this.numupdates = 0;
        this.wpsig = "";
        this.isActive = false;
    }
    onTemplateLoaded() {
        // We create a special map instrument not associated to the current GPS flight plan
        this.instrument.init("SPECIAL_INSTRUMENT");
        this.instrument._flightPlanManager = new GPS_FlightPlanManagerForWaypointMap(this.instrument);
        // Note this.instrument.flightPlanManager returns this.instrument._flightPlanManager
        // So they are the same thing
        this.instrument.flightPlanElement.source = this.instrument.flightPlanManager;
        this.instrumentLoaded = true;
        this.instrument.eBingMode = EBingMode.VFR;
        this.instrument.noCenterOnPlane = true;
        this.instrument.flightPlanElement.hideReachedWaypoints = false;
        this.instrument.flightPlanElement.highlightActiveLeg = false;
        this.instrument._ranges = [0.5, 1, 1.5, 2, 3, 5, 10, 15, 20, 25, 30, 35, 40, 50, 75, 100, 150, 200, 300, 400, 500];
    }
    onEnter(_mapContainer, _zoomLevel) {
        this.isActive = true;
        this.mapContainer = _mapContainer;
        this.instrument.flightPlanManager._waypoints = [[], []];
        this.instrument.flightPlanManager._approachWaypoints = [];
        if (this.mapContainer) {
            this.mapContainer.appendChild(this.range);
            this.mrange = this.range.querySelector("#MapRangeValue4");
            this.mapContainer.appendChild(this.instrument);
            this.setDisplayMode(EMapDisplayMode.GPS);
            this.instrument.setCenteredOnPlane();
            this.instrument.setZoom(_zoomLevel);
            this.show(true);
            this.numupdates = 0;
            this.wpsig = "";
        }
    }
    onExit() {
        if (this.mapContainer) {
            this.show(false);
            //Remove childs
            this.mapContainer.textContent = '';
        }
        this.isActive = false;
    }
    onUpdate(_deltaTime) {
        if(!this.isActive)
            return;
        super.onUpdate(_deltaTime);
        // Must be always refreshed
        this.instrument.flightPlanElement.hideReachedWaypoints = false;
        this.instrument.flightPlanElement.highlightActiveLeg = false;
        if(this.mrange)
            Avionics.Utils.diffAndSet(this.mrange, this.instrument.getDisplayRange());
    }
    onEvent(_event) {
        if(!this.isActive)
            return;
        super.onEvent(_event);
    }

    updateMap(waypoints, initial_coordinates = null, forceDistance = -1, lastLeg = true) {
        this.numupdates++;
        let signature = "";
        this.instrument.flightPlanManager._waypoints[0] = waypoints;
        this.instrument.flightPlanManager._lastIndexBeforeApproach = waypoints.length;
        if(!lastLeg && waypoints.length >= 2)
            this.instrument.flightPlanManager._lastIndexBeforeApproach = waypoints.length - 1;

        for(var i=0; i< waypoints.length; i++)
            signature += waypoints[i].icao + ":";

        // Calculate center position and scale factor (check est, west, north and south max positions)
        if(waypoints.length && (signature != this.wpsig || this.numupdates < 10)){
        // First center on searchfield
            if(initial_coordinates)
                this.instrument.setCenter(initial_coordinates);
            this.instrument.navMap.computeCoordinates();
            let wMostIndex = 0;
            let eMostIndex = 0;
            let nMostIndex = 0;
            let sMostIndex = 0;
            let wMostXY = 0;
            let eMostXY = 0;
            let nMostXY = 0;
            let sMostXY = 0;
            for(var i=0; i< waypoints.length; i++) {
                let xy = this.instrument.navMap.coordinatesToXY(waypoints[i].infos.coordinates);
                if(xy.x == NaN)
                    continue;
                if(i==0) {
                    wMostXY = xy.x;
                    eMostXY = xy.x;
                    nMostXY = xy.y;
                    sMostXY = xy.y;
                }
                else {
                    if(xy.x < wMostXY)
                    {
                        wMostIndex = i;
                        wMostXY = xy.x;                         
                    }
                    if(xy.x > eMostXY)
                    {
                        eMostIndex = i;
                        eMostXY = xy.x;                         
                    }
                    if(xy.y < nMostXY)
                    {
                        nMostIndex = i;
                        nMostXY = xy.y;                         
                    }
                    if(xy.y > sMostXY)
                    {
                        sMostIndex = i;
                        sMostXY = xy.y;                         
                    }
                }
            }
            if(signature != this.wpsig)
                this.numupdates = 0;
            this.wpsig = signature;
            let cxy = new Vec2();
            cxy.x = ((eMostXY - wMostXY)/2) + wMostXY;
            cxy.y = ((sMostXY - nMostXY)/2) + nMostXY;
            let ll = this.instrument.navMap.XYToCoordinates(cxy);
            this.instrument.navMap.setCenterCoordinates(ll.lat, ll.long, 1);

            // Check scale factor now
            // we calculate the distance between extremes
            let hDistance = Avionics.Utils.computeDistance(waypoints[wMostIndex].infos.coordinates, waypoints[eMostIndex].infos.coordinates);
            let vDistance = Avionics.Utils.computeDistance(waypoints[sMostIndex].infos.coordinates, waypoints[nMostIndex].infos.coordinates);
            let distance = Math.max(hDistance, vDistance);
            distance *= 1.10;
            if(forceDistance >= 0)
                distance = forceDistance;
            for(var i=0; i<this.instrument._ranges.length; i++) {
                if(this.instrument._ranges[i] >= distance)
                    break;
            }
            this.instrument.rangeIndex = i;
        }
    }
    show(_show){
        if(_show)
            this.mapContainer.style.display = "Block";
        else
            this.mapContainer.style.display = "None";
    }
}

class GPS_AirportWaypointRunways extends NavSystemElement {
    constructor(_icaoSearchField) {
        super();
        this.name = "AirportRunway";
        this.icaoSearchField = _icaoSearchField;
    }
    init() {
        this.identElement = this.gps.getChildById("APTRwyIdent");
        this.privateLogoElement = this.gps.getChildById("APTRwyPrivateLogo");
        this.privateElement = this.gps.getChildById("APTRwyPrivate");
        this.nameElement = this.gps.getChildById("APTRwyName");
        this.lengthElement = this.gps.getChildById("APTRwyLength");
        this.widthElement = this.gps.getChildById("APTRwyWidth");
        this.surfaceElement = this.gps.getChildById("APTRwySurface");
        this.lightingElement = this.gps.getChildById("APTRwyLighting");
        this.selectedRunway = 0;
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.searchField_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.nameElement, this.runway_SelectionCallback.bind(this))
        ];
        this.icaoSearchField.elements.push(this.identElement);
        this._t = 0;
    }
    onEnter() {
        this._t = 0;
        this.selectedRunway = 0;
        this.mapContainer = this.gps.getChildById("APTRwyMap");
        this.mapElement = this.gps.getElementOfType(GPS_WaypointMap);
        if(this.mapElement)
            this.mapElement.onEnter(this.mapContainer, 1);
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
    }
    onUpdate(_deltaTime) {
        this._t++;
        if(this._t < 5)
            return;
        this._t = 0;
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao && infos instanceof AirportInfo) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.privateLogoElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.privateLogoElement.innerHTML = '';
            }
             switch (infos.privateType) {
                case 0:
                    this.privateElement.textContent = "Unknown";
                    break;
                case 1:
                    this.privateElement.textContent = "Public";
                    break;
                case 2:
                    this.privateElement.textContent = "Military";
                    break;
                case 3:
                    this.privateElement.textContent = "Private";
                    break;
            }
            if (infos.runways && this.selectedRunway >= 0 && this.selectedRunway < infos.runways.length) {
                let runway = infos.runways[this.selectedRunway];
                if (runway) {
                    this.nameElement.textContent = this.getRunwayDesignation(runway);
                    this.lengthElement.textContent = fastToFixed(runway.length * 3.28084, 0);
                    this.widthElement.textContent = fastToFixed(runway.width * 3.28084, 0);
                    if(this.surfaceElement)
                    {
                        switch (runway.surface) {
                            case 0:
                                this.surfaceElement.textContent = "";
                                break;
                            case 1:
                                this.surfaceElement.textContent = "Concrete";
                                break;
                            case 2:
                                this.surfaceElement.textContent = "Asphalt";
                                break;
                            case 4:
                                this.surfaceElement.textContent = "Hard surface";
                                break;
                            case 101:
                                this.surfaceElement.textContent = "Grass";
                                break;
                            case 102:
                                this.surfaceElement.textContent = "Turf";
                                break;
                            case 103:
                                this.surfaceElement.textContent = "Dirt";
                                break;
                            case 104:
                                this.surfaceElement.textContent = "Coral";
                                break;
                            case 105:
                                this.surfaceElement.textContent = "Gravel";
                                break;
                            case 106:
                                this.surfaceElement.textContent = "Oil Treated";
                                break;
                            case 107:
                                this.surfaceElement.textContent = "Steel";
                                break;
                            case 108:
                                this.surfaceElement.textContent = "Bituminus";
                                break;
                            case 109:
                                this.surfaceElement.textContent = "Brick";
                                break;
                            case 110:
                                this.surfaceElement.textContent = "Macadam";
                                break;
                            case 111:
                                this.surfaceElement.textContent = "Planks";
                                break;
                            case 112:
                                this.surfaceElement.textContent = "Sand";
                                break;
                            case 113:
                                this.surfaceElement.textContent = "Shale";
                                break;
                            case 114:
                                this.surfaceElement.textContent = "Tarmac";
                                break;
                            case 115:
                                this.surfaceElement.textContent = "Snow";
                                break;
                            case 116:
                                this.surfaceElement.textContent = "Ice";
                                break;
                            case 201:
                                this.surfaceElement.textContent = "Water";
                                break;
                            default:
                                this.surfaceElement.textContent = "Unknown";
                                break;
                    
                        }
                    }
                    if(this.lightingElement)
                    {
                        switch (runway.lighting) {
                            case 0:
                                this.lightingElement.textContent = "";
                                break;
                            case 1:
                                this.lightingElement.textContent = "None";
                                break;
                            case 2:
                                this.lightingElement.textContent = "Part Time";
                                break;
                            case 3:
                                this.lightingElement.textContent = "Full Time";
                                break;
                            case 4:
                                this.lightingElement.textContent = "Frequency";
                                break;
                        }
                    }
                }
            }
            this.updateMap(infos);
        }
        else {
            this.identElement.textContent = "_____";
            this.privateLogoElement.innerHTML = "";
            this.privateElement.textContent = "Unknown";
            this.nameElement.textContent = "";
            this.lengthElement.textContent = "0";
            this.widthElement.textContent = "0";
            this.surfaceElement.textContent = "Unknown";
            if(this.lightingElement)
                this.lightingElement.textContent = "Unknown";
        }
    }
    updateMap(infos) {
        if(this.icaoSearchField.isActive)
            return;
        let runway = null;
        if(this.selectedRunway >= 0)
            runway = infos.runways[this.selectedRunway];
        if(runway){
            var wayPointList = this.gps.currFlightPlanManager.getApproachWaypoints();
            var waypoints = [];
            let runwayNumber = parseInt(runway.designation[0]);
            let direction =  runway.direction;
            let delta = Math.abs(runwayNumber * 10 - direction);
            let permuted = false;
            if (delta >= 30) {
                direction += 180;
                if (direction >= 360) {
                    direction -= 360;
                }
                permuted = true;
            }
            let beginningCoordinates = Avionics.Utils.bearingDistanceToCoordinates(direction - 180, runway.length / 1852 * 0.5, runway.latitude, runway.longitude);
            let endCoordinates = Avionics.Utils.bearingDistanceToCoordinates(direction, runway.length / 1852 * 0.5, runway.latitude, runway.longitude);
            var waypoint = new WayPoint(this.gps);
            waypoint.infos = new WayPointInfo(this.gps);
            waypoint.infos.name = "User-Defined";
            waypoint.ident = this.getRunwayDesignation(runway, 1);
            if(permuted)
                waypoint.ident = this.getRunwayDesignation(runway, 0);
            waypoint.icao = waypoint.ident;
            waypoint.infos.icao = waypoint.icao;
            waypoint.infos.ident = waypoint.ident;
            waypoint.infos.coordinates = endCoordinates;
            waypoints.push(waypoint);

            waypoint = new WayPoint(this.gps);
            waypoint.infos = new WayPointInfo(this.gps);
            waypoint.infos.name = "User-Defined";
            waypoint.ident = this.getRunwayDesignation(runway, 0);
            if(permuted)
                waypoint.ident = this.getRunwayDesignation(runway, 1);
            waypoint.icao = waypoint.ident;
            waypoint.infos.icao = waypoint.icao;
            waypoint.infos.ident = waypoint.ident;
            waypoint.infos.coordinates = beginningCoordinates;
            waypoints.push(waypoint);

            let ll = new LatLong(runway.latitude, runway.longitude);

            // Add the airport but no leg to it
            if(this.icaoSearchField.getWaypoint()){
                waypoints.push(this.icaoSearchField.getWaypoint());
            }
            if(this.mapElement)
                this.mapElement.updateMap(waypoints, infos.coordinates, -1, false);
        }
        if(!runway)
            if(this.mapElement)
                this.mapElement.updateMap([]);
    }
    onExit() {
        if(this.mapElement)
            this.mapElement.onExit();
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "A";
        }
    }
    onEvent(_event) {
        if ((_event == "CLR_Push") || (_event == "MENU_Push"))  {
            if (this.gps.popUpElement || this.gps.currentContextualMenu) {
                this.gps.closePopUpElement();
                this.gps.currentContextualMenu = null;
                this.gps.SwitchToInteractionState(1);
                this.gps.cursorIndex = 1;
            }
        }
    }
    searchField_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.selectedRunway = -1;
            if(this.mapElement)
                this.mapElement.updateMap([]);
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(function () {
                this.icaoSearchField.getWaypoint().UpdateApproaches();
                this.selectedRunway = 0;
            }.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    runway_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                var menu = new ContextualMenu("RUNWAY", []);
                var callback = function (_index) {
                    this.selectedRunway = _index;
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 1;
                };
                for (var i = 0; i < infos.runways.length; i++) {
                    menu.elements.push(new ContextualMenuElement(this.getRunwayDesignation(infos.runways[i]), callback.bind(this, i)));
                }
                if(infos.runways.length)
                   this.gps.ShowContextualMenu(menu);
                   this.gps.cursorIndex = this.selectedRunway;
                }
        }
    }
    getRunwayDesignation(runway, index = -1) {
        let designations = runway.designation.split("-");
        let r1 = Utils.leadingZeros(designations[0], 2);
        let r2 = Utils.leadingZeros(designations[1], 2);
        let cp = runway.designatorCharPrimary;
        let cs = runway.designatorCharSecondary;
        if (cp=== 1)
            r1 += "L";
        if (cp === 2)
            r1 += "R";
        if (cp === 3)
            r1 += "C";
        if (cs=== 1)
            r2 += "L";
        if (cs === 2)
            r2 += "R";
        if (cs === 3)
            r2 += "C";
        if(index == 0)
            return r1;
        if(index == 1)
            return r2;
        return r1 + "-" + r2;
    }
}
class GPS_AirportWaypointFrequencies extends NavSystemElement {
    constructor(_icaoSearchField, _nbFreqMax = 5) {
        super();
        this.name = "AirportFrequency";
        this.icaoSearchField = _icaoSearchField;
        this.nbFreqMax = _nbFreqMax;
    }
    init() {
        this.identElement = this.gps.getChildById("APTFreqIdent");
        this.logoElement = this.gps.getChildById("APTFreqLogo");
        this.privateElement = this.gps.getChildById("APTFreqPrivate");
        this.mainElement = this.gps.getChildById("APTFreqMain");
        this.sliderElement = this.gps.getChildById("APTFreqSlider");
        this.sliderCursorElement = this.gps.getChildById("APTFreqSliderCursor");
        this.frequenciesSelectionGroup = new SelectableElementSliderGroup(this.gps, [], this.sliderElement, this.sliderCursorElement);
        for (let i = 0; i < this.nbFreqMax; i++) {
            this.frequenciesSelectionGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("APTFrequency_" + i), this.activeFrequency_SelectionCallback.bind(this)));
        }
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.searchField_SelectionCallback.bind(this)),
            this.frequenciesSelectionGroup
        ];
        this.icaoSearchField.elements.push(this.identElement);
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
            if(destination)
                this.icaoSearchField.SetWaypoint("A", destination.icao);
        }
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.logoElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.logoElement.innerHTML = '';
            }
            switch (infos.privateType) {
                case 0:
                    this.privateElement.textContent = "Unknown";
                    break;
                case 1:
                    this.privateElement.textContent = "Public";
                    break;
                case 2:
                    this.privateElement.textContent = "Military";
                    break;
                case 3:
                    this.privateElement.textContent = "Private";
                    break;
            }
            var elements = [];
            if (infos && infos.frequencies) {
                for (let i = 0; i < infos.frequencies.length; i++) {
                    elements.push('<div><div class="Align LeftDisplay">' + infos.frequencies[i].name.slice(0, 22) + '</div> <div class="Align RightValue SelectableElement">' + this.gps.frequencyFormat(infos.frequencies[i].mhValue, 3) + '</div></div>');
                }
            }
            this.frequenciesSelectionGroup.setStringElements(elements);
        }
        else {
            this.identElement.textContent = "_____";
            this.logoElement.innerHTML = "";
            this.privateElement.textContent = "Unknown";
        }
    }
    onExit() {
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "A";
        }
    }
    onEvent(_event) {
    }
    activeFrequency_SelectionCallback(_event, _index) {
        if (_event == "ENT_Push") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos.frequencies[_index].mhValue >= 118) {
                SimVar.SetSimVarValue("K:COM" + (this.gps.comIndex == 1 ? "" : this.gps.comIndex) + "_STBY_RADIO_SET", "Frequency BCD16", infos.frequencies[_index].bcd16Value);
            }
            else {
                SimVar.SetSimVarValue("K:NAV" + this.gps.navIndex + "_STBY_SET", "Frequency BCD16", infos.frequencies[_index].bcd16Value);
            }
        }
    }
    searchField_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(function () {
                this.icaoSearchField.getWaypoint().UpdateApproaches();
            }.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
}
class GPS_AirportWaypointApproaches extends NavSystemElement {
    constructor(_icaoSearchField) {
        super();
        this.name = "AirportApproach";
        this.icaoSearchField = _icaoSearchField;
    }
    init() {
        this.identElement = this.gps.getChildById("APTApproachIdent");
        this.privateLogoElement = this.gps.getChildById("APTApproachPrivateLogo");
        this.privateElement = this.gps.getChildById("APTApproachPrivate");
        this.approachElement = this.gps.getChildById("APTApproachApproach");
        this.transitionElement = this.gps.getChildById("APTApproachTransition");
        this.selectedApproach = 0;
        this.selectedTransition = 0;
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Load&nbsp;into&nbsp;Active&nbsp;FPL?", this.loadApproachIntoFPL.bind(this), this.enableLoadApproach.bind(this)),
            new ContextualMenuElement("Load&nbsp;and&nbsp;Activate?", this.loadApproachAndActivate.bind(this), this.enableLoadApproach.bind(this)),
        ]);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.ident_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.approachElement, this.approach_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.transitionElement, this.transition_SelectionCallback.bind(this))
        ];
        this.icaoSearchField.elements.push(this.identElement);
        this._t = 0;
    }
    onEnter() {
        this._t = 0;
        this.selectedApproach = -1;
        this.selectedTransition = -1;
        this.mapContainer = this.gps.getChildById("APTApproachMap");
        this.mapElement = this.gps.getElementOfType(GPS_WaypointMap);
        if(this.mapElement)
            this.mapElement.onEnter(this.mapContainer, 7);

        if (this.gps.lastRelevantICAO && this.gps.lastRelevantICAOType == "A") {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
            this.initialIcao = this.gps.lastRelevantICAO;
            this.icaoSearchField.getWaypoint().UpdateApproaches();
        }
        else if (this.gps.icaoFromMap && this.gps.icaoFromMap[0] == "A") {
            this.icaoSearchField.SetWaypoint(this.gps.icaoFromMap[0], this.gps.icaoFromMap);
            this.initialIcao = this.gps.icaoFromMap;
            this.icaoSearchField.getWaypoint().UpdateApproaches();
        }
        var infos = this.icaoSearchField.getUpdatedInfos();
        if(!infos || !infos.icao) {
            let destination = this.gps.currFlightPlanManager.getDestination();
            if(destination)
                this.icaoSearchField.SetWaypoint("A", destination.icao);
        }
        if(this.icaoSearchField) {
            // Check if current airport is the destination one
            // and eventually select the current approach (or the first one)
            var infos = this.icaoSearchField.getUpdatedInfos();
            var destination = this.gps.currFlightPlanManager.getDestination();
            if(destination && infos.icao == destination.icao) {
                if(this.gps.currFlightPlanManager.getApproachIndex() != -1) {
                    this.selectedApproach = this.gps.currFlightPlanManager.getApproachIndex();
                    if(this.gps.currFlightPlanManager.getApproachTransitionIndex() != -1)
                        this.selectedTransition = this.gps.currFlightPlanManager.getApproachTransitionIndex();
                }
            }
            if(this.selectedApproach == -1 && infos.approaches.length){
                this.selectedApproach = 0;
                if(infos.approaches[0].transitions.length)
                    this.selectedTransition = 0;
            }
        }
        this.gps.SwitchToInteractionState(0);
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
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.privateLogoElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.privateLogoElement.innerHTML = '';
            }
            switch (infos.privateType) {
                case 0:
                    this.privateElement.textContent = "Unknown";
                    break;
                case 1:
                    this.privateElement.textContent = "Public";
                    break;
                case 2:
                    this.privateElement.textContent = "Military";
                    break;
                case 3:
                    this.privateElement.textContent = "Private";
                    break;
            }
            let approach = this.getSelectedApproach(infos);
            if (approach) {
                this.approachElement.textContent = approach.name;
                if (approach.transitions && this.selectedTransition >= 0 && approach.transitions.length > this.selectedTransition) {
                    this.transitionElement.textContent = approach.transitions[this.selectedTransition].name;
                }
                else {
                    this.transitionElement.textContent = "NONE";
                }
            }
            else {
                this.approachElement.textContent = "NONE";
                this.transitionElement.textContent = "NONE";
            }
            this.updateMap(infos);
        }
        else {
            this.identElement.textContent = "_____";
            this.privateElement.textContent = "Unknown";
            this.approachElement.textContent = "";
            this.transitionElement.textContent = "";
        }
    }
    updateMap(infos) {
        if(this.icaoSearchField.isActive)
            return;
        let approach = this.getSelectedApproach(infos);
        var waypoints = [];
        if(approach){
            var i = 0;
            if(this.selectedTransition >= 0) {
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
    onExit() {
        if(this.mapElement)
            this.mapElement.onExit();
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "A";
        }
    }
    onEvent(_event) {
        if (_event == "CLR_Push")  {
            if (this.gps.popUpElement || this.gps.currentContextualMenu) {
                this.gps.closePopUpElement();
                this.gps.currentContextualMenu = null;
            }
        }
    }
    enableLoadApproach() {
        let infos = this.icaoSearchField.getUpdatedInfos();
        var destination = this.gps.currFlightPlanManager.getDestination();
        let dinfos = destination.GetInfos();
        if (infos && infos.icao && infos.icao == dinfos.icao)
            return false;
        else
            return true;
    }
    loadApproachIntoFPL() {
        // Do load approach
        let infos = this.icaoSearchField.getUpdatedInfos();
        var destination = this.gps.currFlightPlanManager.getDestination();
        let dinfos = destination.GetInfos();
        if (infos && infos.icao && infos.icao == dinfos.icao && infos.approaches.length && this.selectedApproach >= 0) {
            this.gps.currFlightPlanManager.setApproachIndex(this.selectedApproach, () => {
                let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                if (elem) {
                    elem.updateWaypoints();
                }
                setTimeout(() => {
                    this.gps.setApproachFrequency();
                }, 2000);
            }, this.selectedTransition);
            this.gps.closePopUpElement();
            this.gps.SwitchToInteractionState(0);
            if(this.gps.currentEventLinkedPageGroup)
                this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
            this.gps.currentEventLinkedPageGroup = null;
            this.gps.computeEvent("FPL_Push");
        }
        else{
            this.gps.closePopUpElement();
        }
    }
    
    loadApproachAndActivate() {
        // Do activate approach
        let infos = this.icaoSearchField.getUpdatedInfos();
        var destination = this.gps.currFlightPlanManager.getDestination();
        let dinfos = destination.GetInfos();
        if (infos && infos.icao && infos.icao == dinfos.icao && infos.approaches.length && this.selectedApproach >= 0) {
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
        else{
            this.gps.closePopUpElement();
        }
        this.gps.SwitchToMenuName("FPL");
        this.gps.SwitchToInteractionState(0);
    }
    ident_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.selectedApproach = -1;
            this.selectedTransition = -1;
            if(this.mapElement)
                this.mapElement.updateMap([]);
            this.icaoSearchField.StartSearch(function () {
                this.icaoSearchField.getWaypoint().UpdateApproaches();
                var infos = this.icaoSearchField.getUpdatedInfos();
                if(infos.approaches.length) {
                    this.selectedApproach = 0;
                    if(infos.approaches[0].transitions.length)
                        this.selectedTransition = 0;
                }
            }.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    approach_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                var menu = new ContextualMenu("APR", []);
                var callback = function (_index) {
                    this.selectedApproach = _index;
                    this.selectedTransition = 0;
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 2;
                };
                for (var i = 0; i < infos.approaches.length; i++) {
                    menu.elements.push(new ContextualMenuElement(infos.approaches[i].name, callback.bind(this, i)));
                }
                if(infos.approaches.length) {
                    this.gps.ShowContextualMenu(menu);
                    this.gps.cursorIndex = this.selectedApproach;
                }
            }
        }
    }
    transition_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                var menu = new ContextualMenu("TRANS", []);
                var callback = function (_index) {
                    this.selectedTransition = _index;
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 2;
                };
                let approach = this.getSelectedApproach(infos);
                if (approach) {
                    for (var i = 0; i < approach.transitions.length; i++) {
                        menu.elements.push(new ContextualMenuElement(approach.transitions[i].name, callback.bind(this, i)));
                    }
                    if(approach.transitions.length) {
                        this.gps.ShowContextualMenu(menu);
                        this.gps.cursorIndex = this.selectedTransition;
                    }
                }
            }
        }
    }
}

class GPS_AirportWaypointArrivals extends NavSystemElement {
    constructor(_icaoSearchField) {
        super();
        this.name = "AirportArrival";
        this.icaoSearchField = _icaoSearchField;
    }
    init() {
        this.identElement = this.gps.getChildById("APTArrivalIdent");
        this.privateLogoElement = this.gps.getChildById("APTArrivalPrivateLogo");
        this.privateElement = this.gps.getChildById("APTArrivalPrivate");
        this.arrivalElement = this.gps.getChildById("APTArrivalArrival");
        this.transitionElement = this.gps.getChildById("APTArrivalTransition");
        this.runwayElement = this.gps.getChildById("APTArrivalRunway");
        this.selectedArrival = 0;
        this.selectedTransition = 0;
        this.selectedRunway = 0;
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Load&nbsp;into&nbsp;Active&nbsp;FPL?", this.loadArrivalIntoFPL.bind(this), this.enableLoadArrival.bind(this)),
        ]);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.ident_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.arrivalElement, this.arrival_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.transitionElement, this.transition_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.runwayElement, this.runway_SelectionCallback.bind(this))
        ];
        this.icaoSearchField.elements.push(this.identElement);
        this._t = 0;
        this.lastSelectedRunway = 0;
    }
    onEnter() {
        this._t = 0;
        this.selectedArrival = -1;
        this.selectedTransition = -1;
        this.selectedRunway = -1;
        this.mapContainer = this.gps.getChildById("APTArrivalMap");
        this.mapElement = this.gps.getElementOfType(GPS_WaypointMap);
        if(this.mapElement)
            this.mapElement.onEnter(this.mapContainer, 7);

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
            if(destination)
                this.icaoSearchField.SetWaypoint("A", destination.icao);
        }
        if(this.icaoSearchField) {
            // Check if current airport is the destination one
            // and eventually select the current arrival
            var infos = this.icaoSearchField.getUpdatedInfos();
            if(this.gps.currFlightPlanManager.getDestination() && infos.icao == this.gps.currFlightPlanManager.getDestination().icao) {
                if(this.gps.currFlightPlanManager.getArrivalProcIndex() != -1) {
                    this.selectedArrival = this.gps.currFlightPlanManager.getArrivalProcIndex();
                    if(this.gps.currFlightPlanManager.getArrivalTransitionIndex() != -1)
                        this.selectedTransition = this.gps.currFlightPlanManager.getArrivalTransitionIndex();
                    this.selectedRunway = this.lastSelectedRunway;
                    let arrival = this.getSelectedArrival(infos);
                    if(arrival.runwayTransitions.length)
                        this.selectedRunway = 0;
                }
            }
            if(this.selectedArrival == -1 && infos.arrivals.length){
                this.selectedArrival = 0;
                if(infos.arrivals[0].enRouteTransitions.length)
                    this.selectedTransition = 0;
                if(infos.arrivals[0].runwayTransitions.length)
                    this.selectedRunway = 0;
            }
        }
        this.gps.SwitchToInteractionState(0);
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
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.privateLogoElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.privateLogoElement.innerHTML = '';
            }
            switch (infos.privateType) {
                case 0:
                    this.privateElement.textContent = "Unknown";
                    break;
                case 1:
                    this.privateElement.textContent = "Public";
                    break;
                case 2:
                    this.privateElement.textContent = "Military";
                    break;
                case 3:
                    this.privateElement.textContent = "Private";
                    break;
            }
            let arrival = this.getSelectedArrival(infos);
            if (arrival) {
                this.arrivalElement.textContent = arrival.name;
                if (arrival.enRouteTransitions && this.selectedTransition >= 0 && arrival.enRouteTransitions.length > this.selectedTransition) {
                    this.transitionElement.textContent = arrival.enRouteTransitions[this.selectedTransition].name;
                }
                else {
                    this.transitionElement.textContent = "NONE";
                }
                if (arrival.runwayTransitions && arrival.runwayTransitions.length) {
                    if(this.selectedRunway == -1 || this.selectedRunway >= arrival.runwayTransitions.length)
                        this.selectedRunway = 0;
                    this.runwayElement.textContent = arrival.runwayTransitions[this.selectedRunway].name;
                }
                else {
                    this.runwayElement.textContent = "ALL";
                }
            }
            else {
                this.arrivalElement.textContent = "NONE";
                this.transitionElement.textContent = "NONE";
                this.runwayElement.textContent = "NONE";
            }
            this.updateMap(infos);
        }
        else {
            this.identElement.textContent = "_____";
            this.privateElement.textContent = "Unknown";
            this.arrivalElement.textContent = "";
            this.transitionElement.textContent = "";
            this.runwayElement.textContent = "";
        }
    }
    updateMap(infos) {
        if(this.icaoSearchField.isActive)
            return;
        let arrival = this.getSelectedArrival(infos);
        var waypoints = [];
        if(arrival){
            if(this.selectedTransition >= 0) {
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
            if(this.selectedRunway >= 0) {
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
      
    onExit() {
        if(this.mapElement)
            this.mapElement.onExit();
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "A";
        }
        this.lastSelectedRunway = this.selectedRunway;
    }
    onEvent(_event) {
        if (_event == "CLR_Push")  {
            if (this.gps.popUpElement || this.gps.currentContextualMenu) {
                this.gps.closePopUpElement();
                this.gps.currentContextualMenu = null;
            }
        }
    }
    enableLoadArrival() {
        let infos = this.icaoSearchField.getUpdatedInfos();
        var destination = this.gps.currFlightPlanManager.getDestination();
        let dinfos = destination.GetInfos();
        if (infos && infos.icao && infos.icao == dinfos.icao)
            return false;
        else
            return true;
    }

    loadArrivalIntoFPL() {
        // Do load arrival
        let infos = this.icaoSearchField.getUpdatedInfos();
        var destination = this.gps.currFlightPlanManager.getDestination();
        let dinfos = destination.GetInfos();
        if (infos && infos.icao && infos.icao == dinfos.icao && infos.arrivals.length) {
            this.gps.currFlightPlanManager.setArrivalProcIndex(this.selectedArrival, () => {
                let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                if (elem) {
                    elem.updateWaypoints();
                }
            });
            this.gps.currFlightPlanManager.setArrivalRunwayIndex(this.selectedRunway);
            this.gps.currFlightPlanManager.setArrivalEnRouteTransitionIndex(this.selectedTransition);
            this.gps.closePopUpElement();
            this.gps.SwitchToInteractionState(0);
            if(this.gps.currentEventLinkedPageGroup)
                this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
            this.gps.currentEventLinkedPageGroup = null;
            this.gps.computeEvent("FPL_Push");
        }
        else{
            this.gps.closePopUpElement();
        }
    }
    
    ident_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.selectedArrival = -1;
            this.selectedTransition = -1;
            this.selectedRunway = -1;
            if(this.mapElement)
                this.mapElement.updateMap([]);
            this.icaoSearchField.StartSearch(function () {
                var infos = this.icaoSearchField.getUpdatedInfos();
                if(infos.arrivals.length) {
                    this.selectedArrival = 0;
                    if(infos.arrivals[0].enRouteTransitions.length)
                        this.selectedTransition = 0;
                    if(infos.arrivals[0].runwayTransitions.length)
                        this.selectedRunway = 0;
                }
            }.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    arrival_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                var menu = new ContextualMenu("ARRIVALS", []);
                var callback = function (_index) {
                    this.selectedArrival = _index;
                    this.selectedTransition = 0;
                    this.selectedRunway = 0;
                    // Stay on arrival list
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 1;
                };
                for (var i = 0; i < infos.arrivals.length; i++) {
                    menu.elements.push(new ContextualMenuElement(infos.arrivals[i].name, callback.bind(this, i)));
                }
                if(infos.arrivals.length) {
                    this.gps.ShowContextualMenu(menu);
                    this.gps.cursorIndex = this.selectedArrival;
                }
            }
        }
    }
    transition_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                let arrival = this.getSelectedArrival(infos);
                if (arrival) {
                    var menu = new ContextualMenu("TRANS", []);
                    var callback = function (_index) {
                        this.selectedTransition = _index;
                        this.gps.SwitchToInteractionState(1);
                        if(arrival.runwayTransitions.length)
                            this.gps.cursorIndex = 3;
                        else
                            this.gps.cursorIndex = 2;
                    };
                    for (var i = 0; i < arrival.enRouteTransitions.length; i++) {
                        menu.elements.push(new ContextualMenuElement(arrival.enRouteTransitions[i].name, callback.bind(this, i)));
                    }
                    if(arrival.enRouteTransitions.length) {
                        this.gps.ShowContextualMenu(menu);
                        this.gps.cursorIndex = this.selectedTransition;
                    }
                }
            }
        }
    }
    runway_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                var menu = new ContextualMenu("RUNWAY", []);
                var callback = function (_index) {
                    this.selectedRunway = _index;
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 3;
                };
                let arrival = this.getSelectedArrival(infos);
                if (arrival) {
                    for (var i = 0; i < arrival.runwayTransitions.length; i++) {
                        menu.elements.push(new ContextualMenuElement(arrival.runwayTransitions[i].name, callback.bind(this, i)));
                    }
                    if(arrival.runwayTransitions.length) {
                        this.gps.ShowContextualMenu(menu);
                        this.gps.cursorIndex = this.selectedRunway;
                    }
                }
            }
        }
    }

}

class GPS_AirportWaypointDepartures extends NavSystemElement {
    constructor(_icaoSearchField) {
        super();
        this.name = "AirportDeparture";
        this.icaoSearchField = _icaoSearchField;
    }
    init() {
        this.identElement = this.gps.getChildById("APTDepartureIdent");
        this.privateLogoElement = this.gps.getChildById("APTDeparturePrivateLogo");
        this.privateElement = this.gps.getChildById("APTDeparturePrivate");
        this.departureElement = this.gps.getChildById("APTDepartureDeparture");
        this.transitionElement = this.gps.getChildById("APTDepartureTransition");
        this.runwayElement = this.gps.getChildById("APTDepartureRunway");
        this.selectedDeparture = 0;
        this.selectedTransition = 0;
        this.selectedRunway = 0;
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Load&nbsp;into&nbsp;Active&nbsp;FPL?", this.loadDepartureIntoFPL.bind(this), this.enableLoadDeparture.bind(this)),
        ]);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.ident_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.departureElement, this.departure_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.transitionElement, this.transition_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.runwayElement, this.runway_SelectionCallback.bind(this))
        ];
        this.icaoSearchField.elements.push(this.identElement);
        this._t = 0;
        this.lastSelectedRunway = 0;
    }
    onEnter() {
        this._t = 0;
        this.selectedDeparture = -1;
        this.selectedTransition = -1;
        this.selectedRunway = -1;
        this.mapContainer = this.gps.getChildById("APTDepartureMap");
        this.mapElement = this.gps.getElementOfType(GPS_WaypointMap);
        if(this.mapElement)
            this.mapElement.onEnter(this.mapContainer, 7);

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
            let origin = this.gps.currFlightPlanManager.getOrigin();
            if(origin)
                this.icaoSearchField.SetWaypoint("A", origin.icao);
        }
        if(this.icaoSearchField) {
            // Check if current airport is the origin one
            // and eventually select the current departure
            var infos = this.icaoSearchField.getUpdatedInfos();
            if(this.gps.currFlightPlanManager.getOrigin() && infos.icao == this.gps.currFlightPlanManager.getOrigin().icao) {
                if(this.gps.currFlightPlanManager.getDepartureProcIndex() != -1) {
                    this.selectedDeparture = this.gps.currFlightPlanManager.getDepartureProcIndex();
                    if(this.gps.currFlightPlanManager.getDepartureEnRouteTransitionIndex() != -1)
                        this.selectedTransition = this.gps.currFlightPlanManager.getDepartureEnRouteTransitionIndex();
                        if(this.gps.currFlightPlanManager.getDepartureRunwayIndex() != -1)
                           this.selectedRunway = this.gps.currFlightPlanManager.getDepartureRunwayIndex();
                }
            }
            if(this.selectedDeparture == -1 && infos.departures.length){
                this.selectedDeparture = 0;
                if(infos.departures[0].enRouteTransitions.length)
                    this.selectedTransition = 0;
                if(infos.departures[0].runwayTransitions.length)
                    this.selectedRunway = 0;
            }
        }
        this.gps.SwitchToInteractionState(0);
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
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.privateLogoElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.privateLogoElement.innerHTML = '';
            }
            switch (infos.privateType) {
                case 0:
                    this.privateElement.textContent = "Unknown";
                    break;
                case 1:
                    this.privateElement.textContent = "Public";
                    break;
                case 2:
                    this.privateElement.textContent = "Military";
                    break;
                case 3:
                    this.privateElement.textContent = "Private";
                    break;
            }
            let departure = this.getSelectedDeparture(infos);
            if (departure) {
                this.departureElement.textContent = departure.name;
                if (departure.enRouteTransitions && this.selectedTransition >= 0 && departure.enRouteTransitions.length > this.selectedTransition) {
                    this.transitionElement.textContent = departure.enRouteTransitions[this.selectedTransition].name;
                }
                else {
                    this.transitionElement.textContent = "NONE";
                }
                if (departure.runwayTransitions && this.selectedRunway >= 0) {
                    if(departure.runwayTransitions.length <= this.selectedRunway)
                        this.selectedRunway = 0;
                    this.runwayElement.textContent = departure.runwayTransitions[this.selectedRunway].name;
                }
                else {
                    this.runwayElement.textContent = "NONE";
                }
            }
            else {
                this.departureElement.textContent = "NONE";
                this.transitionElement.textContent = "NONE";
                this.runwayElement.textContent = "NONE";
            }
            this.updateMap(infos);
        }
        else {
            this.identElement.textContent = "_____";
            this.privateElement.textContent = "Unknown";
            this.departureElement.textContent = "";
            this.transitionElement.textContent = "";
            this.runwayElement.textContent = "";
        }
    }
    updateMap(infos) {
        if(this.icaoSearchField.isActive)
            return;
        let departure = this.getSelectedDeparture(infos);
        var waypoints = [];
        if(departure){
            if(this.selectedRunway >= 0) {
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
            if(this.selectedTransition >= 0) {
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

    onExit() {
        if(this.mapElement)
            this.mapElement.onExit();
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "A";
        }
        this.lastSelectedRunway = this.selectedRunway;
    }
    onEvent(_event) {
        if (_event == "CLR_Push")  {
            if (this.gps.popUpElement || this.gps.currentContextualMenu) {
                this.gps.closePopUpElement();
                this.gps.currentContextualMenu = null;
            }
        }
    }
    enableLoadDeparture() {
        let infos = this.icaoSearchField.getUpdatedInfos();
        var origin = this.gps.currFlightPlanManager.getOrigin();
        let dinfos = origin.GetInfos();
        if (infos && infos.icao && infos.icao == dinfos.icao)
            return false;
        else
            return true;
    }

    loadDepartureIntoFPL() {
        // Do load departure
        let infos = this.icaoSearchField.getUpdatedInfos();
        var origin = this.gps.currFlightPlanManager.getOrigin();
        let dinfos = origin.GetInfos();
        if (infos && infos.icao && infos.icao == dinfos.icao && infos.departures.length) {
            this.gps.currFlightPlanManager.setDepartureProcIndex(this.selectedDeparture, () => {
                let elem = this.gps.getElementOfType(MFD_ActiveFlightPlan_Element);
                if (elem) {
                    elem.updateWaypoints();
                }
            });
            this.gps.currFlightPlanManager.setDepartureRunwayIndex(this.selectedRunway);
            this.gps.currFlightPlanManager.setDepartureEnRouteTransitionIndex(this.selectedTransition);
            this.gps.closePopUpElement();
            this.gps.SwitchToInteractionState(0);
            if(this.gps.currentEventLinkedPageGroup)
                this.gps.currentEventLinkedPageGroup.pageGroup.onExit();
            this.gps.currentEventLinkedPageGroup = null;
            this.gps.computeEvent("FPL_Push");
        }
        else{
            this.gps.closePopUpElement();
        }
    }
    
    ident_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.selectedDeparture = -1;
            this.selectedTransition = -1;
            this.selectedRunway = -1;
            this.icaoSearchField.StartSearch(function () {
                var infos = this.icaoSearchField.getUpdatedInfos();
                if(infos.departures.length) {
                    this.selectedDeparture = 0;
                    if(infos.departures[0].enRouteTransitions.length)
                        this.selectedTransition = 0;
                    if(infos.departures[0].runwayTransitions.length)
                        this.selectedRunway = 0;
                }
            }.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    departure_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                var menu = new ContextualMenu("DEP", []);
                var callback = function (_index) {
                    this.selectedDeparture = _index;
                    this.selectedTransition = 0;
                    this.selectedRunway = 0;
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 1;
                };
                for (var i = 0; i < infos.departures.length; i++) {
                    menu.elements.push(new ContextualMenuElement(infos.departures[i].name, callback.bind(this, i)));
                }
                if(infos.departures.length) {
                    this.gps.ShowContextualMenu(menu);
                    this.gps.cursorIndex = this.selectedDeparture;
                }
            }
        }
    }
    transition_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                var menu = new ContextualMenu("TRANS", []);
                var callback = function (_index) {
                    this.selectedTransition = _index;
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 2;
                };
                let departure = this.getSelectedDeparture(infos);
                if (departure) {
                    for (var i = 0; i < departure.enRouteTransitions.length; i++) {
                        menu.elements.push(new ContextualMenuElement(departure.enRouteTransitions[i].name, callback.bind(this, i)));
                    }
                    if(departure.enRouteTransitions.length) {
                        this.gps.ShowContextualMenu(menu);
                        this.gps.cursorIndex = this.selectedTransition;
                    }
                }
            }
        }
    }
    runway_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao) {
                var menu = new ContextualMenu("RUNWAY", []);
                var callback = function (_index) {
                    this.selectedRunway = _index;
                    this.gps.SwitchToInteractionState(1);
                    this.gps.cursorIndex = 3;
                };
                let departure = this.getSelectedDeparture(infos);
                if (departure) {
                    for (var i = 0; i < departure.runwayTransitions.length; i++) {
                        menu.elements.push(new ContextualMenuElement(departure.runwayTransitions[i].name, callback.bind(this, i)));
                    }
                    if(departure.runwayTransitions.length) {
                        this.gps.ShowContextualMenu(menu);
                        this.gps.cursorIndex = this.selectedRunway;
                    }
                }
            }
        }
    }

}


class GPS_IntersectionWaypoint extends NavSystemElement {
    constructor() {
        super();
        this.name = "Intersection";
    }
    init() {
        this.identElement = this.gps.getChildById("INTIdent");
        this.symbolElement = this.gps.getChildById("INTSymbol");
        this.regionElement = this.gps.getChildById("INTRegion");
        this.posNSElement = this.gps.getChildById("INTPosNS");
        this.posEWElement = this.gps.getChildById("INTPosEW");
        this.nearestVORElement = this.gps.getChildById("INTNearestVOR");
        this.nearestVORSymbolElement = this.gps.getChildById("INTNearestVORSymbol");
        this.radialFromNearVORElement = this.gps.getChildById("INTRadialFromNearVOR");
        this.distanceFromNearVORElement = this.gps.getChildById("INTDistanceFromNearVOR");
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.identElement], this.gps, 'W');
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.ident_SelectionCallback.bind(this))
        ];
        this.duplicateWaypoints = new NavSystemElementContainer("Duplicate Waypoints", "DuplicateWaypointWindow", new MFD_DuplicateWaypoint());
        this.duplicateWaypoints.setGPS(this.gps);
        this.duplicateWaypoints.element.icaoSearchField = this.icaoSearchField;
    }
    onEnter() {
        if (this.gps.lastRelevantICAO && this.gps.lastRelevantICAOType == "W") {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
            this.initialIcao = this.gps.lastRelevantICAO;
        }
        else if (this.gps.icaoFromMap && this.gps.icaoFromMap[0] == "W") {
            this.icaoSearchField.SetWaypoint(this.gps.icaoFromMap[0], this.gps.icaoFromMap);
            this.initialIcao = this.gps.icaoFromMap;
        }
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.symbolElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.symbolElement.innerHTML = '';
            }
            this.regionElement.textContent = infos.region;
            this.posNSElement.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            this.posEWElement.textContent = this.gps.longitudeFormat(infos.coordinates.long);
            this.nearestVORElement.textContent = infos.nearestVORIdent;
            this.radialFromNearVORElement.textContent = fastToFixed(infos.nearestVORMagneticRadial, 0);
            this.distanceFromNearVORElement.textContent = (Math.round((infos.nearestVORDistance / 1852*10))/10).toFixed(1);
        }
        else {
            this.regionElement.textContent = "_____";
            this.posNSElement.textContent = "_ __°__.__'";
            this.posEWElement.textContent = "____°__.__'";
            this.nearestVORElement.textContent = "_____";
            this.radialFromNearVORElement.textContent = "___";
            this.distanceFromNearVORElement.textContent = "____";
        }
    }
    onExit() {
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "W";
        }
    }
    onEvent(_event) {
    }
    ident_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(this.onSearchEnd.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    onSearchEnd() {
        if (this.icaoSearchField.duplicates.length > 0) {
            this.gps.switchToPopUpPage(this.duplicateWaypoints, () => {
                if(this.gps.lastRelevantICAO) {
                    this.icaoSearchField.getWaypoint().SetICAO(this.gps.lastRelevantICAO);
                    this.gps.ActiveSelection(this.defaultSelectables);
                    this.gps.cursorIndex = 0;
                    this.menuname = ""
                }
            });
        }
        else {
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 0;
            this.menuname = ""
        }
    }
}
class GPS_NDBWaypoint extends NavSystemElement {
    constructor() {
        super();
        this.name = "NDB";
    }
    init() {
        this.identElement = this.gps.getChildById("NDBIdent");
        this.symbolElement = this.gps.getChildById("NDBSymbol");
        this.facilityElement = this.gps.getChildById("NDBFacility");
        this.cityElement = this.gps.getChildById("NDBCity");
        this.regionElement = this.gps.getChildById("NDBRegion");
        this.latitudeElement = this.gps.getChildById("NDBLatitude");
        this.longitudeElement = this.gps.getChildById("NDBLongitude");
        this.frequencyElement = this.gps.getChildById("NDBFrequency");
        this.weatherBroadcastElement = this.gps.getChildById("NDBWeatherBroadcast");
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.identElement], this.gps, 'N');
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.ident_SelectionCallback.bind(this))
        ];
        this.duplicateWaypoints = new NavSystemElementContainer("Duplicate Waypoints", "DuplicateWaypointWindow", new MFD_DuplicateWaypoint());
        this.duplicateWaypoints.setGPS(this.gps);
        this.duplicateWaypoints.element.icaoSearchField = this.icaoSearchField;
    }
    onEnter() {
        if (this.gps.lastRelevantICAO && this.gps.lastRelevantICAOType == "N") {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
            this.initialIcao = this.gps.lastRelevantICAO;
        }
        else if (this.gps.icaoFromMap && this.gps.icaoFromMap[0] == "N") {
            this.icaoSearchField.SetWaypoint(this.gps.icaoFromMap[0], this.gps.icaoFromMap);
            this.initialIcao = this.gps.icaoFromMap;
        }
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.symbolElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.symbolElement.innerHTML = '';
            }
            this.facilityElement.textContent = infos.name;
            this.cityElement.textContent = infos.city;
            this.regionElement.textContent = infos.region;
            this.latitudeElement.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            this.longitudeElement.textContent = this.gps.longitudeFormat(infos.coordinates.long);
            this.frequencyElement.textContent = fastToFixed(infos.frequencyMHz, 1);
            if (infos.weatherBroadcast == 2) {
                this.weatherBroadcastElement.textContent = "Wx Brdcst";
            }
            else {
                this.weatherBroadcastElement.textContent = "";
            }
        }
        else {
            this.identElement.textContent = "_____";
            this.symbolElement.innerHTML = "";
            this.facilityElement.textContent = "______________________";
            this.cityElement.textContent = "______________________";
            this.regionElement.textContent = "__________";
            this.latitudeElement.textContent = "_ __°__.__'";
            this.longitudeElement.textContent = "____°__.__'";
            this.frequencyElement.textContent = "___._";
            this.weatherBroadcastElement.textContent = "";
        }
    }
    onExit() {
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "N";
        }
    }
    onEvent(_event) {
    }
    ident_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(this.onSearchEnd.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    onSearchEnd() {
        if (this.icaoSearchField.duplicates.length > 0) {
            this.gps.switchToPopUpPage(this.duplicateWaypoints, () => {
                if(this.gps.lastRelevantICAO) {
                    this.icaoSearchField.getWaypoint().SetICAO(this.gps.lastRelevantICAO);
                    this.gps.ActiveSelection(this.defaultSelectables);
                    this.gps.cursorIndex = 0;
                    this.menuname = ""
                }
            });
        }
        else {
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 0;
            this.menuname = ""
        }
    }
}
class GPS_VORWaypoint extends NavSystemElement {
    constructor() {
        super();
        this.name = "VOR";
    }
    init() {
        this.identElement = this.gps.getChildById("VORIdent");
        this.symbolElement = this.gps.getChildById("VORSymbol");
        this.facilityElement = this.gps.getChildById("VORFacility");
        this.cityElement = this.gps.getChildById("VORCity");
        this.regionElement = this.gps.getChildById("VORRegion");
        this.latitudeElement = this.gps.getChildById("VORLatitude");
        this.longitudeElement = this.gps.getChildById("VORLongitude");
        this.frequencyElement = this.gps.getChildById("VORFrequency");
        this.weatherBroadcastElement = this.gps.getChildById("VORWeatherBroadcast");
        this.magneticDeviationElement = this.gps.getChildById("VORMagneticDeviation");
        this.icaoSearchField = new SearchFieldWaypointICAO(this.gps, [this.identElement], this.gps, 'V');
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.ident_SelectionCallback.bind(this)),
            new SelectableElement(this.gps, this.frequencyElement, this.frequency_SelectionCallback.bind(this))
        ];
        this.duplicateWaypoints = new NavSystemElementContainer("Duplicate Waypoints", "DuplicateWaypointWindow", new MFD_DuplicateWaypoint());
        this.duplicateWaypoints.setGPS(this.gps);
        this.duplicateWaypoints.element.icaoSearchField = this.icaoSearchField;
    }
    onEnter() {
        if (this.gps.lastRelevantICAO && this.gps.lastRelevantICAOType == "V") {
            this.icaoSearchField.SetWaypoint(this.gps.lastRelevantICAOType, this.gps.lastRelevantICAO);
            this.initialIcao = this.gps.lastRelevantICAO;
        }
        else if (this.gps.icaoFromMap && this.gps.icaoFromMap[0] == "V") {
            this.icaoSearchField.SetWaypoint(this.gps.icaoFromMap[0], this.gps.icaoFromMap);
            this.initialIcao = this.gps.icaoFromMap;
        }
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao) {
            var logo = infos.imageFileName();
            if (logo != "") {
                this.symbolElement.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.symbolElement.innerHTML = '';
            }
            this.facilityElement.textContent = infos.name;
            this.cityElement.textContent = infos.city;
            this.regionElement.textContent = infos.region;
            this.latitudeElement.textContent = this.gps.latitudeFormat(infos.coordinates.lat);
            this.longitudeElement.textContent = this.gps.longitudeFormat(infos.coordinates.long);
            this.frequencyElement.innerHTML = this.gps.frequencyFormat(infos.frequencyMHz, 2);
            if (infos.weatherBroadcast == 2) {
                this.weatherBroadcastElement.textContent = "Wx Brdcst";
            }
            else {
                this.weatherBroadcastElement.textContent = "";
            }
            var magVar = infos.magneticVariation;
            if (infos.magneticVariation > 0) {
                this.magneticDeviationElement.textContent = 'W' + Utils.leadingZeros(fastToFixed(magVar, 0), 3) + "°";
            }
            else {
                this.magneticDeviationElement.textContent = "E" + Utils.leadingZeros(fastToFixed((0 - magVar), 0), 3) + "°";
            }
        }
        else {
            this.identElement.textContent = "_____";
            this.symbolElement.innerHTML = "";
            this.facilityElement.textContent = "______________________";
            this.cityElement.textContent = "______________________";
            this.regionElement.textContent = "__________";
            this.latitudeElement.textContent = "_ __°__.__'";
            this.longitudeElement.textContent = "____°__.__'";
            this.frequencyElement.textContent = "___.__";
            this.weatherBroadcastElement.textContent = "";
            this.magneticDeviationElement.textContent = "____°";
        }
    }
    onExit() {
        if(this.initialIcao && this.icaoSearchField && this.icaoSearchField.getUpdatedInfos().icao != this.initialIcao) {
            this.gps.lastRelevantICAO = this.icaoSearchField.getUpdatedInfos().icao;
            this.gps.lastRelevantICAOType = "V";
        }
    }
    onEvent(_event) {
    }
    ident_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(this.onSearchEnd.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    onSearchEnd() {
        if (this.icaoSearchField.duplicates.length > 0) {
            this.gps.switchToPopUpPage(this.duplicateWaypoints, () => {
                if(this.gps.lastRelevantICAO) {
                    this.icaoSearchField.getWaypoint().SetICAO(this.gps.lastRelevantICAO);
                    this.gps.ActiveSelection(this.defaultSelectables);
                    this.gps.cursorIndex = 0;
                    this.menuname = ""
                }
            });
        }
        else {
            this.gps.ActiveSelection(this.defaultSelectables);
            this.gps.cursorIndex = 0;
            this.menuname = ""
        }
    }
    frequency_SelectionCallback(_event) {
        if (_event == "ENT_Push") {
            this.icaoSearchField.Update();
            var infos = this.icaoSearchField.getUpdatedInfos();
            if (infos && infos.icao)
                SimVar.SetSimVarValue("K:NAV" + this.gps.navIndex + "_STBY_SET", "Frequency BCD16", infos.frequencyBcd16);
        }
    }
}
