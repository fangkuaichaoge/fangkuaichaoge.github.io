class UiHelper {

    static fileInput = null;

    static openFile(callback) {
        if (UiHelper.fileInput === null) {
            let el = document.createElement("input");
            el.type = "file";
            el.style.display = "none";
            document.body.appendChild(el);
            console.log(el);
            UiHelper.fileInput = el;
        }
        UiHelper.fileInput.onchange = (ev) => {
            if (ev.target.files.length !== 1)
                return;
            callback(ev.target.files[0]);
        };
        UiHelper.fileInput.click();
    }

    static loadImage(url, cb) {
        let image = new Image();
        image.onload = () => {
            cb(image);
        };
        image.src = url;
    }

    static saveBlob(blob, name) {
        let url = URL.createObjectURL(blob);
        let link = document.createElement("a"); // Or maybe get it from the current document
        link.href = url;
        link.download = name;
        link.innerHTML = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 20000);
    }

    // https://stackoverflow.com/a/8472700
    static generateUUID =
        (typeof(window.crypto) != 'undefined' && typeof(window.crypto.getRandomValues) != 'undefined')
            ? () => {
                let buf = new Uint16Array(8);
                window.crypto.getRandomValues(buf);
                let pad4 = function(num) {
                    let ret = num.toString(16);
                    while (ret.length < 4)
                        ret = "0" + ret;
                    return ret;
                };
                return (pad4(buf[0])+pad4(buf[1])+"-"+pad4(buf[2])+"-"+pad4(buf[3])+"-"+pad4(buf[4])+"-"+pad4(buf[5])+pad4(buf[6])+pad4(buf[7]));
            }
            : () => {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
            };

    // https://stackoverflow.com/questions/5666222/3d-line-plane-intersection
    static linePlaneIntersection(planePoint, planeNormal, linePoint, lineDirection) {
        if (vec3.dot(planeNormal, lineDirection) === 0)
            return null;
        let t = (vec3.dot(planeNormal, planePoint) - vec3.dot(planeNormal, linePoint)) / vec3.dot(planeNormal, lineDirection);
        let ret = vec3.create();
        vec3.scale(ret, lineDirection, t);
        vec3.add(ret, linePoint, ret);
        return ret;
    }

}

class PropertyEditor {

    constructor() {
        this.container = document.getElementById("inspector");
    }

    clear() {
        let defaultActions = document.getElementById("inspectDefaultActions");
        // 完全清空容器
        this.container.innerHTML = '';
        // 重新添加 defaultActions
        this.container.appendChild(defaultActions);
        // 重置默认提示内容
        defaultActions.innerHTML = `
            <div class="prop-label" style="color: var(--mc-text-muted); font-size: 12px;">
                <i class="fas fa-info-circle"></i> 选择骨骼或组以编辑属性
            </div>
        `;
    }

    addVecF(name, initialValue, cb) {
        let li = document.createElement("li");
        li.classList.add("prop-row");
        
        let labelDom = document.createElement("span");
        labelDom.classList.add("prop-label");
        labelDom.textContent = name;
        li.appendChild(labelDom);
        
        let vecContainer = document.createElement("div");
        vecContainer.classList.add("prop-vec3");
        
        let value = [...initialValue];
        let tbs = [];
        let axisLabels = ['X', 'Y', 'Z'];
        
        for (let i = 0; i < initialValue.length; i++) {
            // 轴标签
            let axisLabel = document.createElement("span");
            axisLabel.classList.add("axis-label", axisLabels[i].toLowerCase());
            axisLabel.textContent = axisLabels[i];
            vecContainer.appendChild(axisLabel);
            
            let tb = document.createElement("input");
            tb.type = "number";
            tb.step = "0.1";
            tb.value = value[i].toFixed(1);
            tb.addEventListener("change", () => {
                value[i] = parseFloat(tb.value);
                cb([...value]);
            });
            vecContainer.appendChild(tb);
            tbs.push(tb);
        }
        li.appendChild(vecContainer);
        this.container.appendChild(li);
        
        return (v) => {
            for (let i = 0; i < tbs.length; i++) {
                value[i] = v[i];
                tbs[i].value = v[i].toFixed(1);
            }
        };
    }

    addDropDown(name, values, displayValues, defaultValue, cb) {
        let li = document.createElement("li");
        li.classList.add("prop-select");
        
        let labelDom = document.createElement("label");
        labelDom.textContent = name;
        li.appendChild(labelDom);
        
        let selectDom = document.createElement("select");
        for (let i = 0; i < values.length; i++) {
            let el = document.createElement("option");
            el.textContent = displayValues[i];
            el.value = values[i];
            selectDom.appendChild(el);
        }
        selectDom.value = defaultValue;
        selectDom.addEventListener("change", () => {
            cb(selectDom.value);
        });
        li.appendChild(selectDom);
        this.container.appendChild(li);
    }

}

class PrimaryCanvas {

    constructor() {
        this.canvas = document.getElementById("primaryCanvas");
        this.context = this.canvas.getContext("webgl");
        this.renderer = new Renderer(this.canvas, this.context);
        this.renderer.bgColor = [0x10 / 256, 0x1f / 256, 0x27 / 256, 1];
        this.renderer.draw();
        
        // 鼠标拖拽旋转
        this.canvas.addEventListener("mousemove", (ev) => {
            if (ev.buttons & 1)
                this.rotateByMouseDelta(ev.movementX, ev.movementY);
        });
        
        // 触摸手势支持
        this.setupTouchGestures();

        window.addEventListener('resize', () => this.draw(), false);
        this.drawCallbacks = [];
    }
    
    // 设置触摸手势
    setupTouchGestures() {
        let touchStartDistance = 0;
        let touchStartAngle = 0;
        let lastTouchX = 0;
        let lastTouchY = 0;
        let initialRotationX = 0;
        let initialRotationY = 0;
        
        this.canvas.addEventListener("touchstart", (ev) => {
            if (ev.touches.length === 1) {
                // 单指：准备旋转
                lastTouchX = ev.touches[0].clientX;
                lastTouchY = ev.touches[0].clientY;
            } else if (ev.touches.length === 2) {
                // 双指：准备缩放/旋转
                ev.preventDefault();
                const dx = ev.touches[0].clientX - ev.touches[1].clientX;
                const dy = ev.touches[0].clientY - ev.touches[1].clientY;
                touchStartDistance = Math.sqrt(dx * dx + dy * dy);
                touchStartAngle = Math.atan2(dy, dx);
                initialRotationX = this.renderer.rotationX;
                initialRotationY = this.renderer.rotationY;
            }
        }, { passive: false });
        
        this.canvas.addEventListener("touchmove", (ev) => {
            if (ev.touches.length === 1) {
                // 单指：旋转模型
                const touchX = ev.touches[0].clientX;
                const touchY = ev.touches[0].clientY;
                const dx = touchX - lastTouchX;
                const dy = touchY - lastTouchY;
                this.rotateByMouseDelta(dx, dy);
                lastTouchX = touchX;
                lastTouchY = touchY;
            } else if (ev.touches.length === 2) {
                // 双指：缩放和旋转
                ev.preventDefault();
                const dx = ev.touches[0].clientX - ev.touches[1].clientX;
                const dy = ev.touches[0].clientY - ev.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                // 角度变化用于旋转
                const angleDelta = angle - touchStartAngle;
                this.renderer.rotationX = initialRotationX + angleDelta * 0.5;
                
                // 距离变化可用于缩放（这里通过调整视角距离模拟）
                // 由于原渲染器没有缩放功能，这里用Y轴旋转替代
                const distanceDelta = (distance - touchStartDistance) * 0.002;
                this.renderer.rotationY = initialRotationY - distanceDelta;
                
                this.draw();
            }
        }, { passive: false });
        
        this.canvas.addEventListener("touchend", (ev) => {
            // 触摸结束，重置状态
            if (ev.touches.length < 2) {
                touchStartDistance = 0;
            }
        });
    }

    setModel(model) {
        this.renderer.setModel(model);
        this.draw();
    }

    setTexture(image) {
        this.renderer.setTexture(image);
        this.draw();
    }

    setSelectedGroup(group) {
        if (group !== null) {
            this.renderer.highlightedVertexStart = group.vertexStart;
            this.renderer.highlightedVertexEnd = group.vertexEnd;
        } else {
            this.renderer.highlightedVertexStart = -1;
            this.renderer.highlightedVertexEnd = -1;
        }
        this.draw();
    }

    rotateByMouseDelta(dx, dy) {
        this.renderer.rotationX += dx * 0.01;
        this.renderer.rotationY += dy * 0.01;
        this.draw();
    }

    draw() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height  = this.canvas.offsetHeight;

        this.renderer.draw();
        for (let cb of this.drawCallbacks)
            cb();
    }

}

class Point3DMover {

    constructor(primaryCanvas) {
        this.container = document.getElementById("point3DMover");
        this.axisX = document.getElementById("point3DMoverX");
        this.axisY = document.getElementById("point3DMoverY");
        this.axisZ = document.getElementById("point3DMoverZ");
        this.primaryCanvas = primaryCanvas;
        this.relativeTo = this.primaryCanvas.canvas;
        this.point = null;
        this.callback = null;
        this.primaryCanvas.drawCallbacks.push(() => this.setPoint(this.point, this.callback));
        this.setupAxis(this.axisX, 0);
        this.setupAxis(this.axisY, 1);
        this.setupAxis(this.axisZ, 2);
    }

    setupAxis(dom, axisNo) {
        let findWorldPosition = (x, y) => {
            let sp = this.primaryCanvas.renderer.sceneToScreen(this.point);
            let spb1 = this.primaryCanvas.renderer.screenToScene([sp[0], sp[1], -1]);
            let spb2 = this.primaryCanvas.renderer.screenToScene([sp[0], sp[1], 1]);
            vec4.sub(spb2, spb2, spb1);
            vec4.normalize(spb2, spb2);

            let p1 = this.primaryCanvas.renderer.screenToScene([x, y, -1]);
            let p2 = this.primaryCanvas.renderer.screenToScene([x, y, 1]);
            vec4.sub(p2, p2, p1);
            vec4.normalize(p2, p2);
            return UiHelper.linePlaneIntersection(this.point, spb2, p1, p2);
        };
        let offset = [0, 0, 0];
        let capturedPointerId = -1;
        dom.addEventListener("pointerdown", (ev) => {
            capturedPointerId = ev.pointerId;
            dom.setPointerCapture(ev.pointerId);

            let x = ev.pageX - this.relativeTo.offsetLeft;
            let y = ev.pageY - this.relativeTo.offsetTop;
            offset = findWorldPosition(x, y);
            vec3.sub(offset, offset, this.point);
        });
        dom.addEventListener("pointermove", (ev) => {
            if (this.callback !== null && ev.pointerId === capturedPointerId) {
                let x = ev.pageX - this.relativeTo.offsetLeft;
                let y = ev.pageY - this.relativeTo.offsetTop;
                let p = findWorldPosition(x, y);
                vec3.sub(p, p, offset);
                this.point[axisNo] = p[axisNo];

                this.callback(this.point);
                this.setPoint(this.point, this.callback);
            }
        });
        dom.addEventListener("pointerup", (ev) => {
            capturedPointerId = -1;
            dom.releasePointerCapture(ev.pointerId);
        });
    }

    setAxis(dom, sp, spDir, depth) {
        let diff = vec2.create();
        vec2.sub(diff, spDir, sp);
        let angle = Math.atan2(diff[1], diff[0]);
        dom.style.transform = "rotate(" + (angle / Math.PI * 180) + "deg)";
        dom.style.width = vec2.length(diff) + "px";
        dom.style.zIndex = depth + 100;
    }

    setPoint(p, cb) {
        this.point = p;
        this.callback = cb;
        if (p === null)
            return;
        let sp = this.primaryCanvas.renderer.sceneToScreen(p);
        let spX = this.primaryCanvas.renderer.sceneToScreen([p[0] + 3, p[1], p[2]]);
        let spY = this.primaryCanvas.renderer.sceneToScreen([p[0], p[1] + 3, p[2]]);
        let spZ = this.primaryCanvas.renderer.sceneToScreen([p[0], p[1], p[2] + 3]);
        let depthTmp = [[spX[2], 0], [spY[2], 1], [spZ[2], 2]];
        depthTmp.sort();
        let depth = [0, 1, 2];
        for (let i = 0; i < 3; i++)
            depth[depthTmp[i][1]] = 2 - i;

        this.setAxis(this.axisX, sp, spX, depth[0]);
        this.setAxis(this.axisY, sp, spY, depth[1]);
        this.setAxis(this.axisZ, sp, spZ, depth[2]);

        sp[0] += this.relativeTo.offsetLeft;
        sp[1] += this.relativeTo.offsetTop;
        this.container.style.left = sp[0] + "px";
        this.container.style.top = sp[1] + "px";
    }

}

class GroupList {

    static TYPE_BONE = "bone";
    static TYPE_GROUP = "group";

    constructor(selectCallback) {
        this.container = document.getElementById("groupTree");
        this.selectCallback = selectCallback;
        this.selectionType = null;
        this.selection = null;
        this.selectionMap = {};
        this.selectionMap[GroupList.TYPE_BONE] = new Map();
        this.selectionMap[GroupList.TYPE_GROUP] = new Map();
        this.selectedElement = null;
        this.propertyEditorContainer = null;
        this.skin = null;
    }

    setSkin(skin) {
        this.skin = skin;
    }

    setObjects(objects, bones) {
        // 保存当前选中状态
        const savedType = this.selectionType;
        const savedObject = this.selection;

        // Clear old groups
        while (this.container.firstChild)
            this.container.removeChild(this.container.lastChild);
        this.selectedElement = null;
        if (this.propertyEditorContainer) {
            this.propertyEditorContainer.remove();
            this.propertyEditorContainer = null;
        }

        this.selectionMap[GroupList.TYPE_BONE].clear();
        this.selectionMap[GroupList.TYPE_GROUP].clear();

        // 按原始顺序创建骨骼列表
        for (let bone of bones) {
            let rel = this.createElementDOM(GroupList.TYPE_BONE, bone, bone.name, 0);
            this.selectionMap[GroupList.TYPE_BONE].set(bone, rel);
            this.container.appendChild(rel);

            // 添加该骨骼的组
            for (let groupIdx of bone.groups) {
                let group = objects[groupIdx[0]].groups[groupIdx[1]];
                let el = this.createElementDOM(GroupList.TYPE_GROUP, group, group.displayName, 1);
                this.selectionMap[GroupList.TYPE_GROUP].set(group, el);
                el.style.paddingLeft = "20px";
                this.container.appendChild(el);
            }
        }

        // 恢复选中状态
        this.setSelection(savedType, savedObject, false);

        // 刷新删除按钮状态
        this.updateDeleteButton();
    }

    setSelection(type, object, skipPropertyEditor = false) {
        console.log('setSelection', { type, object, skipPropertyEditor });

        // 先移除旧的属性编辑器
        if (this.propertyEditorContainer) {
            this.propertyEditorContainer.remove();
            this.propertyEditorContainer = null;
        }

        // 移除旧的选中状态
        if (this.selectedElement !== null) {
            this.selectedElement.classList.remove("selected");
        }

        this.selectionType = type;
        this.selection = object;

        // 获取选中的 DOM 元素
        if (type && object) {
            this.selectedElement = this.selectionMap[type] ? this.selectionMap[type].get(object) : null;
        } else {
            this.selectedElement = null;
        }

        if (this.selectedElement === undefined)
            this.selectedElement = null;
        if (this.selectedElement !== null) {
            this.selectedElement.classList.add("selected");
        }

        // 调用回调
        if (this.selectCallback) {
            this.selectCallback(type, object);
        }

        // 更新删除按钮显示状态
        this.updateDeleteButton();
        
        // 创建属性编辑器
        if (!skipPropertyEditor && type && object) {
            this.insertPropertyEditor(type, object);
        }
    }

    updateDeleteButton() {
        const deleteBtn = document.getElementById("deleteBone");
        if (!deleteBtn) return;

        // 只有选中骨骼时才显示删除按钮
        if (this.selectionType === GroupList.TYPE_BONE && this.selection) {
            deleteBtn.style.display = "flex";
        } else {
            deleteBtn.style.display = "none";
        }
    }

    insertPropertyEditor(type, object) {
        console.log('insertPropertyEditor', { type, object });

        // 先删除旧的属性编辑器
        if (this.propertyEditorContainer) {
            this.propertyEditorContainer.remove();
            this.propertyEditorContainer = null;
        }

        if (!this.skin) {
            console.log('no skin');
            return;
        }

        if (!type || !object) {
            console.log('no type or object');
            return;
        }

        const editorLi = document.createElement("li");
        editorLi.style.cssText = `padding:0;margin:0;background-color:var(--mc-bg-panel-light);border:2px solid var(--mc-border);border-top:none;border-bottom-width:4px;`;

        const editorDiv = document.createElement("div");
        editorDiv.style.cssText = `padding:12px;display:flex;flex-direction:column;gap:10px;`;

        // 骨骼 - 显示 Pivot、Rotation、Parent
        if (type === GroupList.TYPE_BONE && object.pivot) {
            console.log('TYPE_BONE', object);

            // Pivot
            const pivotRow = this.createPivotInput(object.pivot, (val) => {
                object.pivot = val;
                this.skin.postSaveProperties();
            });
            editorDiv.appendChild(pivotRow);

            // Rotation
            const rotationRow = this.createRotationInput(object.rotation, (val) => {
                if (val[0] === 0 && val[1] === 0 && val[2] === 0) {
                    delete object.rotation;
                } else {
                    object.rotation = val;
                }
                this.skin.postSaveProperties();
            });
            editorDiv.appendChild(rotationRow);

            // Parent
            const parentRow = this.createParentSelect(object, (newParent) => {
                if (newParent === "") {
                    delete object.parent;
                } else {
                    object.parent = newParent;
                }
                this.skin.postSaveProperties();
                this.setObjects(this.skin.model.objects, this.skin.bones);
            });
            editorDiv.appendChild(parentRow);
        }
        // 组/物体 - 显示 Bone 选择器
        else if (type === GroupList.TYPE_GROUP) {
            console.log('TYPE_GROUP', object);
            
            if (object.bone && this.skin.bones.length > 0) {
                const boneRow = this.createBoneSelect(object.bone, (newBone) => {
                    const idx = object.bone.groups.indexOf(object.indexTab);
                    if (idx >= 0) object.bone.groups.splice(idx, 1);
                    object.bone = newBone;
                    newBone.groups.push(object.indexTab);
                    this.setObjects(this.skin.model.objects, this.skin.bones);
                    this.skin.saveBonesToLS();
                });
                editorDiv.appendChild(boneRow);
            } else {
                const tipDiv = document.createElement("div");
                tipDiv.style.cssText = `padding:10px;text-align:center;color:var(--mc-text-muted);font-size:12px;`;
                tipDiv.textContent = "该组未关联骨骼";
                editorDiv.appendChild(tipDiv);
            }
        }

        editorLi.appendChild(editorDiv);

        if (this.selectedElement && this.selectedElement.parentNode) {
            this.container.insertBefore(editorLi, this.selectedElement.nextSibling);
        } else {
            this.container.appendChild(editorLi);
        }

        this.propertyEditorContainer = editorLi;
        console.log('property editor created');
    }

    // 创建 Pivot 输入器
    createPivotInput(pivot, onChange) {
        const row = document.createElement("div");
        row.className = "prop-row";
        row.style.cssText = `display:flex;flex-direction:column;align-items:center;padding:10px 12px;background-color:var(--mc-bg-button);border:2px solid var(--mc-border);border-bottom-width:4px;margin-bottom:10px;gap:8px;width:100%;`;

        const label = document.createElement("span");
        label.className = "prop-label";
        label.textContent = "Pivot";
        label.style.cssText = `font-size:12px;font-weight:600;color:var(--mc-gray-light);`;
        row.appendChild(label);

        const inputs = document.createElement("div");
        inputs.className = "prop-vec3";
        inputs.style.cssText = `display:flex;align-items:center;justify-content:center;gap:3px;`;

        const axes = [
            { name: 'X', color: '#ff6666' },
            { name: 'Y', color: '#66ff66' },
            { name: 'Z', color: '#6666ff' }
        ];

        axes.forEach((axis, i) => {
            const axisLabel = document.createElement("span");
            axisLabel.className = "axis-label " + axis.name.toLowerCase();
            axisLabel.textContent = axis.name;
            axisLabel.style.cssText = `font-size:10px;color:${axis.color};width:10px;text-align:center;font-weight:700;flex-shrink:0;`;
            inputs.appendChild(axisLabel);

            const input = document.createElement("input");
            input.type = "number";
            input.step = "0.1";
            input.value = (pivot[i] || 0).toFixed(1);
            input.style.cssText = `width:38px;min-width:38px;padding:3px 2px;background:var(--mc-bg-panel);border:2px solid var(--mc-border);color:var(--mc-gray-light);font-size:11px;text-align:center;border-radius:0;`;
            input.addEventListener("change", () => {
                pivot[i] = parseFloat(input.value) || 0;
                onChange([...pivot]);
            });
            inputs.appendChild(input);
        });

        row.appendChild(inputs);
        return row;
    }

    // 创建 Rotation 输入器
    createRotationInput(rotation, onChange) {
        const row = document.createElement("div");
        row.className = "prop-row";
        row.style.cssText = `display:flex;flex-direction:column;align-items:center;padding:10px 12px;background-color:var(--mc-bg-button);border:2px solid var(--mc-border);border-bottom-width:4px;margin-bottom:10px;gap:8px;width:100%;`;

        const label = document.createElement("span");
        label.className = "prop-label";
        label.textContent = "Rotation";
        label.style.cssText = `font-size:12px;font-weight:600;color:var(--mc-gray-light);`;
        row.appendChild(label);

        const inputs = document.createElement("div");
        inputs.className = "prop-vec3";
        inputs.style.cssText = `display:flex;align-items:center;justify-content:center;gap:3px;`;

        const rot = rotation || [0, 0, 0];
        const axes = [
            { name: 'X', color: '#ff6666' },
            { name: 'Y', color: '#66ff66' },
            { name: 'Z', color: '#6666ff' }
        ];

        axes.forEach((axis, i) => {
            const axisLabel = document.createElement("span");
            axisLabel.className = "axis-label " + axis.name.toLowerCase();
            axisLabel.textContent = axis.name;
            axisLabel.style.cssText = `font-size:10px;color:${axis.color};width:10px;text-align:center;font-weight:700;flex-shrink:0;`;
            inputs.appendChild(axisLabel);

            const input = document.createElement("input");
            input.type = "number";
            input.step = "1";
            // 显示时取相反数
            input.value = rot[i] !== 0 ? (-rot[i]).toFixed(0) : "0";
            input.style.cssText = `width:38px;min-width:38px;padding:3px 2px;background:var(--mc-bg-panel);border:2px solid var(--mc-border);color:var(--mc-gray-light);font-size:11px;text-align:center;border-radius:0;`;
            input.addEventListener("change", () => {
                const val = parseFloat(input.value) || 0;
                rot[i] = -val;  // 存储时取相反数
                onChange([...rot]);
            });
            inputs.appendChild(input);
        });

        row.appendChild(inputs);
        return row;
    }

    // 创建 Parent 选择器
    createParentSelect(bone, onChange) {
        const row = document.createElement("div");
        row.className = "prop-select";
        row.style.cssText = `display:flex;flex-direction:column;align-items:center;padding:10px 12px;background-color:var(--mc-bg-button);border:2px solid var(--mc-border);border-bottom-width:4px;margin-bottom:10px;gap:6px;width:100%;`;

        const label = document.createElement("label");
        label.textContent = "Parent";
        label.style.cssText = `font-size:12px;font-weight:600;color:var(--mc-gray-light);`;
        row.appendChild(label);

        const select = document.createElement("select");
        select.style.cssText = `width:150px;min-width:150px;padding:6px 8px;background:var(--mc-bg-panel);border:2px solid var(--mc-border);color:var(--mc-gray-light);font-size:12px;cursor:pointer;border-radius:0;`;

        // "无"选项
        const noneOpt = document.createElement("option");
        noneOpt.textContent = "无 (根骨骼)";
        noneOpt.value = "";
        select.appendChild(noneOpt);

        // 所有其他骨骼
        this.skin.bones.forEach(b => {
            if (b !== bone) {
                const opt = document.createElement("option");
                opt.textContent = b.name;
                opt.value = b.name;
                select.appendChild(opt);
            }
        });

        if (bone.parent) {
            select.value = bone.parent;
        }

        select.addEventListener("change", () => {
            onChange(select.value);
        });

        row.appendChild(select);
        return row;
    }

    // 创建 Bone 选择器
    createBoneSelect(currentBone, onChange) {
        const row = document.createElement("div");
        row.className = "prop-select";
        row.style.cssText = `display:flex;flex-direction:column;align-items:center;padding:10px 12px;background-color:var(--mc-bg-button);border:2px solid var(--mc-border);border-bottom-width:4px;margin-bottom:10px;gap:6px;width:100%;`;

        const label = document.createElement("label");
        label.textContent = "Bone";
        label.style.cssText = `font-size:12px;font-weight:600;color:var(--mc-gray-light);`;
        row.appendChild(label);

        const select = document.createElement("select");
        select.style.cssText = `width:150px;min-width:150px;padding:6px 8px;background:var(--mc-bg-panel);border:2px solid var(--mc-border);color:var(--mc-gray-light);font-size:12px;cursor:pointer;border-radius:0;`;

        this.skin.bones.forEach(b => {
            const opt = document.createElement("option");
            opt.textContent = b.name;
            opt.value = b.name;
            select.appendChild(opt);
        });

        select.value = currentBone.name;
        select.addEventListener("change", () => {
            const newBone = this.skin.bones.find(b => b.name === select.value);
            if (newBone) onChange(newBone);
        });

        row.appendChild(select);
        return row;
    }

    createElementDOM(type, object, name, level = 0) {
        let e = document.createElement("li");
        
        // 根据类型设置图标
        let icon = document.createElement("i");
        icon.style.cssText = `
            margin-right: 8px;
            color: var(--mc-green);
            font-size: 12px;
            width: 14px;
            text-align: center;
        `;
        
        if (type === GroupList.TYPE_BONE) {
            // 骨骼使用骨头图标
            icon.className = "fas fa-bone";
        } else if (type === GroupList.TYPE_GROUP) {
            // 组/物体使用立方体图标
            icon.className = "fas fa-cube";
        }
        
        e.appendChild(icon);
        
        let text = document.createElement("span");
        text.classList.add("bone-name");
        text.textContent = name;
        
        // 如果有层级，添加缩进和连接线
        if (level > 0) {
            text.style.paddingLeft = (level * 16) + "px";
            text.style.position = "relative";
            // 添加连接线
            text.style.borderLeft = "1px dashed var(--mc-text-muted)";
            text.style.marginLeft = "4px";
        }
        
        e.addEventListener("click", () => {
            if (this.selectedElement !== e)
                this.setSelection(type, object, false);  // 创建属性编辑器
            else
                this.setSelection(null, null, true);  // 不创建
        });
        e.appendChild(text);
        return e;
    }

}

class Skin {

    constructor(index) {
        this.index = index;
        this.image = null;
        this.imageUrl = null;
        this.model = null;
        this.modelStr = null;
        this.bones = [];
        this.updateCb = new Set();
        this.savePropertiesRequested = false;
    }

    loadFromLS() {
        this.setImage(localStorage.getItem("skin." + this.index + ".image"));
        this.modelStr = localStorage.getItem("skin." + this.index + ".model");
        this.model = this.modelStr ? ObjModel.parse(this.modelStr) : null;
        this.bones = JSON.parse(localStorage.getItem("skin." + this.index + ".bones"));
        if (this.bones === null)
            this.resetBones();
        this.assignBoneInfoToGroups();
        this.onUpdated();
    }

    setImage(url) {
        this.imageUrl = url;
        if (url == null) {
            this.image = null;
            return;
        }
        UiHelper.loadImage(url, (img) => {
            if (this.imageUrl !== url)
                return;
            this.image = img;
            this.onUpdated();
        });
    }

    setModel(model) {
        this.modelStr = model;
        this.model = ObjModel.parse(model);
        this.resetBones();
        this.assignBoneInfoToGroups();
    }

    resetBones() {
        this.bones = SharedData.createDefaultBones();
        for (let b of this.bones)
            b.groups = [];
        if (this.model !== null) {
            let mainBone = this.bones[1];
            for (let i = 0; i < this.model.objects.length; i++) {
                let object = this.model.objects[i];
                for (let j = 0; j < object.groups.length; j++)
                    mainBone.groups.push([i, j]);
            }
        }
    }

    assignBoneInfoToGroups() {
        for (let i = 0; i < this.model.objects.length; i++) {
            let o = this.model.objects[i];
            o.index = i;
            for (let j = 0; j < o.groups.length; j++) {
                o.groups[j].object = o;
                o.groups[j].index = j;
            }
        }
        for (let b of this.bones) {
            for (let gRef of b.groups) {
                let group = this.model.objects[gRef[0]].groups[gRef[1]];
                group.bone = b;
                group.indexTab = gRef;
            }
        }
    }

    deleteFromLS() {
        localStorage.removeItem("skin." + this.index + ".image");
        localStorage.removeItem("skin." + this.index + ".model");
        localStorage.removeItem("skin." + this.index + ".bones");
    }

    saveImageToLS() {
        if (this.imageUrl !== null)
            localStorage.setItem("skin." + this.index + ".image", this.imageUrl);
    }

    saveModelToLS() {
        if (this.modelStr !== null)
            localStorage.setItem("skin." + this.index + ".model", this.modelStr);
    }

    saveBonesToLS() {
        localStorage.setItem("skin." + this.index + ".bones", JSON.stringify(this.bones));
    }

    postSaveProperties() {
        if (this.savePropertiesRequested)
            return;
        this.savePropertiesRequested = true;
        setTimeout(() => {
            this.saveBonesToLS();
            this.savePropertiesRequested = false;
        }, 1000);
    }

    exportGeometry() {
        if (this.image === null || this.model === null)
            return null;
        let bones = [];
        for (let b of this.bones) {
            let bCopy = Object.assign({}, b);
            delete bCopy["groups"];
            let indices = [];
            for (let gidx of b.groups) {
                let g = this.model.objects[gidx[0]].groups[gidx[1]];
                this.model.getMinecraftIndices(indices, g.start, g.end);
            }
            let mesh = this.model.exportPolyMesh(indices);
            if (mesh !== null)
                bCopy["poly_mesh"] = mesh;
            if (bCopy.hasOwnProperty("pivot"))
                bCopy["pivot"] = [-b.pivot[0], b.pivot[1], b.pivot[2]];
            // 导出 rotation 时取相反数
            if (bCopy.hasOwnProperty("rotation"))
                bCopy["rotation"] = [-b.rotation[0], -b.rotation[1], -b.rotation[2]];
            bones.push(bCopy);
        }
        return {
            "bones": bones,
            "texturewidth": this.image.width,
            "textureheight": this.image.height
        };
    }

    onUpdated() {
        for (let cb of this.updateCb)
            cb(this);
    }

}

class SkinListUi {

    constructor(activeCallback, deleteCallback) {
        this.skinList = [];
        this.skinDomList = [];
        this.selectedSkinDom = null;
        this.container = document.getElementById("skins");
        this.renderCanvas = document.createElement("canvas");
        this.renderCanvas.style.display = "none";
        this.renderCanvas.width = 64;
        this.renderCanvas.height = 64;
        this.renderContext = this.renderCanvas.getContext("webgl", {preserveDrawingBuffer: true});
        this.renderer = new Renderer(this.renderCanvas, this.renderContext);
        this.renderer.bgColor = [0, 0, 0, 0];
        this.skinUpdateCb = (skin) => this.redrawSkin(skin);
        this.activeCallback = activeCallback;
        this.deleteCallback = deleteCallback;
    }

    setSkinList(skinList) {
        let exportBtn = document.getElementById("export");
        let addSkinBtn = document.getElementById("addSkin");
        while (this.container.firstChild)
            this.container.removeChild(this.container.lastChild);
        for (let skin of this.skinList)
            skin.updateCb.delete(this.skinUpdateCb);
        this.skinList = skinList;
        this.skinDomList = [];
        this.selectedSkinDom = null;
        for (let skin of skinList) {
            let dom = this.createEntryDOM(skin);
            this.skinDomList.push(dom);
            this.container.appendChild(dom);
            skin.updateCb.add(this.skinUpdateCb);
        }
        this.container.appendChild(addSkinBtn);
        this.container.appendChild(exportBtn);
        for (let skin of skinList)
            this.redrawSkin(skin);
    }

    redrawSkin(skin) {
        if (skin.index >= this.skinList.length || this.skinList[skin.index] !== skin)
            return;
        this.renderer.setModel(skin.model);
        this.renderer.setTexture(skin.image);
        this.renderer.draw();
        this.skinDomList[skin.index].img.src = this.renderCanvas.toDataURL();
    }

    setSelected(skin) {
        if (skin.index >= this.skinList.length || this.skinList[skin.index] !== skin)
            skin = null;
        if (this.selectedSkinDom !== null)
            this.selectedSkinDom.classList.remove("selected");
        this.selectedSkinDom = skin ? this.skinDomList[skin.index] : null;
        if (this.selectedSkinDom !== null)
            this.selectedSkinDom.classList.add("selected");
    }

    createEntryDOM(skin) {
        let el = document.createElement("li");
        el.classList.add("skin");
        
        // 缩略图
        el.img = document.createElement("img");
        el.appendChild(el.img);
        
        // 皮肤信息
        let infoDiv = document.createElement("div");
        infoDiv.classList.add("skin-info");
        
        let nameSpan = document.createElement("span");
        nameSpan.classList.add("skin-name-text");
        nameSpan.textContent = "皮肤 #" + skin.index;
        infoDiv.appendChild(nameSpan);
        
        // 状态标志
        let flagsDiv = document.createElement("div");
        flagsDiv.classList.add("skin-flags");
        
        let modelFlag = document.createElement("span");
        modelFlag.classList.add("skin-flag");
        modelFlag.textContent = "模型";
        if (skin.model !== null) {
            modelFlag.classList.add("active");
        }
        flagsDiv.appendChild(modelFlag);
        
        let textureFlag = document.createElement("span");
        textureFlag.classList.add("skin-flag");
        textureFlag.textContent = "纹理";
        if (skin.image !== null) {
            textureFlag.classList.add("active");
        }
        flagsDiv.appendChild(textureFlag);
        
        infoDiv.appendChild(flagsDiv);
        el.appendChild(infoDiv);
        
        // 删除按钮
        let deleteBtn = document.createElement("div");
        deleteBtn.classList.add("skin-delete-btn");
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this.deleteCallback) {
                this.deleteCallback(skin);
            }
        });
        el.appendChild(deleteBtn);
        
        // 点击选择皮肤
        el.addEventListener("click", () => {
            this.activeCallback(skin);
        });
        
        return el;
    }

}

class PropertyManager {

    constructor(editor, pointMover) {
        this.editor = editor;
        this.skin = null;
        this.selectionType = null;
        this.selection = null;
        this.boneChangeCallback = null;
        this.pointMover = pointMover;
    }

    setSkin(skin) {
        this.skin = skin;
    }

    setSelection(type, what) {
        this.selectionType = type;
        this.selection = what;
    }

    update() {
        this.editor.clear();
        if (this.selectionType === GroupList.TYPE_BONE) {
            this.createBoneProperties(this.selection);
        } else if (this.selectionType === GroupList.TYPE_GROUP) {
            this.createBoneProperties(this.selection.bone);
            this.createGroupProperties(this.selection);
        } else {
            // 没有选择时显示提示
            this.editor.clear();
        }
    }

    createSkinProperties(skin) {
        // 皮肤级别属性（暂不使用）
    }

    createBoneProperties(bone) {
        if (!bone || !this.skin) return;
        let updatePoint = null;
        let updateVecF = this.editor.addVecF("Pivot", bone.pivot, (val) => {
            bone.pivot = val;
            if (updatePoint !== null)
                updatePoint();
            this.skin.postSaveProperties();
        });
        updatePoint = () => this.pointMover.setPoint(bone.pivot, (p) => {
            bone.pivot = p;
            updateVecF(p);
            this.skin.postSaveProperties();
        });
        updatePoint();
    }

    createGroupProperties(group) {
        let boneNames = [];
        for (let bone of this.skin.bones)
            boneNames.push(bone.name);
        this.editor.addDropDown("Bone", boneNames, boneNames, group.bone.name, (newBoneName) => {
            let newBone = null;
            for (let bone of this.skin.bones) {
                if (bone.name === newBoneName) {
                    newBone = bone;
                    break;
                }
            }

            let iof = group.bone.groups.indexOf(group.indexTab);
            if (newBone === null || iof === -1 || newBone === group.bone)
                return;
            group.bone.groups.splice(iof, 1);
            group.bone = newBone;
            newBone.groups.push(group.indexTab);
            this.boneChangeCallback();
        });
    }

}

class UiManager {

    constructor() {
        this.skins = [];
        this.activeSkin = null;
        this.primaryCanvas = new PrimaryCanvas();
        this.skinListUi = new SkinListUi(
            (skin) => this.setSkin(skin),
            (skin) => this.deleteSkin(skin)
        );
        this.propEditor = new PropertyEditor();
        this.pointMover = new Point3DMover(this.primaryCanvas);
        this.propManager = new PropertyManager(this.propEditor, this.pointMover);
        this.groupList = new GroupList((type, g) => {
            // 原始回调 - 只做基本操作
            if (type === GroupList.TYPE_GROUP)
                this.primaryCanvas.setSelectedGroup(g);
            else
                this.primaryCanvas.setSelectedGroup(null);

            this.propManager.setSelection(type, g);
            this.propManager.update();
        });
        this.propManager.boneChangeCallback = () => {
            this.groupList.setObjects(this.activeSkin.model.objects, this.activeSkin.bones);
            this.activeSkin.saveBonesToLS();
        };
        this.defaultImage = null;

        UiHelper.loadImage("steve.png", (img) => this.setDefaultImage(img));

        document.getElementById("uploadModel").addEventListener("click", () => {
            UiHelper.openFile((file) => {
                let reader = new FileReader();
                reader.addEventListener("loadend", () => {
                    if (reader.readyState === FileReader.DONE && this.activeSkin !== null) {
                        this.activeSkin.setModel(reader.result);
                        this.activeSkin.saveModelToLS();
                        // 重新设置模型和纹理，确保显示正确
                        this.activeSkin.assignBoneInfoToGroups();
                        // 先设置模型，再设置纹理
                        if (this.activeSkin.image !== null) {
                            this.primaryCanvas.setTexture(this.activeSkin.image);
                        } else if (this.defaultImage !== null) {
                            this.primaryCanvas.setTexture(this.defaultImage);
                        }
                        this.primaryCanvas.setModel(this.activeSkin.model);
                        this.groupList.setObjects(this.activeSkin.model.objects, this.activeSkin.bones);
                        this.propManager.update();
                    }
                });
                reader.readAsText(file);
            });
        });
        document.getElementById("uploadTexture").addEventListener("click", () => {
            UiHelper.openFile((file) => {
                let reader = new FileReader();
                reader.addEventListener("loadend", () => {
                    if (reader.readyState === FileReader.DONE && this.activeSkin !== null) {
                        this.activeSkin.setImage(reader.result);
                        this.activeSkin.saveImageToLS();
                        // 刷新画布显示新纹理
                        this.primaryCanvas.setTexture(this.activeSkin.image);
                    }
                });
                reader.readAsDataURL(file);
            });
        });

        document.getElementById("addSkin").addEventListener("click",
            () => this.setSkin(this.addSkin()));
        document.getElementById("export").addEventListener("click",
            () => this.export());

        // 几何层级操作按钮
        document.getElementById("addBoneFromGeo").addEventListener("click",
            () => this.addBone());
        document.getElementById("deleteBone").addEventListener("click",
            () => this.deleteSelectedBone());
        
        // 初始化时隐藏删除按钮
        const deleteBtn = document.getElementById("deleteBone");
        if (deleteBtn) deleteBtn.style.display = "none";

        // 初始化移动端UI
        this.initMobileUI();

        this.loadCurrentSkins((skins) => this.setSkins(skins));
    }
    
    // 初始化移动端UI组件
    initMobileUI() {
        // 检测是否为移动设备
        const isMobile = window.innerWidth <= 600;
        
        if (isMobile) {
            // 创建移动端导航栏
            this.createMobileNav();
            // 创建遮罩层
            this.createMobileOverlay();
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 600 && !this.mobileNavCreated) {
                this.createMobileNav();
                this.createMobileOverlay();
            }
        });
    }
    
    // 创建移动端底部导航栏
    createMobileNav() {
        if (this.mobileNavCreated) return;
        
        // 创建导航栏元素
        const nav = document.createElement('nav');
        nav.className = 'mobile-nav';
        nav.innerHTML = `
            <div class="mobile-nav-item" data-panel="skins">
                <i class="fas fa-list"></i>
                <span>皮肤</span>
            </div>
            <div class="mobile-nav-item active" data-panel="canvas">
                <i class="fas fa-cube"></i>
                <span>模型</span>
            </div>
            <div class="mobile-nav-item" data-panel="properties">
                <i class="fas fa-cog"></i>
                <span>属性</span>
            </div>
            <div class="mobile-nav-item" data-action="upload-model">
                <i class="fas fa-upload"></i>
                <span>模型</span>
            </div>
            <div class="mobile-nav-item" data-action="upload-texture">
                <i class="fas fa-image"></i>
                <span>纹理</span>
            </div>
        `;
        
        document.body.appendChild(nav);
        
        // 绑定导航项点击事件
        nav.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const panel = item.dataset.panel;
                const action = item.dataset.action;
                
                // 处理动作按钮
                if (action === 'upload-model') {
                    document.getElementById('uploadModel').click();
                    return;
                }
                if (action === 'upload-texture') {
                    document.getElementById('uploadTexture').click();
                    return;
                }
                
                // 切换面板显示
                this.toggleMobilePanel(panel);
                
                // 更新激活状态
                nav.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        this.mobileNav = nav;
        this.mobileNavCreated = true;
    }
    
    // 创建遮罩层
    createMobileOverlay() {
        if (this.mobileOverlay) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        overlay.addEventListener('click', () => {
            this.closeAllMobilePanels();
            this.mobileNav.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
            this.mobileNav.querySelector('[data-panel="canvas"]').classList.add('active');
        });
        
        document.body.appendChild(overlay);
        this.mobileOverlay = overlay;
    }
    
    // 切换移动端面板
    toggleMobilePanel(panelName) {
        const skinPanel = document.querySelector('.skin-list-panel');
        const propPanel = document.querySelector('.properties-panel');
        
        // 关闭所有面板
        if (panelName !== 'skins') {
            skinPanel.classList.remove('open');
        }
        if (panelName !== 'properties') {
            propPanel.classList.remove('open');
        }
        
        // 切换目标面板
        if (panelName === 'skins') {
            skinPanel.classList.toggle('open');
            this.mobileOverlay.classList.toggle('active', skinPanel.classList.contains('open'));
        } else if (panelName === 'properties') {
            propPanel.classList.toggle('open');
            this.mobileOverlay.classList.toggle('active', propPanel.classList.contains('open'));
        } else if (panelName === 'canvas') {
            this.mobileOverlay.classList.remove('active');
        }
    }
    
    // 关闭所有移动端面板
    closeAllMobilePanels() {
        document.querySelector('.skin-list-panel')?.classList.remove('open');
        document.querySelector('.properties-panel')?.classList.remove('open');
        this.mobileOverlay?.classList.remove('active');
    }

    setDefaultImage(image) {
        this.defaultImage = image;
        if (this.activeSkin !== null && this.activeSkin.image === null)
            this.setSkin(this.activeSkin);
    }

    setSkin(skin) {
        this.activeSkin = skin;
        // 设置 skin 到 groupList
        this.groupList.setSkin(skin);
        
        if (skin.image !== null)
            this.primaryCanvas.setTexture(skin.image);
        else
            this.primaryCanvas.setTexture(this.defaultImage);
        this.primaryCanvas.setModel(skin.model);
        if (skin.model !== null)
            this.groupList.setObjects(skin.model.objects, skin.bones);
        this.skinListUi.setSelected(skin);
        this.propManager.setSkin(skin);
        this.propManager.update();
    }

    createSkin(index) {
        let skin = new Skin(index);
        skin.updateCb.add(() => {
            if (skin === this.activeSkin)
                this.setSkin(this.activeSkin);
        });
        return skin;
    }

    deleteSkin(skin) {
        skin.deleteFromLS();
        this.skins.splice(skin.index, 1);
        for (let i = skin.index; i < this.skins.length; i++) {
            this.skins[i].deleteFromLS();
            this.skins[i].index = i;
            this.skins[i].saveImageToLS();
            this.skins[i].saveModelToLS();
            this.skins[i].saveBonesToLS();
        }
        skin.index = -1;
        localStorage.setItem("skin.count", this.skins.length);
        this.setSkins(this.skins);
    }

    addSkin() {
        let skin = this.createSkin(this.skins.length);
        this.skins.push(skin);
        localStorage.setItem("skin.count", this.skins.length);
        this.skinListUi.setSkinList(this.skins);
        return skin;
    }

    addBone() {
        if (!this.activeSkin) {
            alert("请先选择或创建一个皮肤！");
            return;
        }

        // 弹出对话框输入骨骼名称
        const boneName = prompt("请输入骨骼名称：", "bone_" + this.activeSkin.bones.length);
        if (!boneName || boneName.trim() === "") {
            return;
        }

        // 检查是否已存在同名骨骼
        const existingBone = this.activeSkin.bones.find(b => b.name === boneName.trim());
        if (existingBone) {
            alert("已存在名为 \"" + boneName + "\" 的骨骼！");
            return;
        }

        // 让用选择父骨骼
        let parentName = null;
        if (this.activeSkin.bones.length > 0) {
            const boneNames = this.activeSkin.bones.map(b => b.name).join("\n");
            const useParent = confirm("是否要设置父骨骼？\n\n当前骨骼列表:\n" + boneNames + "\n\n点击确定设置父骨骼，点击取消创建根骨骼");
            if (useParent) {
                const parentInput = prompt("请输入父骨骼名称（区分大小写）:");
                if (parentInput && parentInput.trim() !== "") {
                    const parentBone = this.activeSkin.bones.find(b => b.name === parentInput.trim());
                    if (parentBone) {
                        parentName = parentInput.trim();
                    } else {
                        alert("未找到名为 \"" + parentInput + "\" 的骨骼！将创建为根骨骼");
                    }
                }
            }
        }

        // 创建新骨骼
        const newBone = {
            "name": boneName.trim(),
            "pivot": [0, 0, 0],
            "rotation": [0, 0, 0],
            "position": [0, 0, 0],
            "mirror": false,
            "groups": []
        };
        
        // 设置父骨骼
        if (parentName) {
            newBone.parent = parentName;
        }

        // 添加到骨骼列表
        this.activeSkin.bones.push(newBone);

        // 保存并刷新
        this.activeSkin.saveBonesToLS();
        this.activeSkin.assignBoneInfoToGroups();
        this.groupList.setObjects(this.activeSkin.model.objects, this.activeSkin.bones);

        alert("骨骼 \"" + boneName + "\" 添加成功！" + (parentName ? " 父骨骼：" + parentName : ""));
    }

    deleteSelectedBone() {
        if (!this.activeSkin) {
            alert("请先选择或创建一个皮肤！");
            return;
        }

        const selectedType = this.groupList.selectionType;
        const selectedObject = this.groupList.selection;

        if (!selectedType || !selectedObject) {
            alert("请先在几何层级中选择一个骨骼！");
            return;
        }

        if (selectedType !== GroupList.TYPE_BONE) {
            alert("请选择一个骨骼（而不是组）！");
            return;
        }

        // 确认删除
        const confirmDelete = confirm("确定要删除骨骼 \"" + selectedObject.name + "\" 吗？\n\n注意：删除骨骼会同时删除其关联的所有组！");
        if (!confirmDelete) {
            return;
        }

        // 从骨骼列表中移除
        const boneIndex = this.activeSkin.bones.indexOf(selectedObject);
        if (boneIndex >= 0) {
            this.activeSkin.bones.splice(boneIndex, 1);
        }

        // 保存并刷新
        this.activeSkin.saveBonesToLS();
        this.activeSkin.assignBoneInfoToGroups();
        this.groupList.setObjects(this.activeSkin.model.objects, this.activeSkin.bones);
        this.groupList.setSelection(null, null);

        // 清除画布选择
        this.primaryCanvas.setSelectedGroup(null);
        this.propManager.update();
    }

    setSkins(skins) {
        this.skins = skins;
        if (this.skins.length === 0) {
            this.setSkin(this.addSkin());
        } else {
            this.skinListUi.setSkinList(this.skins);
            this.setSkin(this.skins[0]);
        }
    }

    loadCurrentSkins(callback) {
        let skinCount = localStorage.getItem("skin.count") || 0;
        let skins = [];
        for (let i = 0; i < skinCount; i++) {
            let skin = this.createSkin(i);
            skin.loadFromLS();
            skins.push(skin);
        }
        callback(skins);
    }

    exportManifest() {
        return {
            "format_version": 2,
            "header": {
                "name": "Custom Skin Pack",
                "uuid": UiHelper.generateUUID(),
                "version": [1, 0, 0]
            },
            "modules": [
                {
                    "type": "skin_pack",
                    "uuid": UiHelper.generateUUID(),
                    "version": [1, 0, 0]
                }
            ]
        };
    }

    exportSkinList() {
        let skins = [];
        for (let skin of this.skins) {
            skins.push({
                "localization_name": "Skin #" + skin.index,
                "geometry": "geometry.n" + skin.index,
                "texture": "skin_" + skin.index + ".png",
                "type": "free"
            });
        }
        return {
            "skins": skins,
            "serialize_name": "Custom Skins",
            "localization_name": "Custom Skins"
        };
    }

    exportGeometry() {
        let result = {
            "format_version": "1.8.0"
        };
        for (let skin of this.skins) {
            let geo = skin.exportGeometry();
            if (geo !== null)
                result["geometry.n" + skin.index] = geo;
        }
        return result;
    }

    export() {
        // 检查是否有可导出的皮肤
        if (this.skins.length === 0) {
            alert("没有可导出的皮肤！");
            return;
        }

        // 使用 dontDeflate = true 避免加载 deflate.js
        zip.createWriter(new zip.BlobWriter("application/zip"), (writer) => {
            let textFiles = [
                ["manifest.json", JSON.stringify(this.exportManifest())],
                ["skins.json", JSON.stringify(this.exportSkinList())],
                ["geometry.json", JSON.stringify(this.exportGeometry())]
            ];

            let handleError = (err) => {
                alert("导出失败：" + err);
            };

            // 先写入文本文件
            let writeText = (idx) => {
                if (idx >= textFiles.length) {
                    writeSkin(0);
                } else {
                    let fi = textFiles[idx];
                    try {
                        writer.add(fi[0], new zip.TextReader(fi[1]), () => writeText(idx + 1));
                    } catch (e) {
                        handleError(e);
                    }
                }
            };

            // 再写入皮肤图片
            let writeSkin = (idx) => {
                if (idx >= this.skins.length) {
                    // 所有文件写入完成，关闭 zip
                    try {
                        writer.close((blob) => {
                            UiHelper.saveBlob(blob, "skinpack.zip");
                        });
                    } catch (e) {
                        handleError(e);
                    }
                } else {
                    let skin = this.skins[idx];
                    if (skin.imageUrl) {
                        try {
                            writer.add("skin_" + skin.index + ".png", new zip.Data64URIReader(skin.imageUrl), () => writeSkin(idx + 1));
                        } catch (e) {
                            handleError(e);
                        }
                    } else {
                        // 跳过没有纹理的皮肤
                        writeSkin(idx + 1);
                    }
                }
            };

            writeText(0);
        }, (err) => {
            alert("无法创建 zip 写入器：" + err);
        }, true); // dontDeflate = true
    }

}
