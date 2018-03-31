var UserInput;
(function (UserInput) {
    (function (InputEvent) {
        InputEvent[InputEvent["MouseMove"] = 0] = "MouseMove";
        InputEvent[InputEvent["MouseLeftDown"] = 1] = "MouseLeftDown";
        InputEvent[InputEvent["MouseMiddleDown"] = 2] = "MouseMiddleDown";
        InputEvent[InputEvent["MouseRightDown"] = 3] = "MouseRightDown";
        InputEvent[InputEvent["MouseLeftUp"] = 4] = "MouseLeftUp";
        InputEvent[InputEvent["MouseMiddleUp"] = 5] = "MouseMiddleUp";
        InputEvent[InputEvent["MouseRightUp"] = 6] = "MouseRightUp";
        InputEvent[InputEvent["MouseWheel"] = 7] = "MouseWheel";
        InputEvent[InputEvent["KeyDown"] = 8] = "KeyDown";
        InputEvent[InputEvent["KeyUp"] = 9] = "KeyUp";
    })(UserInput.InputEvent || (UserInput.InputEvent = {}));
    var InputEvent = UserInput.InputEvent;
    class InputState {
        constructor() {
            this._elements = new Array();
            this._listener = null;
            document.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            }, false);
        }
        elements() { return this._elements; }
        shiftDown() { return this._shift; }
        ctrlDown() { return this._ctrl; }
        altDown() { return this._alt; }
        mouseX() { return this._mouseX; }
        mouseY() { return this._mouseY; }
        mouseLeftDown() { return this._mouseLeft; }
        mouseMiddleDown() { return this._mouseMiddle; }
        MouseRightDown() { return this._mouseRight; }
        lastKeyPressed() { return this._lastKeyPressed; }
        wheelChange() { return this._wheelChange; }
        addListener(parent, handler) {
            let self = this;
            self._elements.push(parent);
            parent.draggable = false;
            parent.addEventListener("wheel", function (e) {
                let event = InputEvent.MouseWheel;
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._wheelChange = e.deltaY;
                handler(self, event);
                pauseEvent(e);
            });
            parent.addEventListener("mousedown", function (e) {
                let event;
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._mouseX = e.x;
                self._mouseY = e.y;
                self._mouseStartX = e.x;
                self._mouseStartY = e.y;
                switch (e.button) {
                    case 0:
                        event = InputEvent.MouseLeftDown;
                        self._mouseLeft = true;
                        break;
                    case 1:
                        event = InputEvent.MouseMiddleDown;
                        self._mouseMiddle = true;
                        break;
                    case 2:
                        event = InputEvent.MouseRightDown;
                        self._mouseRight = true;
                        break;
                    default:
                        alert("Bad mouse down input.");
                        break;
                }
                handler(self, event);
                pauseEvent(e);
            });
            window.addEventListener("mouseup", function (e) {
                let event;
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._mouseX = e.x;
                self._mouseY = e.y;
                switch (e.button) {
                    case 0:
                        event = InputEvent.MouseLeftUp;
                        self._mouseLeft = false;
                        break;
                    case 1:
                        event = InputEvent.MouseMiddleUp;
                        self._mouseMiddle = false;
                        break;
                    case 2:
                        event = InputEvent.MouseRightUp;
                        self._mouseRight = false;
                        break;
                    default:
                        alert("Bad mouse down input.");
                        break;
                }
                handler(self, event);
                pauseEvent(e);
            });
            window.addEventListener("mousemove", function (e) {
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._mouseX = e.x;
                self._mouseY = e.y;
                handler(self, InputEvent.MouseMove);
                pauseEvent(e);
            });
            window.addEventListener("keydown", function (e) {
                if (e.keyCode === 122 || e.keyCode === 123) {
                    return true;
                }
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._lastKeyPressed = e.keyCode;
                handler(self, InputEvent.KeyDown);
                pauseEvent(e);
            });
            window.addEventListener("keyup", function (e) {
                self._shift = e.shiftKey;
                self._ctrl = e.ctrlKey;
                self._alt = e.altKey;
                self._lastKeyPressed = e.keyCode;
                handler(self, InputEvent.KeyUp);
                pauseEvent(e);
            });
        }
    }
    UserInput.InputState = InputState;
    function pauseEvent(e) {
        if (e.stopPropagation)
            e.stopPropagation();
        if (e.stopImmediatePropagation)
            e.stopImmediatePropagation;
        if (e.preventDefault)
            e.preventDefault();
        e.cancelBubble = true;
        return false;
    }
})(UserInput || (UserInput = {}));
