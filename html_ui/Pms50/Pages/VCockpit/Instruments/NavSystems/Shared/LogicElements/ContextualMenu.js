class ContextualMenu {
    constructor(_title, _elements) {
        this.title = _title;
        this.elements = _elements;
    }
    Update(_gps, _maxElems = 6) {
        diffAndSetHTML(_gps.contextualMenuTitle, this.title);
        var elementsHTML = "";
        _gps.UpdateSlider(_gps.menuSlider, _gps.menuSliderCursor, _gps.contextualMenuDisplayBeginIndex, _gps.currentContextualMenu.elements.length, _maxElems);
        for (var i = _gps.contextualMenuDisplayBeginIndex; i < Math.min(this.elements.length, _gps.contextualMenuDisplayBeginIndex + _maxElems); i++) {
            if (this.elements[i].isInactive()) {
                elementsHTML += '<div class="ContextualMenuElement" state="Inactive">' + this.elements[i].name + '</div>';
            }
            else {
                if (i == _gps.cursorIndex) {
                    elementsHTML += '<div class="ContextualMenuElement" state="Selected">' + this.elements[i].name + '</div>';
                }
                else {
                    elementsHTML += '<div class="ContextualMenuElement" state="Unselected">' + this.elements[i].name + '</div>';
                }
            }
        }
        diffAndSetHTML(_gps.contextualMenuElements, elementsHTML);
    }
// PM Modif: Check all inactive    
    isAllInactive() {
        for (var i = 0; i < this.elements.length; i++) {
            if(!this.elements[i].isInactive()) {
                return false;
            }
        }
        return true;
    }
// PM Modif: End Check all inactive    
}
class ContextualMenuConfirmation extends ContextualMenu {
    constructor(_title, _elements, _message) {
        super(_title, _elements);
        this.message = _message;
    }
    Update(_gps) {
        diffAndSetHTML(_gps.contextualMenuTitle, this.title);
        var ElementsHTML = "";
        diffAndSetAttribute(_gps.menuSlider, "state", "Inactive");
        ElementsHTML += '<div class="ContextualMenuElement" state="Unselected">' + this.message + '</div>';
        ElementsHTML += '<div id="ContextualMenuSeparator"></div>';
        ElementsHTML += '<div class="ContextualMenuElement Align" state="' + (_gps.cursorIndex == 0 ? 'Selected' : 'Unselected') + '">' + this.elements[0].name + '</div>';
        ElementsHTML += '<div class="ContextualMenuElement Align" state="Unselected">&nbsp;or&nbsp;</div>';
        ElementsHTML += '<div class="ContextualMenuElement Align" state="' + (_gps.cursorIndex == 1 ? 'Selected' : 'Unselected') + '">' + this.elements[1].name + '</div>';
        diffAndSetHTML(_gps.contextualMenuElements, ElementsHTML);
    }
}
class ContextualMenuElement {
    constructor(_name, _callBack, _isInactive = false) {
        this.name = _name;
        this.callBack = _callBack;
        this.inactiveCallback = _isInactive;
    }
    SendEvent() {
        return this.callBack();
    }
    isInactive() {
        if (this.inactiveCallback instanceof Function) {
            return this.inactiveCallback();
        }
        else {
            return this.inactiveCallback;
        }
    }
}
//# sourceMappingURL=ContextualMenu.js.map