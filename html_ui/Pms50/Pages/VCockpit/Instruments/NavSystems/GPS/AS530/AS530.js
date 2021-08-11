class AS530 extends BaseGPS {
    get templateID() { return "AS530"; }
    connectedCallback() {
        this.gpsType = "530";
        this.cnt = 0;
        this.toInit = true;
        this.initDone = false;
        this.hotStart = false;
        super.connectedCallback();
        this.initScreen = this.getChildById("InitScreen");
        this.initScreenBottomInfo = this.getChildById("InitScreenBottomInfo");
        this.NbLoopInitScreen = 150;
        this.initScreen.setAttribute("style", "display: none");
        this.pageGroups = [
            new NavSystemPageGroup("AUX", this, [
                new NavSystemPage("COMSetup", "COMSetup", new GPS_COMSetup()),
            ])
        ];
        this.messageList = new GPS_Messages();
        this.messageList.setGPS(this);
        this.doInit();
    }

    onUpdate(_deltaTime) {
        // Normal start
        if(!this.isStarted){
            this.initScreen.setAttribute("style", "display: none");
        }
        if(this.isStarted && this.toInit) {
            if(this.debug) {
                this.NbLoopInitScreen = 50;
            }
            this.initScreen.setAttribute("style", "display: flex");
            this.initScreenBottomInfo.innerHTML = "GPS SW Version " + this.version + "<br /> Initializing...";
            this.cnt++;
            // Init delayed after 50 updates
            if(this.cnt > this.NbLoopInitScreen){
                this.toInit = false;
                this.hotStart = false;
//                this.doInit();
                this.initScreen.setAttribute("style", "display: none");
            }
        }
        // Hot restart
        if(this.initDone) {
            if(!this.isStarted) {
                this.hotStart = true;
                this.cnt = 0;
            }
            if(this.hotStart && this.isStarted) {
                if(this.cnt == 0) {
                    this.initScreen.setAttribute("style", "display: flex");
                }
                this.cnt++;
                if(this.cnt > this.NbLoopInitScreen) {
                    this.hotStart = false;
                    this.initScreen.setAttribute("style", "display: none");
                }
            }
        }
        super.onUpdate(_deltaTime);
    }

    doInit(){
        this.defaultNav = new GPS_DefaultNavPage(5, [3, 4, 9, 7, 10], "530");
        this.defaultNav.element.addElement(new GPS_Map());
        this.mapNav = new GPS_MapNavPage(5, [16, 3, 10, 4, 9]);
        this.mapNav.element.addElement(new GPS_Map());
        this.terrainNav = new GPS_TerrainNavPage(0, []);
        this.terrainNav.element.addElement(new GPS_Map());
        this.trafficNav = new GPS_TrafficNavPage(0, []);
        this.trafficNav.element.addElement(new GPS_Map());
        this.pageGroups = [
            new NavSystemPageGroup("NAV", this, [
                this.defaultNav,
                this.mapNav,
                this.terrainNav,
                this.trafficNav,
                new NavSystemPage("ComNav", "ComNav", new GPS_ComNav(10))
            ]),
            new NavSystemPageGroup("WPT", this, [
                new NavSystemPage("AirportLocation", "AirportLocation", new GPS_AirportWaypointLocation(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportRunway", "AirportRunway", new GPS_AirportWaypointRunways(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportFrequency", "AirportFrequency", new GPS_AirportWaypointFrequencies(this.airportWaypointsIcaoSearchField, 9)),
                new NavSystemPage("AirportApproach", "AirportApproach", new GPS_AirportWaypointApproaches(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportArrival", "AirportArrival", new GPS_AirportWaypointArrivals(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportDeparture", "AirportDeparture", new GPS_AirportWaypointDepartures(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("Intersection", "Intersection", new GPS_IntersectionWaypoint()),
                new NavSystemPage("NDB", "NDB", new GPS_NDBWaypoint()),
                new NavSystemPage("VOR", "VOR", new GPS_VORWaypoint())
            ]),
            new NavSystemPageGroup("AUX", this, [
                new NavSystemPage("COMSetup", "COMSetup", new GPS_COMSetup()),
                new NavSystemPage("METAR", "METAR", new GPS_METAR(this.airportWaypointsIcaoSearchField))
            ]),
            new NavSystemPageGroup("NRST", this, [
                new NavSystemPage("NRSTAirport", "NRSTAirport", new GPS_NearestAirports(4)),
                new NavSystemPage("NRSTIntersection", "NRSTIntersection", new GPS_NearestIntersection(8)),
                new NavSystemPage("NRSTNDB", "NRSTNDB", new GPS_NearestNDB(8)),
                new NavSystemPage("NRSTVOR", "NRSTVOR", new GPS_NearestVOR(8)),
                new NavSystemPage("NRSTAirspace", "NRSTAirspace", new GPS_NearestAirpaces())
            ])
        ];
        this.addEventLinkedPageGroup("DirectTo_Push", new NavSystemPageGroup("DRCT", this, [new NavSystemPage("DRCT", "DRCT", new GPS_DirectTo())]));
        this.addEventLinkedPageGroup("FPL_Push", new NavSystemPageGroup("FPL", this, [
                new NavSystemPage("ActiveFPL", "FlightPlanEdit", new GPS_ActiveFPL("530")),
                new NavSystemPage("FPLCatalog", "FPLCatalog", new GPS_FPLCatalog("530"))
            ]));
        this.addEventLinkedPageGroup("PROC_Push", new NavSystemPageGroup("PROC", this, [new NavSystemPage("Procedures", "Procedures", new GPS_Procedures())]));
        this.addEventLinkedPageGroup("MSG_Push", new NavSystemPageGroup("MSG", this, [new NavSystemPage("MSG", "MSG", this.messageList)]));
        this.VnavPage = new GPS_Vnav();
        this.addEventLinkedPageGroup("VNAV_Push", new NavSystemPageGroup("VNAV", this, [new NavSystemPage("VNAV", "Vnav", this.VnavPage)]));
        this.addIndependentElementContainer(new NavSystemElementContainer("VorInfos", "RadioPart", new AS530_VorInfos()));
        this.addIndependentElementContainer(new NavSystemElementContainer("WaypointMap", "WaypointMap", new GPS_WaypointMap()));
        this.addIndependentElementContainer(new NavSystemElementContainer("MSG", "MSG", new AS530_InitMessageList()));
        this.initDone = true;
    }
}

// Just to be able to initialize the message list (needed for checking if we have messages before displaying them)
// I didn't find another way to proceed. It works like this.
class AS530_InitMessageList extends NavSystemElement {
    init(root) {
        this.gps.messageList.init(root);
    }
    onUpdate(_deltaTime) {
    }
    onEnter() {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}


class AS530_VorInfos extends NavSystemElement {
    init(root) {
        this.vor = this.gps.getChildById("vorValue");
        this.rad = this.gps.getChildById("radValue");
        this.radTitle = this.gps.getChildById("radTitle");
        this.dis = this.gps.getChildById("disValue");
//PM Modif: check for LOC or VOR
        this.typ = this.gps.getChildById("vorTitle");
//PM Modif: End check for LOC or VOR
    }
    onEnter() {
    }
    onExit() {
    }
    onEvent(_event) {
    }
    onUpdate(_deltaTime) {
//PM Modif: World4Fly Mod integration (Wrong radial and Rounded DME) and check for LOC or VOR
        let radial = "___";
        let radialtitle = "RAD";
        let ident = "____";
        let distance = "__._";
        // VOR by default
        let type = "VOR";
        if (SimVar.GetSimVarValue("NAV HAS NAV:1", "bool")) {
            let radnum = Math.round(SimVar.GetSimVarValue("NAV RADIAL:1", "degrees"));
            // radnum is from -179 to 180 degrees ...
            radnum = radnum < 0 ? 360 + radnum : radnum;
            radial = radnum.toString() + "°";
            // Add leading 0s
            radial = radnum < 100 ? "0" + radial : radial;
            radial = radnum < 10 ? "0" + radial : radial;
            ident = SimVar.GetSimVarValue("NAV IDENT:1", "string") != "" ? SimVar.GetSimVarValue("NAV IDENT:1", "string"):"____";
//PM Modif: Change rounded DME distance
            distance = (SimVar.GetSimVarValue("NAV HAS DME:1", "bool") ? (Math.round((SimVar.GetSimVarValue("NAV DME:1", "Nautical Miles")*10))/10).toFixed(1) : "__._");
//PM Modif: End Change rounded DME distance
            ident = SimVar.GetSimVarValue("NAV IDENT:1", "string") != "" ? SimVar.GetSimVarValue("NAV IDENT:1", "string"):"____";
            // LOC frequency is < 112Mhz and first decimal digit is odd
            let frequency = SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:1", "MHz");
            let islocfrequency = frequency && frequency < 112 && Math.trunc(frequency*10)%2 ? true : false;
            this.radTitle.setAttribute("style", "display: block;");
            if(islocfrequency){
                type = "LOC";
                // Hide rad title if LOC and display LOC name
                this.radTitle.setAttribute("style", "display: none");
                radial = SimVar.GetSimVarValue("NAV NAME:1", "string") != "" ? SimVar.GetSimVarValue("NAV NAME:1", "string"):"____";
                // Get only last word
                // radial = radial.substring(radial.lastIndexOf(" "));
                // Limit to 8 chars
                // radial = radial.slice(0,8);

                //  6/26/2021 GSD:     - SU4  added more text before the ILS Runway number
                // Format to match the Garmin GNS530 Trainer
                // LDA RW19            ----> LDA 19
                // ILS/GS CAT II RW01  ----> ILS 01
                // LOC RW15            ----> LOC 15
                // ILS/GS CAT I RW33   ----> ILS 33
                // (1) Change "/" to " "
                // (2) Change " RW" to ""
                //  Return  1st-word nbsp nbsp Last-word
                radial = radial.replace("/", " ");
                radial = radial.replace(" RW", " ");
                radial = radial.split(" ")[0] + " - " + radial.substring(radial.lastIndexOf(" "));
                //  end 6/26.2021 GSD
                // Limit to 10 chars  Max  is  "ILS space - space 19C"  Note the 19C word has a leading space
                radial = radial.slice(0, 10);
            }
        }
        else if(SimVar.GetSimVarValue("NAV HAS DME:1", "bool")) {
            type = "DME";
            ident = SimVar.GetSimVarValue("NAV IDENT:1", "string") != "" ? SimVar.GetSimVarValue("NAV IDENT:1", "string"):"____";
            distance = (Math.round((SimVar.GetSimVarValue("NAV DME:1", "Nautical Miles")*10))/10).toFixed(1);
        }
        diffAndSetText(this.vor, ident);
        diffAndSetText(this.typ, type);
        diffAndSetText(this.rad, radial);
        if(distance > 99.9)
            distance = Math.trunc(distance);
        diffAndSetText(this.dis, distance);
//PM Modif: End World4Fly Mod integration (Wrong radial and Rounded DME) and check for LOC or VOR
    }
}

registerInstrument("as530-element", AS530);
//# sourceMappingURL=AS530.js.map