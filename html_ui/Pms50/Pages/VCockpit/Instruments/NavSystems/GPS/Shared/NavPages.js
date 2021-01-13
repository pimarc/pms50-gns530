class GPS_CDIElement extends NavSystemElement {
    init(_root) {
        this.cdiCursor = this.gps.getChildById("CDICursor");
        this.toFrom = this.gps.getChildById("CDIToFrom");
        this.botLeft = this.gps.getChildById("CDIBotLeft");
        this.botRight = this.gps.getChildById("CDIBotRight");
        this.mark1 = this.gps.getChildById("CDIMark1");
        this.mark2 = this.gps.getChildById("CDIMark2");
        this.mark3 = this.gps.getChildById("CDIMark3");
        this.mark4 = this.gps.getChildById("CDIMark4");
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var dtk = fastToFixed(SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"),2);
        var brg = fastToFixed(SimVar.GetSimVarValue("GPS WP BEARING", "degree"),2);
        var dtkminusbrg = ((dtk - brg) + 360) %360;
        var CTD = SimVar.GetSimVarValue("GPS WP CROSS TRK", "Nautical Miles");
        var displayedCTD = (Math.round(Math.abs(CTD)*10)/10).toFixed(1);
        var limit = 2.4;
        // On the original GPS if the distance to next WP is less than 30nm, the limit to display the sursor is 1.2nm
        if(SimVar.GetSimVarValue("GPS WP DISTANCE", "Nautical Miles") < 30)
            limit = 1.2;
        this.toFrom.innerHTML = "<img src=\"/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/cdi_tofrom.png\"" + ((dtkminusbrg > 90 && dtkminusbrg < 270) ? " style=\"transform: rotate(180deg);margin-top: 3vh;\" />" : " />");
        this.botLeft.innerHTML = (CTD < -limit) ? "<img src=\"/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/cdi_arrow.png\"/>&nbsp;" + displayedCTD : "";
        this.botRight.innerHTML = (CTD > limit) ? displayedCTD + "&nbsp;<img src=\"/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/cdi_arrow.png\"/>" : "";
        this.mark1.setAttribute("style", "visibility: " + ((CTD > limit || (-limit <= CTD && CTD <= limit)) ? "visible;" : "hidden;"));
        this.mark2.setAttribute("style", "visibility: " + ((CTD > limit || (-limit <= CTD && CTD <= limit)) ? "visible;" : "hidden;"));
        this.mark3.setAttribute("style", "visibility: " + ((CTD < -limit || (-limit <= CTD && CTD <= limit)) ? "visible;" : "hidden;"));
        this.mark4.setAttribute("style", "visibility: " + ((CTD < -limit || (-limit <= CTD && CTD <= limit)) ? "visible;" : "hidden;"));
        this.cdiCursor.setAttribute("style", "visibility: " + ((-limit <= CTD && CTD <= limit) ? "visible;" : "hidden;") + " left:" + ((CTD <= -limit ? -1 : CTD/limit >= limit ? 1 : CTD/limit) * 50 + 50) + "%;");
    }
    onExit() {
    }
    onEvent(_event) {
    }
}


// Adding base class for all nav pages with a map
class GPS_BaseNavPage extends NavSystemPage {
    constructor() {
        super(...arguments);
    }
    init(_mapnum, _trkUp, _trkUpHeight, _northUpHeight, _trkUpRangeFactor, _northUpRangeFactor, _maxrange) {
        this.mapnum = _mapnum;
        this.trkUpHeight = _trkUpHeight;
        this.northUpHeight = _northUpHeight;
        this.trkUpRangeFactor = _trkUpRangeFactor;
        this.northUpRangeFactor = _northUpRangeFactor;
        this.trackUp = _trkUp;
        this.trackUpBeforeWeather = this.trackUp;
        this.maxrange = _maxrange;
        this.declutterLevelIndex = 0;
        this.declutterLevels = [0, 0, 2, 4];
        this.mrangeContainer = this.gps.getChildById("Range" + this.mapnum);
        this.mrange = this.gps.getChildById("MapRangeValue" + this.mapnum);
        this.dlevel = this.gps.getChildById("MapDeclutterLevel" + this.mapnum);
        this.map = this.gps.getChildById("MapInstrument" + this.mapnum);
        this.mapDisplayRanges = [0.5, 1, 2, 3, 5, 10, 15, 20, 35, 50, 100, 150, 200, 350, 500, 1000, 1500, 2000];
        this.weatherRangeIndex = 0;
        this.weatherLegend = this.gps.getConfigKey("weather_legend", false);
        this.mapSavedRanges = [];
        this.mapSavedRangeIndex = 0;
        if(this.map){
            this.map.intersectionMaxRange = 16;
            this.map.mapScaleFactor = 1.4;
        }
        this.navCompassImg = this.gps.getChildById("NavCompassBackgroundImg" + this.mapnum);
        this.navCompass = this.gps.getChildById("NavCompass" + this.mapnum);
        this.navBrgImg = this.gps.getChildById("NavBrgBackgroundImg" + this.mapnum);
        this.navBrg = this.gps.getChildById("NavBrg" + this.mapnum);
        this.trkIndicator = this.gps.getChildById("TrkIndicator" + this.mapnum);
        this.northIndicatorImg = this.gps.getChildById("NorthIndicatorBackgroundImg" + this.mapnum);
        this.northIndicator = this.gps.getChildById("NorthIndicator" + this.mapnum);
        this.windDirection = this.gps.getChildById("MapWindArrow" + this.mapnum);
        this.windVelocity = this.gps.getChildById("MapWindValue" + this.mapnum);
        this.windUnit = this.gps.getChildById("MapWindUnit" + this.mapnum);
        this.windContainer = this.gps.getChildById("Wind" + this.mapnum);
        this.lasttrk = -1;
        this.lastwinddir = -1;
        if(this.navCompass)
            this.navCompass.setAttribute("style", "visibility: hidden");
        if(this.navBrg)
            this.navBrg.setAttribute("style", "visibility: hidden");
        if(this.trkIndicator)
            this.trkIndicator.setAttribute("style", "visibility: hidden");
        this.alwaysHideAirspacesAndRoads = false;
        this.displayWeather = false;
        this.weatherModeHorizontal = true;
        this.tcas = false;
        this.setMapOrientation();
    }
    onEvent(_event){
        super.onEvent(_event);
        if (_event == "CLR_Push") {
            this.toggleDeclutterLevel();
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if(this.windDirection && this.windVelocity){
            this.windVelocity.textContent = fastToFixed(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"), 0);
            let direction = fastToFixed(SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree"), 0);
            let trk = fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree"), 1);
            if(trk != this.lasttrk || direction != this.lastwinddir) {
                // Wind display from true north
                trk = fastToFixed(SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree"), 1);
                this.lastwinddir = direction;
                direction = ((direction - 180 + 360) % 360);
                if(this.trackUp){
                    direction = ((trk - direction + 360) % 360);
                    this.windDirection.style.transform = this.gps.gpsType == "530" ? "rotate(-" + direction + "deg)" : "rotate(-" + direction + "deg) scale(0.7)";
                }
                else
                    this.windDirection.style.transform = this.gps.gpsType == "530" ? "rotate(" + direction + "deg)" : "rotate(" + direction + "deg) scale(0.7)";
            }
        }
        if(this.trackUp && (this.navCompassImg || this.northIndicatorImg)){
            // magnetic north
            let trk = fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree"), 1);
            if(trk != this.lasttrk){
                // Last trk is used to save time in update (no rotation if no change)
                if(this.navCompassImg)
                    this.navCompassImg.style.transform = "rotate(-" + trk + "deg)";
                if(this.navBrgImg)
                {
                    var brg = fastToFixed(SimVar.GetSimVarValue("GPS WP BEARING", "degree"),1);
                    var angle = ((brg - trk + 360) % 360);
                    if(angle > 59 && angle < 180)
                        angle = 59;
                    if(angle > 180 && angle < 301)
                        angle = 301;
                    this.navBrgImg.style.transform = "rotate(" + angle + "deg)";
                }
                if(this.northIndicatorImg)
                    this.northIndicatorImg.style.transform = "rotate(-" + trk + "deg)";
            }
            this.lasttrk = trk;
        }

        if (this.map) {
            if(this.declutterLevelIndex || this.map.getDisplayRange() > 90 || this.displayWeather) {
                if(this.map.roadNetwork)
                    this.map.roadNetwork.setVisible(false);
                this.map.showAirspaces = false;
                this.map.showRoads  = false;
            }
            else {
                if(!this.alwaysHideAirspacesAndRoads){
                    this.map.showAirspaces = true;
                    this.map.showRoads  = true;
                    if(this.map.roadNetwork)
                        this.map.roadNetwork.setVisible(true);
                }
            }
            if(this.mrange) {
                Avionics.Utils.diffAndSet(this.mrange, this.mapDisplayRanges[this.map.rangeIndex]);
            }
            if(this.dlevel)
                Avionics.Utils.diffAndSet(this.dlevel, this.declutterLevelIndex ? "-" + this.declutterLevelIndex : "");
            if(this.mapDisplayRanges[this.map.rangeIndex] > 35)
                this.map.showTraffic = false;
            else
                this.map.showTraffic = true;
        }
    }
    toggleDeclutterLevel() {
        if (!this.gps.currentContextualMenu) {
            if (this.map && !this.displayWeather) {
                this.declutterLevelIndex ++;
                if (this.declutterLevelIndex >= this.declutterLevels.length) {
                    this.declutterLevelIndex = 0;
                }
                this.map.declutterLevel=this.declutterLevels[this.declutterLevelIndex];
            }
        }
    }
    toggleMapOrientation() {
        if (this.map && this.map.navMap) {
            this.trackUp = !this.trackUp;
            this.setMapOrientation();
        }
        this.gps.SwitchToInteractionState(0);
    }
    setDisplayElements() {
        if (this.map && this.map.navMap) {
            if(this.displayWeather){
                if(this.mrangeContainer)
                    this.mrangeContainer.setAttribute("style", "visibility: hidden");
                if(this.windContainer)
                    this.windContainer.setAttribute("style", "visibility: hidden");
                if(this.navCompass)
                    this.navCompass.setAttribute("style", "visibility: hidden;");
                if(this.navBrg)
                    this.navBrg.setAttribute("style", "visibility: hidden;");
                if(this.trkIndicator)
                    this.trkIndicator.setAttribute("style", "visibility: hidden;");
                if(this.northIndicator)
                    this.northIndicator.setAttribute("style", "visibility: hidden");
            }
            else {
                if(this.mrangeContainer)
                    this.mrangeContainer.setAttribute("style", "visibility: visible");
                if(this.windContainer)
                    this.windContainer.setAttribute("style", "visibility: visible");
               if(this.trackUp){
                    if(this.navCompass)
                        this.navCompass.setAttribute("style", "visibility: visible");
                    if(this.navBrg)
                        this.navBrg.setAttribute("style", "visibility: visible");
                    if(this.trkIndicator)
                        this.trkIndicator.setAttribute("style", "visibility: visible");
                    if(this.northIndicator)
                        this.northIndicator.setAttribute("style", "visibility: visible");
                }
                else {
                    if(this.navCompass)
                        this.navCompass.setAttribute("style", "visibility: hidden;");
                    if(this.navBrg)
                        this.navBrg.setAttribute("style", "visibility: hidden;");
                    if(this.trkIndicator)
                        this.trkIndicator.setAttribute("style", "visibility: hidden;");
                    if(this.northIndicator)
                        this.northIndicator.setAttribute("style", "visibility: hidden");
                }
            }
       }
    }
    setMapOrientation() {
        if (this.map && this.map.navMap) {
            if(this.trackUp){
                this.map.rotateWithPlane(true);
                this.setDisplayElements();
                this.map.setAttribute("style", "height: " + this.trkUpHeight + ";");
                this.setMapRanges();
                this.map.intersectionMaxRange = 27
                this.map.vorMaxRange = 270;
                this.map.ndbMaxRange = 180;
                this.map.smallAirportMaxRange = 65;
                this.map.medAirportMaxRange = 180;
                this.map.smallCityMaxRange = 180;
                this.map.medCityMaxRange = 360;
                this.map.largeCityMaxRange = 2670;
                this.map.npcAirplaneMaxRange = 400;
                this.map.roadNetwork._lastRange = -1;
            }
            else{
                this.map.rotateWithPlane(false);
                this.setDisplayElements();
                this.map.setAttribute("style", "height: " + this.northUpHeight + ";");
                this.setMapRanges();
                this.map.intersectionMaxRange = 16;
                this.map.vorMaxRange = 200;
                this.map.ndbMaxRange = 100;
                this.map.smallAirportMaxRange = 35;
                this.map.medAirportMaxRange = 100;
                this.map.smallCityMaxRange = 100;
                this.map.medCityMaxRange = 200;
                this.map.largeCityMaxRange = 1500;
                this.map.npcAirplaneMaxRange = 400;
                this.map.roadNetwork._lastRange = -1;
            }
        }
    }
    setMapRanges() {
        let rangeFactor = this.trackUp ? this.trkUpRangeFactor : this.northUpRangeFactor;
        this.map._ranges.length = 0;
        for (let i = 0; i < this.mapDisplayRanges.length; i++) {
            if(this.mapDisplayRanges[i] > this.maxrange)
                break;
            this.map._ranges[i] = this.mapDisplayRanges[i]*rangeFactor;
        }
    }
    saveRange() {
        this.mapSavedRanges = this.map._ranges;
        this.mapSavedRangeIndex = this.map.rangeIndex;
        this.map.rangeIndex = this.weatherRangeIndex;
        this.map._ranges = this.map.weatherRanges;
        if(this.map.rangeIndex > this.map._ranges.length)
            this.map.rangeIndex = 0;
    }
    restoreRange() {
        this.weatherRangeIndex = this.map.rangeIndex;
        this.map._ranges = this.mapSavedRanges;
        this.map.rangeIndex = this.mapSavedRangeIndex;
        if(this.map.rangeIndex > this.map._ranges.length)
            this.map.rangeIndex = 0;
    }
    toggleMapWeather() {
        let elem = this.gps.getElementOfType(GPS_Map);
        if(this.displayWeather){
            this.displayWeather = false;
            this.restoreRange();
            if(elem) {
                if(elem.nexradOn)
                    elem.setWeather(EWeatherRadar.TOPVIEW);
                else
                    elem.setWeather(EWeatherRadar.OFF);
            }
        }
        else {
            this.displayWeather = true;
            this.saveRange();
            if(elem){
                if(this.weatherModeHorizontal)
                    elem.setWeather(EWeatherRadar.HORIZONTAL, this.weatherLegend);
                else
                    elem.setWeather(EWeatherRadar.VERTICAL, this.weatherLegend);
            }
        }
        this.setDisplayElements();
    }
    toggleWeatherMode() {
        if(this.displayWeather){
            let elem = this.element.getElementOfType(GPS_Map);
            if(this.weatherModeHorizontal){
                if(elem)
                    elem.setWeather(EWeatherRadar.VERTICAL, this.weatherLegend);
                this.weatherModeHorizontal = false;
            }
            else {
                if(elem)
                    elem.setWeather(EWeatherRadar.HORIZONTAL, this.weatherLegend);
                this.weatherModeHorizontal = true;
            }
        }
    }
    toggleWeatherLegend() {
        if(this.displayWeather){
            this.weatherLegend = this.weatherLegend ? false : true;
            let elem = this.element.getElementOfType(GPS_Map);
            if(elem){
                if(this.weatherModeHorizontal)
                    elem.setWeather(EWeatherRadar.HORIZONTAL, this.weatherLegend);
                else
                    elem.setWeather(EWeatherRadar.VERTICAL, this.weatherLegend);
            }
        }
    }
    toggleNexrad() {
        let elem = this.element.getElementOfType(GPS_Map);
        if(elem)
            elem.toggleNexrad();
    }
    toggleTCAS() {
        this.tcas = !this.tcas;
        this.map.setNPCAirplaneManagerTCASMode(this.tcas);
    }
}

class GPS_DefaultNavPage extends GPS_BaseNavPage {
    constructor(_customValuesNumber = 6, _customValuesDefaults = [4, 3, 0, 9, 10, 7], gpsType = "530") {
        if(gpsType == "530") {
            var cdiElem = new GPS_CDIElement();
        }
        else {
            var cdiElem = new CDIElement();
        }
        var baseElem = new GPS_DefaultNav(_customValuesNumber, _customValuesDefaults);
        super("DefaultNav", "DefaultNav", new NavSystemElementGroup([baseElem, cdiElem]));
        this.cdiElement = cdiElem;
        this.baseElem = baseElem;
        this.nightLighting = false;
        this.initialUpdate = true;
    }
    init() {
        this.trackUp = this.gps.dataStore.get("BaseNavTrackUp", false);
        super.init(1, this.trackUp, "110%", "66%", 1.62, 1, 200);
        if(this.gps.gpsType == "530") {
            this.defaultMenu = new ContextualMenu("PAGE MENU", [
                new ContextualMenuElement("Crossfill?", null, true),
                new ContextualMenuElement("Change&nbsp;Fields?", this.gps.ActiveSelection.bind(this.gps, this.baseElem.dnCustomSelectableArray), false),
                new ContextualMenuElement("North up/Trk up?", this.toggleMapOrientation.bind(this)),
                new ContextualMenuElement("Restore&nbsp;Defaults?", this.restoreDefaults.bind(this)),
                new ContextualMenuElement("Day/Night&nbsp;lighting", this.toggleLighting.bind(this)),
                new ContextualMenuElement("Restart GPS?", this.reloadGPS.bind(this))
            ]);
        }
        else {
            this.defaultMenu = new ContextualMenu("PAGE MENU", [
                new ContextualMenuElement("Crossfill?", null, true),
                new ContextualMenuElement("Change&nbsp;Fields?", this.gps.ActiveSelection.bind(this.gps, this.baseElem.dnCustomSelectableArray), false),
                new ContextualMenuElement("Restore&nbsp;Defaults?", this.restoreDefaults.bind(this)),
                new ContextualMenuElement("Day/Night&nbsp;lighting", this.toggleLighting.bind(this)),
                new ContextualMenuElement("Restart GPS?", this.reloadGPS.bind(this))
            ]);
        }
    }
    onEvent(_event){
        super.onEvent(_event);
        if (_event == "CLR_Push")  {
            this.gps.closePopUpElement();
            this.gps.currentContextualMenu = null;
            this.gps.SwitchToInteractionState(0);
        }
        if (_event == "MENU_Push")  {
            // Unblock declutter when leaving menu
            this.gps.currentContextualMenu = null;
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if(this.initialUpdate) {
            this.initialUpdate = false;
            this.gps.currFlightPlanManager.updateFlightPlan();
        }
    }
    restoreDefaults() {
        this.baseElem.restoreCustomValues();
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    reloadGPS() {
        this.element.gps.confirmWindow.element.setTexts("Restart GPS ?");
        this.element.gps.switchToPopUpPage(this.element.gps.confirmWindow, () => {
            if (this.element.gps.confirmWindow.element.Result == 1) {
                window.location.reload();
                return;
            }
            this.element.gps.SwitchToInteractionState(0);
        });
    }
    toggleMapOrientation() {
        super.toggleMapOrientation();
        this.gps.dataStore.set("BaseNavTrackUp", this.trackUp);
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    toggleLighting() {
        var dark = this.gps.getChildById("dark");
        this.nightLighting = this.nightLighting ? false : true;
        dark.setAttribute("style", this.nightLighting ? "display: block;" : "display:none;");
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
}

class GPS_DefaultNav extends NavSystemElement {
    constructor(_customValuesNumber = 6, _customValuesDefaults = [4, 3, 0, 9, 10, 7]) {
        super();
        this.dnCustoms = [];
        this.legSymbol = 0;
        this.name = "DefaultNav";
        this.customValuesNumber = _customValuesNumber;
        this.customValuesDefault = _customValuesDefaults;
    }
    init() {
        this.currBranchFrom = this.gps.getChildById("CurrBranchFrom");
        this.currBranchArrow = this.gps.getChildById("CurrBranchArrow");
        this.currBranchTo = this.gps.getChildById("CurrBranchTo");
        this.dnCustoms = [];
        this.dnCustomSelectableArray = [];
        for (let i = 0; i < this.customValuesNumber; i++) {
            let num = i + 1;
            this.dnCustoms.push(new CustomValue(this.gps, "DNName" + num, "DNValue" + num, "DNUnit" + num));
            // Track cannot be changed in the original GPS
            if(this.gps.gpsType != "530" || i!=4)
                this.dnCustomSelectableArray.push(new SelectableElement(this.gps, this.dnCustoms[i].nameDisplay, this.customValueSelect_CB.bind(this, i)));
        }
        this.dnCustomFieldSelectorMenu = new ContextualMenu("SELECT&nbsp;FIELD&nbsp;TYPE", [
            new ContextualMenuElement("BRG&nbsp;&nbsp;-&nbsp;Bearing", this.customValueSet_CB.bind(this, 0)),
            new ContextualMenuElement("CTS&nbsp;&nbsp;-&nbsp;Course&nbsp;To&nbsp;Steer", this.customValueSet_CB.bind(this, 1)),
            new ContextualMenuElement("XTK&nbsp;&nbsp;-&nbsp;Cross&nbsp;Track&nbsp;Err", this.customValueSet_CB.bind(this, 2)),
            new ContextualMenuElement("DTK&nbsp;&nbsp;-&nbsp;Desired&nbsp;Track", this.customValueSet_CB.bind(this, 3)),
            new ContextualMenuElement("DIS&nbsp;&nbsp;-&nbsp;Distance", this.customValueSet_CB.bind(this, 4)),
            new ContextualMenuElement("ESA&nbsp;&nbsp;-&nbsp;Enrte&nbsp;Safe&nbsp;Alt", this.customValueSet_CB.bind(this, 5)),
            new ContextualMenuElement("ETA&nbsp;&nbsp;-&nbsp;Est&nbsp;Time&nbsp;Arvl", this.customValueSet_CB.bind(this, 6)),
            new ContextualMenuElement("ETE&nbsp;&nbsp;-&nbsp;Est&nbsp;Time&nbsp;Enrte", this.customValueSet_CB.bind(this, 7)),
            new ContextualMenuElement("FLOW&nbsp;-&nbsp;Fuel&nbsp;Flow", this.customValueSet_CB.bind(this, 8)),
            new ContextualMenuElement("GS&nbsp;&nbsp;&nbsp;-&nbsp;Ground&nbsp;Speed", this.customValueSet_CB.bind(this, 9)),
            new ContextualMenuElement("TRK&nbsp;&nbsp;-&nbsp;Ground&nbsp;Track", this.customValueSet_CB.bind(this, 10)),
            new ContextualMenuElement("MSA&nbsp;&nbsp;-&nbsp;Min&nbsp;Safe&nbsp;Alt", this.customValueSet_CB.bind(this, 11)),
            new ContextualMenuElement("TKE&nbsp;&nbsp;-&nbsp;Track&nbsp;Angle&nbsp;Err", this.customValueSet_CB.bind(this, 12)),
            new ContextualMenuElement("VSR&nbsp;-&nbsp;Vert&nbsp;Speed&nbsp;Rqrd", this.customValueSet_CB.bind(this, 13)),
            new ContextualMenuElement("ALT&nbsp;-&nbsp;Altitude", this.customValueSet_CB.bind(this, 14)),
            new ContextualMenuElement("BARO&nbsp;-&nbsp;Baro", this.customValueSet_CB.bind(this, 15)),
            new ContextualMenuElement("WPT&nbsp;-&nbsp;Target&nbsp;Waypoint", this.customValueSet_CB.bind(this, 16)),
        ]);
        this.restoreCustomValues();
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.currBranchFrom.textContent = SimVar.GetSimVarValue("GPS WP PREV ID", "string").slice(0, 7);
        if (this.gps.currFlightPlanManager.getIsDirectTo()) {
            if (this.legSymbol != 1) {
                this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/direct_to.png" class="imgSizeM"/>';
                this.legSymbol = 1;
            }
        }
        else {
            if (SimVar.GetSimVarValue("GPS IS APPROACH ACTIVE", "Boolean")) {
                let approachType = SimVar.GetSimVarValue("GPS APPROACH WP TYPE", "number");
                switch (approachType) {
                    case 0:
                    case 1:
                    case 8:
                    case 9:
                    case 10:
                        if (this.legSymbol != 2) {
                            this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/course_to.png" class="imgSizeM"/>';
                            this.legSymbol = 2;
                        }
                        break;
                    case 2:
                        if (this.legSymbol != 3) {
                            this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/left_turn.png" class="imgSizeM"/>';
                            this.legSymbol = 3;
                        }
                        break;
                    case 3:
                        if (this.legSymbol != 4) {
                            this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/right_turn.png" class="imgSizeM"/>';
                            this.legSymbol = 4;
                        }
                        break;
                    case 4:
                        if (this.legSymbol != 5) {
                            this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/arc_left.png" class="imgSizeM"/>';
                            this.legSymbol = 5;
                        }
                        break;
                    case 5:
                        if (this.legSymbol != 6) {
                            this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/arc_right.png" class="imgSizeM"/>';
                            this.legSymbol = 6;
                        }
                        break;
                    case 6:
                        if (this.legSymbol != 7) {
                            this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/left_hand.png" class="imgSizeM"/>';
                            this.legSymbol = 7;
                        }
                        break;
                    case 7:
                        if (this.legSymbol != 8) {
                            this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/right_hand.png" class="imgSizeM"/>';
                            this.legSymbol = 8;
                        }
                        break;
                    case 11:
                        if (this.legSymbol != 9) {
                            this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/vectors_to_final.png" class="imgSizeM"/>';
                            this.legSymbol = 9;
                        }
                        break;
                }
            }
            else {
                if (this.legSymbol != 2) {
                    this.currBranchArrow.innerHTML = '<img src="/Pms50/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/course_to.png" class="imgSizeM"/>';
                    this.legSymbol = 2;
                }
            }
        }
        this.currBranchTo.textContent = SimVar.GetSimVarValue("GPS WP NEXT ID", "string").slice(0, 7);
        for (var i = 0; i < this.dnCustoms.length; i++) {
            this.dnCustoms[i].Update();
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    customValueSelect_CB(_param, _event) {
        switch (_event) {
            case "RightSmallKnob_Right":
            case "RightSmallKnob_Left":
                this.selectedCustomValueIndex = _param;
                this.gps.ShowContextualMenu(this.dnCustomFieldSelectorMenu);
                break;
            default:
                return false;
        }
        return true;
    }
    customValueSet_CB(_param) {
        this.dnCustoms[this.selectedCustomValueIndex].valueIndex = _param;
        this.gps.SwitchToInteractionState(1);
        this.gps.cursorIndex = this.selectedCustomValueIndex;
    }
    restoreCustomValues() {
        for (let i = 0; i < this.customValuesNumber; i++) {
            this.dnCustoms[i].valueIndex = this.customValuesDefault[i];
        }
        this.gps.SwitchToInteractionState(0);
    }
}


class GPS_MapNavPage extends GPS_BaseNavPage {
    constructor(_customValuesNumber = 6, _customValuesDefaults = [4, 3, 0, 9, 10, 7]) {
        var cdiElem = new CDIElement();
        var baseElem = new GPS_MapNav(_customValuesNumber, _customValuesDefaults);
        super("MapNav", "MapNav", new NavSystemElementGroup([baseElem, cdiElem]));
        this.cdiElement = cdiElem;
        this.baseElem = baseElem;
    }
    init() {
        this.displayData = !this.gps.dataStore.get("MapDisplayData", true); // Not operator because toggle after
        this.trackUp = this.gps.dataStore.get("MapTrackUp", false);
        super.init(2, this.trackUp, "110%", "66%", 1.47, 1.53, 2000);
        var menu_elements = [];
        menu_elements.push(new ContextualMenuElement("Data On/Off?", this.toggleDataDisplay.bind(this), this.toggleDisplayDataCB.bind(this)));
        menu_elements.push(new ContextualMenuElement("North up/Trk up", this.toggleMapOrientation.bind(this), this.toggleMapOrientationCB.bind(this)));
        menu_elements.push(new ContextualMenuElement("Nexrad on/off", this.toggleNexrad.bind(this), this.toggleNexradCB.bind(this)));
        menu_elements.push(new ContextualMenuElement("TCAS on/off", this.toggleTCAS.bind(this), this.toggleTCASCB.bind(this)));
        menu_elements.push(new ContextualMenuElement("Change&nbsp;Fields?", this.gps.ActiveSelection.bind(this.gps, this.baseElem.dnCustomSelectableArray), this.changeFieldsStateCB.bind(this)));
        menu_elements.push(new ContextualMenuElement("Restore&nbsp;Defaults?", this.restoreDefaults.bind(this), this.restoreDefaultsCB.bind(this)));
        this.defaultMenu = new ContextualMenu("PAGE MENU", menu_elements);
        // No data displayed by default for GNS530
        this.toggleDataDisplay();
        this.savedDisplayData = this.displayData;
        this.nearestIntersectionList = new NearestIntersectionList(this.map.instrument);
        this.nearestNDBList = new NearestNDBList(this.map.instrument);
        this.nearestVORList = new NearestVORList(this.map.instrument);
        this.nearestAirportList = new NearestAirportList(this.map.instrument);
        this._t = 0;
        this.gps.icaoFromMap = null;
        this.selectedsvgMapElement = null;
        this.cursorData = this.gps.getChildById("CursorMode");
        if(this.cursorData)
            this.cursorData.setAttribute("style", "display: none");
        this.cursorDataLeft = this.gps.getChildById("CursorModeLeft");
        this.cursorDataRight = this.gps.getChildById("CursorModeRight");
        this.tcas = this.gps.dataStore.get("MapTCAS", false);
        if(this.tcas) {
            this.tcas = false;
            this.toggleTCAS();
        }
    }
    onEnter() {
        if(this.map && !this.displayWeather) {
            if(this.tcas)
                this.gps.getChildById("TCAS").setAttribute("style", "display: block");
            else
                this.gps.getChildById("TCAS").setAttribute("style", "display: none");
        }
    }
    onEvent(_event){
        if(this.map && !this.displayWeather && this.map.eBingMode == EBingMode.CURSOR) {
            let cursorSpeed = 2;
            let mapSpeed = 4;
            if(_event == "RNG_Zoom" || _event == "RNG_Dezoom") {
                this.map.onEvent(_event);
            }
            else if(_event == "NavigationSmallInc" ) {
                if (this.map.cursorY > 15) {
                    this.map.setCursorPos(this.map.cursorX, this.map.cursorY - cursorSpeed);
                }
                else {
                    let offset = new Vec2(0, +mapSpeed);
                    this.moveMap(offset);
                }
            }
            else if(_event == "NavigationSmallDec" ) {
                if (this.map.cursorY < 95) {
                    this.map.setCursorPos(this.map.cursorX, this.map.cursorY + cursorSpeed);
                }
                else {
                    let offset = new Vec2(0, -mapSpeed);
                    this.moveMap(offset);
                }
            }
            else if(_event == "NavigationLargeInc" ) {
                if (this.map.cursorX < 95) {
                    this.map.setCursorPos(this.map.cursorX + cursorSpeed, this.map.cursorY);
                }
                else {
                    let offset = new Vec2(-mapSpeed, 0);
                    this.moveMap(offset);
                }
            }
            else if(_event == "NavigationLargeDec" ) {
                if (this.map.cursorX > 5) {
                    this.map.setCursorPos(this.map.cursorX - cursorSpeed, this.map.cursorY);
                }
                else {
                    let offset = new Vec2(+mapSpeed, 0);
                    this.moveMap(offset);
                }
            }
            else if (_event == "CLR_Push")  {
                super.onEvent(_event);
                return;
            }
            else if (_event == "ENT_Push")  {
                this.map.setNavMapCenter(this.getCursorCoordinates());
                this.map.setCursorPos(50, 50);
                this.clearSelectedElement();
                return;
            }
            if(_event == "DirectTo_Push" 
                || _event == "MENU_Push"
                || _event == "CLR_Push_Long"
                || _event == "PROC_Push"
                || _event == "VNAV_Push"
                || _event == "FPL_Push"
                || _event == "MSG_Push")  {
                if(this.map && !this.displayWeather && this.map.eBingMode === EBingMode.CURSOR) {
                    this.map.deactivateCursor();
                    this.clearSelectedElement();
                    this.gps.SwitchToInteractionState(0);
                    if(this.windContainer)
                       this.windContainer.setAttribute("style", "visibility: visible");
                   if(this.northIndicator && this.trackUp)
                      this.northIndicator.setAttribute("style", "visibility: visible");
                    if(this.cursorData)
                        this.cursorData.setAttribute("style", "display: none");
                    if(this.tcas)
                        this.gps.getChildById("TCAS").setAttribute("style", "display: block");
                    else
                        this.gps.getChildById("TCAS").setAttribute("style", "display: none");
                }
                super.onEvent(_event);
            }
        }
        else
            super.onEvent(_event);

        if (_event == "CLR_Push")  {
            this.gps.closePopUpElement();
            this.gps.currentContextualMenu = null;
            this.gps.SwitchToInteractionState(0);
            if(this.displayWeather && this.gps.getConfigKey("weather_legend", false))
                this.toggleWeatherLegend();
            // Declutter a max when declutter level 3 and TCAS displayed
            if(!this.displayWeather && this.map)
            {
                if(this.tcas && (this.declutterLevelIndex == this.declutterLevels.length-1) && this.mapDisplayRanges[this.map.rangeIndex] <= 20) {
                    this.map.showVORs = false;
                    this.map.showIntersections = false;
                    this.map.showNDBs = false;
                    this.map.showAirports = false;
                    this.map.showObstacles = false;
                }
                else {
                    this.map.showVORs = true;
                    this.map.showIntersections = true;
                    this.map.showNDBs = true;
                    this.map.showAirports = true;
                    this.map.showObstacles = true;
                }
            }
        }
        if (_event == "ENT_Push")  {
            if(this.gps.getConfigKey("weather_radar", false) && this.gps.gpsType == "530")
            {
                if(!this.gps.currentContextualMenu)
                    if(!this.displayWeather || !this.weatherModeHorizontal) {
                        if(!this.weatherModeHorizontal)
                            this.toggleWeatherMode();
                        this.toggleMapWeather();
                    }
                    else
                        this.toggleWeatherMode();
                }
        }
        if (_event == "NavigationPush")  {
            if(this.gps.currentInteractionState != 2) {
                this.gps.currentContextualMenu = null;
                if(this.map && !this.displayWeather) {
                    if (this.map.eBingMode === EBingMode.PLANE || this.map.eBingMode === EBingMode.VFR) {
                        this.map.cursorSvg.setAttribute("height", "5%");
                        if(this.gps.gpsType == "430")
                            this.map.cursorSvg.setAttribute("height", "8%");
                        this.map.activateCursor();
                        // We block the nav page mecanism by setting interaction state to 3
                        // (normaly used for search field)
                        this.gps.currentSearchFieldWaypoint = null;
                        this.gps.SwitchToInteractionState(3);
                        if(this.windContainer)
                            this.windContainer.setAttribute("style", "visibility: hidden");
                        if(this.northIndicator)
                            this.northIndicator.setAttribute("style", "visibility: hidden");
                        if(this.cursorData)
                            this.cursorData.setAttribute("style", "display: flex");
                        this.gps.getChildById("TCAS").setAttribute("style", "display: none");
                    }
                    else if (this.map.eBingMode === EBingMode.CURSOR) {
                        this.map.deactivateCursor();
                        this.clearSelectedElement();
                        this.gps.SwitchToInteractionState(0);
                        if(this.windContainer) {
                            this.windContainer.setAttribute("style", "visibility: visible");
                            if(this.displayData) {
                                this.gps.getChildById("Wind2").setAttribute("style", "right: 30%;");
                            }
                            else
                                this.gps.getChildById("Wind2").setAttribute("style", "right: 2%;");
                        }
                       if(this.northIndicator && this.trackUp)
                           this.northIndicator.setAttribute("style", "visibility: visible");
                        if(this.cursorData)
                            this.cursorData.setAttribute("style", "display: none");
                        if(this.tcas)
                            this.gps.getChildById("TCAS").setAttribute("style", "display: block");
                        else
                            this.gps.getChildById("TCAS").setAttribute("style", "display: none");
                    }
                }
            }
        }
        if (_event == "MENU_Push")  {
            // Unblock declutter when leving menu
            this.gps.currentContextualMenu = null;
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if(this.map && !this.displayWeather && this.map.eBingMode == EBingMode.CURSOR) {
            if(this.gps.currentInteractionState != 3) {
                // This situation may occur after a direcTo from map and then CLR
                this.map.deactivateCursor();
                this.clearSelectedElement();
                this.gps.SwitchToInteractionState(0);
                if(this.windContainer)
                    this.windContainer.setAttribute("style", "visibility: visible");
               if(this.northIndicator && this.trackUp)
                   this.northIndicator.setAttribute("style", "visibility: visible");
                if(this.cursorData)
                    this.cursorData.setAttribute("style", "display: none");
                return;
            }
            this._t++;
            if(this._t > 5)
            {
                this._t = 0;
                this.UpdateNearests();
                if(this.displayData) {
                    this.cursorDataRight.setAttribute("style", "margin-right: 30%");
                }
                else {
                    this.cursorDataRight.setAttribute("style", "");
                }
            }
            let cc = this.getCursorCoordinates();
            this.cursorDataRight.innerHTML = this.gps.latitudeFormat(cc.lat) + "<br />" + this.gps.longitudeFormat(cc.long);
            let text = "MAP CURSOR";
            if(this.selectedsvgMapElement && this.selectedsvgMapElement.selected && this.selectedsvgMapElement.source) {
                text = this.selectedsvgMapElement.source.ident;
                let coordinates = this.selectedsvgMapElement.coordinates;
                if(!coordinates && this.selectedsvgMapElement.source)
                {
                    let wp = new WayPoint(this.gps);
                    wp.icao = this.selectedsvgMapElement.source.icao;
                    wp.ident = wp.icao.substr(7);
                    if(wp.icao.replace(/\s+/g, '').length){
                        wp.UpdateInfos(() => {
                            coordinates = wp.infos.coordinates;
                        });
                    }
                }
                if(coordinates)
                    cc = coordinates;
            }
            text += "<br />";
            text += fastToFixed(Avionics.Utils.computeGreatCircleHeading(new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")), cc) - SimVar.GetSimVarValue("MAGVAR", "degrees"), 0) + "°";
            text += " " + fastToFixed(Avionics.Utils.computeGreatCircleDistance(new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")), cc), 1) + '<div class="Align unit">n<br />m</div>';
            this.cursorDataLeft.innerHTML = text;
        }
    }
    UpdateNearests() {

        let mapSvgElements = [];
        for (let i = 0; i < this.map.navMap.mapElements.length; i++) {
            let svgElement = this.map.navMap.mapElements[i];
            if (svgElement.source && svgElement.source.icao)
                mapSvgElements.push(svgElement);
        }
        if(!mapSvgElements.length) {
            this.clearSelectedElement();
            return;
        }

        let cc = this.getCursorCoordinates();
        let distance = 1000;
        let icao = null;
        let svgMapElement = null;
        let maxdistance = this.mapDisplayRanges[this.map.rangeIndex] / 5;
        // Calulate distance
        for (let i = 0; i < mapSvgElements.length; i++) {
            let svgElement = mapSvgElements[i];
            let coordinates = svgElement.coordinates;
            if(!coordinates && svgElement.source)
            {
                let wp = new WayPoint(this.gps);
                wp.icao = svgElement.source.icao;
                wp.ident = wp.icao.substr(7);
                if(wp.icao.replace(/\s+/g, '').length){
                    wp.UpdateInfos(() => {
                        coordinates = wp.infos.coordinates;
                    });
                }
            }
            if(coordinates) {
                let distanceFromCursor = Avionics.Utils.computeDistance(coordinates, cc);
                if(distanceFromCursor < distance && distanceFromCursor < maxdistance) {
                    distance = distanceFromCursor;
                    svgMapElement = svgElement;
                }
            }
        }

        if (!svgMapElement) {
            this.clearSelectedElement();
            return;
        }
        if(svgMapElement != this.selectedsvgMapElement)
            this.clearSelectedElement();
        this.selectedsvgMapElement = svgMapElement;
        this.selectedsvgMapElement.selected = true;
        this.selectedsvgMapElement._refreshLabel(this.map.navMap, false);
        if(svgMapElement.source)
            icao = svgMapElement.source.icao;
        if(icao) {
            this.gps.lastRelevantICAO = icao;
            this.gps.lastRelevantICAOType = icao[0];
            this.gps.icaoFromMap = this.gps.lastRelevantICAO;
        }
    }
    clearSelectedElement() {
        if(this.selectedsvgMapElement) {
            this.selectedsvgMapElement.selected = false;
            this.selectedsvgMapElement._refreshLabel(this.map.navMap, false);
        }
    }
    getCursorCoordinates(offset = null) {
        let ratio = this.map.getWidth() / this.map.getHeight();
        let xyc = this.map.navMap.coordinatesToXY(this.map.navMap.centerCoordinates);
        let xy = new Vec2();
        if(offset){
            xy.x =  10 * (this.map.cursorX + offset.x);
            xy.y = 10 * (this.map.cursorY + offset.y);
        }
        else {
            xy.x =  10 * this.map.cursorX;
            xy.y = 10 * this.map.cursorY;
        }
        if(ratio > 1) {
            xy.y = xy.y / ratio + (this.map.getWidth() - this.map.getHeight())*4/2;
        }
        if(ratio < 1) {
            xy.x = xy.x * ratio + (this.map.getHeight() - this.map.getWidth())*4/2;
        }
        if(this.trackUp) {
           let trk = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
           xy = this.getTrkRotation(xy, xyc, 360-trk);
        }
        let nc = this.map.navMap.XYToCoordinates(xy);
        return nc;
    }
    getTrkRotation (M, O, angle) {
        var xM, yM, x, y;
        angle *= Math.PI / 180;
        xM = M.x - O.x;
        yM = M.y - O.y;
        x = xM * Math.cos (angle) + yM * Math.sin (angle) + O.x;
        y = - xM * Math.sin (angle) + yM * Math.cos (angle) + O.y;
        return ({x:Math.round (x), y:Math.round (y)});
    }
    moveMap(offset) {
        if(this.trackUp){
            let cursorbefore = this.getCursorCoordinates();
            let cursorafter = this.getCursorCoordinates(offset);
            let difflat = cursorafter.lat - cursorbefore.lat;
            let difflong = cursorafter.long - cursorbefore.long;
            let center = this.map.navMap.centerCoordinates;
            center.lat -= difflat;
            center.long -= difflong;
            this.map.setNavMapCenter(center);
        }
        else {
            this.map.scrollDisp.y += offset.y;
            this.map.scrollDisp.x += offset.x;
            this.map.svgSmooth = this.map.SVG_SMOOTH_CURSOR;
        }
    }
    restoreDefaultsCB(){
        return !this.displayData;
    }
    restoreDefaults() {
        this.baseElem.restoreCustomValues();
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    toggleMapOrientation() {
        super.toggleMapOrientation();
        this.gps.dataStore.set("MapTrackUp", this.trackUp);
        if (this.map && this.map.navMap) {
            // We must readjust width after changing the height in toggle map orientation
            if(this.displayData){
                this.gps.getChildById("MapInstrument2").setAttribute("style", "width: 70%;");
                this.gps.getChildById("Wind2").setAttribute("style", "right: 30%;");
            }
            else{
                this.gps.getChildById("MapInstrument2").setAttribute("style", "width: 100%;");
                this.gps.getChildById("Wind2").setAttribute("style", "right: 2%;");
            }
        }
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    toggleWeatherModeCB(){
        return !this.displayWeather;
    }
    toggleMapOrientationCB() {
        return this.displayWeather;
    }
    toggleNexradCB(){
        return this.displayWeather;
    }
    toggleTCASCB(){
        return this.displayWeather;
    }
    toggleMapWeather() {
        if(this.displayWeather){
            if(this.savedDisplayData)
                this.toggleDataDisplay();
            if(this.tcas)
                this.gps.getChildById("TCAS").setAttribute("style", "display: block");
            else
                this.gps.getChildById("TCAS").setAttribute("style", "display: none");
        }
        else
        {
            this.savedDisplayData = this.displayData;
            if(this.displayData)
                this.toggleDataDisplay();
            this.gps.getChildById("TCAS").setAttribute("style", "display: none");
        }
        super.toggleMapWeather();
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    toggleWeatherMode() {
        super.toggleWeatherMode();
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    toggleWeatherLegend() {
        super.toggleWeatherLegend();
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    toggleNexrad() {
        super.toggleNexrad();
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    toggleTCAS() {
        super.toggleTCAS();
        this.gps.dataStore.set("MapTCAS", this.tcas);
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
        if(this.tcas) {
            this.gps.getChildById("TCAS").setAttribute("style", "display: block");
            // Set the range to max 20
            while(this.mapDisplayRanges[this.map.rangeIndex] > 20 && this.map.rangeIndex >= 0)
                this.map.zoomIn();
            // Set declutter level to max
            this.declutterLevelIndex = this.declutterLevels.length-1;
            this.map.declutterLevel = this.declutterLevels[this.declutterLevelIndex];
            if(this.mapDisplayRanges[this.map.rangeIndex] <= 20) {
                this.map.showVORs = false;
                this.map.showIntersections = false;
                this.map.showNDBs = false;
                this.map.showAirports = false;
                this.map.showObstacles = false;
            }
        }
        else {
            this.gps.getChildById("TCAS").setAttribute("style", "display: none");
        }
    }
    toggleDisplayDataCB(){
        return this.displayWeather;
    }
    toggleDataDisplay(){
        this.displayData = this.displayData ? false : true;
        this.gps.dataStore.set("MapDisplayData", this.displayData);

        if(this.displayData) {
            this.gps.getChildById("MapRightDisplay").setAttribute("style", "display: block;");
            this.gps.getChildById("MapInstrument2").setAttribute("style", "width: 70%;");
            this.gps.getChildById("Wind2").setAttribute("style", "right: 30%;");
        }
        else {
            this.gps.getChildById("MapRightDisplay").setAttribute("style", "display: none");
            this.gps.getChildById("MapInstrument2").setAttribute("style", "width: 100%;");
            this.gps.getChildById("Wind2").setAttribute("style", "right: 2%;");
        }
        this.gps.currentContextualMenu = null;
        this.gps.SwitchToInteractionState(0);
    }
    changeFieldsStateCB() {
        return !this.displayData;
    }
}



class GPS_MapNav extends NavSystemElement {
    constructor(_customValuesNumber = 6, _customValuesDefaults = [16, 3, 0, 9, 10, 7]) {
        super(_customValuesNumber, _customValuesDefaults);
        this.dnCustoms = [];
        this.legSymbol = 0;
        this.name = "MapNav";
        this.customValuesNumber = _customValuesNumber;
        this.customValuesDefault = _customValuesDefaults;
    }
    init() {
        this.dnCustoms = [];
        this.dnCustomSelectableArray = [];
        for (let i = 0; i < this.customValuesNumber; i++) {
            let num = i + 1;
            this.dnCustoms.push(new CustomValue(this.gps, "MNName" + num, "MNValue" + num, "MNUnit" + num));
            this.dnCustomSelectableArray.push(new SelectableElement(this.gps, this.dnCustoms[i].nameDisplay, this.customValueSelect_CB.bind(this, i)));
        }
        this.dnCustomFieldSelectorMenu = new ContextualMenu("SELECT&nbsp;FIELD&nbsp;TYPE", [
            new ContextualMenuElement("BRG&nbsp;&nbsp;-&nbsp;Bearing", this.customValueSet_CB.bind(this, 0)),
            new ContextualMenuElement("CTS&nbsp;&nbsp;-&nbsp;Course&nbsp;To&nbsp;Steer", this.customValueSet_CB.bind(this, 1)),
            new ContextualMenuElement("XTK&nbsp;&nbsp;-&nbsp;Cross&nbsp;Track&nbsp;Err", this.customValueSet_CB.bind(this, 2)),
            new ContextualMenuElement("DTK&nbsp;&nbsp;-&nbsp;Desired&nbsp;Track", this.customValueSet_CB.bind(this, 3)),
            new ContextualMenuElement("DIS&nbsp;&nbsp;-&nbsp;Distance", this.customValueSet_CB.bind(this, 4)),
            new ContextualMenuElement("ESA&nbsp;&nbsp;-&nbsp;Enrte&nbsp;Safe&nbsp;Alt", this.customValueSet_CB.bind(this, 5)),
            new ContextualMenuElement("ETA&nbsp;&nbsp;-&nbsp;Est&nbsp;Time&nbsp;Arvl", this.customValueSet_CB.bind(this, 6)),
            new ContextualMenuElement("ETE&nbsp;&nbsp;-&nbsp;Est&nbsp;Time&nbsp;Enrte", this.customValueSet_CB.bind(this, 7)),
            new ContextualMenuElement("FLOW&nbsp;-&nbsp;Fuel&nbsp;Flow", this.customValueSet_CB.bind(this, 8)),
            new ContextualMenuElement("GS&nbsp;&nbsp;&nbsp;-&nbsp;Ground&nbsp;Speed", this.customValueSet_CB.bind(this, 9)),
            new ContextualMenuElement("TRK&nbsp;&nbsp;-&nbsp;Ground&nbsp;Track", this.customValueSet_CB.bind(this, 10)),
            new ContextualMenuElement("MSA&nbsp;&nbsp;-&nbsp;Min&nbsp;Safe&nbsp;Alt", this.customValueSet_CB.bind(this, 11)),
            new ContextualMenuElement("TKE&nbsp;&nbsp;-&nbsp;Track&nbsp;Angle&nbsp;Err", this.customValueSet_CB.bind(this, 12)),
            new ContextualMenuElement("VSR&nbsp;-&nbsp;Vert&nbsp;Speed&nbsp;Rqrd", this.customValueSet_CB.bind(this, 13)),
            new ContextualMenuElement("ALT&nbsp;-&nbsp;Altitude", this.customValueSet_CB.bind(this, 14)),
            new ContextualMenuElement("BARO&nbsp;-&nbsp;Baro", this.customValueSet_CB.bind(this, 15)),
            new ContextualMenuElement("WPT&nbsp;-&nbsp;Target&nbsp;Waypoint", this.customValueSet_CB.bind(this, 16)),
        ]);
        this.restoreCustomValues();
        }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        for (var i = 0; i < this.dnCustoms.length; i++) {
            this.dnCustoms[i].Update();
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    customValueSelect_CB(_param, _event) {
        switch (_event) {
            case "RightSmallKnob_Right":
            case "RightSmallKnob_Left":
                this.selectedCustomValueIndex = _param;
                this.gps.ShowContextualMenu(this.dnCustomFieldSelectorMenu);
                break;
            default:
                return false;
        }
        return true;
    }
    customValueSet_CB(_param) {
        this.dnCustoms[this.selectedCustomValueIndex].valueIndex = _param;
        this.gps.SwitchToInteractionState(1);
        this.gps.cursorIndex = this.selectedCustomValueIndex;
    }
    restoreCustomValues() {
        for (let i = 0; i < this.customValuesNumber; i++) {
            this.dnCustoms[i].valueIndex = this.customValuesDefault[i];
        }
        this.gps.SwitchToInteractionState(0);
    }
}



class GPS_TerrainNavPage extends GPS_BaseNavPage {
    constructor(_customValuesNumber = 6, _customValuesDefaults = [4, 3, 0, 9, 10, 7]) {
        var cdiElem = new CDIElement();
        var baseElem = new GPS_TerrainNav(_customValuesNumber, _customValuesDefaults);
        super("TerrainNav", "TerrainNav", new NavSystemElementGroup([baseElem, cdiElem]));
        this.cdiElement = cdiElem;
        this.baseElem = baseElem;

    }
    init() {
        super.init(3, true, "110%", "66%", 2.29, 1.53, 100);
        this.navCompassImg = null;
        this.navBrgImg = null;
        this.declutterLevels = [0, 17];
        this.alwaysHideAirspacesAndRoads = true;
        this.map.mapConfigId = 1;
        if(this.map.roadNetwork)
            this.map.roadNetwork.setVisible(false);
        this.map.showAirspaces = false;
        this.map.showRoads  = false;
        this.map.instrument.bingMapRef = EBingReference.PLANE;
        this.mslThousands = this.gps.getChildById("TerrainMslValueTh" + this.mapnum);
        this.mslHundreds = this.gps.getChildById("TerrainMslValueHu" + this.mapnum);
    }
    onEnter() {
        if(this.map) {
            this.map.mapConfigId = 1;
            this.map.bingMapRef = EBingReference.PLANE;
        }
    }
    onExit() {
        if(this.map) {
            this.map.mapConfigId = 0;
            this.map.bingMapRef = EBingReference.SEA;
        }
    }
    onEvent(_event){
        super.onEvent(_event);
        if (_event == "CLR_Push")  {
            this.gps.closePopUpElement();
            this.gps.currentContextualMenu = null;
            this.gps.SwitchToInteractionState(0);
        }
        if (_event == "MENU_Push")  {
            // Unblock declutter when leving menu
            this.gps.currentContextualMenu = null;
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        var currentAlt = fastToFixed(SimVar.GetSimVarValue("GPS POSITION ALT", "feet"), 0);
        this.mslThousands.textContent = Math.trunc(currentAlt / 1000);
        // Add leading 0s
        var Hundreds = currentAlt % 1000;
        Hundreds = Hundreds < 100 ? "0" + Hundreds : Hundreds;
        Hundreds = Hundreds < 10 ? "0" + Hundreds : Hundreds;
        this.mslHundreds.textContent = Hundreds;
    }
}



class GPS_TerrainNav extends NavSystemElement {
    constructor(_customValuesNumber = 6, _customValuesDefaults = [16, 3, 0, 9, 10, 7]) {
        super(_customValuesNumber, _customValuesDefaults);
        this.dnCustoms = [];
        this.legSymbol = 0;
        this.name = "TerrainNav";
        this.customValuesNumber = _customValuesNumber;
        this.customValuesDefault = _customValuesDefaults;
    }
    init() {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}





class GPS_TrafficNavPage extends GPS_BaseNavPage {
    constructor(_customValuesNumber = 6, _customValuesDefaults = [4, 3, 0, 9, 10, 7]) {
        var cdiElem = new CDIElement();
        var baseElem = new GPS_TrafficNav(_customValuesNumber, _customValuesDefaults);
        super("TrafficNav", "TrafficNav", new NavSystemElementGroup([baseElem, cdiElem]));
        this.cdiElement = cdiElem;
        this.baseElem = baseElem;

    }
    init() {
        super.init(5, true, "110%", "66%", 2.29, 1.53, 35);
        this.mrange2 = this.gps.getChildById("MapRangeValue" + this.mapnum + "_2");
        this.navCompassImg = null;
        if(this.map) {
            this.map.showBingMap = false;
            this.map.refreshDisplay();
        }
        this.navBrgImg = null;
        this.declutterLevels = [0];
        this.alwaysHideAirspacesAndRoads = true;
        this.map.mapConfigId = 0;
        this.tcas = false;
        this.toggleTCAS();
    }
    onEnter() {
        if(this.map) {
            this.map.showBingMap = false;
            this.map.refreshDisplay();
        }
    }
    onExit() {
        if(this.map) {
            this.map.showBingMap = true;
            this.map.refreshDisplay();
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if(this.mrange2) {
            Avionics.Utils.diffAndSet(this.mrange2, this.mapDisplayRanges[this.map.rangeIndex] / 2);
        }
    }
    onEvent(_event){
        if (_event == "CLR_Push")  {
            // Do nothing here
        }
        else
            super.onEvent(_event);
    }
}



class GPS_TrafficNav extends NavSystemElement {
    constructor(_customValuesNumber = 6, _customValuesDefaults = [16, 3, 0, 9, 10, 7]) {
        super(_customValuesNumber, _customValuesDefaults);
        this.dnCustoms = [];
        this.legSymbol = 0;
        this.name = "TrafficNav";
        this.customValuesNumber = _customValuesNumber;
        this.customValuesDefault = _customValuesDefaults;
    }
    init() {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}



class GPS_ComNav extends NavSystemElement {
    constructor(_nbFreqMax = 5) {
        super();
        this.airportListOnPlan = [];
        this.airportListIndex = 0;
        this.nbFreqMax = 0;
        this.name = "ComNav";
        this.nbFreqMax = _nbFreqMax;
    }
    init() {
        this.comNavMain = this.gps.getChildById("ComNavMain");
        this.terrainStatus = this.gps.getChildById("TerrainStatus");
        this.terrainCode = this.gps.getChildById("TerrainCode");
        this.terrainType = this.gps.getChildById("TerrainType");
        this.terrainTypeLogo = this.gps.getChildById("TerrainTypeLogo");
        this.comNavSliderCursor = this.gps.getChildById("ComNavSliderCursor");
        this.comNavSlider = this.gps.getChildById("ComNavSlider");
        this.airportSelectionMenu = new ContextualMenu("AIRPORT", []);
        this.frequenciesSelectionGroup = new SelectableElementSliderGroup(this.gps, [], this.comNavSlider, this.comNavSliderCursor);
        for (let i = 0; i < this.nbFreqMax; i++) {
            this.frequenciesSelectionGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("ComNavFrequency_" + i), this.activeFrequency_CB.bind(this)));
        }
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.terrainCode, this.airportSelection_CB.bind(this)),
            this.frequenciesSelectionGroup
        ];
    }
    airportSelection_CB(_event) {
        //Show airport selection when ENT pushed
        if (_event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left" || _event == "ENT_Push") {
            this.gps.ShowContextualMenu(this.airportSelectionMenu);
        }
        return false;
    }
    activeFrequency_CB(_event, _index) {
        if (_event == "ENT_Push") {
            if (this.airportListOnPlan[this.airportListIndex].GetInfos().frequencies[_index].mhValue >= 118) {
                SimVar.SetSimVarValue("K:COM" + (this.gps.comIndex == 1 ? "" : this.gps.comIndex) + "_STBY_RADIO_SET", "Frequency BCD16", this.airportListOnPlan[this.airportListIndex].GetInfos().frequencies[_index].bcd16Value);
            }
            else {
                SimVar.SetSimVarValue("K:NAV" + this.gps.navIndex + "_STBY_SET", "Frequency BCD16", this.airportListOnPlan[this.airportListIndex].GetInfos().frequencies[_index].bcd16Value);
            }
            // Select next frequency
            this.gps.SwitchToInteractionState(1);
            this.gps.cursorIndex = 1;
            this.frequenciesSelectionGroup.incrementIndex();
        }
    }
    onEnter() {
        this.gps.currFlightPlan.wayPoints =  this.gps.currFlightPlanManager.getWaypoints();
        this.airportListOnPlan = this.gps.currFlightPlan.GetAirportList();
        this.airportSelectionMenu.elements = [];
        for (var i = 0; i < this.airportListOnPlan.length; i++) {
            this.airportSelectionMenu.elements.push(new ContextualMenuElement(this.airportListOnPlan[i].GetInfos().ident, this.setComAirtportListIndex_CB.bind(this, i)));
        }
    }
    onUpdate(_deltaTime) {
        if (this.airportListOnPlan.length > 0) {
            this.UpdateComDisplay();
            if (this.airportListIndex > this.airportListOnPlan.length) {
                this.airportListIndex = 0;
            }
            if (this.airportListOnPlan[this.airportListIndex].GetInfos().privateType == 0) {
                this.airportListOnPlan[this.airportListIndex].UpdateInfos();
            }
            if (this.airportListIndex == 0) {
                this.terrainStatus.textContent = "DEPARTURE";
            }
            else if (this.airportListIndex == this.airportListOnPlan.length - 1) {
                this.terrainStatus.textContent = "ARRIVAL";
            }
            else {
                this.terrainStatus.textContent = "EN ROUTE";
            }
            this.terrainCode.textContent = this.airportListOnPlan[this.airportListIndex].GetInfos().ident;
            this.terrainType.textContent = this.gps.airportPrivateTypeStrFromEnum(this.airportListOnPlan[this.airportListIndex].GetInfos().privateType);
            var logo = this.airportListOnPlan[this.airportListIndex].GetInfos().imageFileName();
            if (logo != "") {
                this.terrainTypeLogo.innerHTML = '<img src="/Pages/VCockpit/Instruments/Shared/Map/Images/' + logo + '" class="imgSizeM"/>';
            }
            else {
                this.terrainTypeLogo.innerHTML = "";
            }
        }
        else {
            this.terrainStatus.textContent = "";
            this.terrainCode.textContent = "";
            this.terrainType.textContent = "";
            this.terrainTypeLogo.innerHTML = "";
            this.airportListIndex = 0;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    if ((_event == "CLR_Push") || (_event == "MENU_Push"))  {
            if(this.gps.currentContextualMenu) {
                this.gps.closePopUpElement();
                this.gps.currentContextualMenu = null;
                this.gps.SwitchToInteractionState(1);
            }
        }
    }
    setComAirtportListIndex_CB(_index) {
        this.airportListIndex = _index;
        this.UpdateComDisplay();
        //Set focus to airport after changing airport
        this.gps.SwitchToInteractionState(1);
        this.gps.cursorIndex = 0;
    }
    UpdateComDisplay() {
        this.airportListOnPlan[this.airportListIndex].UpdateInfos();
        var infos = this.airportListOnPlan[this.airportListIndex].GetInfos();
        var elements = [];
        if (infos && infos.frequencies) {
            for (let i = 0; i < infos.frequencies.length; i++) {
                elements.push('<div><div class="Align LeftDisplay">' + infos.frequencies[i].name.slice(0, 22) + '</div> <div class="Align RightValue SelectableElement">' + this.gps.frequencyFormat(infos.frequencies[i].mhValue, 3) + '</div></div>');
            }
        }
        this.frequenciesSelectionGroup.setStringElements(elements);
    }
}

// Used in GNS430 only
class GPS_Position extends NavSystemElement {
    constructor() {
        super();
        this.referenceMode = 1;
        this.customValues = [];
        this.name = "Position";
    }
    init() {
        this.compassBackground = this.gps.getChildById("CompassBackground");
        this.positionValueNS = this.gps.getChildById("PositionValueNS");
        this.positionValueEW = this.gps.getChildById("PositionValueEW");
        this.timeValue = this.gps.getChildById("TimeValue");
        this.positionRefBearing = this.gps.getChildById("PositionRefBearing");
        this.positionRefDistance = this.gps.getChildById("PositionRefDistance");
        this.positionRefType = this.gps.getChildById("PositionRefType");
        this.positionRefMode = this.gps.getChildById("PositionRefMode");
        this.geoCalcReferenceRelative = new GeoCalcInfo(this.gps);
        this.posRefSearchField = new SearchFieldWaypointICAO(this.gps, [this.gps.getChildById("PositionRefID")], this.gps);
        this.customValues = [
            new CustomValue(this.gps, "PositionInfos1_Title", "PositionInfos1_Value", "PositionInfos1_Unit"),
            new CustomValue(this.gps, "PositionInfos2_Title", "PositionInfos2_Value", "PositionInfos2_Unit"),
            new CustomValue(this.gps, "PositionInfos3_Title", "PositionInfos3_Value", "PositionInfos3_Unit")
        ];
        this.posCustomSelectableArray = [
            new SelectableElement(this.gps, this.customValues[0].nameDisplay, this.customValueSelect.bind(this, 0)),
            new SelectableElement(this.gps, this.customValues[1].nameDisplay, this.customValueSelect.bind(this, 1)),
            new SelectableElement(this.gps, this.customValues[2].nameDisplay, this.customValueSelect.bind(this, 2)),
            new SelectableElement(this.gps, this.positionRefType, this.refTypeSelect.bind(this)),
            new SelectableElement(this.gps, this.positionRefMode, this.refModeSelect.bind(this)),
        ];
        this.posCustomFieldSelectorMenu = new ContextualMenu("SELECT&nbsp;FIELD&nbsp;TYPE", [
            new ContextualMenuElement("ALT&nbsp;&nbsp;-&nbsp;Altitude", this.customValueSet.bind(this, 14)),
            new ContextualMenuElement("BARO&nbsp;-&nbsp;Baro&nbsp;Pressure", this.customValueSet.bind(this, 15)),
            new ContextualMenuElement("GS&nbsp;&nbsp;&nbsp;-&nbsp;Ground&nbsp;Speed", this.customValueSet.bind(this, 9)),
            new ContextualMenuElement("MSA&nbsp;&nbsp;-&nbsp;Min&nbsp;Safe&nbsp;Alt", this.customValueSet.bind(this, 11)),
            new ContextualMenuElement("TRK&nbsp;&nbsp;-&nbsp;Track", this.customValueSet.bind(this, 10)),
        ]);
        this.posRefTypeSelectorMenu = new ContextualMenu("CATEGORY", [
            new ContextualMenuElement("APT", this.refTypeSet.bind(this, 'A')),
            new ContextualMenuElement("INT", this.refTypeSet.bind(this, 'I')),
            new ContextualMenuElement("NDB", this.refTypeSet.bind(this, 'N')),
            new ContextualMenuElement("VOR", this.refTypeSet.bind(this, 'V')),
            new ContextualMenuElement("USR", this.refTypeSet.bind(this, 'U')),
            new ContextualMenuElement("WPT", this.refTypeSet.bind(this, 'WANV')),
        ]);
        this.posRefModeSelectorMenu = new ContextualMenu("MODE", [
            new ContextualMenuElement("TO", this.refModeSet.bind(this, 0)),
            new ContextualMenuElement("FROM", this.refModeSet.bind(this, 1)),
        ]);
        this.container.defaultMenu = new ContextualMenu("PAGE MENU", [
            new ContextualMenuElement("Change&nbsp;Fields?", this.gps.ActiveSelection.bind(this.gps, this.posCustomSelectableArray), false),
            new ContextualMenuElement("Restore&nbsp;Defaults?", this.restoreCustomValues.bind(this))
        ]);
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.posRefSearchField.elements[0], this.activeRefSearchField.bind(this))
        ];
        this.restoreCustomValues();
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.compassBackground.setAttribute("style", "Left:" + fastToFixed(((SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree") * -125 / 90) - 40), 0) + "px");
        for (var i = 0; i < this.customValues.length; i++) {
            this.customValues[i].Update();
        }
        this.positionValueNS.textContent = this.gps.latitudeFormat(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"));
        this.positionValueEW.textContent = this.gps.longitudeFormat(SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        var time = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor((time % 3600) / 60);
        var seconds = Math.floor(time % 60);
        this.timeValue.textContent = (hours < 10 ? "0" + fastToFixed(hours, 0) : fastToFixed(hours, 0)) + ":" + (minutes < 10 ? "0" + fastToFixed(minutes, 0) : fastToFixed(minutes, 0)) + ":" + (seconds < 10 ? "0" + fastToFixed(seconds, 0) : fastToFixed(seconds, 0));
        var reference = this.posRefSearchField.getUpdatedInfos();
        if (this.referenceMode == 0) {
            this.positionRefMode.textContent = "TO";
        }
        else {
            this.positionRefMode.textContent = "FROM";
        }
        this.posRefSearchField.Update();
        if (reference.icao) {
            if (this.referenceMode == 0) {
                this.geoCalcReferenceRelative.SetParams(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"), reference.coordinates.lat, reference.coordinates.long);
            }
            else {
                this.geoCalcReferenceRelative.SetParams(reference.coordinates.lat, reference.coordinates.long, SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
            }
            this.geoCalcReferenceRelative.Compute(function () {
                this.positionRefBearing.textContent = fastToFixed(this.geoCalcReferenceRelative.bearing, 0);
                this.positionRefDistance.textContent = fastToFixed(this.geoCalcReferenceRelative.distance, 0);
            }.bind(this));
        }
        else {
            this.positionRefBearing.textContent = "___";
            this.positionRefDistance.textContent = "__._";
        }
        switch (this.posRefSearchField.wpType) {
            case 'A':
                this.positionRefType.textContent = "APT";
                break;
            case 'N':
                this.positionRefType.textContent = "NDB";
                break;
            case 'V':
                this.positionRefType.textContent = "VOR";
                break;
            case 'W':
                this.positionRefType.textContent = "WPT";
                break;
            case 'U':
                this.positionRefType.textContent = "USR";
                break;
            case 'I':
                this.positionRefType.textContent = "INT";
                break;
            default:
                this.positionRefType.textContent = "WPT";
                break;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    restoreCustomValues() {
        this.customValues[0].valueIndex = 10;
        this.customValues[1].valueIndex = 9;
        this.customValues[2].valueIndex = 14;
        this.posRefSearchField.wpType = "A";
        this.referenceMode = 1;
        this.posRefSearchField.SetWaypoint("A", "");
        this.gps.SwitchToInteractionState(0);
    }
    customValueSelect(_index, _event) {
        switch (_event) {
            case "RightSmallKnob_Right":
            case "RightSmallKnob_Left":
                this.selectedCustomValueIndex = _index;
                this.gps.ShowContextualMenu(this.posCustomFieldSelectorMenu);
                break;
            default:
                return false;
        }
        return true;
    }
    customValueSet(_index) {
        this.customValues[this.selectedCustomValueIndex].valueIndex = _index;
        this.gps.SwitchToInteractionState(1);
        this.gps.cursorIndex = this.selectedCustomValueIndex;
    }
    refTypeSelect(_event) {
        switch (_event) {
            case "RightSmallKnob_Right":
            case "RightSmallKnob_Left":
                this.gps.ShowContextualMenu(this.posRefTypeSelectorMenu);
                break;
            default:
                return false;
        }
        return true;
    }
    refTypeSet(_type) {
        this.posRefSearchField.wpType = _type;
        this.gps.SwitchToInteractionState(0);
    }
    refModeSelect(_event) {
        switch (_event) {
            case "RightSmallKnob_Right":
            case "RightSmallKnob_Left":
                this.gps.ShowContextualMenu(this.posRefModeSelectorMenu);
                break;
            default:
                return false;
        }
        return true;
    }
    refModeSet(_mode) {
        this.referenceMode = _mode;
        this.gps.SwitchToInteractionState(0);
    }
    activeRefSearchField() {
        this.gps.currentSearchFieldWaypoint = this.posRefSearchField;
        this.gps.SwitchToInteractionState(3);
        this.posRefSearchField.StartSearch(() => {
            this.gps.SwitchToInteractionState(0);
        });
    }
}

// Map instrument extended for weather radar
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
