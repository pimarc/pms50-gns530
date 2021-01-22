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
        this.spacingMode = this.gps.dataStore.get("ChannelSpacingMode", SimVar.GetSimVarValue("COM SPACING MODE:" + this.gps.comIndex, "Enum"));
        this.channelSpacingSet(this.spacingMode);
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        Avionics.Utils.diffAndSet(this.channelSpacingValue, this.spacingMode == 0 ? "25.0 KHZ" : "8.33 KHZ");
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
            this.spacingMode = _mode;
            this.gps.dataStore.set("ChannelSpacingMode", this.spacingMode);
        }
        this.gps.SwitchToInteractionState(0);
    }
}

class GPS_METAR extends NavSystemElement {
    constructor(_icaoSearchField, _nbElemsMax = 8) {
        super();
        this.name = "METAR";
        this.icaoSearchField = _icaoSearchField;
        this.nbElemsMax = _nbElemsMax;
    }
    init(root) {
        this.identElement = this.gps.getChildById("APTIdent");
        this.metarElement = this.gps.getChildById("MetarData_0");
        this.container.defaultMenu = new ContextualMenu("METAR", [
            new ContextualMenuElement("METAR Origin", this.metarOriginSet.bind(this), this.metarOriginSetCB.bind(this)),
            new ContextualMenuElement("METAR Destin.", this.metarDestinationSet.bind(this,), this.metarDestinationSetCB.bind(this,))
        ]);
        this.sliderElement = this.gps.getChildById("SliderMETAR");
        this.sliderCursorElement = this.gps.getChildById("SliderMETARCursor");
        this.metarSliderGroup = new SelectableElementSliderGroup(this.gps, [], this.sliderElement, this.sliderCursorElement);
        for (let i = 0; i < this.nbElemsMax; i++) {
            this.metarSliderGroup.addElement(new SelectableElement(this.gps, this.gps.getChildById("MetarData_" + i), this.metar_SelectionCallback.bind(this)));
        }
        this.defaultSelectables = [
            new SelectableElement(this.gps, this.identElement, this.searchField_SelectionCallback.bind(this)),
            this.metarSliderGroup
        ];
        this.icaoSearchField.elements.push(this.identElement);
        this.doDecode = this.gps.getConfigKey("metar_decode", false);
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
            if(destination){
                this.icaoSearchField.SetWaypoint("A", destination.icao);
            }
        }
        if(this.icaoSearchField.wayPoint) {
            this.updateMetar(this.icaoSearchField.wayPoint.ident);
        }
    }
    onUpdate(_deltaTime) {
        this.icaoSearchField.Update();
        var infos = this.icaoSearchField.getUpdatedInfos();
        if (infos && infos.icao && infos instanceof AirportInfo) {
        }
        else {
            this.identElement.textContent = "_____";
        }
    }
    onExit() {
    }
    onEvent(_event) {
        if(_event == "CLR_Push"
            || _event == "NavigationPush") {
            if(this.gps.currentContextualMenu) {
                this.gps.closePopUpElement();
                this.gps.currentContextualMenu = null;
                this.gps.SwitchToInteractionState(0);
            }
        }
        if (_event == "ENT_Push") {
            if(this.gps.currentInteractionState == 0 && this.icaoSearchField.wayPoint) {
                this.updateMetar(this.identElement.textContent);
            }
        }
    }
    metar_SelectionCallback(_event, _index) {
    }
    searchField_SelectionCallback(_event) {
        if (_event == "ENT_Push" || _event == "RightSmallKnob_Right" || _event == "RightSmallKnob_Left") {
            this.metarSliderGroup.setStringElements([]);
            this.gps.currentSearchFieldWaypoint = this.icaoSearchField;
            this.icaoSearchField.StartSearch(function () {
                if(this.icaoSearchField.wayPoint) {
                    this.updateMetar(this.icaoSearchField.wayPoint.ident);
                }
            }.bind(this));
            this.gps.SwitchToInteractionState(3);
        }
    }
    metarOriginSetCB() {
        var origin = this.gps.currFlightPlanManager.getOrigin();
        if(origin && origin.GetInfos().getWaypointType() == "A" )
            return false;
        return true;
    }
    metarDestinationSetCB() {
        var destination = this.gps.currFlightPlanManager.getDestination();
        if(destination && destination.GetInfos().getWaypointType() == "A" )
            return false;
        return true;
    }
    metarOriginSet() {
        this.gps.SwitchToInteractionState(0);
        var origin = this.gps.currFlightPlanManager.getOrigin();
        if(origin) {
            this.icaoSearchField.SetWaypoint("A", origin.icao);
            this.updateMetar(origin.ident);
        }
    }
    metarDestinationSet() {
        this.gps.SwitchToInteractionState(0);
        var destination = this.gps.currFlightPlanManager.getDestination();
        if(destination) {
            this.icaoSearchField.SetWaypoint("A", destination.icao);
            this.updateMetar(destination.ident);
        }
    }
    updateMetar(ident) {
        this.metarSliderGroup.setStringElements([]);
        if(this.gps.getConfigKey("metar_avwx_token", "") == "") {
            this.metarSliderGroup.setStringElements(["No token. Check config."]);
        }
        else {
            let Lines = [];
            let Line = "";
            let maxLineLengthMetar = 26;
            let maxLineLengthDecodedMetar = 32;
            if(this.gps.gpsType == "430") {
                maxLineLengthMetar = 30;
                maxLineLengthDecodedMetar = 36;
            }
            this.metarSliderGroup.setStringElements(["Get data..."]);
            this.gps.loadMetar(ident, (metar_data) => {
                if(metar_data.length) {
                    let data = JSON.parse(metar_data);
                    if(data && data.sanitized) {
                        // Do display rows
                        let i = 0;
                        let SplittedLines = this.splitMetarLineData(data.sanitized, 26);
                        for(i=0;i<SplittedLines.length;i++) {
                            Line = '<div class="SelectableElement">' + SplittedLines[i] + '</div>';
                            if(i==SplittedLines.length-1 && this.doDecode)
                                Line += "<hr />";
                            Lines.push(Line);
                        }
                        if(this.doDecode) {
                            let translated = "";
                            if(data.translate["altimeter"]) {
                                Lines = Lines.concat(this.getMetarLines("altimeter", data.translate["altimeter"]));
                                delete data.translate["altimeter"]; 
                            }
                            if(data.translate["wind"]) {
                                Lines = Lines.concat(this.getMetarLines("wind", data.translate["wind"]));
                                delete data.translate["wind"]; 
                            }
                            if(data.translate["visibility"]) {
                                Lines = Lines.concat(this.getMetarLines("visibility", data.translate["visibility"]));
                                delete data.translate["visibility"]; 
                            }
                            if(data.translate["wx_codes"]) {
                                Lines = Lines.concat(this.getMetarLines("wx_codes", data.translate["wx_codes"]));
                                delete data.translate["wx_codes"]; 
                            }
                            if(data.translate["temperature"]) {
                                Lines = Lines.concat(this.getMetarLines("temperature", data.translate["temperature"]));
                                delete data.translate["temperature"]; 
                            }
                            if(data.translate["dewpoint"]) {
                                Lines = Lines.concat(this.getMetarLines("dewpoint", data.translate["dewpoint"]));
                                delete data.translate["dewpoint"]; 
                            }
                            if(data.translate["clouds"]) {
                                Lines = Lines.concat(this.getMetarLines("clouds", data.translate["clouds"]));
                                delete data.translate["clouds"]; 
                            }
                            if(data.translate["remarks"]) {
                                Lines = Lines.concat(this.getMetarLines("remarks", data.translate["remarks"]));
                                delete data.translate["remarks"]; 
                            }
                            for (var key in data.translate) {
                                Lines = Lines.concat(this.getMetarLines(key, data.translate[key]));

                                // if (typeof data.translate[key] === 'string' && data.translate[key].length) {
                                //     SplittedLines = this.splitMetarLineData(key + ": " + data.translate[key], 32);
                                //     if(SplittedLines.length) {
                                //         // Remove key from first line
                                //         SplittedLines[0] = SplittedLines[0].replace(key + ":", "");
                                //         for(i=0;i<SplittedLines.length;i++) {
                                //             Line = '<div class="SelectableElement MetarDecodedLine">';
                                //             if(i==0) {
                                //                 Line += '<span class="MetarDecodedLineTitle">' + key + ':</span>';
                                //             }
                                //             Line += '<span class="MetarDecodedLineData">' + SplittedLines[i] + '</span></div>';
                                //             Lines.push(Line);
                                //         }
                                //     }
                                // }
                                // else if (typeof data.translate[key] === "object") {
                                //     // Usually for remarks entry in decoded data
                                //     let firstKey = true;
                                //     for (var key2 in data.translate[key]) {
                                //         if (typeof data.translate[key][key2] === 'string' && data.translate[key][key2].length) {
                                //             if(firstKey) {
                                //                 SplittedLines = this.splitMetarLineData(key + ": " + data.translate[key][key2], 32);
                                //                 if(SplittedLines.length) {
                                //                     // Remove key from first line
                                //                     SplittedLines[0] = SplittedLines[0].replace(key + ":", "");
                                //                 }
                                //             }
                                //             else
                                //                 SplittedLines = this.splitMetarLineData(data.translate[key][key2], 32);
                                //             if(SplittedLines.length) {
                                //                 for(i=0;i<SplittedLines.length;i++) {
                                //                     Line = '<div class="SelectableElement MetarDecodedLine">';
                                //                     if(firstKey && i==0) {
                                //                         Line += '<span class="MetarDecodedLineTitle">' + key + ':</span>';
                                //                         firstKey = false;
                                //                     }
                                //                     Line += '<span class="MetarDecodedLineData">' + SplittedLines[i] + '</span></div>';
                                //                     Lines.push(Line);
                                //                 }
                                //             }
                                //         }
                                //     }
                                // }
                            }
                        }
                        this.metarSliderGroup.setStringElements(Lines);
                    }
                    else {
                        this.metarSliderGroup.setStringElements(["No data"]);
                    }
                }
                else {
                    this.metarSliderGroup.setStringElements(["No data"]);
                }
            });
        }
    }
    getMetarLines(key ,data) {
        let SplittedLines = [];
        var Lines = [];
        if (typeof data === 'string' && data.length) {
            SplittedLines = this.splitMetarLineData(key + ": " + data, 32);
            if(SplittedLines.length) {
                // Remove key from first line
                SplittedLines[0] = SplittedLines[0].replace(key + ":", "");
                for(let i=0;i<SplittedLines.length;i++) {
                    var Line = '<div class="SelectableElement MetarDecodedLine">';
                    if(i==0) {
                        Line += '<span class="MetarDecodedLineTitle">' + key + ':</span>';
                    }
                    Line += '<span class="MetarDecodedLineData">' + SplittedLines[i] + '</span></div>';
                    Lines.push(Line);
                }
            }
        }
        else if (typeof data === "object") {
            // Usually for remarks entry in decoded data
            let firstKey = true;
            for (var key2 in data) {
                if (typeof data[key2] === 'string' && data[key2].length) {
                    if(firstKey) {
                        SplittedLines = this.splitMetarLineData(key + ": " + data[key2], 32);
                        if(SplittedLines.length) {
                            // Remove key from first line
                            SplittedLines[0] = SplittedLines[0].replace(key + ":", "");
                        }
                    }
                    else
                        SplittedLines = this.splitMetarLineData(data[key2], 32);
                    if(SplittedLines.length) {
                        for(let i=0;i<SplittedLines.length;i++) {
                            Line = '<div class="SelectableElement MetarDecodedLine">';
                            if(firstKey && i==0) {
                                Line += '<span class="MetarDecodedLineTitle">' + key + ':</span>';
                                firstKey = false;
                            }
                            Line += '<span class="MetarDecodedLineData">' + SplittedLines[i] + '</span></div>';
                            Lines.push(Line);
                        }
                    }
                }
            }
        }
        return Lines;
    }
    // Returns some text as array of lines of maxlenght = length
    splitMetarLineData(str, length) {
        var result = [],
          currentLine = '',
          currentLineLengthWithoutFormatting = 0;
      
        // 1. Split words on &nbsp;
        let words = str.trim().split(" ");
      
        // 2. Re-assemble lines
        words.forEach(function(word) {
        let wordLength = word.length;
        // Assemble line
        if (currentLineLengthWithoutFormatting + wordLength <= length) {
            // Word still fits on current line
            if (currentLineLengthWithoutFormatting > 0) {
                currentLine += ' ';
                currentLineLengthWithoutFormatting++;
            }
            } else {
                // Need to start new line
                result.push(currentLine);
                currentLine = '';
                currentLineLengthWithoutFormatting = 0;
            }
            currentLine += word;
            currentLineLengthWithoutFormatting += wordLength;
        });
      
        if (currentLineLengthWithoutFormatting > 0)
            result.push(currentLine);
      
        return result;
    }
}