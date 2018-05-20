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
var ScenesManager_1 = require("../core/ScenesManager");
var MenuScene_1 = require("./scenes/MenuScene");
var CardScene_1 = require("./scenes/CardScene");
var RandomScene_1 = require("./scenes/RandomScene");
var FireScene_1 = require("./scenes/FireScene");
var Game = /** @class */ (function (_super) {
    __extends(Game, _super);
    function Game() {
        var _this = _super.call(this) || this;
        _this.loop = function () {
            var x = (_this.app.renderer.width / 2) - (_this.menuContainer.width / 2);
            var y = (_this.app.renderer.height / 2) - (_this.scene.height / 2);
            _this.scene.setTransform(x, y);
            _this.scene.updateTransform();
            _this.menuContainer.x = x;
            _this.menuContainer.updateTransform();
            _this.renderer.render(_this.app.stage);
            requestAnimationFrame(function () { return _this.loop(); });
        };
        _this.activateScene = function (sceneName) {
            _this.scene = _this.scenesManager.activateScene(sceneName);
        };
        return _this;
    }
    Game.prototype.start = function () {
        var _this = this;
        this.app = new PIXI.Application(window.innerWidth, window.innerHeight, { transparent: true });
        this.scenesManager = new ScenesManager_1.ScenesManager();
        document.body.appendChild(this.app.view);
        this.app.renderer.autoResize = true;
        this.mainContainer = new PIXI.Container;
        this.menuContainer = new PIXI.Container;
        this.app.stage.addChild(this.mainContainer);
        this.app.stage.addChild(this.menuContainer);
        this.loader.add('../assets/button.png').load(function () { return _this.setup(); });
        window.addEventListener("resize", function () {
            _this.app.renderer.resize(window.innerWidth, window.innerHeight);
        });
    };
    Game.prototype.setup = function () {
        var cards = this.scenesManager.createScene('cardScene', CardScene_1.CardScene);
        this.mainContainer.addChild(cards);
        var random = this.scenesManager.createScene('randomScene', RandomScene_1.RandomScene);
        this.mainContainer.addChild(random);
        var fire = this.scenesManager.createScene('fireScene', FireScene_1.FireScene);
        this.mainContainer.addChild(fire);
        var menu = this.scenesManager.createScene('menuScene', MenuScene_1.MenuScene);
        menu.setNavigator(this.activateScene);
        menu.setMenuManager(this.scenesManager);
        this.menuContainer.addChild(menu);
        menu.renderable = true;
        this.activateScene('cardScene');
        this.loop();
    };
    return Game;
}(PIXI.Application));
exports.Game = Game;
