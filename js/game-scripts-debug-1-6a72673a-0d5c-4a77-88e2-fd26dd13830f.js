/**
 * 用户自定义脚本.
 */
(function(window, Object, undefined) {

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 保持横版或者竖版的组件
 * 在本节点下面的对象都会进行旋转
 * @class qc.Plugins.LockOrientation
 */
var LockOrientation = qc.defineBehaviour('qc.Plugins.LockOrientation', qc.Behaviour, function() {
    var self = this;

    /**
     * @property {int} orientation - 当前是限定为横版还是竖版，有如下取值：
     * Device.AUTO = 0;
     * Device.PORTRAIT = 1;
     * Device.LANDSCAPE = 2;
     */
    self.orientation = self.game.device.orientation;

    // 在PC上默认不启用
    self.desktop = false;

    // 本组件可以在编辑器模式下运行
    self.runInEditor = true;

    self.manualType = 0;
}, {
    orientation: qc.Serializer.INT,
    desktop: qc.Serializer.BOOLEAN,
    manualType: qc.Serializer.INT
});
LockOrientation.__menu = 'Plugins/LockOrientation';

Object.defineProperties(LockOrientation.prototype, {
    orientation: {
        get: function() {
            return this._orientation;
        },
        set: function(v) {
            if (v === this._orientation) return;
            this._orientation = v;
            this._doOrientation(this.game.device.orientation);
        }
    }
});

// 初始化处理，关注横竖版事件并做处理
LockOrientation.prototype.awake = function() {
    var self = this, o = self.gameObject;

    self.addListener(self.game.world.onSizeChange, self._doOrientation, self);
    self.addListener(o.parent.onRelayout, self.assureSize, self);

    // 确保目标节点大小、pivot与世界一致
    self._doOrientation();
    self.assureSize();

    var adapter = o.parent.getScript('qc.ScaleAdapter');

    if (adapter) {
        // 本插件需要重载掉ScaleAdapter，在屏幕宽高缩放时，需要按照旋转后的长宽来获取
        var oldScaleAdapter_getReferenceResolution = adapter.getReferenceResolution;
        adapter.getReferenceResolution = function() {
            var p = oldScaleAdapter_getReferenceResolution.call(this);
            if (self.rotate90) {
                return new qc.Point(p.y, p.x);
            }
            return p;        
        };
    }
};

// 确保和父亲节点的大小保持一致
LockOrientation.prototype.assureSize = function() {
    var self = this, o = self.gameObject;

    var rect = o.parent.rect;
    if (self.rotate90 === true) {
        // 旋转时，对调下长宽，确保和父亲节点重合
        o.width = rect.height;
        o.height = rect.width;
    }
    else {
        o.width = rect.width;
        o.height = rect.height;
    }
    o.setAnchor(new qc.Point(0.5, 0.5), new qc.Point(0.5, 0.5));
    o.anchoredX = 0;
    o.anchoredY = 0;
    o.pivotX = 0.5;
    o.pivotY = 0.5;
};

// 横竖屏发生变化的处理
LockOrientation.prototype._doOrientation = function() {
    var self = this, o = self.gameObject, v = self.game.device.orientation;

    if (!self.desktop && !self.game.editor && self.game.device.desktop) {
        o.rotation = 0;
        self.rotate90 = false;
        return;
    }

    switch (self.orientation) {
    case qc.Device.AUTO:
    default:
        o.rotation = 0;
        self.rotate90 = false;
        return;

    case qc.Device.PORTRAIT:
    case qc.Device.LANDSCAPE:
        if (v === self.orientation) {
            // 一致，就不需要旋转了
            o.rotation = 0;
            self.rotate90 = false;
        }
        else {
            // 不一致，旋转90度
            o.rotation = -Math.PI / 2;
            self.rotate90 = true;
        }
        self.assureSize();
        break;
    }
    var adapter = o.parent.getScript('qc.ScaleAdapter');
    if (adapter) {
        if (self.rotate90) {
            if (self.manualType === qc.ScaleAdapter.MANUAL_WIDTH) {
                adapter.manualType = qc.ScaleAdapter.MANUAL_HEIGHT;
            }
            else if (self.manualType === qc.ScaleAdapter.MANUAL_HEIGHT) {
                adapter.manualType = qc.ScaleAdapter.MANUAL_WIDTH;
            }
            else {
                adapter.manualType = self.manualType;
            }
        }
        else {
            adapter.manualType = self.manualType;
        }
    }
};


// 检测环境
var _ensureModule = function(clazz) {
    var arr = clazz.split('.');
    var curr = window;
    for (var i = 0; i < arr.length; i++) {
        if (!curr[arr[i]]) curr[arr[i]] = {};
        curr = curr[arr[i]];
    }
};


_ensureModule('com.qici.extraUI');
/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 滚动支持
 */
var ScrollView = qc.ScrollView;

var ScrollSupport = com.qici.extraUI.ScrollSupport = function(game, node, fnViewRect, fnContentRect, fnSetContentPos) {

    this.game = game;

	/**
	 * @property {qc.Node} node - 需要响应的节点
	 */
	this.node = node;

	/**
	 * @property {function} getViewRect - 得到视窗的大小
	 */
	this._getViewRect = fnViewRect;

	/**
	 * @property {function} getContentRect - 得到内容的大小
	 */
	this._getContentRect = fnContentRect;

	/**
	 * @property {function} setContentPosition - 设置内容的偏移
	 */
	this._setContentPosition = fnSetContentPos;

	/**
     * @property {boolean} canHorizontal - 是否响应水平滑动
     */
    this.canHorizontal = true;

    /**
     * @property {boolean} canVertical - 是否响应竖直滑动
     */
    this.canVertical = true;

    /**
     * @property {number} movementType - 边界限制类型
     */
    this.movementType = ScrollView.MOVEMENT_ELASTIC;

    /**
     * @property {number} elasticity - 当movementType === ScrollView.MOVEMENT_ELASTIC时生效，表示复位速度
     */
    this.elasticity = 1;

    /**
     * @property {boolean} inertia - 是否惯性滑动
     */
    this.inertia = true;

    /**
     * @property {number} decelerationRate - 惯性滑动的减速参数
     */
    this.decelerationRate = 0.03;

    /**
     * @property {number} scrollSensitivity - 响应滚动时的倍率
     */
    this.scrollSensitivity = 1;

    /**
     * @property {boolean} propagationScroll - 是否向上传递滚动事件
     * @type {boolean}
     */
    this.propagationScroll = false;

    /**
     * @property {Phaser.Signal} onValueChange - 偏移值发生变化时调用
     */
    this.onValueChange = new Phaser.Signal();

    /**
     * @property {qc.Point | null} _preContentPosition - 上一次处理的显示内容的偏移值
     * @private
     */
    this._preContentPosition = null;

    /**
     * @property {qc.Rectangle | null} _preContentRect - 上一次处理的内容区域在本节点坐标系下的位置
     * @private
     */
    this._preContentRect = null;

    /**
     * @property {qc.Rectangle | null} _preViewRect - 上一次处理的本视窗的大小
     * @private
     */
    this._preViewRect = null;

    /**
     * @property {qc.Point] _velocity - 滚动的速率，每秒移动的距离
     * @private
     */
    this._velocity = new qc.Point(0, 0);

    /**
     * @property {boolean} _isDragging - 是否正在拖拽中
     * @private
     */
    this._isDragging = false;

    this.pivotX = 0;
    this.pivotY = 0;

    // 监听滚动事件和拖拽事件
    if (this.node) {
	    this.node.onWheel.add(this._doWheel, this);
	    this.node.onDragStart.add(this._doDragStart, this);
	    this.node.onDrag.add(this._doDrag, this);
	    this.node.onDragEnd.add(this._doDragEnd, this);	
    }
};

ScrollSupport.prototype = {};
ScrollSupport.prototype.constructor = ScrollSupport;


Object.defineProperties(ScrollSupport.prototype,{
	/**
     * @property {qc.Node | null} horizontalScrollBar - 水平滚动条
     */
    horizontalScrollBar : {
        get : function() {
            if (this._horizontalScrollBar && this._horizontalScrollBar._destroy) {
                this._horizontalScrollBar = null;
            }
            return this._horizontalScrollBar;
        },
        set : function(value) {
            if (this._horizontalScrollBar) {
                this._horizontalScrollBar.onValueChange.remove(this._setHorizontalNormalizedPosition, this);
            }
            this._horizontalScrollBar = value;
            if (this._horizontalScrollBar) {
                this._horizontalScrollBar.onValueChange.add(this._setHorizontalNormalizedPosition, this);
            }
        }
    },

    /**
     * @property {qc.Node | null} verticalScrollBar - 竖直滚动条
     */
    verticalScrollBar : {
        get : function() {
            if (this._verticalScrollBar && this._verticalScrollBar._destroy) {
                this._verticalScrollBar = null;
            }
            return this._verticalScrollBar;
        },
        set : function(value) {
            if (this._verticalScrollBar) {
                this._verticalScrollBar.onValueChange.remove(this._setVerticalNormalizedPosition, this);
            }
            this._verticalScrollBar = value;
            if (this._verticalScrollBar) {
                this._verticalScrollBar.onValueChange.add(this._setVerticalNormalizedPosition, this);
            }
        }
    },

    /**
     * @property {number} horizontalNormalizedPosition - 水平方向上滚动的比例
     */
    horizontalNormalizedPosition : {
        get : function() {
            this._updateBounds();
            if (this._contentRect.width <= this._viewRect.width) {
                return (this._viewRect.x > this._contentRect.x) ? 1 : 0;
            }
            return (this._viewRect.x - this._contentRect.x) / (this._contentRect.width - this._viewRect.width);
        },
        set : function(value) {
            this.setNormalizedPosition(value, 0);
        }
    },

    /**
     * @property {number} verticalNormalizedPosition - 竖直方向上滚动的比例
     */
    verticalNormalizedPosition : {
        get : function() {
            this._updateBounds();
            if (this._contentRect.height <= this._viewRect.height) {
                return (this._viewRect.y > this._contentRect.y) ? 1 : 0;
            }
            return (this._viewRect.y - this._contentRect.y) / (this._contentRect.height - this._viewRect.height);
        },
        set : function(value) {
            this.setNormalizedPosition(value, 1);
        }
    }
});

/**
 * 析构
 */
ScrollSupport.prototype.destroy = function() {
	if (this.node) {
		this.node.onWheel.remove(this._doWheel, this);
	    this.node.onDragStart.remove(this._doDragStart, this);
	    this.node.onDrag.remove(this._doDrag, this);
	    this.node.onDragEnd.remove(this._doDragEnd, this);		
	}
    this.node = null;
    this._setContentPosition = null;
    this._getContentRect = null;
    this._getViewRect = null;
    this.horizontalScrollBar = null;
    this.verticalScrollBar = null;
};

/**
 * 更新
 */
ScrollSupport.prototype.update = function(deltaTime) {
    this._updateVelocity(deltaTime);
};

/**
 * 获取视窗大小
 */
ScrollSupport.prototype.getViewRect = function() {
	return this._getViewRect ? this._getViewRect() : new qc.Rectangle(0, 0, 0, 0);
};

/**
 * 获取内容大小
 */
ScrollSupport.prototype.getContentRect = function() {
	return this._getContentRect ? this._getContentRect() : new qc.Rectangle(0, 0, 0, 0);
};

/**
 * 设置内容显示的位置
 * @param x {Number} - x轴坐标
 * @param y {Number} - y轴坐标
 */
ScrollSupport.prototype.setContentPosition = function(x, y) {
	this._setContentPosition && this._setContentPosition(x, y);
};

/**
 * 设置水平位置
 * @param value {Number}
 * @private
 */
ScrollSupport.prototype._setHorizontalNormalizedPosition = function(value) {
    this.setNormalizedPosition(value, 0);
};

/**
 * 设置竖直位置
 * @param value {Number}
 * @private
 */
ScrollSupport.prototype._setVerticalNormalizedPosition = function(value) {
    this.setNormalizedPosition(value, 1);
};

/**
 * 计算移动指定距离后，显示区域对于视窗的越界偏移
 * @param deltaX {Number} - x轴上移动的距离
 * @param deltaY {Number} - y轴上移动的距离
 * @returns {qc.Point}
 */
ScrollSupport.prototype._calculateOffset = function(deltaX, deltaY) {
    var offset = new qc.Point(0, 0);
    // 无限制的情况下，没有越界处理
    if (this.movementType === ScrollView.MOVEMENT_UNRESTRICTED) {
        return offset;
    }
    var rect = this.getViewRect();
    var contentRect = this._contentRect;
    var min = new qc.Point(contentRect.x, contentRect.y);
    var max = new qc.Point(contentRect.x + contentRect.width, contentRect.y + contentRect.height);
    if (this.canHorizontal) {
        min.x += deltaX;
        max.x += deltaX;
        if (min.x > rect.x) {
            offset.x = rect.x - min.x;
        }
        else if (max.x < rect.x + rect.width) {
            offset.x = rect.x + rect.width - max.x;
        }
    }

    if (this.canVertical) {
        min.y += deltaY;
        max.y += deltaY;
        if (min.y > rect.y) {
            offset.y = rect.y - min.y;
        }
        else if (max.y < rect.y + rect.height) {
            offset.y = rect.y + rect.height - max.y;
        }
    }

    return offset;
};

/**
 * 处理回弹效果
 * @param position {qc.Point} - 当前位置
 * @param offset {qc.Point} - 需要处理的越界值
 * @param deltaTime {Number} - 上一帧到现在的时间
 * @param axisPos {'x' | 'y') - 滚动轴
 * @private
 */
ScrollSupport.prototype._calcVelocityEffect = function(position, offset, deltaTime, axisPos) {
    // 弹性处理
    if (this.movementType === ScrollView.MOVEMENT_ELASTIC && offset[axisPos] !== 0) {
        var lastOffset = this['_lastOffset_' + axisPos] || 0;
        if (Math.abs(lastOffset) < Math.abs(offset[axisPos])) {
            this['_lastOffset_' + axisPos] = offset[axisPos];
            this._currSmoothetTime = deltaTime;
        }
        else {
            this['_lastOffset_' + axisPos] = offset[axisPos];
            this._currSmoothetTime += deltaTime;
        }
        var smootherTime = this.elasticity <= 0 ? deltaTime : this.elasticity;
        var ret = this.game.math.smoothDamp(position[axisPos], position[axisPos] + offset[axisPos], this._velocity[axisPos], this.elasticity, Number.MAX_VALUE, deltaTime / 100);
        if (Math.abs(position[axisPos] + offset[axisPos] - ret[0]) < 0.0001) {
            position[axisPos] = position[axisPos] + offset[axisPos];
            this._velocity[axisPos] = 0;
        }
        else {
            position[axisPos] = ret[0];
            this._velocity[axisPos] = ret[1];
        }
        //position[axisPos] = position[axisPos] + offset[axisPos] * Phaser.Math.smoothstep(this._currSmoothetTime, 0, smootherTime * 1000);
        //this._velocity[axisPos] = 0;

    }
    else if (this.movementType === ScrollView.MOVEMENT_CLAMPED && offset[axisPos] !== 0) {
        position[axisPos] = position[axisPos] + offset[axisPos];
    }
    else if (this.inertia) {
        // 计算速度衰减
        var velocity = this._velocity[axisPos] * Math.pow(Math.abs(this.decelerationRate), deltaTime / 1000);
        if (Math.abs(velocity) < 1) {
            velocity = 0;
        }
        this._velocity[axisPos] = velocity;
        position[axisPos] = position[axisPos] + velocity * deltaTime / 1000;
    }
    else {
        this._velocity[axisPos] = 0;
    }
};

/**
 * 弹性形变
 * @param overStretching {Number} - 越界值，相当于力的大小
 * @param viewSize {Number} - 正常值
 * @return {Number} 产生的形变值
 * @private
 */
ScrollSupport.prototype._rubberDelta = function(overStretching, viewSize) {
    return (1 - (1 / ((Math.abs(overStretching) * 0.55 / viewSize) + 1))) * viewSize * this.game.math.sign(overStretching);
};

/**
 * 更新处理速度信息
 * @private
 */
ScrollSupport.prototype._updateVelocity = function(deltaTime) {
    var contentRect, position; 

    this._updateBounds();

    var offset = this._calculateOffset(0, 0);

    // 拖拽中，或者越界的偏移为0，或者回弹的速度为0时跳过
    if (!this._isDragging &&
        ((offset.x !== 0 || offset.y !== 0) ||
        (this._velocity.x !== 0 || this._velocity.y !== 0))) {

        contentRect = this.getContentRect();
        position = new qc.Point(contentRect.x, contentRect.y);

        this._calcVelocityEffect(position, offset, deltaTime, 'x');
        this._calcVelocityEffect(position, offset, deltaTime, 'y');

        if (this._velocity.x !== 0 ||
            this._velocity.y !== 0) {
            if (this.movementType === ScrollView.MOVEMENT_CLAMPED) {
                offset = this._calculateOffset(position.x - contentRect.x, position.y - contentRect.y);
                position.x += offset.x;
                position.y += offset.y;
            }
        }
        this.setContentPosition(position.x, position.y);
    }

    if (this._isDragging && this.inertia) {
        contentRect = this.getContentRect();
        var vx = contentRect.x - this._preContentPosition.x;
        var vy = contentRect.y - this._preContentPosition.y;

        var l =  this.game.math.clamp(deltaTime / 1000, 0, 1);

        this._velocity.x = vx / l;
        this._velocity.y = vy / l;
    }

    if (!this._preViewRect || !qc.Rectangle.equals(this._viewRect, this._preViewRect) ||
        !this._preContentRect || !qc.Rectangle.equals(this._contentRect, this._preContentRect)) {
        this._updateScrollBars(offset.x, offset.y);
        this.onValueChange.dispatch(new qc.Point(this.horizontalNormalizedPosition, this.verticalNormalizedPosition));
        this._updatePrevData();
    }
};

/**
 * 设置指定方向上的滚动值
 * @param value {number} - 设置的值
 * @param axis {number} - 坐标轴，0：x轴，1：y轴
 */
ScrollSupport.prototype.setNormalizedPosition = function(value, axis) {
    this._updateBounds();
    if (!this._contentRect) {
        return;
    }
    var contentRect = this.getContentRect();
    var lenProperty = axis ? 'height' : 'width';
    var posProperty = axis ? 'y' : 'x';
    var hiddenLength = this._contentRect[lenProperty] - this._viewRect[lenProperty];
    var contentMinPosition = this._viewRect[posProperty] - value * hiddenLength;
    var newLocalPosition = contentRect[posProperty] + contentMinPosition - this._contentRect[posProperty];
    var localPosition = contentRect[posProperty];
    // 滚动位置相差1个像素时开始处理
    if (Math.abs(localPosition - newLocalPosition) > 1) {
        contentRect[posProperty] = newLocalPosition;
        this.setContentPosition(contentRect.x, contentRect.y);
        // 设置滚动速率为0
        this._velocity[posProperty] = 0;
        this._updateBounds();
    }
};

/**
 * 更新记录的上一次信息
 * @private
 */
ScrollSupport.prototype._updatePrevData = function() {
    var contentRect = this.getContentRect();
    this._preContentPosition = new qc.Point(contentRect.x, contentRect.y);
    this._preContentRect = this._contentRect;
    this._preViewRect = this._viewRect;
};

/**
 * 更新滚动条的滚动信息
 * @param offX {number} - 在水平方向上的偏移
 * @param offY {number} - 在竖直方向上的偏移
 * @private
 */
ScrollSupport.prototype._updateScrollBars = function(offX, offY) {
	var barSize;
    if (this.horizontalScrollBar) {
        if (this._contentRect.width > 0) {
            barSize = (this._viewRect.width - Math.abs(offX)) / this._contentRect.width;
            this.horizontalScrollBar.size = Phaser.Math.clamp(barSize,0, 1);
        }
        else {
            this.horizontalScrollBar.size = 1;
        }
        this.horizontalScrollBar.value = this.horizontalNormalizedPosition;
    }

    if (this.verticalScrollBar) {
        if (this._contentRect.height > 0) {
            barSize = (this._viewRect.height - Math.abs(offY)) / this._contentRect.height;
            this.verticalScrollBar.size = Phaser.Math.clamp(barSize, 0, 1);
        }
        else {
            this.verticalScrollBar.size = 1;
        }
        this.verticalScrollBar.value = this.verticalNormalizedPosition;
    }
};

/**
 * 更新区域信息
 * @private
 */
ScrollSupport.prototype._updateBounds = function() {
    var viewRect = this._viewRect = this.getViewRect();
    this._updateContentBounds();
    if (!this._getContentRect)
        return;

    // 如果内容区域下于显示区域，则模拟内容区域为显示区域大小
    var diffWidth = viewRect.width - this._contentRect.width;
    var diffHeight = viewRect.height - this._contentRect.height;
    if (diffWidth > 0) {
        this._contentRect.width = viewRect.width;
        this._contentRect.x -= diffWidth * this.pivotX;
    }
    if (diffHeight > 0) {
        this._contentRect.height = viewRect.height;
        this._contentRect.y -= diffHeight * this.pivotY;
    }
};

/**
 * 更新内容的区域信息
 * @private
 */
ScrollSupport.prototype._updateContentBounds = function() {
    this._contentRect = this.getContentRect();
};

/**
 * 滚动条滚动时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.WheelEvent} - 拖拽结束事件
 * @private
 */
ScrollSupport.prototype._doWheel = function(node, event) {
    this._updateBounds();

    var delta = new qc.Point(event.source.deltaX, event.source.deltaY);
    if (!this.canVertical) {
        delta.y = 0;
    }
    if (!this.canHorizontal) {
        delta.x = 0;
    }

    var deltaX = delta.x * this.scrollSensitivity;
    var deltaY = delta.y * this.scrollSensitivity;
    this.doScroll(deltaX, deltaY, false);
};

/**
 * 开始拖拽
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragStartEvent} - 开始拖拽事件
 * @private
 */
ScrollSupport.prototype._doDragStart = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }

    this._updateBounds();
    // 记录当前点击时内容的显示位置
    var contentRect = this.getContentRect();
    this._contentStartPosition = new qc.Point(contentRect.x, contentRect.y);
    this._pointerStartCursor = this.node.toLocal(new qc.Point(event.source.startX, event.source.startY));
    this._isDragging = true;
};

/**
 * 处理拖拽结束
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEndEvent} - 拖拽结束事件
 * @private
 */
ScrollSupport.prototype._doDragEnd = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }
    this._isDragging = false;
};

/**
 * 处理拖拽事件
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEvent} - 拖拽结束事件
 * @private
 */
ScrollSupport.prototype._doDrag = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }

    this._updateBounds();
    var contentRect = this.getContentRect();
    var cursor = this.node.toLocal(new qc.Point(event.source.x, event.source.y));
    if (!this._pointerStartCursor)
        return;

    var deltaX = this.canHorizontal ? (cursor.x - this._pointerStartCursor.x) : 0;
    var deltaY = this.canVertical ? (cursor.y - this._pointerStartCursor.y) : 0;
    this.doScroll(this._contentStartPosition.x + deltaX - contentRect.x,
        this._contentStartPosition.y + deltaY - contentRect.y,
        true);
};

/**
 * 处理滚动事件
 * @param deltaX {number} - x轴偏移
 * @param deltaY {number} - x轴偏移
 * @param isDrag {boolean} - 是否是拖拽
 */
ScrollSupport.prototype.doScroll = function(deltaX, deltaY, isDrag) {
    var contentRect = this.getContentRect();
    var position = new qc.Point(contentRect.x, contentRect.y);
    position.x += deltaX;
    position.y += deltaY;
    var offset = this._calculateOffset(deltaX, deltaY);
    position.x += offset.x;
    position.y += offset.y;
    if (this.movementType === ScrollView.MOVEMENT_CLAMPED && this.propagationScroll) {
        var parentScroll = this.parent;
        while (!(parentScroll instanceof ScrollView) && parentScroll !== this.game.world) {
            parentScroll = parentScroll.parent;
        }
        if (parentScroll instanceof ScrollView) {
            parentScroll.doScroll(-offset.x, -offset.y, isDrag);
        }
    }
    else if (this.movementType === ScrollView.MOVEMENT_ELASTIC) {
        if (isDrag) {
            if (offset.x !== 0) {
                position.x = position.x - this._rubberDelta(offset.x, this._viewRect.width);
            }
            if (offset.y !== 0) {
                position.y = position.y - this._rubberDelta(offset.y, this._viewRect.height);
            }
        }
        else {
            position.x -= offset.x;
            position.y -= offset.y;
            if (Math.abs(offset.x) > this._viewRect.width) {
                position.x += offset.x - this.game.math.sign(offset.x) * this._viewRect.width;
            }
            if (Math.abs(offset.y) > this._viewRect.height) {
                position.y += offset.y - this.game.math.sign(offset.y) * this._viewRect.height;
            }
        }
    }
    this.setContentPosition(position.x, position.y);
    if (!isDrag) {
        this._updateBounds();
    }
};
/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * TableView的适配器，用于提供表格数据信息。
 * 使用时，继承此类，并实现相关接口
 */
var TableViewAdapter = qc.defineBehaviour('com.qici.extraUI.TableViewAdapter', qc.Behaviour, function() {
	var self = this;

	/**
	 * @property {qc.Signal} onDataChange - 当表格数据发生变化时的通知事件
	 */
	self.onDataChange = new qc.Signal();
}, {
	
});

Object.defineProperties(TableViewAdapter.prototype,{

});

/**
 * 通知TableView表格变化
 */
TableViewAdapter.prototype.dispatchDataChange = function() {
	this.onDataChange.dispatch();

};

/**
 * 获取表格大小，x、y同时只能有一个为Infinity
 * @return {{x: number|Infinity, y: number| Infinity}}
 */
TableViewAdapter.prototype.getTableSize = function() {
	return { x: 1, y: Infinity};
};

/**
 * 根据在Table中的点返回对应的单元格
 * @param  {number} x - x轴坐标
 * @param  {number} y - y轴坐标
 * @return {{x: number, y: number}}} 返回点所在的单元格信息
 */
TableViewAdapter.prototype.findCellWithPos = function(x, y) {
	return { 
		x: Math.floor(x / 100),
		y: Math.floor(y / 100)
	};
};

/**
 * 获取节点的显示位置
 */
TableViewAdapter.prototype.getCellRect = function(col, row) {
	return new qc.Rectangle(col * 100, row * 100, 100, 100);
};

/**
 * 节点处于不可见时，回收节点，
 * @param  {qc.Node} cell - 节点
 * @param  {number} col - 所在列
 * @param  {number} row - 所在行
 */
TableViewAdapter.prototype.revokeCell = function(cell, col, row) {

};

/**
 * 节点处于可见时，创建节点，
 * @param  {qc.Node} cell - 节点
 * @param  {number} col - 所在列
 * @param  {number} row - 所在行
 */
TableViewAdapter.prototype.createCell = function(cell, col, row) {

};
/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 一个高效的表格显示组件，
 */
var TableView = qc.defineBehaviour('com.qici.extraUI.TableView', qc.Behaviour, function() {
    var self = this;

    /**
     * @property {[qc.Node]} _cellPool - 缓存的节点
     */
    self._cellPool = [];

    /**
     * @property {[qc.Node]} _usingCell - 使用中的节点
     */
    self._usingCell = [];

    /**
     * @property {qc.Rectangle} _showRect - 当前显示的子节点记录
     */
    self._showRect = new qc.Rectangle(0, 0, 0, 0);

    /**
     * 启用滚动功能
     */
    self.scrollSupport = new com.qici.extraUI.ScrollSupport(
        self.game,
        self.gameObject, 
        self._getViewRect.bind(self), 
        self._getContentRect.bind(self),
        self._setContentPosition.bind(self));

    self.runInEditor = true;
}, {
    content: qc.Serializer.NODE,
    adapterNode: qc.Serializer.NODE,
    horizontalScrollBar: qc.Serializer.NODE,
    verticalScrollBar: qc.Serializer.NODE,
    cellPrefab: qc.Serializer.PREFAB,
    overflow: qc.Serializer.BOOLEAN,
    canHorizontal: qc.Serializer.BOOLEAN,
    canVertical: qc.Serializer.BOOLEAN,
    movementType: qc.Serializer.NUMBER,
    elasticity: qc.Serializer.NUMBER,
    inertia: qc.Serializer.BOOLEAN,
    decelerationRate: qc.Serializer.NUMBER,
    scrollSensitivity: qc.Serializer.NUMBER,
    propagationScroll: qc.Serializer.BOOLEAN,
    extraLeft: qc.Serializer.NUMBER,
    extraRight: qc.Serializer.NUMBER,
    extraTop: qc.Serializer.NUMBER,
    extraBottom: qc.Serializer.NUMBER
});

Object.defineProperties(TableView.prototype, {
    /**
     * @property {qc.Node} adapterNode - 数据提供者所在的节点
     */
    adapterNode : {
        get : function() { return this._adapterNode || this.gameObject; },
        set : function(v) {
            if (v === this._adapterNode) 
                return;

            this._adapterNode = v;
            // 删除当前的数据来源
            if (this._adapter) {
                this._adapter.onDataChange.remove(this._clearTable, this);
                this._adapter = null;
            }
            this._needRebuild = true;
        }
    },

     /**
     * @property {qc.Node} adapter - 数据提供者
     * @readonly
     */
    adapter : {
        get : function() { 
            if (!this._adapter) {
                this._adapter = this.adapterNode && this.adapterNode.getScript('com.qici.extraUI.TableViewAdapter');
                if (this._adapter) {
                    this._adapter.onDataChange.add(this._clearTable, this);
                }
            }
            return this._adapter;
        },
    },

    /**
     * @property {qc.Node} content - 需要滚动显示的内容
     * 注意本节点之下不能挂载子节点，重构表单时会删除所有的子节点。
     */
    content : {
        get : function() {
            if (this._content && this._content._destroy) {
                this.content = null;
            }
            return this._content;
        },
        set : function(value) {
            var self = this;
            if (self._content) {
                self._content.onChildrenChanged.remove(self._doChildrenChanged, self);
                self._content.onLayoutArgumentChanged.remove(self._doLayoutArgumentChanged, self);
            }
            self._content = value;
            self._needRebuild = true;
            if (self._content) {
                self._content.onChildrenChanged.add(self._doChildrenChanged, self);
                self._content.onLayoutArgumentChanged.add(self._doLayoutArgumentChanged, self);
            }
        }
    },

    /**
     * @property {qc.Prefab} cellPrefab - 单元格的预制
     */
    cellPrefab : {
        get : function() { return this._cellPrefab; },
        set : function(v) {
            if (v === this._cellPrefab) 
                return;

            this._cellPrefab = v;
            // 更改显示预制时需要清理所有节点
            if (this.content)
                this.content.removeChildren();
            // 清理缓存的节点
            this._cellPool = [];
            this._needRebuild = true;
        }
    },

    /**
     * @property {boolean} overflow - 是否溢出显示。
     * 当溢出显示时，节点完全超过content的范围才隐藏。
     * 否者只要超出范围就隐藏
     */
    overflow : {
        get : function() { return this._overflow; },
        set : function(v) {
            if (v === this._overflow)
                return;

            this._overflow = v;
            this._needRebuild = true;
        }
    },

    extraLeft : {
        get : function() { return this._extraLeft || 0; },
        set : function(v) {
            if (v === this._extraLeft)
                return;
            this._extraLeft = v;
            this._needRebuild = true;
        }
    },
    extraRight : {
        get : function() { return this._extraRight || 0; },
        set : function(v) {
            if (v === this._extraRight)
                return;
            this._extraRight = v;
            this._needRebuild = true;
        }
    },
    extraTop : {
        get : function() { return this._extraTop || 0; },
        set : function(v) {
            if (v === this._extraTop)
                return;
            this._extraTop = v;
            this._needRebuild = true;
        }
    },
    extraBottom : {
        get : function() { return this._extraBottom || 0; },
        set : function(v) {
            if (v === this._extraBottom)
                return;
            this._extraBottom = v;
            this._needRebuild = true;
        }
    },

    canHorizontal: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.canHorizontal : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.canHorizontal = value);
        }
    },

    canVertical: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.canVertical : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.canVertical = value);
        }
    },

    movementType: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.movementType : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.movementType = value);
        }
    },

    elasticity: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.elasticity : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.elasticity = value);
        }
    },

    inertia: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.inertia : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.inertia = value);
        }
    },

    decelerationRate: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.decelerationRate : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.decelerationRate = value);
        }
    },

    scrollSensitivity: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.scrollSensitivity : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.scrollSensitivity = value);
        }
    },

    propagationScroll: {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.propagationScroll : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.propagationScroll = value);
        }
    },
    
    /**
     * @property {qc.Node | null} horizontalScrollBar - 水平滚动条
     */
    horizontalScrollBar : {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.horizontalScrollBar : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.horizontalScrollBar = value);
        }
    },

    /**
     * @property {qc.Node | null} verticalScrollBar - 竖直滚动条
     */
    verticalScrollBar : {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.verticalScrollBar : null;
        },
        set : function(value) {
            this.scrollSupport && (this.scrollSupport.verticalScrollBar = value);
        }
    },

    /**
     * @property {number} horizontalNormalizedPosition - 水平方向上滚动的比例
     */
    horizontalNormalizedPosition : {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.horizontalNormalizedPosition : null;
        },
        set : function(value) {
            this.scrollSupport  && this.scrollSupport.setNormalizedPosition(value, 0);
        }
    },

    /**
     * @property {number} verticalNormalizedPosition - 竖直方向上滚动的比例
     */
    verticalNormalizedPosition : {
        get : function() {
            return this.scrollSupport ? this.scrollSupport.verticalNormalizedPosition : null;
        },
        set : function(value) {
            this.scrollSupport  && this.scrollSupport.setNormalizedPosition(value, 1);
        }
    }
});

/**
 * 脚本启动时
 */
TableView.prototype.awake = function() {
};

/**
 * 析构
 */
TableView.prototype.onDestroy = function() {
    var self = this;
    // 清理一些引用的资源
    self.content = null;
    self.cellPrefab = null;
    self._adapter = null;
    self.adapterNode = null;

    self._cellPool = [];
    self._showCell = [];
    self._usingCell = [];
};

/**
 * 更新
 */
TableView.prototype.update = function() {
    if (this.content) {
        this.scrollSupport.pivotX = this.content.pivotX;
        this.scrollSupport.pivotY = this.content.pivotY;
    }
    this.scrollSupport.update(this.game.time.deltaTime);
    if (this._needRebuild) {
        this._rebuildTable();
    }
};

/**
 * 重新排布
 */
TableView.prototype.relayout = function() {
    this._rebuildTable();
};

/**
 * 清理表格
 */
TableView.prototype._clearTable = function() {
    var self = this,
        gameObject = self.gameObject,
        content = self.content;

    content.x = 0;
    content.y = 0;

    // 移除所有子节点
    self.revokeAllCell();
};

/**
 * 回收所有节点
 */
TableView.prototype.revokeAllCell = function() {
    var self = this,
        content = self.content;
    content.removeChildren();
    Array.prototype.push.apply(self._cellPool, self._usingCell);
    self._usingCell = [];
};

/**
 * 废弃一个节点
 * @param  {qc.Node} node - 不在显示区域的需要回收的节点
 */
TableView.prototype._revokeCell = function(node) {
    var self = this;
    self._cellPool.push(node);
    var idx = self._usingCell.indexOf(node);
    if (idx >= 0) {
        self._usingCell.splice(idx, 1);
    }
};

/**
 * 获取一个新的节点。
 * 如果当前缓存中存在可用的节点，则从缓存中获取，否则根据Prefab新建一个。
 * @return {qc.Node} 单元格的节点
 */
TableView.prototype._createCell = function() {
    var self = this;
    if (!self._cellPrefab) {
        return null;
    }
    var node = self._cellPool.pop() || self.game.add.clone(self._cellPrefab, self.gameObject);
    if (node) {
        self._usingCell.push(node);
    }
    return node;
};

/**
 * 获取视图大小
 */
TableView.prototype._getViewRect = function() {
    return this.gameObject.rect;
};

/**
 * 获取内容大小
 */
TableView.prototype._getContentRect = function() {
    var self = this,
        adapter = self.adapter,
        content = self.content;
    if (!content || !adapter) 
        return new qc.Rectangle(0, 0, 0, 0);

    var tableSize = adapter.getTableSize();
    var lastCellX = tableSize.x < Infinity ? tableSize.x - 1 : 0,
        lastCellY = tableSize.y < Infinity ? tableSize.y - 1 : 0;

    var cellRect = adapter.getCellRect(lastCellX, lastCellY);
    return new qc.Rectangle(content.x, content.y, 
        tableSize.x < Infinity ? cellRect.x + cellRect.width : Infinity,
        tableSize.y < Infinity ? cellRect.y + cellRect.height : Infinity);
};

/**
 * 设置当前内容在表格内容中的偏移
 */
TableView.prototype._setContentPosition = function(offsetX, offsetY) {
    var self = this,
        content = self.content;
    if (!content) 
        return;

    content.x = offsetX;
    content.y = offsetY;

    // 修改表格位置后需要马上重新设定显示内容。否则，可能会无法立即及时的更新内容信息
    self._rebuildTable();
};

/**
 * 获取当前内容区域在表格中对应的内容区域
 */
TableView.prototype._getViewRectInTable = function() {
    var self = this,
        gameObject = self.gameObject,
        rect = gameObject.rect,
        content = self.content;
    if (!content)
        return new qc.Rectangle(0, 0, 0, 0);
    return new qc.Rectangle(
        rect.x - self.extraLeft - content.x,
         rect.y - self.extraTop - content.y, 
         rect.width + self.extraLeft + self.extraRight, 
         rect.height + self.extraTop + self.extraBottom);
};

/**
 * 设置单元格的偏移
 */
TableView.prototype._setCellRect = function(cell, x, y, width, height) {
    var self = this,
        content = self.content;
    if (!content || !cell) 
        return;

    cell.x = x;
    cell.y = y;
    cell.width = width;
    cell.height = height;
};


/**
 * 重新构建表格
 */
TableView.prototype._rebuildTable = function() {
    var self = this,
        adapter = self.adapter,
        content = self.content;

    if (!content) {
        return;
    }

    if (!adapter) {
        this._clearTable();
        return;
    }

    var tableSize = adapter.getTableSize();
    if (tableSize.x <= 0 || tableSize.y <= 0 ||
        (tableSize.x === Infinity && tableSize.y === Infinity)) {
        // 没有行，或者没有列，或者行无限且列无限
        // 则清理显示并退出处理
        this._clearTable();
        return;
    }

    var bounds = self._getViewRectInTable();
    var showRect = self._showRect;
    var minX = bounds.x,
        maxX = bounds.x + bounds.width,
        minY = bounds.y,
        maxY = bounds.y + bounds.height;

    var leftUp = adapter.findCellWithPos(minX, minY);
    var rightBottom = adapter.findCellWithPos(maxX, maxY);

    if (!self.overflow) {
        var overLeftUp = adapter.findCellWithPos(minX - 1, minY - 1);
        var overRightBottom = adapter.findCellWithPos(maxX + 1, maxY + 1);
        if (overLeftUp.x === leftUp.x)
            ++leftUp.x;
        if (overLeftUp.y === leftUp.y)
            ++leftUp.y;
        if (overRightBottom.x === rightBottom.x)
            --rightBottom.x;
        if (overRightBottom.y === rightBottom.y)
            --rightBottom.y;
    }

    var startCellX = Math.max(leftUp.x, 0),
        startCellY = Math.max(leftUp.y, 0),
        endCellX = Math.min(rightBottom.x, tableSize.x - 1),
        endCellY = Math.min(rightBottom.y, tableSize.y - 1);

    var children = content.children;
    var totalLength = showRect.width * showRect.height;

    // 显示与实际需要的不匹配，全部销毁后重置
    if (totalLength !== children.length) {
        content.removeChildren();
        showRect.setTo(0, 0, 0, 0);
        totalLength = 0;
    }

    // 先移出不需要显示的部分
    var node;
    var yPos, xPos, yEnd, xEnd;
    var childIdx = totalLength - 1;
    for (yPos = showRect.y + showRect.height -1, yEnd = showRect.y; yPos >= yEnd; --yPos) {
        for (xPos = showRect.x + showRect.width - 1, xEnd = showRect.x; xPos >= xEnd; --xPos, --childIdx) {
            if (xPos >= startCellX && xPos <= endCellX &&
                yPos >= startCellY && yPos <= endCellY) 
                continue;
            node = content.removeChildAt(childIdx);
            adapter.revokeCell(node, xPos, yPos);
            self._revokeCell(node);
        }
    }

    var currStartX = Math.max(showRect.x, startCellX),
        currStartY = Math.max(showRect.y, startCellY),
        currEndX = Math.min(showRect.x + showRect.width - 1, endCellX),
        currEndY = Math.min(showRect.y + showRect.height - 1, endCellY);

    // 当前需要显示的宽，高
    var showWidth = endCellX - startCellX + 1,
        showHeight = endCellY - startCellY + 1;
    if (showWidth > 0 && showHeight > 0) {
        childIdx = 0;
        for (yPos = startCellY; yPos <= endCellY; ++yPos) {
            for (xPos = startCellX; xPos <= endCellX; ++xPos, ++childIdx) {
                if (xPos >= currStartX && xPos <= currEndX &&
                    yPos >= currStartY && yPos <= currEndY)
                    continue;
                node = self._createCell();
                if (!node) {
                    continue;
                }
                content.addChildAt(node, childIdx);
                var cellRect = adapter.getCellRect(xPos, yPos);
                self._setCellRect(node, cellRect.x, cellRect.y, cellRect.width, cellRect.height);
                adapter.createCell(node, xPos, yPos);
            }
        }
    }
    showRect.setTo(startCellX, startCellY, showWidth, showHeight);
};

/**
 * 当子节点变化时
 * @private
 */
TableView.prototype._doChildrenChanged = function(event) {
    this._needRebuild = true;
};

TableView.prototype._doLayoutArgumentChanged = function() {
    this._needRebuild = true;
};

/**
 * @author chenx
 * @date 2015.11.13
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * tween 回调函数
 * @class qc.TweenFunction
 */
var TweenFunction = qc.defineBehaviour('qc.TweenFunction', qc.Tween, function() {
    var self = this;

    /**
     * @property {string} func - 回调函数名
     */
    self.funcName = '';

    /**
     * @property {function} _func - 回调函数
     */
    self.func = null;

    // 回调函数的属主
    self.funcContext = null;

    // 默认情况下不可用
    self.enable = false;
},{
    funcName: qc.Serializer.STRING
});

// 菜单上的显示
TweenFunction.__menu = 'Plugins/TweenFunction';

Object.defineProperties(TweenFunction.prototype, {
    funcName: {
        get: function() { return this._funcName; },
        set: function(v) {
            if (v === this._funcName) return;

            this._funcName = v;
            this.onEnable();
        }
    }
});

// 组件 enabled
// gameObject 所有脚本挂载完后，才调用该接口，在此处将函数名转换成函数
TweenFunction.prototype.onEnable = function() {

    if (this._funcName.length <= 0)
        return;

    // 遍历 gameObject 及其所有的 scripts，查找回调函数
    this.func = this.gameObject[this._funcName];
    var classList = [];
    if (this.func)
    {
        // 记录存在该函数名的类名
        classList.push(this.gameObject.class);
        this.func = this.func.bind(this.gameObject);
        //this.funcContext = this.gameObject;
    }

    var self = this;
    this.gameObject.scripts.forEach(function(scriptOb) {
        var func = scriptOb[self._funcName];
        if (func)
        {
            // 记录存在该函数名的类名
            classList.push(scriptOb.class);
            self.func = func.bind(scriptOb);
            //this.funcContext = scriptOb;
        }
    });

    if (!self.func && this.enable)
        this.game.log.important('TweenFunction({0}) not find!', this._funcName);

    if (classList.length <= 1)
        return;

    // 存在多个相同名字的函数，提示错误
    self.game.log.error('Error: Exist multi functions with same name: {0}', classList);

    if (self.game.device.editor === true)
    {
        // 在编辑器中，弹出错误提示框
        var G = window.parent && window.parent.G;
        if (G)
        {
            var str = G._('TweenFunction func error') + classList;
            G.notification.error(str);
        }
    }
};


// 帧调度
TweenFunction.prototype.onUpdate = function(factor, isFinished) {
    if (typeof(this.func) != 'function')
        return;

    if (this.duration == 0 && !isFinished)
        // 表示该回调只在完成的调用一次
        return;

    // 调用回调函数
    this.func(factor, this.duration);
};

/**
 * 开始变化
 * @param node {qc.Node} - 需要改变的节点
 * @param duration {number} - 经历的时间
 * @param funcName {string} - 回调函数名
 * @returns {qc.TweenFunction}
 */
TweenFunction.begin = function(node, duration, funcName) {
    var tween = qc.Tween.begin('qc.TweenFunction', node, duration);
    tween.funcName = funcName;

    return tween;
};

/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 负责处理游戏的节点淡入淡出
 * @class qc.NodeFadeInOut
 */
var NodeFadeInOut = qc.defineBehaviour('qc.Plugins.NodeFadeInOut', qc.Tween, function() {
    /**
     * @property {number} fadeType - 淡入淡出类型
     */
    this.fadeType = NodeFadeInOut.FADE_IN;
    /**
     * @property {number} columnCount - 变化的列数
     */
    this.columnCount = 1;
    /**
     * @property {number} rowCount - 变化的列数
     */
    this.rowCount = 1;
    /**
     * @property {number] pivotX - 变化时的原点 x 位置
     */
    this.pivotX = 0.5;
    /**
     * @property {number} pivotY - 变化时的原点 y 坐标
     */
    this.pivotY = 0.5;
    /**
     * @property {number} style - 淡入淡出的类型
     */
    this.fadeStyle = NodeFadeInOut.STYLE_ZOOM;
    /**
     * @property {number} effect - 生效的效果
     */
    this.fadeEffect = NodeFadeInOut.EFFECT_XY;

    /**
     * @property {qc.Node} target - 需要淡入淡出的节点，不设置默认为自身节点
     */
    this.target = null;
}, {
    fadeType : qc.Serializer.NUMBER,
    columnCount : qc.Serializer.NUMBER,
    rowCount : qc.Serializer.NUMBER,
    pivotX : qc.Serializer.NUMBER,
    pivotY : qc.Serializer.NUMBER,
    fadeStyle : qc.Serializer.NUMBER,
    fadeEffect : qc.Serializer.NUMBER,
    target : qc.Serializer.NODE
});
NodeFadeInOut.__menu = 'Plugins/NodeFadeInOut';

Object.defineProperties(NodeFadeInOut.prototype, {
    /**
     * @property {number} columnCount - 分隔的列数
     */
    columnCount : {
        get : function() { return this._columnCount; },
        set : function(v) {
            v = (isNaN(v) || v === 0) ? 1 : v;
            if (v === this._columnCount) {
                return;
            }
            this._columnCount = v;
        }
    },
    /**
     * @property {number} rowCount - 分隔的行数
     */
    rowCount : {
        get : function() { return this._rowCount; },
        set : function(v) {
            v = (isNaN(v) || v === 0) ? 1 : v;
            if (v === this._rowCount) {
                return;
            }
            this._rowCount = v;
        }
    },
    /**
     * @property {qc.Node} _cachedTarget - 缓存的对象
     * @private
     * @readonly
     */
    _cachedTarget : {
        get : function() {
            if (this.target && this.target._destroy) {
                this.target = null;
            }
            return this.target || this.gameObject;
        }
    }
});


/**
 * 生效
 */
NodeFadeInOut.prototype.onEnable = function() {
    var self = this;
    if (self._cachedTarget._destroy) {
        return;
    }
    self._cachedTarget.visible = true;
    if (self._cachedTexture) {
        self._cachedTexture.destroy(true);
        self._cachedTexture = null;
    }
    // 获取缓存信息
    self._cachedBounds = self._cachedTarget.localBounds;
    self._cachedTexture = self._cachedTarget.generateTexture();
    self._cachedSprite = new PIXI.Sprite(self._cachedTexture);
    self._cachedSprite.worldTransform = self._cachedTarget.worldTransform;
    self._cachedTarget.phaser.anchor && (self._cachedSprite.anchor = self._cachedTarget.phaser.anchor);

    // 替换绘制函数
    if (!self._nodeRenderCanvas) {
        self._nodeRenderCanvas = self.gameObject.phaser._renderCanvas;
        self.gameObject.phaser._renderCanvas = self.renderCanvas.bind(this);

        self.gameObject.phaser.getSelfWidth = function() {
            return self._cachedSprite.width;
        };
        self.gameObject.phaser.getSelfHeight = function() {
            return self._cachedSprite.height;
        };
        self.gameObject.phaser._skipChildrenRender = true;
    }

    if (!self._nodeRenderWebGL) {
        self._nodeRenderWebGL = self.gameObject.phaser._renderWebGL;
        self.gameObject.phaser._renderWebGL = self.renderWebGL.bind(this);
    }

    
    // 缓存对象不是自身时，直接隐藏
    //if (this._cachedTarget !== this.gameObject) {
    //    this._cachedTarget.visible = false;
    //}
};

/**
 * 失效
 */
NodeFadeInOut.prototype.onDisable = function() {
    if (this._nodeRenderCanvas) {
        this.gameObject.phaser._renderCanvas = this._nodeRenderCanvas;
        this._nodeRenderCanvas = null;
    }
    if (this._nodeRenderWebGL) {
        this.gameObject.phaser._renderWebGL = this._nodeRenderWebGL;
        this._nodeRenderWebGL = null;
        this.gameObject.phaser.getSelfWidth = null;
        this.gameObject.phaser.getSelfHeight = null;
        this.gameObject.phaser._skipChildrenRender = false;
    }
    if (this._cachedTexture) {
        this._cachedTexture.destroy(true);
        this._cachedTexture = null;
    }
    if (this._cachedSprite) {
        this._cachedSprite = null;
    }
    qc.Tween.prototype.onDisable.call(this);
};

/**
 * 销毁
 */
NodeFadeInOut.prototype.onDestroy = function() {
    if (this._nodeRenderCanvas) {
        this.gameObject.phaser._renderCanvas = this._nodeRenderCanvas;
        this._nodeRenderCanvas = null;
    }
    if (this._nodeRenderWebGL) {
        this.gameObject.phaser._renderWebGL = this._nodeRenderWebGL;
        this._nodeRenderWebGL = null;
    }
    if (this._cachedTexture) {
        this._cachedTexture.destroy(true);
        this._cachedTexture = null;
    }
    if (this._cachedSprite) {
        this._cachedSprite = null;
    }
    if (qc.Tween.prototype.onDestroy)
        qc.Tween.prototype.onDestroy.call(this);
};

// 帧调度: 驱动位置
NodeFadeInOut.prototype.onUpdate = function(factor, isFinished) {
    this._factorValue = this.fadeType === NodeFadeInOut.FADE_IN ? (1 - factor) : factor;
    this.gameObject.phaser.displayChanged(qc.DisplayChangeStatus.TEXTURE | qc.DisplayChangeStatus.SIZE);
    if (isFinished && !this._cachedTarget._destroy && this._cachedTarget === this.gameObject) {
        this._cachedTarget.visible = this.fadeType === NodeFadeInOut.FADE_IN;
    }
};

/**
 * canvas下的绘制
 * @param renderSession
 */
NodeFadeInOut.prototype.renderCanvas = function(renderSession) {
    // 自身不是淡入淡出对象时，绘制自身
    if (this._cachedTarget !== this.gameObject) {
        this._nodeRenderCanvas.call(this.gameObject.phaser, renderSession);
    }

    var texture = this._cachedTexture;
    var sprite = this._cachedSprite;
    var bounds = this._cachedBounds;

    //  Ignore null sources
    if (texture)
    {
        var resolution = texture.baseTexture.resolution / renderSession.resolution;

        renderSession.context.globalAlpha = sprite.worldAlpha;

        //  If smoothingEnabled is supported and we need to change the smoothing property for this texture
        if (renderSession.smoothProperty && renderSession.scaleMode !== texture.baseTexture.scaleMode)
        {
            renderSession.scaleMode = texture.baseTexture.scaleMode;
            renderSession.context[renderSession.smoothProperty] = (renderSession.scaleMode === PIXI.scaleModes.LINEAR);
        }

        //  If the texture is trimmed we offset by the trim x/y, otherwise we use the frame dimensions
        var dx = (texture.trim) ? texture.trim.x - sprite.anchor.x * texture.trim.width : sprite.anchor.x * -texture.frame.width;
        var dy = (texture.trim) ? texture.trim.y - sprite.anchor.y * texture.trim.height : sprite.anchor.y * -texture.frame.height;

        //  Allow for pixel rounding
        if (renderSession.roundPixels)
        {
            renderSession.context.setTransform(
                sprite.worldTransform.a,
                sprite.worldTransform.b,
                sprite.worldTransform.c,
                sprite.worldTransform.d,
                (sprite.worldTransform.tx * renderSession.resolution) | 0,
                (sprite.worldTransform.ty * renderSession.resolution) | 0);
            dx = dx | 0;
            dy = dy | 0;
        }
        else
        {
            renderSession.context.setTransform(
                sprite.worldTransform.a,
                sprite.worldTransform.b,
                sprite.worldTransform.c,
                sprite.worldTransform.d,
                sprite.worldTransform.tx * renderSession.resolution,
                sprite.worldTransform.ty * renderSession.resolution);
        }

        var xStep = texture.crop.width / this.columnCount;
        var yStep = texture.crop.height  / this.rowCount;

        var effectX = this.fadeEffect === NodeFadeInOut.EFFECT_X || this.fadeEffect === NodeFadeInOut.EFFECT_XY;
        var effectY = this.fadeEffect === NodeFadeInOut.EFFECT_Y || this.fadeEffect === NodeFadeInOut.EFFECT_XY;
        var cellShowWidth = (effectX ? (1 - this._factorValue) : 1) * xStep / resolution;
        var cellShowHeight = (effectY ? (1 - this._factorValue) : 1) * yStep / resolution;
        var cellWidth = effectX && this.fadeStyle === NodeFadeInOut.STYLE_CLIP ? xStep * (1 - this._factorValue) : xStep;
        var cellHeight = effectY && this.fadeStyle === NodeFadeInOut.STYLE_CLIP ? yStep * (1 - this._factorValue) : yStep;
        for (var yPos = 0; yPos < texture.crop.height; yPos += yStep) {
            var showY = (dy + yPos + yStep * (effectY ? this._factorValue : 0) * this.pivotY )/ resolution + bounds.y;
            for (var xPos = 0; xPos < texture.crop.width; xPos += xStep) {
                var showX = (dx + xPos + xStep * (effectX ? this._factorValue : 0) * this.pivotX ) / resolution + bounds.x;
                renderSession.context.drawImage(
                    texture.baseTexture.source,
                    texture.crop.x + xPos,
                    texture.crop.y + yPos,
                    cellWidth,
                    cellHeight,
                    showX,
                    showY,
                    cellShowWidth,
                    cellShowHeight);
            }
        }
    }
};

/**
 * webGL 下的绘制
 * @param renderSession
 */
NodeFadeInOut.prototype.renderWebGL = function(renderSession){
    // 自身不是淡入淡出对象时，绘制自身
    if (this._cachedTarget !== this.gameObject) {
        this._nodeRenderWebGL.call(this.gameObject.phaser, renderSession);
    }

    var texture = this._cachedTexture;
    var bounds = this._cachedBounds;
    var sprite = this._cachedSprite;

    var uvs = texture._uvs;
    if (! uvs) return;

    var resolution = texture.baseTexture.resolution / renderSession.resolution;
    var xStep = texture.crop.width / this.columnCount;
    var yStep = texture.crop.height  / this.rowCount;

    var effectX = this.fadeEffect === NodeFadeInOut.EFFECT_X || this.fadeEffect === NodeFadeInOut.EFFECT_XY;
    var effectY = this.fadeEffect === NodeFadeInOut.EFFECT_Y || this.fadeEffect === NodeFadeInOut.EFFECT_XY;
    var cellShowWidth = (effectX ? (1 - this._factorValue) : 1) * xStep / resolution;
    var cellShowHeight = (effectY ? (1 - this._factorValue) : 1) * yStep / resolution;
    var cellWidth = effectX && this.fadeStyle === NodeFadeInOut.STYLE_CLIP ? xStep * (1 - this._factorValue) : xStep;
    var cellHeight = effectY && this.fadeStyle === NodeFadeInOut.STYLE_CLIP ? yStep * (1 - this._factorValue) : yStep;

    var worldTransform = sprite.worldTransform;

    var a = worldTransform.a / resolution;
    var b = worldTransform.b / resolution;
    var c = worldTransform.c / resolution;
    var d = worldTransform.d / resolution;
    var tx = worldTransform.tx;
    var ty = worldTransform.ty;
    var uvWith = uvs.x2 - uvs.x0;
    var uvHeight = uvs.y2 - uvs.y0;
    for (var yPos = 0; yPos < texture.crop.height; yPos += yStep) {
        var showY = (yPos + yStep * (effectY ? this._factorValue : 0) * this.pivotY )/ resolution + bounds.y;
        for (var xPos = 0; xPos < texture.crop.width; xPos += xStep) {
            var showX = (xPos + xStep * (effectX ? this._factorValue : 0) * this.pivotX ) / resolution + bounds.x;
            this._webGLAddQuad(renderSession.spriteBatch,sprite,
                showX, showY, showX + cellShowWidth, showY + cellShowHeight,
                uvs.x0 + uvWith * xPos / texture.crop.width,
                uvs.y0 + uvHeight * yPos / texture.crop.height,
                uvs.x0 + uvWith * (xPos + cellWidth) / texture.crop.width,
                uvs.y0 + uvHeight * (yPos + cellHeight) / texture.crop.height,
                a, b, c, d, tx, ty, sprite.tint);
        }
    }
};


// 增加定点
NodeFadeInOut.prototype._webGLAddQuad = function(spriteBatch, sprite, w1, h1, w0, h0, uvx0, uvy0, uvx1, uvy1, a, b, c, d, tx, ty, tint) {
    if(spriteBatch.currentBatchSize >= spriteBatch.size)
    {
        spriteBatch.flush();
        spriteBatch.currentBaseTexture = sprite.texture.baseTexture;
    }

    var colors = spriteBatch.colors;
    var positions = spriteBatch.positions;

    var index = spriteBatch.currentBatchSize * 4 * spriteBatch.vertSize;


    if(spriteBatch.renderSession.roundPixels)
    {
        // xy
        positions[index] = a * w1 + c * h1 + tx | 0;
        positions[index+1] = d * h1 + b * w1 + ty | 0;

        // xy
        positions[index+5] = a * w0 + c * h1 + tx | 0;
        positions[index+6] = d * h1 + b * w0 + ty | 0;

        // xy
        positions[index+10] = a * w0 + c * h0 + tx | 0;
        positions[index+11] = d * h0 + b * w0 + ty | 0;

        // xy
        positions[index+15] = a * w1 + c * h0 + tx | 0;
        positions[index+16] = d * h0 + b * w1 + ty | 0;
    }
    else
    {
        // xy
        positions[index] = a * w1 + c * h1 + tx;
        positions[index+1] = d * h1 + b * w1 + ty;

        // xy
        positions[index+5] = a * w0 + c * h1 + tx;
        positions[index+6] = d * h1 + b * w0 + ty;

        // xy
        positions[index+10] = a * w0 + c * h0 + tx;
        positions[index+11] = d * h0 + b * w0 + ty;

        // xy
        positions[index+15] = a * w1 + c * h0 + tx;
        positions[index+16] = d * h0 + b * w1 + ty;
    }
    // uv
    positions[index+2] = uvx0;
    positions[index+3] = uvy0;

    // uv
    positions[index+7] = uvx1;
    positions[index+8] = uvy0;

    // uv
    positions[index+12] = uvx1;
    positions[index+13] = uvy1;

    // uv
    positions[index+17] = uvx0;
    positions[index+18] = uvy1;

    // color and alpha
    colors[index+4] = colors[index+9] = colors[index+14] = colors[index+19] = (tint >> 16) + (tint & 0xff00) + ((tint & 0xff) << 16) + (sprite.worldAlpha * 255 << 24);

    // increment the batchsize
    spriteBatch.sprites[spriteBatch.currentBatchSize++] = sprite;
};

/**
 * 淡入
 * @constant
 * @type {number}
 */
NodeFadeInOut.FADE_IN = 0;

/**
 * 淡出
 * @constant
 * @type {number}
 */
NodeFadeInOut.FADE_OUT = 1;

/**
 * 缩放淡入淡出
 * @constant
 * @type {number}
 */
NodeFadeInOut.STYLE_ZOOM = 0;

/**
 * 裁切淡入淡出
 * @constant
 * @type {number}
 */
NodeFadeInOut.STYLE_CLIP = 1;

/**
 * x,y轴同时变化
 * @constant
 * @type {number}
 */
NodeFadeInOut.EFFECT_XY = 0;
/**
 * x轴变化
 * @constant
 * @type {number}
 */
NodeFadeInOut.EFFECT_X = 1;
/**
 * y轴变化
 * @constant
 * @type {number}
 */
NodeFadeInOut.EFFECT_Y = 2;
// 旋转 90°
var RotateAdapter = qc.defineBehaviour('qc.dota.RotateAdapter', qc.Behaviour, function() {
    this.runInEditor = true;
}, { });

RotateAdapter.prototype.awake = function() {
    var self = this;
    this.addListener(self.game.device.onOrientationChange, function() {
        if (self.game.device.orientation === qc.Device.LANDSCAPE)
            self.enable = false;
        else
            self.enable = true;
    }, self);
};

RotateAdapter.prototype.onEnable = function() {
    var self = this;
    var gameOb = self.gameObject;
    var scaleAdapter = gameOb.getScript('qc.ScaleAdapter');

    if (scaleAdapter) {
        // 重载 scaleAdapter 的 getTargetSize 方法
        self._rawGetTargetSizeFunc = scaleAdapter.getTargetSize;
        scaleAdapter.getTargetSize = function() {
            var currTarget = this.target || this.gameObject.game.world;
            if (!currTarget || !currTarget.width || !currTarget.height)
                return new qc.Point(0, 0);
            return new qc.Point(currTarget.height, currTarget.width);
        };
    }

    // hack updateWorldTransform
    self._rawUpdateTransformFunc = self.gameObject.phaser.updateTransform;
    self.gameObject.phaser.updateTransform = function() {
        // 是否更新 sin cos 信息
        if (this.rotation !== this.rotationCache) {
            this.rotationCache=this.rotation;
            this._sr=Math.sin(this.rotation);
            this._cr=Math.cos(this.rotation);
        }

        var pt = this.parent.worldTransform;
        var wt = this.worldTransform;

        // temporary matrix variables
        var a, b, c, d, tx, ty;

        // check to see if the rotation is the same as the previous render. This means we only need to use sin and cos when rotation actually changes
        if (this.rotation !== this.rotationCache)
        {
            this.rotationCache = this.rotation;
            this._sr = Math.sin(this.rotation);
            this._cr = Math.cos(this.rotation);
        }

        // get the matrix values of the displayobject based on its transform properties..
        a  =  -this._sr * this.scale.x;
        b  =  this._cr * this.scale.x;
        c  =  -this._cr * this.scale.y;
        d  = -this._sr * this.scale.y;
        tx =  -this.position.y + gameOb.game.world.width;
        ty =  this.position.x;

        // check for pivot.. not often used so geared towards that fact!
        if (this.pivot.x || this.pivot.y)
        {
            tx -= this.pivot.x * a + this.pivot.y * c;
            ty -= this.pivot.x * b + this.pivot.y * d;
        }

        // concat the parent matrix with the objects transform.
        wt.a  = a  * pt.a + b  * pt.c;
        wt.b  = a  * pt.b + b  * pt.d;
        wt.c  = c  * pt.a + d  * pt.c;
        wt.d  = c  * pt.b + d  * pt.d;
        wt.tx = tx * pt.a + ty * pt.c + pt.tx;
        wt.ty = tx * pt.b + ty * pt.d + pt.ty;

        // multiply the alphas..
        this.worldAlpha = this.alpha * this.parent.worldAlpha;

        //  Custom callback?
        if (this.transformCallback)
        {
            this.transformCallback.call(this.transformCallbackContext, wt, pt);
        }

        if(this._cacheAsBitmap)return;

        for(var i=0,j=this.children.length; i<j; i++)
        {
            this.children[i].updateTransform();
        }
    };
};

// 还原 scaleAdapter 的 getTargetSize 方法，还原 updateTransform 方法
RotateAdapter.prototype.onDisable = function() {
    var gameOb = this.gameObject;
    var scaleAdapter = gameOb.getScript('qc.ScaleAdapter');

    if (scaleAdapter && this._rawGetTargetSizeFunc)
        scaleAdapter.getTargetSize = this._rawGetTargetSizeFunc;

    if (this._rawUpdateTransformFunc)
    this.gameObject.phaser.updateTransform = this._rawUpdateTransformFunc;
};

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 负责战斗的控制
 */
var CombatUI = qc.defineBehaviour('qc.demo.CombatUI', qc.Behaviour, function() {
    var self = this;

    // startr btn
    self.startBtn = null;

    // 战斗的时间
    self.duration = 0;

    // 4 gamer units
    self.pets = [];

    // 4 monsters
    self.monsters = [];

    // is special attack 
    self.ult = false;

    // is combat started
    self._combating = false;

    // masking
    self.maskColor = new qc.Color(0xcccccc);

    // 大招预备的特效
    self.prepareEffect = null;

    // 我方和敌人当前的位置，每次前进1格就加1
    self.myPos = 0;
    self.oppPos = 0;

    self.startStep = false;

    // 登记本界面
    window.combatUI = self;
}, {
    // 需要序列化的字段
    startBtn: s.NODE,
    duration: s.NUMBER,
    pets: s.NODES,
    monsters: s.NODES,
    all: s.NODES,
    ult: s.BOOLEAN,
    maskColor: s.COLOR,
    prepareEffect: s.PREFAB,
    mask: s.NODE
});

Object.defineProperties(CombatUI.prototype, {
    /**
     * property {boolean} win - 战斗是不是胜利了
     */
    win: {
        get: function() {
            for (var i in this.monsters) {
                var fighter = this.monsters[i].getScript('qc.demo.Fighter');
                if (!fighter.die) return false;
            }
            return true;
        }
    },

    /**
     * property {boolean} lose - 战斗是不是失败了
     */
    lose: {
        get: function() {
            for (var i in this.pets) {
                var fighter = this.pets[i].getScript('qc.demo.Fighter');
                if (!fighter.die) return false;
            }
            return true;
        }
    }
});

// 初始化处理
CombatUI.prototype.awake = function() {
    var self = this;
    var count = self.all.length;

    for(var e = 0; e < count; e++){
        var creature = self.all[e];
        var fighter = creature.getScript('qc.demo.Fighter');
        fighter.defensers = [];
        if(fighter.isPet){
            fighter.stepAvailable = true;
            self.pets.push(creature);
            for(var d = 0; d < count; d++){
                // add links for monsters 
                var nextOne = self.all[d].getScript('qc.demo.Fighter');
                if(!nextOne.isPet){
                    fighter.defensers.push(self.all[d]);
                }
            }
        } else {
            self.monsters.push(creature);
            for(var c = 0; c < count; c++){
                // add links for monsters 
                var nextTwo = self.all[c].getScript('qc.demo.Fighter');
                if(nextTwo.isPet){
                    fighter.defensers.push(self.all[c]);
                }
            }
        } 
    }

    // this.addListener(self.startBtn.onClick, function() {
        if (!self._combating) {
            // 开启战斗
            self.startCombat();
            self.startBtn.getScript('qc.TweenScale').stop(); 
            self.startBtn.getScript('qc.TweenScale').reset();
        }
    // });
};

// 开始战斗的处理
CombatUI.prototype.startCombat = function() {
    var self = this;
    self._combating = true;
    self.duration = 0;
    self.myPos = 0;
    self.oppPos = 0;

    // 所有怪物回到出生点，然后向中间集结
    // 血量等回满、状态清除等
    for (var i in self.pets) {
        var fighter = self.pets[i].getScript('qc.demo.Fighter');
        if (fighter) fighter.reset();
    }
    for (var i in self.monsters) {
        var fighter = self.monsters[i].getScript('qc.demo.Fighter');
        if (fighter) fighter.reset();
    }
}

// 开始/停止播放大招
CombatUI.prototype.enableUlt = function(fighter, enable) {
    var self = this;
    enable = enable === undefined ? true : enable;
    var color = !enable ? qc.Color.white : self.maskColor;

    // 背景变色
    self.mask.visible = enable;

    // 模型变大或还原
    fighter.scaleX = enable ? 1.3 : 1;
    fighter.scaleY = enable ? 1.3 : 1;

    // 其他怪物或宠物变色
    for (var i in self.pets) {
        var o = self.pets[i];
        if (o === fighter) continue;
        o.colorTint = color;
        o.paused = enable;
    }
    for (var i in self.monsters) {
        var o = self.monsters[i];
        if (o === fighter) continue;
        o.colorTint = color;
        o.paused = enable;
    }

    // 准备动作的光效
    if (enable && self.prepareEffect) {
        var e = self.game.add.clone(self.prepareEffect, fighter.parent);
        e.onFinished.addOnce(function() {
            e.destroy();
        });
    }
}

// 目标死亡了，是否需要往前移动
CombatUI.prototype.onDie = function(target) {
    // 看战斗是不是结束了
    var self = this;

    var indexO = self.all.indexOf(target);
    self.all.splice(indexO, 1); 

    if(target.isPet){
        var indexOP = self.pets.indexOf(target);
        self.pets.splice(indexOP, 1); 
    } else {
        var indexOM = self.monsters.indexOf(target);
        self.monsters.splice(indexOM, 1); 
    }


    // 重新计算下我方和地方的最新位置
    var mPos = 0, oPos = 0;
    for (var i = 0; i < self.pets.length; i += 1) {
        if (!self.pets[i].getScript('qc.demo.Fighter').die){
            oPos++;
        }
    }
    for (var i = 0; i < self.monsters.length; i += 1) {
        if (!self.monsters[i].getScript('qc.demo.Fighter').die){
            mPos++;
        }
    }

    console.log(oPos, mPos);

    if(mPos === 0 || oPos === 0) {
        if(oPos > mPos){
            for (var i in self.pets) {
                var fighter = self.pets[i].getScript('qc.demo.Fighter');
                if (fighter) fighter.letsWin();
            }
            return;
        }
        for (var i in self.monsters) {
            var fighter = self.monsters[i].getScript('qc.demo.Fighter');
            if (fighter) fighter.letsWin();
        }
    }

    if (self.win || self.lose) {
        self._combating = false;
        return;
    }
    // console.log('有人死亡了，位置：', mPos, oPos);

    // if (mPos > self.myPos) {
    //     // 我方向前推进
    //     for (i in self.pets) {
    //         var fighter = self.pets[i].getScript('qc.demo.Fighter');
    //         if (!fighter.die) fighter.moveTo(mPos);
    //     }
    //     self.myPos = mPos;
    // }
    // if (oPos > self.oppPos) {
    //     // 敌人向前推进
    //     for (i in self.monsters) {
    //         var fighter = self.monsters[i].getScript('qc.demo.Fighter');
    //         if (!fighter.die) fighter.moveTo(oPos);
    //     }
    //     self.oppPos = oPos;
    // }
}

CombatUI.prototype.passDone = function(){
    var self = this;
    if (!self.startStep) return;
    var unit = self.all.shift();
    self.all.push(unit);
    self.startStep = false;
    var item = self.all[0].getScript('qc.demo.Fighter');
    if(!unit.getScript('qc.demo.Fighter').isPet && item.isPet){
        for (var i in self.pets) {
            var fighter = self.pets[i].getScript('qc.demo.Fighter');
            if (fighter) fighter.stepAvailable = true;
        }
    }
}

CombatUI.prototype.startPass = function(){
    this.startStep = true;
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 特效的动作
 */
var EffectAni = qc.defineBehaviour('qc.demo.EffectAni', qc.Behaviour, function() {
    var self = this;

    // 动作类型
    // moveFromOut - 从屏幕外移动进来到目标点
    self.type = 'moveFromOut';

    // 目标点
    self.to = new qc.Point(0, 0);

    self.runInEditor = true;
}, {
    // 需要序列化的字段
    type: s.STRING,
    to: s.POINT
});

// 启动处理
EffectAni.prototype.awake = function() {
    var self = this, o = self.gameObject;
    switch (self.type) {
    case 'moveFromOut':
        var tp = o.getScript('qc.TweenPosition');
        tp.to = self.to;
        tp.from.x = tp.to.x - self.game.world.width / 2;
        tp.from.y = self.to.y;
        tp.resetToBeginning();
        tp.playForward();
        break;
    }
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 特效从攻击者飞到受创者的控制
 */
var EffectFly = qc.defineBehaviour('qc.demo.EffectFly', qc.Behaviour, function() {
    // 目标位置的偏移量
    this.offset = new qc.Point(0, 0);

    // 飞行方向（向左还是向右）
    this.left = true;
}, {
    // 需要序列化的字段
    offset: s.POINT,
    left: s.BOOLEAN
});

// 开始播放
EffectFly.prototype.play = function(attacker, defenser) {
    var self = this;
    var o1 = attacker.parent, o2 = defenser.parent;
    var tp = self.gameObject.getScript('qc.TweenPosition');
    tp.from = new qc.Point(self.gameObject.x, self.gameObject.y);
    if (self.left) {
        tp.to = new qc.Point(tp.from.x + (o2.x - o1.x) + self.offset.x,
            tp.from.y + (o2.y - o1.y) + self.offset.y);
    }
    else {
        tp.to = new qc.Point(tp.from.x - (o2.x - o1.x) - self.offset.x,
            tp.from.y + (o2.y - o1.y) + self.offset.y);
    }
    tp.playForward();
    tp.onFinished.addOnce(function() {
        self.gameObject.destroy();
    });
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 战斗者的逻辑控制
 */
var Fighter = qc.defineBehaviour('qc.demo.Fighter', qc.Behaviour, function() {
    var self = this;

    // 是不是宠物
    self.isPet = true;

    // unicId
    self.uid = '';

    // 血量、伤害值、攻击频率、大招冷却时间
    self.maxHp = 1000;
    self.hp = self.maxHp;
    self.minDamage = 0;
    self.maxDamage = 0;
    self.frequency = 3;
    self.freeze = 0;

    // 普通攻击的技能
    self.skills = [];

    // 使用的大招
    self.bigSkill = null;

    // 攻击顺序
    self.defensers = [];

    // 是否处于晕眩中
    self.stun = false;

    // 晕眩的特效
    self.stunEffect = null;

    // 下次出招的时间
    self.nextRound = Fighter.MAX_VALUE;

    // 下次出大招的时间点倒计时
    // self.bigTime = Fighter.MAX_VALUE;
    self.bigTime = 3;
    self.originBigTime = 3;

    // 飘血的预制
    self.flyDamage = null;

    // 移动的目标位置
    self.twoPos = [null, null];

    // 关联的头像节点
    self.icon = null;

    // 死亡的声音
    self.dieAudio = null;

    self.stepAvailable = false;


    self.roundFinished = false;
}, {
    // 需要序列化的字段
    isPet: s.BOOLEAN,
    icon: s.NODE,
    maxHp: s.NUMBER,
    minDamage: s.NUMBER,
    maxDamage: s.NUMBER,
    frequency: s.NUMBER,
    freeze: s.NUMBER,
    bigSkill: s.NODE,
    defensers: s.NODES,
    stunEffect: s.PREFAB,
    skills: s.NODES,
    flyDamage: s.PREFAB,
    twoPos: s.NODES,
    dieAudio: s.AUDIO,
    uid: s.STRING,
    originBigTime: s.NUMBER
});

Fighter.MAX_VALUE = 999999999999;
// Fighter.SPECIAL_ATAK = 3;

Object.defineProperties(Fighter.prototype, {
    /**
     * @property {number} damage - 普通伤害值
     * @readonly
     */
    damage: {
        get: function() {
            return this.game.math.random(this.minDamage, this.maxDamage);
        }
    },

    /**
     * @property {boolean} die - 是不是死亡了
     * @readonly
     */
    die: {
        get: function() { return this.hp <= 0; }
    }
});

// 初始化处理
Fighter.prototype.awake = function() {
    var self = this;
    var parent = self.gameObject.parent;

    // 记录我当前的位置
    self.oldX = parent.x;
    self.oldY = parent.y;

    // 记录目标的两个位置
    // self._twoPos = [new qc.Point(self.twoPos[0].x, self.twoPos[0].y),
    //     new qc.Point(self.twoPos[1].x, self.twoPos[1].y)]

    // 初始隐藏掉
    parent.visible = false;
}

// 帧调度，自动出招
Fighter.prototype.update = function() {
    var self = this,
        o = self.gameObject;

    // 大招播放时不允许出招
    if (window.combatUI.ult || !window.combatUI._combating) return;

    // 对象不处于idle状态，不能出招
    if (self.die || o.paused || !o.isPlaying) return;

    // 处于晕眩状态
    if (self.stun) return;

    // if (self.nextRound === Fighter.MAX_VALUE && self.isIdle()) {
    //     // 当前对象处于idle状态，需要重置下回合
    //     self.resetRound();
    //     return;
    // }

    // 扣除倒计时，当对象处于idle状态时出招
    self.nextRound -= self.game.time.deltaTime;
    var queue = window.combatUI.all;
    var firstUnit = queue[0].getScript('qc.demo.Fighter');
    if (self.isIdle() && !self.isPet && self.uid === firstUnit.uid) {
        // 可以出招了
        // self.nextRound = Fighter.MAX_VALUE;
        window.combatUI.startPass();
        if(self.bigTime > 0){
            self.commonAttack();
        } else {
            self.bigAttack();
        }
    }
}

// 自动进行普通物理攻击
Fighter.prototype.commonAttack = function() {
    var self = this;
    self.bigTime -= 1;

    // get random atack
    var index = self.game.math.random(0, self.skills.length - 1);
    var skill = self.skills[index];

    // 抽取攻击目标
    var target = null;

    var defensers = [];
    for (var i in self.defensers) {
        var fighter = self.defensers[i].getScript('qc.demo.Fighter');
        if (fighter.die) continue;
        defensers.push(self.defensers[i]);
    }
    var randomIndex = Math.round(Math.random() * 3);
    target = defensers[randomIndex];    
    if (!target) return;

    var damage = self.game.math.random(self.minDamage, self.maxDamage);
    skill.scripts[0].play([target], damage);
}

// 播放大招
Fighter.prototype.bigAttack = function() {
    var self = this;
    if (self.bigTime > 0) return;

    self.bigTime = self.originBigTime;
    // self.nextRound = Fighter.MAX_VALUE;

    // 如果对手都死亡了，别出招了
    var win = true;
    for (var i in self.defensers) {
        if (self.defensers[i].die) continue;
        win = false;
        break;
    }
    if (!win && self.bigSkill)
        self.bigSkill.scripts[0].play(self.defensers, 0);
}

// 出招结束，进入下一回合
Fighter.prototype.resetRound = function() {
    var self = this;

    // 记录下一次出招的时间
    self.nextRound = self.frequency * 1000;
}

// 重置处理
Fighter.prototype.reset = function() {
    var self = this;
    var parent = self.gameObject.parent;

    // 重置下血量
    self.hp = self.maxHp;

    // 消除状态
    self.stun = false;

    // reset big time
    self.bigTime = self.originBigTime;
    self.nextRound = Fighter.MAX_VALUE;

    // 设置其位置
    parent.x = self.oldX;
    parent.y = self.oldY;
    parent.alpha = 1;

    // 令其出现
    var appear = self.gameObject.getScript('qc.demo.FighterAppear');
    if (appear) {
        appear.play();
    }
}

// 受创
Fighter.prototype.receiveDamage = function(damage, effect) {
    var self = this;
    var o = self.gameObject;
    if (self.die) return;
    self.hp -= damage;

    // 播放受创动作
    if (self.hp > 0) {
        if (self.isIdle()) {
            // 攻击过程中不播放受创动作
            o.playAnimation('damage');
            o.onFinished.addOnce(function() {
                self.resumeIdle();
            });
        }
    }
    else {
        // 死亡了
        o.playAnimation('death');
        o.onFinished.addOnce(function() {
            // 淡出消失
            var ta = o.parent.getScript('qc.TweenAlpha');
            ta.resetToBeginning();
            ta.playForward();
            ta.onFinished.addOnce(function() {
                o.parent.visible = false;

                // 通知有人死亡了
                window.combatUI.onDie(o);
            });
        });

        // 死亡声音
        if (self.dieAudio) {
            var sound = self.game.add.sound();
            sound.audio = self.dieAudio;
            sound.play();
        }
    }

    // 播放命中特效
    var e = null;
    if (effect) {
        e = self.game.add.clone(effect, o.parent);
        e.onFinished.addOnce(function() {
            e.destroy();
        });
    }

    // 播放飘血动画
    var fly = self.game.add.clone(self.flyDamage, o.parent);
    var damageFly = fly.getScript('qc.demo.DamageFly');
    damageFly.play(damage);

    // 返回特效，可能不同的技能需要进行移动等
    return e;
}

// 移动到目标位置
Fighter.prototype.moveTo = function(pos) {
    // 最多就前进2个位置
    var self = this;
    if (pos !== 1 && pos !== 2) return;

    // 移动过去
    var parent = self.gameObject.parent;
    var targetPos = self._twoPos[pos - 1];
    self.gameObject.playAnimation('move', 1, true);
    var tp = parent.getScript('qc.TweenPosition');
    if(tp){
        tp.from = new qc.Point(parent.x, parent.y);
        tp.to = targetPos;
        tp.duration = 1.5;
        tp.onFinished.addOnce(function() {
            // 回到idle状态
            self.resumeIdle();
        });
        tp.resetToBeginning();
        tp.playForward();
    }
}

// 回到idle状态
Fighter.prototype.resumeIdle = function() {
    // var self = this;
    this.gameObject.colorTint = new qc.Color(0xffffff);
    // var combatUI = window.combatUI;
    window.combatUI.passDone();
    if (this.die) return;
    this.gameObject.playAnimation(this.gameObject.defaultAnimation, 1, true);
}

// 当前是否表示处于idle状态
Fighter.prototype.isIdle = function() {
    if (this.die) return false;
    return this.gameObject.lastAnimationName === this.gameObject.defaultAnimation;
}

// 赋予晕眩状态
Fighter.prototype.applyStun = function(duration) {
    var self = this;
    self.stun = true;

    // 播放特效
    var e = self.game.add.clone(self.stunEffect, self.gameObject.parent);
    self.game.timer.add((duration + 1) * 1000, function() {
        self.stun = false;
        if(e) e.destroy();
    });
}

Fighter.prototype.letsWin = function(){
    var self = this;
    self.gameObject.playAnimation('cheer', 1, true);
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 战斗者出现的动画表现
 */
var FighterAppear = qc.defineBehaviour('qc.demo.FighterAppear', qc.Behaviour, function() {
    var self = this;

    // 走动的动作名称
    self.moveAni = 'move';

    // 偏移量，需要加上屏幕的宽度
    self.offset = 20;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    moveAni: s.STRING,
    offset: s.NUMBER
});

// 播放动作
FighterAppear.prototype.play = function() {
    var self = this, o = self.gameObject;
    var fighter = o.getScript('qc.demo.Fighter');
    o.parent.visible = true;
    o.alpha = 1;

    // var tp = o.parent.getScript('qc.TweenPosition');
    var tp = undefined;

    if(tp){
        tp.to.x = o.parent.x;
        tp.to.y = o.parent.y;
        tp.from.y = tp.to.y;
        if (fighter.isPet)
            tp.from.x = tp.to.x - self.game.world.width / 2 - self.offset;
        else
            tp.from.x = tp.to.x + self.game.world.width / 2 + self.offset;
        tp.resetToBeginning();
        tp.playForward();
        o.playAnimation(self.moveAni, 1, true);
        tp.onFinished.addOnce(function() {
            // 动作播放完毕，播放idle动作
            fighter.resumeIdle();
    
            // 可以出招了
            fighter.nextRound = 0;
            // fighter.bigTime = 3;
        });
    }
    else {
        fighter.resumeIdle();
        fighter.nextRound = 0;
        // fighter.bigTime = 3;
    }

}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 头像信息
 */
var IconInfo = qc.defineBehaviour('qc.demo.IconInfo', qc.Behaviour, function() {
    var self = this;

    // 对应的宠物等信息
    self.pet = null;
    self.hp = null;
    self.mp = null;
    self.effect = null;
    self.mask = null;
    self.frame = null;
    self.clickEffect = null;
}, {
    // 需要序列化的字段
    pet: s.NODE,
    hp: s.NODE,
    mp: s.NODE,
    effect: s.NODE,
    frame: s.NODE,
    mask: s.NODE,
    clickEffect: s.PREFAB
});

// 初始化处理
IconInfo.prototype.awake = function() {
    var self = this;

    // 未播放过激活动画
    self.activePlay = false;
    if(self.frame){
        self.frame.visible = false;
    }
    self.redraw();
};

// 头像被点击的处理：释放大招
IconInfo.prototype.onClick = function() {
    var self = this;
    var pet = self.pet.getScript('qc.demo.Fighter');
    // TEMP accept big atack
    if (pet.die || pet.stun || !pet.isPet || !pet.stepAvailable) return;
    // if (window.combatUI.ult) return;
    if (window.combatUI.win || window.combatUI.lose) return;
    window.combatUI.startPass();
    pet.stepAvailable = false;
    self.frame.visible = false;

    if(pet.bigTime > 0){
        pet.commonAttack();
    } else {
        pet.bigAttack();
    }

    // 未播放过激活动画
    self.activePlay = false;

    // 播放点击特效
    var e = self.game.add.clone(self.clickEffect, self.gameObject);
    e.onFinished.addOnce(function() {
        e.destroy();
    });

    this.update();
};

// 帧调度
IconInfo.prototype.update = function() {
    // 重绘值界面
    this.redraw();
};

// 绘制界面
IconInfo.prototype.redraw = function() {
    var self = this;
    var pet = self.pet.getScript('qc.demo.Fighter');
    if (!window.combatUI._combating) {
        self.effect.visible = false;
        return;
    }

    if(pet.stepAvailable && pet.isPet && !pet.die){
        self.frame.visible = true;
    }

    // HP的值
    self.hp.value = pet.hp / pet.maxHp;

    // mana counter for special attack
    self.mp.value = 1 - Math.fround(pet.bigTime / pet.originBigTime, 2);
    //self.mask.value = 1 - Math.min(pet.bigTime / (pet.freeze * 1000), 1);

    // 是不是死亡了
    if (pet.die) {
        self.effect.visible = false;
        self.gameObject.destroy();
        return;
    }

    // 如果大招刚激活，需要播放激活动画
    if (pet.bigTime <= 0 && !pet.die && pet.stepAvailable) {
        self.effect.visible = true;
        if (!self.activePlay) {
            self.activePlay = true;
            self.effect.playAnimation('start');
            self.effect.onFinished.addOnce(function() {
                self.effect.playAnimation('start1', 1, true);
            });
        }
    }
    else {
        self.effect.visible = false;
    }
};

var SoundCtr = qc.defineBehaviour('qc.engine.SoundCtr', qc.Behaviour, function() {
}, {
    // fields need to be serialized
    backgroundMusic: qc.Serializer.STRING
});

SoundCtr.prototype.awake = function() {
    var self = this;
    
    // Downloads the background music file and play it
    self.game.assets.load(self.backgroundMusic, function(music) {
        if (!music) return;
        var sound = self.game.add.sound(self.gameObject);
        sound.name = 'background music';
        sound.audio = music;
        sound.loop = true;
        sound.play();
    });
};

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 场景加载的进度提示界面
 */
var LoadingUI = qc.defineBehaviour('qc.demo.LoadingUI', qc.Behaviour,
    function() {
        this.clue = null;
    },
    {
        // 需要序列化的字段
        clue: qc.Serializer.NODE
    }
);

// 初始化处理
LoadingUI.prototype.awake = function() {
    // 关注场景开始切换和切换结束的事件
    var self = this;
    this.addListener(self.game.scene.onStartLoad, function() {
        // 场景加载开始，显示本界面
        self.show();
    });
    this.addListener(self.game.scene.onEndLoad, function() {
        // 场景加载完毕，隐藏本界面
        if (self.gameObject.visible) {
            if (self.duringTween)
                self.nextChange = 1;
            else
                self.hide();
        }
    });
};

// 帧调度，保证本界面永远在其他界面之上
LoadingUI.prototype.update = function() {
    var self = this,
        loaded = self.game.assets.loaded,
        total = self.game.assets.total;
    if (total) {
        self.clue.text = '拼命加载中：' + loaded + '/' + total;
    }
    else {
        self.clue.text = '';
    }
    // 扔到最后面去
    self.gameObject.parent.setChildIndex(this.gameObject, self.gameObject.parent.children.length - 1);
};

// 开始显示本界面
LoadingUI.prototype.show = function() {
    var self = this,
        fadeInOut = self.gameObject.getScript('qc.Plugins.NodeFadeInOut');

    self.gameObject.visible = true;
    self.gameObject.alpha = 0;
    fadeInOut.stop();
    fadeInOut.enable = false;
    fadeInOut.target = self.gameObject.game.world;
    fadeInOut.fadeType = NodeFadeInOut.FADE_OUT;
    fadeInOut.fadeStyle = this.getRandomInt(0, 2);
    fadeInOut.fadeEffect = this.getRandomInt(0, 3);
    fadeInOut.pivotX = Math.random(0, 1);
    fadeInOut.pivotY = Math.random(0, 1);
    fadeInOut.columnCount = this.getRandomInt(1, 32);
    fadeInOut.rowCount = this.getRandomInt(1, 32);
    fadeInOut.resetToBeginning();
    fadeInOut.playForward();
    self.gameObject.alpha = 1;
    self.duringTween = true;
    fadeInOut.onFinished.addOnce(function() {
        self.duringTween = false;
        if (self.nextChange) {
            self.hide();
            self.nextChange = 0;
        }
    });
};

// 结束显示本页面，加载完毕了
LoadingUI.prototype.hide = function() {
    var self = this,
        fadeInOut = self.gameObject.getScript('qc.Plugins.NodeFadeInOut');

    self.gameObject.alpha = 1;
    fadeInOut.enable = false;
    fadeInOut.target = null;
    fadeInOut.fadeType = NodeFadeInOut.FADE_OUT;
    fadeInOut.fadeStyle = this.getRandomInt(0, 2);
    fadeInOut.fadeEffect = this.getRandomInt(0, 3);
    fadeInOut.pivotX = Math.random(0, 1);
    fadeInOut.pivotY = Math.random(0, 1);
    fadeInOut.columnCount = this.getRandomInt(1, 32);
    fadeInOut.rowCount = this.getRandomInt(1, 32);
    fadeInOut.resetToBeginning();
    fadeInOut.playForward();
    self.duringTween = true;
    fadeInOut.onFinished.addOnce(function() {
        self.gameObject.visible = false;
        self.duringTween = false;
        self.nextChange = 0;
    });
};

LoadingUI.prototype.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 飘血的动画表现
 */
var DamageFly = qc.defineBehaviour('qc.demo.DamageFly', qc.Behaviour, function() {
    var self = this;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
});

// 创建出来就开始播放动作
DamageFly.prototype.play = function(damage) {
    var self = this, o = self.gameObject;
    o.text = '-' + damage;
    o.scaleDirtyInterval = 0;

    // 设定初生点位置
    var tp = o.getScript('qc.TweenPosition');
    tp.from.x = o.x + self.game.math.random(-30, 30);
    tp.from.y = o.y - self.game.math.random(-10, 10);
    tp.to.x = tp.from.x;
    tp.to.y = tp.from.y - 80;
    o.x = tp.from.x;
    o.y = tp.from.y;

    // 放大
    var ts = o.getScript('qc.TweenScale'),
        ta = o.getScript('qc.TweenAlpha');

    // 往上移动并淡出
    ts.onFinished.addOnce(function() {
        tp.resetToBeginning();
        tp.playForward();

        ta.from = 1;
        ta.to = 0;
        ta.onFinished.addOnce(function() {
            o.destroy();
        });
        ta.resetToBeginning();
        ta.playForward();
    });
    ts.resetToBeginning();
    ts.playForward();
};

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 船长的普通攻击3
 */
var CaptainAttack3 = qc.defineBehaviour('qc.demo.CaptainAttack3', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'atk3';

    // 精灵对象
    self.sprite = null;

    // 命中的特效
    self.hitEffect = null;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;

    // 飞上去的距离，时间
    self.flyDistance = 200;
    self.flyDuration = 0.2;

    // 到落下的时间点
    self.dropTime = 0.3;

    // 音效
    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    hitTime: s.NUMBER,
    hitEffect: s.PREFAB,
    flyDistance: s.NUMBER,
    flyDuration: s.NUMBER,
    dropTime: s.NUMBER,
    audio: s.AUDIO
});
CaptainAttack3.__menu = 'Dota/船长/atk3';

// 初始时不可用
CaptainAttack3.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
CaptainAttack3.prototype.update = function() {
    var self = this;
    if (self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0 && !self.hadHit) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
CaptainAttack3.prototype.play = function(targets, damage) {
    var self = this;
    self.targets = targets;
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 播放音效
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;
};

// 命中的处理
CaptainAttack3.prototype.onHit = function() {
    var self = this;
    self.hadHit = true;
    self.enable = false;

    // 目标播放受创动作
    for (var i in self.targets) {
        var fighter = self.targets[i].getScript('qc.demo.Fighter');
        if (fighter.die) continue;
        fighter.receiveDamage(self.damage, self.hitEffect);

        // 目标飞起来
        self.fly(self.targets[i]);
    }
}

// 目标飞起来的动画
CaptainAttack3.prototype.fly = function(target) {
    var self = this;
    var tp = target.getScript('qc.TweenPosition');
    if (!tp) {
        tp = target.addScript('qc.TweenPosition');
    }
    tp.duration = self.flyDuration;
    tp.from = new qc.Point(target.x, target.y);
    tp.to = new qc.Point(target.x, target.y - self.flyDistance);
    tp.resetToBeginning();
    tp.playForward();
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 船长的大招
 */
var CaptainBig = qc.defineBehaviour('qc.demo.CaptainBig', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'ult';

    // 精灵对象
    self.sprite = null;

    // 特效
    self.effect = null;

    // 大招的凸显时间
    self.duration = 0.8;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;

    // 命中特效
    self.hitEffect = null;

    // 音效
    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    effect: s.PREFAB,
    duration: s.NUMBER,
    hitTime: s.NUMBER,
    hitEffect: s.PREFAB,
    audio: s.AUDIO
});
CaptainBig.__menu = 'Dota/船长/big';

// 初始时不可用
CaptainBig.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
CaptainBig.prototype.update = function() {
    var self = this;
    if (self.hadHit || !self.sprite || self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
CaptainBig.prototype.play = function(targets, damage) {
    var self = this;
    var fighter = self.sprite.getScript('qc.demo.Fighter');
    damage = damage || 800;

    // 记录数据
    self.targets = targets;
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 战场和其他参展者全部暂停动作一段时间
    window.combatUI.enableUlt(self.sprite, true);
    self.game.timer.add(self.duration * 1000, function() {
        window.combatUI.enableUlt(self.sprite, false);

        // 播放特效
        var effect = self.game.add.clone(self.effect, self.gameObject.parent);
        var tp = effect.getScript('qc.TweenPosition');
        tp.from.x = tp.to.x - self.game.world.width/2;
        tp.resetToBeginning();
        tp.playForward();
        tp.onFinished.addOnce(function() {
            // 光效可以干掉了
            effect.destroy();
        });
    });

    // 播放音效
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;
};

// 命中的处理
CaptainBig.prototype.onHit = function() {
    var self = this;
    self.hadHit = true;
    self.enable = false;

    // 目标播放受创动作
    for (var i in self.targets) {
        var fighter = self.targets[i].getScript('qc.demo.Fighter');
        if (fighter.die) continue;
        fighter.receiveDamage(self.damage, self.hitEffect);

        // TODO: 目标晕眩状态(1s不能行动)
        fighter.applyStun(1);
    }
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 冰女的大招
 */
var CmBig = qc.defineBehaviour('qc.demo.CmBig', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'ult';

    // 精灵对象
    self.sprite = null;

    // 特效
    self.effect = null;

    // 大招的凸显时间
    self.duration = 0.8;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;

    // 命中特效
    self.hitEffect = null;

    // 音效
    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    effect: s.PREFAB,
    duration: s.NUMBER,
    hitTime: s.NUMBER,
    hitEffect: s.PREFAB,
    audio: s.AUDIO
});
CmBig.__menu = 'Dota/冰女/big';

// 初始时不可用
CmBig.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
CmBig.prototype.update = function() {
    var self = this;
    if (self.hadHit || !self.sprite || self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
CmBig.prototype.play = function(targets, damage) {
    var self = this;
    var fighter = self.sprite.getScript('qc.demo.Fighter');
    damage = damage || 500;

    // 记录数据
    self.targets = targets;
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 战场和其他参展者全部暂停动作一段时间
    window.combatUI.enableUlt(self.sprite, true);
    self.game.timer.add(self.duration * 1000, function() {
        window.combatUI.enableUlt(self.sprite, false);

        // 播放特效
        var effect = self.game.add.clone(self.effect, self.gameObject.parent.parent);
        effect.playAnimation(effect.defaultAnimation, 0.7);
        effect.onFinished.addOnce(function() {
            // 光效可以干掉了
            effect.destroy();
        });
    });

    // 播放声音
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;
};

// 命中的处理
CmBig.prototype.onHit = function() {
    var self = this;
    self.hadHit = true;
    self.enable = false;

    var count = 3;
    var f = function() {
        // 目标播放受创动作
        for (var i in self.targets) {
            var fighter = self.targets[i].getScript('qc.demo.Fighter');
            if (fighter.die) continue;
            fighter.receiveDamage(self.damage, self.hitEffect);
        }

        if (count-- > 0) {
            self.game.timer.add(150, f);
        }
    };
    f();
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 默认的普通攻击
 */
var CommonAttack = qc.defineBehaviour('qc.demo.CommonAttack', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'atk';

    // 精灵对象
    self.sprite = null;

    // 命中的特效
    self.hitEffect = null;

    // 从攻击者飞到受创者的光效
    self.flyEffect = null;
    self.flyEffectTime = 1;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;
    self.hadHit = true;

    // 声音
    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    hitTime: s.NUMBER,
    hitEffect: s.PREFAB,
    flyEffect: s.PREFAB,
    flyEffectTime: s.NUMBER,
    audio: s.AUDIO
});
CommonAttack.__menu = 'Dota/普通攻击';

// 初始时不可用
CommonAttack.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
CommonAttack.prototype.update = function() {
    var self = this;
    if (self.hadHit || !self.sprite || self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
CommonAttack.prototype.play = function(targets, damage) {
    var self = this;
    self.targets = targets;
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 延迟播放特效飞出去的特效
    if (self.flyEffect) {
        self.game.timer.add(self.flyEffectTime * 1000, function() {
            for (var i in targets) {
                var e = self.game.add.clone(self.flyEffect, self.sprite.parent);
                var ef = e.getScript('qc.demo.EffectFly');
                ef.play(self.sprite, targets[i]);
            }
        });
    }

    // 播放声音
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;
};

// 命中的处理
CommonAttack.prototype.onHit = function() {
    var self = this;
    self.hadHit = true;
    self.enable = false;

    // 目标播放受创动作
    for (var i in self.targets) {
        var fighter = self.targets[i].getScript('qc.demo.Fighter');
        if (fighter.die) continue;
        fighter.receiveDamage(self.damage, self.hitEffect);
    }
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 神牛的大招
 */
var EsBig = qc.defineBehaviour('qc.demo.EsBig', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'ult';

    // 精灵对象
    self.sprite = null;

    // 特效
    self.effect = null;
    self.effectTime = 1;

    // 大招的凸显时间
    self.duration = 0.8;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;

    // 命中特效
    self.hitEffect = null;

    // 音效
    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    effect: s.PREFAB,
    effectTime: s.NUMBER,
    duration: s.NUMBER,
    hitTime: s.NUMBER,
    hitEffect: s.PREFAB,
    audio: s.AUDIO
});
EsBig.__menu = 'Dota/神牛/big';

// 初始时不可用
EsBig.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
EsBig.prototype.update = function() {
    var self = this;
    if (self.hadHit || !self.sprite || self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
EsBig.prototype.play = function(targets, damage) {
    var self = this;
    var fighter = self.sprite.getScript('qc.demo.Fighter');
    damage = damage || 1000;

    // 记录数据
    self.targets = targets;
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 延迟播放特效
    self.game.timer.add(self.effectTime * 1000, function() {
        var effect = self.game.add.clone(self.effect, self.gameObject.parent);
        effect.onFinished.addOnce(function() {
            effect.destroy();
        });
    });

    // 战场和其他参展者全部暂停动作一段时间
    window.combatUI.enableUlt(self.sprite, true);
    self.game.timer.add(self.duration * 1000, function() {
        window.combatUI.enableUlt(self.sprite, false);
    });

    // 播放音效
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;
};

// 命中的处理
EsBig.prototype.onHit = function() {
    var self = this;
    self.hadHit = true;
    self.enable = false;

    // 目标播放受创动作
    for (var i in self.targets) {
        var fighter = self.targets[i].getScript('qc.demo.Fighter');
        if (fighter.die) continue;
        fighter.receiveDamage(self.damage, self.hitEffect);
    }
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 熊猫的大招
 */
var PandaBig = qc.defineBehaviour('qc.demo.PandaBig', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'ult';

    // 精灵对象
    self.sprite = null;

    // 大招的凸显时间
    self.duration = 0.8;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;

    // 后续3次命中的时间差
    self.doubleHit = [0.1, 0.1, 0.1];

    // 开始飞起的时间
    self.flyTime = 2;

    // 飞起的高度和时间
    self.flyDistance = 200;
    self.flyDuration = 0.5;
    self.hadHit = true;

    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    duration: s.NUMBER,
    hitTime: s.NUMBER,
    flyDistance: s.NUMBER,
    flyDuration: s.NUMBER,
    doubleHit: s.NUMBERS,
    flyTime: s.NUMBER,
    audio: s.AUDIO
});
PandaBig.__menu = 'Dota/熊猫/big';

// 初始时不可用
PandaBig.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
PandaBig.prototype.update = function() {
    var self = this;
    if (self.hadHit || !self.sprite || self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
PandaBig.prototype.play = function(targets, damage) {
    var self = this;
    var fighter = self.sprite.getScript('qc.demo.Fighter');
    damage = damage || 1000;

    // 只攻击1个人
    var target = null;
    for (var i in targets) {
        if (!targets[i].getScript('qc.demo.Fighter').die) {
            target = targets[i];
            break;
        }
    }
    if (!target) {
        console.error(targets);
        return;
    }

    // 记录数据
    self.targets = [target];
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 战场和其他参展者全部暂停动作一段时间
    window.combatUI.enableUlt(self.sprite, true);
    self.game.timer.add(self.duration * 1000, function() {
        window.combatUI.enableUlt(self.sprite, false);
    });

    // 播放音效
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;

    // 被击中后需要飞起来
    self.game.timer.add(self.flyTime * 1000, function() {
        self.fly();
    });
};

// 命中的处理
PandaBig.prototype.onHit = function() {
    var self = this, target = self.targets[0];
    self.hadHit = true;
    self.enable = false;

    // 多次连击
    var index = -1;
    var f = function() {
        var fighter = target.getScript('qc.demo.Fighter');
        if (fighter.die) return;
        fighter.receiveDamage(self.damage, self.hitEffect);

        index++;
        if (index < self.doubleHit.length) {
            self.game.timer.add(self.doubleHit[index] * 1000, f);
        }
    };
    f();
}

// 目标飞起来
PandaBig.prototype.fly = function() {
    var self = this, target = self.targets[0];
    var tp = target.getScript('qc.TweenPosition');
    if (!tp) {
        tp = target.addScript('qc.TweenPosition');
    }

    if (!target.die) {
        target.playAnimation('damage');
    }
    tp.from = new qc.Point(target.x, target.y);
    tp.to = new qc.Point(tp.from.x, tp.from.y - self.flyDistance);
    tp.duration = self.flyDuration;
    tp.resetToBeginning();
    tp.playForward();
    if (!target.die) {
        tp.onFinished.addOnce(function() {
            // 回到idle状态
            target.getScript('qc.demo.Fighter').resumeIdle();
        });
    }
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 痛苦女王的大招
 */
var QobBig = qc.defineBehaviour('qc.demo.QobBig', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'ult';

    // 精灵对象
    self.sprite = null;

    // 特效
    self.effect = null;
    self.effectTime = 1;

    // 大招的凸显时间
    self.duration = 0.8;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;

    // 命中特效
    self.hitEffect = null;

    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    effect: s.PREFAB,
    effectTime: s.NUMBER,
    duration: s.NUMBER,
    hitTime: s.NUMBER,
    hitEffect: s.PREFAB,
    audio: s.AUDIO
});
QobBig.__menu = 'Dota/痛苦女王/big';

// 初始时不可用
QobBig.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
QobBig.prototype.update = function() {
    var self = this;
    if (self.hadHit || !self.sprite || self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
QobBig.prototype.play = function(targets, damage) {
    var self = this;
    var fighter = self.sprite.getScript('qc.demo.Fighter');
    damage = damage || 2000;

    // 记录数据
    self.targets = targets;
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 延迟播放特效
    self.game.timer.add(self.effectTime * 1000, function() {
        var effect = self.game.add.clone(self.effect, self.gameObject.parent);
        effect.onFinished.addOnce(function() {
            effect.destroy();
        });
    });

    // 战场和其他参展者全部暂停动作一段时间
    window.combatUI.enableUlt(self.sprite, true);
    self.game.timer.add(self.duration * 1000, function() {
        window.combatUI.enableUlt(self.sprite, false);
    });

    // 播放音效
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;
};

// 命中的处理
QobBig.prototype.onHit = function() {
    var self = this;
    self.hadHit = true;
    self.enable = false;

    // 目标播放受创动作
    for (var i in self.targets) {
        var fighter = self.targets[i].getScript('qc.demo.Fighter');
        if (fighter.die) continue;
        fighter.receiveDamage(self.damage, self.hitEffect);
    }
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 白虎的大招
 */
var TigerBig = qc.defineBehaviour('qc.demo.TigerBig', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'ult';

    // 精灵对象
    self.sprite = null;

    // 大招的凸显时间
    self.duration = 0.8;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;

    // 命中特效
    self.hitEffect = null;

    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    duration: s.NUMBER,
    hitTime: s.NUMBER,
    hitEffect: s.PREFAB,
    audio: s.AUDIO
});
TigerBig.__menu = 'Dota/老虎/big';

// 初始时不可用
TigerBig.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
TigerBig.prototype.update = function() {
    var self = this;
    if (self.hadHit || !self.sprite || self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
TigerBig.prototype.play = function(targets, damage) {
    var self = this;
    var fighter = self.sprite.getScript('qc.demo.Fighter');
    damage = damage || 1200;

    // 记录数据
    self.targets = targets;
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 战场和其他参展者全部暂停动作一段时间
    window.combatUI.enableUlt(self.sprite, true);
    self.game.timer.add(self.duration * 1000, function() {
        window.combatUI.enableUlt(self.sprite, false);
    });

    // 播放音效
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;
};

// 命中的处理
TigerBig.prototype.onHit = function() {
    var self = this;
    self.hadHit = true;
    self.enable = false;

    // 目标播放受创动作
    for (var i in self.targets) {
        var fighter = self.targets[i].getScript('qc.demo.Fighter');
        if (fighter.die) continue;
        fighter.receiveDamage(self.damage, self.hitEffect);
    }
}

/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

var s = qc.Serializer;

/**
 * 宙斯的大招
 */
var ZeusBig = qc.defineBehaviour('qc.demo.ZeusBig', qc.Behaviour, function() {
    var self = this;

    // 攻击时播放的动作
    self.attackAni = 'ult';

    // 精灵对象
    self.sprite = null;

    // 大招的凸显时间
    self.duration = 0.8;

    // 从开始到命中的时间
    self.hitTime = 1.5;
    self._hitCountDown = 0;

    // 命中特效
    self.hitEffect = null;

    self.audio = null;

    // 在编辑器模式下需要运行
    self.runInEditor = true;
}, {
    // 需要序列化的字段
    attackAni: s.STRING,
    sprite: s.NODE,
    effect: s.PREFAB,
    duration: s.NUMBER,
    hitTime: s.NUMBER,
    hitEffect: s.PREFAB,
    audio: s.AUDIO
});
ZeusBig.__menu = 'Dota/宙斯/big';

// 初始时不可用
ZeusBig.prototype.awake = function() {
    this.enable = false;
}

// 帧调度，看是否命中了
ZeusBig.prototype.update = function() {
    var self = this;
    if (self.hadHit || !self.sprite || self.sprite.paused) return;
    self._hitCountDown -= self.game.time.deltaTime;
    if (self._hitCountDown <= 0) {
        // 命中的处理
        self.onHit();
    }
}

// 开始对目标（可能多个）进行攻击
ZeusBig.prototype.play = function(targets, damage) {
    var self = this;
    var fighter = self.sprite.getScript('qc.demo.Fighter');
    damage = damage || 1200;

    // 记录数据
    self.targets = targets;
    self.damage = damage;

    // 播放攻击动作
    self.enable = true;
    self.hadHit = false;
    self.sprite.playAnimation(self.attackAni);
    self.sprite.onFinished.addOnce(function() {
        // 攻击完毕，切换回默认动作
        self.sprite.getScript('qc.demo.Fighter').resumeIdle();
        self.sprite.getScript('qc.demo.Fighter').resetRound();
    });

    // 战场和其他参展者全部暂停动作一段时间
    window.combatUI.enableUlt(self.sprite, true);
    self.game.timer.add(self.duration * 1000, function() {
        window.combatUI.enableUlt(self.sprite, false);
    });

    // 播放音效
    if (self.audio) {
        var sound = self.game.add.sound();
        sound.audio = self.audio;
        sound.play();
    }

    // 计算命中的倒计时
    self._hitCountDown = self.hitTime * 1000;
};

// 命中的处理
ZeusBig.prototype.onHit = function() {
    var self = this;
    self.hadHit = true;
    self.enable = false;

    // 目标播放受创动作
    for (var i in self.targets) {
        var fighter = self.targets[i].getScript('qc.demo.Fighter');
        if (fighter.die) continue;
        fighter.receiveDamage(self.damage, self.hitEffect);
    }
}


}).call(this, this, Object);
