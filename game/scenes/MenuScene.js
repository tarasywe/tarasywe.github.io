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
var Scene_1 = require("../../core/Scene");
var MenuScene = /** @class */ (function (_super) {
    __extends(MenuScene, _super);
    function MenuScene() {
        var _this = _super.call(this) || this;
        _this.selectScene = function (scene) {
            _this.navigate(scene);
        };
        _this.buttons = [];
        _this.createView();
        return _this;
    }
    MenuScene.prototype.createView = function () {
        this.menuContainer = new PIXI.Container;
        this.menuContainer.interactive = true;
        this.createMenuButtons(0, 'cardScene');
        this.createMenuButtons(1, 'randomScene');
        this.createMenuButtons(2, 'fireScene');
        this.addChild(this.menuContainer);
    };
    MenuScene.prototype.createMenuButtons = function (n, scene) {
        var _this = this;
        var buttonTexture = PIXI.Texture.fromImage('assets/button.png');
        var sprite = new PIXI.Sprite(buttonTexture);
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.on('pointerdown', function () { return _this.selectScene(scene); });
        sprite.y = n * 50;
        var style = { fontFamily: "Helvetica, sans-serif", fontSize: "18px", fill: 'white' };
        var text = new PIXI.Text(scene, style);
        text.x = 20;
        text.y = (n * 50) + 5;
        this.menuContainer.addChild(sprite);
        this.menuContainer.addChild(text);
    };
    return MenuScene;
}(Scene_1.Scene));
exports.MenuScene = MenuScene;
