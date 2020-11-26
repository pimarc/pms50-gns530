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