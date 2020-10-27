class AS530 extends BaseGPS {
    get templateID() { return "AS530"; }
    connectedCallback() {
        this.gpsType = "530";
        super.connectedCallback();
        this.menuMaxElems = 11;
        var defaultNav = new GPS_DefaultNavPage(5, [3, 4, 9, 7, 10], "530");
        defaultNav.element.addElement(new MapInstrumentElement());
        var mapNav = new GPS_MapNavPage(5, [16, 3, 10, 4, 9]);
        mapNav.element.addElement(new MapInstrumentElement());
        var terrainNav = new GPS_TerrainNavPage(0, []);
        terrainNav.element.addElement(new MapInstrumentElement());
        this.pageGroups = [
            new NavSystemPageGroup("NAV", this, [
                defaultNav,
                mapNav,
                terrainNav,
                new NavSystemPage("ComNav", "ComNav", new GPS_ComNav(8)),
            ]),
            new NavSystemPageGroup("WPT", this, [
                new NavSystemPage("AirportLocation", "AirportLocation", new GPS_AirportWaypointLocation(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportRunway", "AirportRunway", new GPS_AirportWaypointRunways(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportFrequency", "AirportFrequency", new GPS_AirportWaypointFrequencies(this.airportWaypointsIcaoSearchField, 8)),
                new NavSystemPage("AirportApproach", "AirportApproach", new GPS_AirportWaypointApproaches(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("Intersection", "Intersection", new GPS_IntersectionWaypoint()),
                new NavSystemPage("NDB", "NDB", new GPS_NDBWaypoint()),
                new NavSystemPage("VOR", "VOR", new GPS_VORWaypoint())
            ]),
            new NavSystemPageGroup("NRST", this, [
                new NavSystemPage("NRSTAirport", "NRSTAirport", new GPS_NearestAirports(4)),
                new NavSystemPage("NRSTIntersection", "NRSTIntersection", new GPS_NearestIntersection(8)),
                new NavSystemPage("NRSTNDB", "NRSTNDB", new GPS_NearestNDB(8)),
                new NavSystemPage("NRSTVOR", "NRSTVOR", new GPS_NearestVOR(8)),
                new NavSystemPage("NRSTAirspace", "NRSTAirspace", new GPS_NearestAirpaces()),
            ]),
            new NavSystemPageGroup("AUX", this, [
                new NavSystemPage("COMSetup", "COMSetup", new GPS_COMSetup())
            ])
        ];
        this.addEventLinkedPageGroup("DirectTo_Push", new NavSystemPageGroup("DRCT", this, [new NavSystemPage("DRCT", "DRCT", new GPS_DirectTo())]));
        this.addEventLinkedPageGroup("FPL_Push", new NavSystemPageGroup("FPL", this, [new NavSystemPage("ActiveFPL", "FlightPlanEdit", new GPS_ActiveFPL("530"))]));
        this.addEventLinkedPageGroup("PROC_Push", new NavSystemPageGroup("PROC", this, [new NavSystemPage("Procedures", "Procedures", new GPS_Procedures())]));
        this.addEventLinkedPageGroup("MSG_Push", new NavSystemPageGroup("MSG", this, [new NavSystemPage("MSG", "MSG", new GPS_Messages())]));
        this.addIndependentElementContainer(new NavSystemElementContainer("VorInfos", "RadioPart", new AS530_VorInfos()));
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
            }
        }
        Avionics.Utils.diffAndSet(this.vor, ident);
        Avionics.Utils.diffAndSet(this.typ, type);
        Avionics.Utils.diffAndSet(this.rad, radial);
        Avionics.Utils.diffAndSet(this.dis, distance);
//PM Modif: End World4Fly Mod integration (Wrong radial and Rounded DME) and check for LOC or VOR
    }
}

registerInstrument("as530-element", AS530);
//# sourceMappingURL=AS530.js.map