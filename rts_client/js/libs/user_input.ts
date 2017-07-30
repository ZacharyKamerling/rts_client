module UserInput {

    export enum InputEvent {
        MouseMove,
        MouseLeftDown,
        MouseMiddleDown,
        MouseRightDown,
        MouseLeftUp,
        MouseMiddleUp,
        MouseRightUp,
        MouseWheel,
        KeyDown,
        KeyUp,
    }

    export class InputState {
        private _elements: HTMLElement[] = new Array();
        private _listener: HTMLElement = null;
        private _shift: boolean;
        private _ctrl: boolean;
        private _alt: boolean;
        private _mouseX: number;
        private _mouseY: number;
        private _mouseStartX: number;
        private _mouseStartY: number;
        private _mouseLeft: boolean;
        private _mouseMiddle: boolean;
        private _mouseRight: boolean;
        private _lastKeyPressed: number;
        private _wheelChange: number;

        public elements() { return this._elements; }
        public shiftDown() { return this._shift; }
        public ctrlDown() { return this._ctrl; }
        public altDown() { return this._alt; }
        public mouseX() { return this._mouseX; }
        public mouseY() { return this._mouseY; }
        public mouseLeftDown() { return this._mouseLeft; }
        public mouseMiddleDown() { return this._mouseMiddle; }
        public MouseRightDown() { return this._mouseRight; }
        public lastKeyPressed() { return this._lastKeyPressed; }
        public wheelChange() { return this._wheelChange; }

        constructor() {
            document.addEventListener('contextmenu', function (e) {
                e.preventDefault();
            }, false);
        }

        public addListener(parent: HTMLElement, handler: (state: InputState, event: InputEvent) => void) {
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
                let event: InputEvent;
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
                let event: InputEvent;
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
    }

    function pauseEvent(e: Event) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation;
        if (e.preventDefault) e.preventDefault();
        e.cancelBubble = true;
        return false;
    }
}