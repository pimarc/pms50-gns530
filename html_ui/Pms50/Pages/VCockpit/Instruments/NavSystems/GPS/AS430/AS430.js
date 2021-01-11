class AS430 extends BaseGPS {
    get templateID() { return "AS430"; }
    connectedCallback() {
        this.gpsType = "430";
        this.cnt = 0;
        this.superCnt = 0;
        this.toInit = true;
        this.initDone = false;
        this.hotStart = false;
        super.connectedCallback();
        this.initScreen = this.getChildById("InitScreen");
        this.initScreenBottomInfo = this.getChildById("InitScreenBottomInfo");
        this.NbLoopInitScreen = 150;
        this.initScreen.setAttribute("style", "display: none");
        this.pageGroups = [
            new NavSystemPageGroup("NAV", this, [
                new GPS_DefaultNavPage(6, [4, 3, 0, 9, 10, 7], "430"),
            ])
        ];
        this.messageList = new GPS_Messages();
        this.messageList.setGPS(this);
        // We delay the init of the GNS430 in order to check if there is a GNS530
        // Because at this time we must disable the GNS430 maps since
        // the simulator cannot accept more than 4 maps for an airplane (crash if more)
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
                this.doInit();
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
        this.menuMaxElems = 11;
        var defaultNav = new GPS_DefaultNavPage(6, [4, 3, 0, 9, 10, 7], "430");
        defaultNav.element.addElement(new GPS_Map());
        var mapNav = new GPS_MapNavPage(4, [16, 3, 4, 9]);
        mapNav.element.addElement(new GPS_Map());
        this.pageGroups = [
            new NavSystemPageGroup("NAV", this, [
                defaultNav,
                mapNav,
                new NavSystemPage("ComNav", "ComNav", new GPS_ComNav()),
                new NavSystemPage("Position", "Position", new GPS_Position()),
            ]),
            new NavSystemPageGroup("WPT", this, [
                new NavSystemPage("AirportLocation", "AirportLocation", new GPS_AirportWaypointLocation(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportRunway", "AirportRunway", new GPS_AirportWaypointRunways(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportFrequency", "AirportFrequency", new GPS_AirportWaypointFrequencies(this.airportWaypointsIcaoSearchField, 6)),
                new NavSystemPage("AirportApproach", "AirportApproach", new GPS_AirportWaypointApproaches(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportArrival", "AirportArrival", new GPS_AirportWaypointArrivals(this.airportWaypointsIcaoSearchField)),
                new NavSystemPage("AirportDeparture", "AirportDeparture", new GPS_AirportWaypointDepartures(this.airportWaypointsIcaoSearchField)),
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
                new NavSystemPage("COMSetup", "COMSetup", new GPS_COMSetup()),
                new NavSystemPage("METAR", "METAR", new GPS_METAR(this.airportWaypointsIcaoSearchField, 6))
            ])
        ];
        this.addEventLinkedPageGroup("DirectTo_Push", new NavSystemPageGroup("DRCT", this, [new NavSystemPage("DRCT", "DRCT", new GPS_DirectTo())]));
        this.addEventLinkedPageGroup("FPL_Push", new NavSystemPageGroup("FPL", this, [
            new NavSystemPage("ActiveFPL", "FlightPlanEdit", new GPS_ActiveFPL("430")),
            new NavSystemPage("FPLCatalog", "FPLCatalog", new GPS_FPLCatalog("430"))
        ]));
        this.addEventLinkedPageGroup("PROC_Push", new NavSystemPageGroup("PROC", this, [new NavSystemPage("Procedures", "Procedures", new GPS_Procedures())]));
        this.addEventLinkedPageGroup("MSG_Push", new NavSystemPageGroup("MSG", this, [new NavSystemPage("MSG", "MSG", this.messageList)]));
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


registerInstrument("as430-element", AS430);
//# sourceMappingURL=AS430.js.map