class AS430 extends BaseGPS {
    get templateID() { return "AS430"; }
    connectedCallback() {
        this.gpsType = "430";
        super.connectedCallback();
        this.menuMaxElems = 11;
        var defaultNav = new GPS_DefaultNavPage(6, [4, 3, 0, 9, 10, 7]);
        defaultNav.element.addElement(new MapInstrumentElement());
        var mapNav = new GPS_MapNavPage(4, [16, 3, 4, 9]);
        mapNav.element.addElement(new MapInstrumentElement());
        this.pageGroups = [
            new NavSystemPageGroup("NAV", this, [
                defaultNav,
                mapNav,
//                new NavSystemPage("Map", "Map", new NavSystemElementGroup([new MapInstrumentElement(), new GPS_MapInfos()])),
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
    }
}


registerInstrument("as430-element", AS430);
//# sourceMappingURL=AS430.js.map