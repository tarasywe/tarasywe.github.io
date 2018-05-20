"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var PIXI = require("pixi.js");
var Scene = /** @class */ (function (_super) {
    __extends(Scene, _super);
    function Scene() {
        var _this = _super.call(this) || this;
        _this.sceneNames = ['Card Scene', 'Random Images and texts', 'Particle Fire Scene'];
        _this.setMenuManager = function (manager) { return _this.manager = manager; };
        _this.getManager = function () { return _this.manager; };
        _this.setNavigator = function (cb) { return _this.navigateCallback = cb; };
        _this.navigate = function (scene) { return _this.navigateCallback(scene); };
        return _this;
    }
    Scene.prototype.createView = function (sceneName) {
        this.container = new PIXI.Container;
        var style = { fontFamily: "Helvetica, sans-serif", fontSize: "18px", fill: 'black' };
        var title = this.sceneNames[sceneName];
        var text = new PIXI.Text(title, style);
        text.y = 100;
        this.container.addChild(text);
        this.addChild(this.container);
    };
    return Scene;
}(PIXI.Container));
exports.Scene = Scene;
