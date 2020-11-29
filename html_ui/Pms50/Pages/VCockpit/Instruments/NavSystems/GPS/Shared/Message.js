class GPS_Annunciations extends PFD_Annunciations {
    init(root) {
        super.init(root);
        this.addMessage(Annunciation_MessageType.WARNING, "Test message 1", this.Test1);
        this.addMessage(Annunciation_MessageType.WARNING, "Test message 2", this.Test2);
        this.addMessage(Annunciation_MessageType.WARNING, "Test message 3", this.Test3);
        // this.addMessage(Annunciation_MessageType.WARNING, "Test message 4", this.Test4);
        // this.addMessage(Annunciation_MessageType.WARNING, "Test message 5", this.Test5);
        // this.addMessage(Annunciation_MessageType.WARNING, "Test message 6", this.Test6);
        // this.addMessage(Annunciation_MessageType.CAUTION, "Test message 7", this.Test6);
        // switch (this.engineType) {
        //     case EngineType.ENGINE_TYPE_PISTON:
        //         this.addMessage(Annunciation_MessageType.WARNING, "OIL PRESSURE", this.OilPressure);
        //         this.addMessage(Annunciation_MessageType.WARNING, "LOW VOLTS", this.LowVoltage);
        //         this.addMessage(Annunciation_MessageType.WARNING, "HIGH VOLTS", this.HighVoltage);
        //         this.addMessage(Annunciation_MessageType.WARNING, "CO LVL HIGH", this.COLevelHigh);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "STBY BATT", this.StandByBattery);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "LOW VACUUM", this.LowVaccum);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "LOW FUEL R", this.LowFuelR);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "LOW FUEL L", this.LowFuelL);
        //         break;
        //     case EngineType.ENGINE_TYPE_TURBOPROP:
        //     case EngineType.ENGINE_TYPE_JET:
        //         this.addMessage(Annunciation_MessageType.WARNING, "FUEL OFF", this.fuelOff);
        //         this.addMessage(Annunciation_MessageType.WARNING, "FUEL PRESS", this.fuelPress);
        //         this.addMessage(Annunciation_MessageType.WARNING, "OIL PRESS", this.oilPressWarning);
        //         this.addMessageMultipleConditions(Annunciation_MessageType.WARNING, "ITT", [
        //             new Condition(this.itt.bind(this, "1000")),
        //             new Condition(this.itt.bind(this, "870"), 5),
        //             new Condition(this.itt.bind(this, "840"), 20)
        //         ]);
        //         this.addMessage(Annunciation_MessageType.WARNING, "FLAPS ASYM", this.flapsAsym);
        //         this.addMessage(Annunciation_MessageType.WARNING, "ELEC FEATH FAULT", this.elecFeathFault);
        //         this.addMessage(Annunciation_MessageType.WARNING, "BLEED TEMP", this.bleedTemp);
        //         this.addMessage(Annunciation_MessageType.WARNING, "CABIN ALTITUDE", this.cabinAltitude);
        //         this.addMessage(Annunciation_MessageType.WARNING, "EDM", this.edm);
        //         this.addMessage(Annunciation_MessageType.WARNING, "CABIN DIFF PRESS", this.cabinDiffPress);
        //         this.addMessage(Annunciation_MessageType.WARNING, "DOOR", this.door);
        //         this.addMessage(Annunciation_MessageType.WARNING, "USP ACTIVE", this.uspActive);
        //         this.addMessage(Annunciation_MessageType.WARNING, "GEAR UNSAFE", this.gearUnsafe);
        //         this.addMessage(Annunciation_MessageType.WARNING, "PARK BRAKE", this.parkBrake);
        //         this.addMessage(Annunciation_MessageType.WARNING, "OXYGEN", this.oxygen);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "OIL PRESS", this.oilPressCaution);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "CHIP", this.chip);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "OIL TEMP", this.oilTemp);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "AUX BOOST PMP ON", this.auxBoostPmpOn);
        //         this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["FUEL LOW L", "FUEL LOW R", "FUEL LOW L-R"], this.fuelLowSelector);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "AUTO SEL", this.autoSel);
        //         this.addMessageTimed(Annunciation_MessageType.CAUTION, "FUEL IMBALANCE", this.fuelImbalance, 30);
        //         this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["LOW LVL FAIL L", "LOW LVL FAIL R", "LOW LVL FAIL L-R"], this.lowLvlFailSelector);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "BAT OFF", this.batOff);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "BAT AMP", this.batAmp);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "MAIN GEN", this.mainGen);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "LOW VOLTAGE", this.lowVoltage);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "BLEED OFF", this.bleedOff);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "USE OXYGEN MASK", this.useOxygenMask);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "VACUUM LOW", this.vacuumLow);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "PROP DEICE FAIL", this.propDeiceFail);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "INERT SEP FAIL", this.inertSepFail);
        //         this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["PITOT NO HT L", "PITOT NO HT R", "PITOT NO HT L-R"], this.pitotNoHtSelector);
        //         this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["PITOT HT ON L", "PITOT HT ON R", "PITOT HT ON L-R"], this.pitotHtOnSelector);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "STALL NO HEAT", this.stallNoHeat);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "STALL HEAT ON", this.stallHeatOn);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "FRONT CARGO DOOR", this.frontCargoDoor);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "GPU DOOR", this.gpuDoor);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "IGNITION", this.ignition);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "STARTER", this.starter);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "MAX DIFF MODE", this.maxDiffMode);
        //         this.addMessage(Annunciation_MessageType.CAUTION, "CPCS BACK UP MODE", this.cpcsBackUpMode);
        //         break;
        // }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
    }
    Test1() {
        return false;
    }
    Test2() {
        return false;
    }
    Test3() {
        return false;
    }
    Test4() {
        return true;
    }
    Test5() {
        return true;
    }
    Test6() {
        return true;
    }
    
    // sayTrue() {
    //     return true;
    // }
    // SafePropHeat() {
    //     return false;
    // }
    // CautionPropHeat() {
    //     return false;
    // }
    // StandByBattery() {
    //     return false;
    // }
    // LowVaccum() {
    //     return SimVar.GetSimVarValue("WARNING VACUUM", "Boolean");
    // }
    // LowPower() {
    //     return false;
    // }
    // LowFuelR() {
    //     return SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "gallon") < 5;
    // }
    // LowFuelL() {
    //     return SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "gallon") < 5;
    // }
    // FuelTempFailed() {
    //     return false;
    // }
    // ECUMinorFault() {
    //     return false;
    // }
    // PitchTrim() {
    //     return false;
    // }
    // StartEngage() {
    //     return false;
    // }
    // OilPressure() {
    //     return SimVar.GetSimVarValue("WARNING OIL PRESSURE", "Boolean");
    // }
    // LowFuelPressure() {
    //     var pressure = SimVar.GetSimVarValue("ENG FUEL PRESSURE", "psi");
    //     if (pressure <= 1)
    //         return true;
    //     return false;
    // }
    // LowVoltage() {
    //     var voltage;
    //     voltage = SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "volts");
    //     if (voltage < 24)
    //         return true;
    //     return false;
    // }
    // HighVoltage() {
    //     var voltage;
    //     voltage = SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "volts");
    //     if (voltage > 32)
    //         return true;
    //     return false;
    // }
    // FuelTemperature() {
    //     return false;
    // }
    // ECUMajorFault() {
    //     return false;
    // }
    // COLevelHigh() {
    //     return false;
    // }
    // fuelOff() {
    //     return (SimVar.GetSimVarValue("FUEL TANK SELECTOR:1", "number") == 0);
    // }
    // fuelPress() {
    //     return (SimVar.GetSimVarValue("GENERAL ENG FUEL PRESSURE:1", "psi") <= 10);
    // }
    // oilPressWarning() {
    //     return (SimVar.GetSimVarValue("ENG OIL PRESSURE:1", "psi") <= 60);
    // }
    // itt(_limit = 840) {
    //     let itt = SimVar.GetSimVarValue("TURB ENG ITT:1", "celsius");
    //     return (itt > _limit);
    // }
    // flapsAsym() {
    //     return false;
    // }
    // elecFeathFault() {
    //     return false;
    // }
    // bleedTemp() {
    //     return false;
    // }
    // cabinAltitude() {
    //     return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet") > 10000;
    // }
    // edm() {
    //     return false;
    // }
    // cabinDiffPress() {
    //     return SimVar.GetSimVarValue("PRESSURIZATION PRESSURE DIFFERENTIAL", "psi") > 6.2;
    // }
    // door() {
    //     return SimVar.GetSimVarValue("EXIT OPEN:0", "percent") > 0;
    // }
    // uspActive() {
    //     return false;
    // }
    // gearUnsafe() {
    //     return false;
    // }
    // parkBrake() {
    //     return SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool");
    // }
    // oxygen() {
    //     return false;
    // }
    // oilPressCaution() {
    //     let press = SimVar.GetSimVarValue("ENG OIL PRESSURE:1", "psi");
    //     return (press <= 105 && press >= 60);
    // }
    // chip() {
    //     return false;
    // }
    // oilTemp() {
    //     let temp = SimVar.GetSimVarValue("GENERAL ENG OIL TEMPERATURE:1", "celsius");
    //     return (temp <= 0 || temp >= 104);
    // }
    // auxBoostPmpOn() {
    //     return SimVar.GetSimVarValue("GENERAL ENG FUEL PUMP ON:1", "Bool");
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
    // autoSel() {
    //     return false;
    // }
    // fuelImbalance() {
    //     let left = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "gallon");
    //     let right = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "gallon");
    //     return Math.abs(left - right) > 15;
    // }
    // lowLvlFailSelector() {
    //     return false;
    // }
    // batOff() {
    //     return !SimVar.GetSimVarValue("ELECTRICAL MASTER BATTERY", "Bool");
    // }
    // batAmp() {
    //     return SimVar.GetSimVarValue("ELECTRICAL BATTERY BUS AMPS", "amperes") > 50;
    // }
    // mainGen() {
    //     return !SimVar.GetSimVarValue("GENERAL ENG GENERATOR SWITCH:1", "Bool");
    // }
    // lowVoltage() {
    //     return SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "volts") < 24.5;
    // }
    // bleedOff() {
    //     return SimVar.GetSimVarValue("BLEED AIR SOURCE CONTROL", "Enum") == 1;
    // }
    // useOxygenMask() {
    //     return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet") > 10000;
    // }
    // vacuumLow() {
    //     return SimVar.GetSimVarValue("PARTIAL PANEL VACUUM", "Enum") == 1;
    // }
    // propDeiceFail() {
    //     return false;
    // }
    // inertSepFail() {
    //     return false;
    // }
    // pitotNoHtSelector() {
    //     return 0;
    // }
    // pitotHtOnSelector() {
    //     return 0;
    // }
    // stallNoHeat() {
    //     return false;
    // }
    // stallHeatOn() {
    //     return false;
    // }
    // frontCargoDoor() {
    //     return false;
    // }
    // gpuDoor() {
    //     return false;
    // }
    // ignition() {
    //     return SimVar.GetSimVarValue("TURB ENG IS IGNITING:1", "Bool");
    // }
    // starter() {
    //     return SimVar.GetSimVarValue("GENERAL ENG STARTER ACTIVE:1", "Bool");
    // }
    // maxDiffMode() {
    //     return SimVar.GetSimVarValue("BLEED AIR SOURCE CONTROL", "Enum") == 3;
    // }
    // cpcsBackUpMode() {
    //     return false;
    // }
    hasMessages() {
        for (var i = 0; i < this.allMessages.length; i++) {
            if (this.allMessages[i].Visible) {
                return true;
            }
        }
        return false;
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
        if(this.annunciations.hasMessages())
            return true;
        return false;
    }
}

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
