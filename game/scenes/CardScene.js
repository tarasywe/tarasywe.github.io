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
var CardScene = /** @class */ (function (_super) {
    __extends(CardScene, _super);
    function CardScene() {
        var _this = _super.call(this) || this;
        _this.createView(0);
        return _this;
    }
    return CardScene;
}(Scene_1.Scene));
exports.CardScene = CardScene;
