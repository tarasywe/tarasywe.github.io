"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Scene_1 = require("./Scene");
var ScenesManager = /** @class */ (function () {
    function ScenesManager() {
        this.scenes = {};
    }
    ScenesManager.prototype.createScene = function (sceneId, scene) {
        if (scene === void 0) { scene = Scene_1.Scene; }
        var createdScene = new scene();
        this.scenes[sceneId] = createdScene;
        createdScene.renderable = false;
        return createdScene;
    };
    ScenesManager.prototype.activateScene = function (sceneId) {
        if (this.currentScene) {
            this.currentScene.renderable = false;
        }
        this.currentScene = this.scenes[sceneId];
        this.currentScene.renderable = true;
        return this.currentScene;
    };
    ScenesManager.prototype.setPosition = function (x, y) {
        this.currentScene.x = x;
        this.currentScene.y = y;
    };
    return ScenesManager;
}());
exports.ScenesManager = ScenesManager;
