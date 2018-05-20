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
var RandomScene = /** @class */ (function (_super) {
    __extends(RandomScene, _super);
    function RandomScene() {
        var _this = _super.call(this) || this;
        _this.createView(2);
        return _this;
    }
    return RandomScene;
}(Scene_1.Scene));
exports.RandomScene = RandomScene;