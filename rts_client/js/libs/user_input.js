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
        InputEvent[InputEvent["KeyDown"] = 7] = "KeyDown";
        InputEvent[InputEvent["KeyUp"] = 8] = "KeyUp";
    })(UserInput.InputEvent || (UserInput.InputEvent = {}));
    var InputEvent = UserInput.InputEvent;
    var InputState = (function () {
        function InputState(parent, handler) {
            var self = this;
            self._element = parent;
            parent.draggable = false;
            document.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            }, false);
            parent.addEventListener("mousedown", function (e) {
                var event;
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
                var event;
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
            parent.addEventListener("mousemove", function (e) {
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
            /*
            parent.addEventListener("touchstart", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
    
            parent.addEventListener("touchend", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
    
            parent.addEventListener("touchcancel", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
    
            parent.addEventListener("touchleave", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
    
            parent.addEventListener("touchmove", function (e: TouchEvent) {
                that.addTouches(e.touches);
                handler(that);
                pauseEvent(e);
            });
            */
        }
        InputState.prototype.element = function () { return this._element; };
        InputState.prototype.shiftDown = function () { return this._shift; };
        InputState.prototype.ctrlDown = function () { return this._ctrl; };
        InputState.prototype.altDown = function () { return this._alt; };
        InputState.prototype.mouseX = function () { return this._mouseX; };
        InputState.prototype.mouseY = function () { return this._mouseY; };
        InputState.prototype.mouseLeftDown = function () { return this._mouseLeft; };
        InputState.prototype.mouseMiddleDown = function () { return this._mouseMiddle; };
        InputState.prototype.MouseRightDown = function () { return this._mouseRight; };
        InputState.prototype.lastKeyPressed = function () { return this._lastKeyPressed; };
        return InputState;
    }());
    UserInput.InputState = InputState;
    function pauseEvent(e) {
        if (e.stopPropagation)
            e.stopPropagation();
        if (e.preventDefault)
            e.preventDefault();
        e.cancelBubble = true;
        return false;
    }
})(UserInput || (UserInput = {}));
//# sourceMappingURL=user_input.js.map