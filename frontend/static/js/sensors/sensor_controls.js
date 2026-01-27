/**
 * sensor_controls.js
 * 
 * Interactive controls for sensor positioning and orientation:
 * - Drag and drop repositioning
 * - Entity attachment (follow moving objects)
 * - Keyboard control for position and orientation
 */

/**
 * Make a sensor draggable with mouse
 * Click and drag to reposition the sensor on the terrain
 * 
 * @param {Object} viewer - Cesium viewer instance
 * @param {SensorBase} sensor - Sensor to make draggable
 * @param {Object} options - Configuration options
 * @returns {Cesium.ScreenSpaceEventHandler} Handler for cleanup
 */
export function makeSensorDraggable(viewer, sensor, options = {}) {
    const {
        lockHeight = false,        // Keep height constant while dragging
        showLabel = true,          // Show position while dragging
        onDragStart = null,        // Callback when drag starts
        onDrag = null,             // Callback during drag
        onDragEnd = null           // Callback when drag ends
    } = options;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    let dragging = false;
    let dragLabel = null;

    // Create label for showing position during drag
    if (showLabel) {
        dragLabel = viewer.entities.add({
            label: {
                text: '',
                font: '14pt monospace',
                fillColor: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                pixelOffset: new Cesium.Cartesian2(0, -50),
                show: false,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
    }

    // Mouse down - start dragging
    handler.setInputAction((click) => {
        const pickedObject = viewer.scene.pick(click.position);
        
        if (Cesium.defined(pickedObject) && 
            pickedObject.id === sensor.entity) {
            dragging = true;
            viewer.scene.screenSpaceCameraController.enableRotate = false;
            viewer.scene.screenSpaceCameraController.enableTranslate = false;
            
            if (showLabel && dragLabel) {
                dragLabel.label.show = true;
            }
            
            if (onDragStart) onDragStart(sensor);
            
            console.log(`Dragging ${sensor.type} sensor [${sensor.id.substring(0, 8)}]`);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // Mouse move - update position
    handler.setInputAction((movement) => {
        if (dragging) {
            const cartesian = viewer.camera.pickEllipsoid(
                movement.endPosition,
                viewer.scene.globe.ellipsoid
            );
            
            if (cartesian) {
                const carto = Cesium.Cartographic.fromCartesian(cartesian);
                const lon = Cesium.Math.toDegrees(carto.longitude);
                const lat = Cesium.Math.toDegrees(carto.latitude);
                const height = lockHeight ? sensor.height : carto.height + sensor.height;
                
                sensor.updatePosition(lon, lat, height);
                
                if (showLabel && dragLabel) {
                    dragLabel.position = Cesium.Cartesian3.fromDegrees(lon, lat, height);
                    dragLabel.label.text = 
                        `Lon: ${lon.toFixed(6)}\n` +
                        `Lat: ${lat.toFixed(6)}\n` +
                        `Alt: ${height.toFixed(1)}m`;
                }
                
                if (onDrag) onDrag(sensor, lon, lat, height);
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Mouse up - stop dragging
    handler.setInputAction(() => {
        if (dragging) {
            dragging = false;
            viewer.scene.screenSpaceCameraController.enableRotate = true;
            viewer.scene.screenSpaceCameraController.enableTranslate = true;
            
            if (showLabel && dragLabel) {
                dragLabel.label.show = false;
            }
            
            if (onDragEnd) onDragEnd(sensor);
            
            console.log(`Released sensor at: ${sensor.lon.toFixed(6)}, ${sensor.lat.toFixed(6)}, ${sensor.height.toFixed(1)}m`);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // Store cleanup function
    handler.cleanup = () => {
        handler.destroy();
        if (dragLabel) {
            viewer.entities.remove(dragLabel);
        }
    };

    return handler;
}


/**
 * Attach sensor to a moving entity (vehicle, drone, etc.)
 * Sensor will follow the entity and optionally match its orientation
 * 
 * @param {Object} viewer - Cesium viewer instance
 * @param {SensorBase} sensor - Sensor to attach
 * @param {Cesium.Entity} entity - Entity to attach to
 * @param {Object} options - Attachment configuration
 * @returns {Object} Handler with update function and cleanup
 */
export function attachSensorToEntity(viewer, sensor, entity, options = {}) {
    const {
        offsetHeight = 2,          // Height offset above entity (meters)
        offsetHeading = 0,         // Heading offset from entity direction (degrees)
        matchOrientation = true,   // Match entity's heading
        offsetX = 0,               // Forward/backward offset (meters)
        offsetY = 0,               // Left/right offset (meters)
        onUpdate = null            // Callback on each update
    } = options;

    let isActive = true;

    const handler = viewer.clock.onTick.addEventListener(() => {
        if (!isActive) return;

        const entityPos = entity.position.getValue(viewer.clock.currentTime);
        
        if (entityPos) {
            const carto = Cesium.Cartographic.fromCartesian(entityPos);
            let lon = Cesium.Math.toDegrees(carto.longitude);
            let lat = Cesium.Math.toDegrees(carto.latitude);
            const height = carto.height + offsetHeight;

            // Apply X/Y offsets if entity has orientation
            if ((offsetX !== 0 || offsetY !== 0) && entity.orientation) {
                const orientation = entity.orientation.getValue(viewer.clock.currentTime);
                if (orientation) {
                    const hpr = Cesium.HeadingPitchRoll.fromQuaternion(orientation);
                    const heading = hpr.heading;
                    
                    // Calculate offset in world coordinates
                    const offsetLon = offsetX * Math.sin(heading) + offsetY * Math.cos(heading);
                    const offsetLat = offsetX * Math.cos(heading) - offsetY * Math.sin(heading);
                    
                    // Convert meters to degrees (approximate)
                    lon += offsetLon / (111320 * Math.cos(carto.latitude));
                    lat += offsetLat / 110540;
                }
            }

            sensor.updatePosition(lon, lat, height);
            
            // Match entity orientation if available and enabled
            if (matchOrientation && entity.orientation) {
                const orientation = entity.orientation.getValue(viewer.clock.currentTime);
                if (orientation) {
                    const hpr = Cesium.HeadingPitchRoll.fromQuaternion(orientation);
                    sensor.updateOrientation(
                        Cesium.Math.toDegrees(hpr.heading) + offsetHeading,
                        sensor.pitch,
                        0
                    );
                }
            }
            
            if (onUpdate) onUpdate(sensor, lon, lat, height);
        }
    });

    // Return control object
    return {
        detach: () => {
            isActive = false;
            viewer.clock.onTick.removeEventListener(handler);
            console.log(`Sensor ${sensor.id.substring(0, 8)} detached from entity`);
        },
        isAttached: () => isActive,
        setOffsetHeight: (newHeight) => { options.offsetHeight = newHeight; },
        setOffsetHeading: (newHeading) => { options.offsetHeading = newHeading; },
        entity: entity,
        sensor: sensor
    };
}


/**
 * Enable keyboard control for sensor position and orientation
 * Use arrow keys for movement, Q/E for altitude, WASD for rotation
 * 
 * @param {SensorBase} sensor - Sensor to control
 * @param {Object} options - Control configuration
 * @returns {Object} Controller with enable/disable and cleanup
 */
export function enableKeyboardControl(sensor, options = {}) {
    const {
        moveSpeed = 0.0001,        // Horizontal movement speed (degrees per key press)
        verticalSpeed = 1,         // Vertical movement speed (meters per key press)
        rotateSpeed = 5,           // Rotation speed (degrees per key press)
        showStatus = true,         // Show status messages in console
        customKeys = null          // Custom key bindings
    } = options;

    const keyBindings = customKeys || {
        // Position control
        moveNorth: 'ArrowUp',
        moveSouth: 'ArrowDown',
        moveWest: 'ArrowLeft',
        moveEast: 'ArrowRight',
        moveUp: 'q',
        moveDown: 'e',
        
        // Orientation control
        pitchUp: 'w',
        pitchDown: 's',
        rotateLeft: 'a',
        rotateRight: 'd',
        rollLeft: 'z',
        rollRight: 'c',
        
        // Range control
        increaseRange: '+',
        decreaseRange: '-',
        
        // Reset
        resetOrientation: 'r'
    };

    let isActive = true;
    let shiftPressed = false;

    const keyDownHandler = (e) => {
        if (!isActive) return;

        // Track shift key for faster movement
        if (e.key === 'Shift') {
            shiftPressed = true;
            return;
        }

        const speedMultiplier = shiftPressed ? 5 : 1;
        let updated = false;

        // Position controls
        if (e.key === keyBindings.moveNorth) {
            sensor.updatePosition(sensor.lon, sensor.lat + moveSpeed * speedMultiplier, sensor.height);
            updated = true;
        } else if (e.key === keyBindings.moveSouth) {
            sensor.updatePosition(sensor.lon, sensor.lat - moveSpeed * speedMultiplier, sensor.height);
            updated = true;
        } else if (e.key === keyBindings.moveWest) {
            sensor.updatePosition(sensor.lon - moveSpeed * speedMultiplier, sensor.lat, sensor.height);
            updated = true;
        } else if (e.key === keyBindings.moveEast) {
            sensor.updatePosition(sensor.lon + moveSpeed * speedMultiplier, sensor.lat, sensor.height);
            updated = true;
        } else if (e.key === keyBindings.moveUp) {
            sensor.updatePosition(sensor.lon, sensor.lat, sensor.height + verticalSpeed * speedMultiplier);
            updated = true;
        } else if (e.key === keyBindings.moveDown) {
            sensor.updatePosition(sensor.lon, sensor.lat, sensor.height - verticalSpeed * speedMultiplier);
            updated = true;
        }
        
        // Orientation controls
        else if (e.key === keyBindings.pitchUp) {
            sensor.updateOrientation(sensor.heading, Math.min(sensor.pitch + rotateSpeed * speedMultiplier, 90), sensor.roll);
            updated = true;
        } else if (e.key === keyBindings.pitchDown) {
            sensor.updateOrientation(sensor.heading, Math.max(sensor.pitch - rotateSpeed * speedMultiplier, -90), sensor.roll);
            updated = true;
        } else if (e.key === keyBindings.rotateLeft) {
            sensor.updateOrientation((sensor.heading - rotateSpeed * speedMultiplier + 360) % 360, sensor.pitch, sensor.roll);
            updated = true;
        } else if (e.key === keyBindings.rotateRight) {
            sensor.updateOrientation((sensor.heading + rotateSpeed * speedMultiplier) % 360, sensor.pitch, sensor.roll);
            updated = true;
        } else if (e.key === keyBindings.rollLeft) {
            sensor.updateOrientation(sensor.heading, sensor.pitch, (sensor.roll - rotateSpeed * speedMultiplier + 360) % 360);
            updated = true;
        } else if (e.key === keyBindings.rollRight) {
            sensor.updateOrientation(sensor.heading, sensor.pitch, (sensor.roll + rotateSpeed * speedMultiplier) % 360);
            updated = true;
        }
        
        // Range control
        else if (e.key === keyBindings.increaseRange) {
            sensor.updateRange(sensor.range * 1.1);
            updated = true;
        } else if (e.key === keyBindings.decreaseRange) {
            sensor.updateRange(sensor.range * 0.9);
            updated = true;
        }
        
        // Reset
        else if (e.key === keyBindings.resetOrientation) {
            sensor.updateOrientation(0, -90, 0);
            updated = true;
            if (showStatus) console.log('Orientation reset to default (down)');
        }

        if (updated && showStatus) {
            console.log(
                `${sensor.type} [${sensor.id.substring(0, 8)}] | ` +
                `Pos: ${sensor.lon.toFixed(6)}, ${sensor.lat.toFixed(6)}, ${sensor.height.toFixed(1)}m | ` +
                `Orient: H:${sensor.heading.toFixed(0)}° P:${sensor.pitch.toFixed(0)}° R:${sensor.roll.toFixed(0)}° | ` +
                `Range: ${sensor.range.toFixed(1)}m`
            );
        }

        if (updated) {
            e.preventDefault();
        }
    };

    const keyUpHandler = (e) => {
        if (e.key === 'Shift') {
            shiftPressed = false;
        }
    };

    // Add event listeners
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    // Print instructions
    if (showStatus) {
        console.log(`\n=== Keyboard Control Enabled for ${sensor.type} [${sensor.id.substring(0, 8)}] ===`);
        console.log('Position:');
        console.log('  Arrow Keys: Move horizontally (North/South/East/West)');
        console.log('  Q/E: Move up/down');
        console.log('Orientation:');
        console.log('  W/S: Pitch up/down');
        console.log('  A/D: Rotate heading left/right');
        console.log('  Z/C: Roll left/right');
        console.log('Range:');
        console.log('  +/-: Increase/decrease detection range');
        console.log('Other:');
        console.log('  R: Reset orientation to default');
        console.log('  Hold SHIFT: 5x faster movement');
        console.log('===============================================\n');
    }

    // Return control object
    return {
        disable: () => {
            isActive = false;
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
            if (showStatus) console.log(`Keyboard control disabled for sensor ${sensor.id.substring(0, 8)}`);
        },
        enable: () => {
            isActive = true;
            if (showStatus) console.log(`Keyboard control enabled for sensor ${sensor.id.substring(0, 8)}`);
        },
        isActive: () => isActive,
        cleanup: () => {
            document.removeEventListener('keydown', keyDownHandler);
            document.removeEventListener('keyup', keyUpHandler);
        },
        sensor: sensor
    };
}


/**
 * Create a multi-sensor attachment system for a single entity
 * Allows multiple sensors with different mount points
 * 
 * @param {Object} viewer - Cesium viewer instance
 * @param {Cesium.Entity} entity - Entity to attach sensors to
 * @returns {Object} Multi-sensor attachment manager
 */
export function createSensorMount(viewer, entity) {
    const attachments = [];

    return {
        addSensor: (sensor, mountOptions = {}) => {
            const attachment = attachSensorToEntity(viewer, sensor, entity, mountOptions);
            attachments.push(attachment);
            console.log(`Sensor ${sensor.type} mounted to entity`);
            return attachment;
        },
        
        removeSensor: (sensor) => {
            const index = attachments.findIndex(a => a.sensor === sensor);
            if (index >= 0) {
                attachments[index].detach();
                attachments.splice(index, 1);
                console.log(`Sensor ${sensor.type} unmounted`);
            }
        },
        
        detachAll: () => {
            attachments.forEach(a => a.detach());
            attachments.length = 0;
            console.log('All sensors detached');
        },
        
        getSensors: () => attachments.map(a => a.sensor),
        
        getAttachmentCount: () => attachments.length,
        
        entity: entity
    };
}


// Export utility functions
export default {
    makeSensorDraggable,
    attachSensorToEntity,
    enableKeyboardControl,
    createSensorMount
};
