class GPS_Messages extends NavSystemElement {
    constructor() {
        super();
        this.name = "MSG";
    }
    init() {
        this.messages = this.gps.getChildById("Messages");
    }
    onEnter() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onUpdate(_deltaTime) {
        var html = "";
        this.messages.innerHTML = html;
    }
    onExit() {
        this.gps.closeConfirmWindow();
        this.gps.closeAlertWindow();
    }
    onEvent(_event) {
        if (_event == "CLR_Push") {
            this.gps.SwitchToInteractionState(0);
            this.gps.SwitchToPageName("NAV", "DefaultNav");
            this.gps.currentEventLinkedPageGroup = null;
        }
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
