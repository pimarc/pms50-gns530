class AS430 extends BaseGPS {
    get templateID() { return "AS430"; }
    connectedCallback() {
        super.connectedCallback();
        this.manageAutoActivateApproach = false;
        this.pageGroups = [
            new NavSystemPageGroup("NAV", this, [
                new GPS_DefaultNavPage(),
                new NavSystemPage("Map", "Map", new NavSystemElementGroup([new MapInstrumentElement(), new GPS_MapInfos()])),
                new NavSystemPage("ComNav", "ComNav", new GPS_ComNav()),
                new NavSystemPage("Position", "Position", new GPS_Position()),
            ]),
            new NavSystemPageGroup("WPT", this, [
                new NavSystemPage("AirportLocation", "AirportLocation", new GPS_AirportWaypointLocation(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportRunway", "AirportRunway", new GPS_AirportWaypointRunways(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportFrequency", "AirportFrequency", new GPS_AirportWaypointFrequencies(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportApproach", "AirportApproach", new GPS_AirportWaypointApproaches(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("Intersection", "Intersection", new GPS_IntersectionWaypoint()),
                new NavSystemPage("NDB", "NDB", new GPS_NDBWaypoint()),
                new NavSystemPage("VOR", "VOR", new GPS_VORWaypoint())
            ]),
            new NavSystemPageGroup("NRST", this, [
                new NavSystemPage("NRSTAirport", "NRSTAirport", new GPS_NearestAirports()),
                new NavSystemPage("NRSTIntersection", "NRSTIntersection", new GPS_NearestIntersection()),
                new NavSystemPage("NRSTNDB", "NRSTNDB", new GPS_NearestNDB()),
                new NavSystemPage("NRSTVOR", "NRSTVOR", new GPS_NearestVOR()),
                new NavSystemPage("NRSTAirspace", "NRSTAirspace", new GPS_NearestAirpaces()),
            ]),
            new NavSystemPageGroup("AUX", this, [
                new NavSystemPage("COMSetup", "COMSetup", new GPS_COMSetup())
            ])
        ];
        this.addEventLinkedPageGroup("DirectTo_Push", new NavSystemPageGroup("DRCT", this, [new NavSystemPage("DRCT", "DRCT", new GPS_DirectTo())]));
        this.addEventLinkedPageGroup("FPL_Push", new NavSystemPageGroup("FPL", this, [new NavSystemPage("ActiveFPL", "FlightPlanEdit", new GPS_ActiveFPL())]));
        this.addEventLinkedPageGroup("PROC_Push", new NavSystemPageGroup("PROC", this, [new NavSystemPage("Procedures", "Procedures", new GPS_Procedures())]));
        this.addEventLinkedPageGroup("MSG_Push", new NavSystemPageGroup("MSG", this, [new NavSystemPage("MSG", "MSG", new GPS_Messages())]));
//PM Modif: Add range and declutter level to map
        this.addIndependentElementContainer(new NavSystemElementContainer("RangeInfos", "MapPart", new AS430_RangeInfos()));
//PM Modif: End add range and declutter level to map
    }
}

//PM Modif: Add range and declutter level to map
class AS430_RangeInfos extends NavSystemElement {
    init(root) {
        this.mrange = this.gps.getChildById("MapRangeValue");
        this.dlevel = this.gps.getChildById("MapDeclutterLevel");
    }
    onEnter() {
    }
    onExit() {
    }
    onEvent(_event) {
    }
    onUpdate(_deltaTime) {
        let map = this.gps.getChildById("MapInstrument");
        if (map) {
            Avionics.Utils.diffAndSet(this.mrange, map.getDisplayRange());
            Avionics.Utils.diffAndSet(this.dlevel, map.declutterLevel ? "-" + map.declutterLevel/2 : "");
        }
    }
}
//PM Modif: End add range and declutter level to map


registerInstrument("as430-element", AS430);
//# sourceMappingURL=AS430.js.map