export class AmmoAdapter {
  constructor() {
    this.enabled = false;
    this.world = null;
    this._bodies = new Map(); // maps application body -> Ammo body
  }

  init() {
    // Ensure multiple callers share the same init promise
    if (this._initPromise) return this._initPromise;

    this._initPromise = new Promise((resolve) => {
      this._initAttempted = true;
      this._initFailedLogged = this._initFailedLogged || false;

      // If Ammo() factory function is present, call it and wait for resolution
      if (typeof Ammo === 'function') {
        Ammo()
          .then((lib) => {
            try {
              // Only set global after successful resolution
              window.Ammo = lib;
              const AmmoLib = lib;

              const collisionConfiguration = new AmmoLib.btDefaultCollisionConfiguration();
              const dispatcher = new AmmoLib.btCollisionDispatcher(collisionConfiguration);
              const broadphase = new AmmoLib.btDbvtBroadphase();
              const solver = new AmmoLib.btSequentialImpulseConstraintSolver();
              const world = new AmmoLib.btDiscreteDynamicsWorld(
                dispatcher,
                broadphase,
                solver,
                collisionConfiguration
              );
              world.setGravity(new AmmoLib.btVector3(0, 0, -9.81));

              // Add a static ground plane at z=0 for collisions
              const groundShape = new AmmoLib.btStaticPlaneShape(new AmmoLib.btVector3(0, 0, 1), 0);
              const groundTransform = new AmmoLib.btTransform();
              groundTransform.setIdentity();
              groundTransform.setOrigin(new AmmoLib.btVector3(0, 0, 0));
              const groundMotionState = new AmmoLib.btDefaultMotionState(groundTransform);
              const groundRbInfo = new AmmoLib.btRigidBodyConstructionInfo(
                0,
                groundMotionState,
                groundShape,
                new AmmoLib.btVector3(0, 0, 0)
              );
              const groundBody = new AmmoLib.btRigidBody(groundRbInfo);
              world.addRigidBody(groundBody);

              this.world = world;
              this.Ammo = AmmoLib;
              this.enabled = true;
              console.log('[AmmoAdapter] Ammo initialized successfully');
              resolve(true);
            } catch (e) {
              this.enabled = false;
              if (!this._initFailedLogged) {
                console.info('[AmmoAdapter] Ammo failed to load → using Light physics');
                this._initFailedLogged = true;
              }
              resolve(false);
            }
          })
          .catch(() => {
            this.enabled = false;
            if (!this._initFailedLogged) {
              console.info('[AmmoAdapter] Ammo failed to load → using Light physics');
              this._initFailedLogged = true;
            }
            resolve(false);
          });
        return this._initPromise;
      }

      // No synchronous global check — if Ammo() factory isn't present, fail fast
      this.enabled = false;
      if (!this._initFailedLogged) {
        console.info('[AmmoAdapter] Ammo failed to load → using Light physics');
        this._initFailedLogged = true;
      }
      resolve(false);
    });

    return this._initPromise;
  }

  createBody(appBody) {
    if (!this.enabled) return;
    if (this._bodies.has(appBody)) return;

    const Ammo = this.Ammo;
    // Use a simple box shape approximation centered on appBody.position
    const pos = appBody.position || { x: 0, y: 0, z: 0 };
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x || pos.x, pos.y || pos.y, pos.z || pos.z));

    // Simple box half extents
    const halfExtents = new Ammo.btVector3(1, 1, 1);
    const shape = new Ammo.btBoxShape(halfExtents);

    const localInertia = new Ammo.btVector3(0, 0, 0);
    const mass = appBody.mass ?? 1;
    if (mass > 0) shape.calculateLocalInertia(mass, localInertia);

    const motionState = new Ammo.btDefaultMotionState(transform);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    // store bullet body and link to app body
    this.world.addRigidBody(body);
    this._bodies.set(appBody, { body, motionState, shape });

    // set damping to emulate drag
    body.setDamping(appBody.drag ?? 0.02, appBody.drag ?? 0.02);

    // mark static
    if (appBody.isStatic) {
      body.setCollisionFlags(body.getCollisionFlags() | 2); // CF_STATIC_OBJECT
    }

    return body;
  }

  removeBody(appBody) {
    if (!this.enabled) return;
    const rec = this._bodies.get(appBody);
    if (!rec) return;
    this.world.removeRigidBody(rec.body);
    try {
      this.Ammo.destroy(rec.body);
      this.Ammo.destroy(rec.motionState);
      this.Ammo.destroy(rec.shape);
    } catch (e) {}
    this._bodies.delete(appBody);
  }

  step(dt) {
    if (!this.enabled) return;
    // stepSimulation(timeStep, maxSubSteps)
    this.world.stepSimulation(dt, 5, 1 / 60);

    // sync back to app bodies
    for (const [appBody, rec] of this._bodies.entries()) {
      const ms = rec.body.getMotionState();
      if (ms) {
        const tmpTrans = new this.Ammo.btTransform();
        ms.getWorldTransform(tmpTrans);
        const origin = tmpTrans.getOrigin();
        const vel = rec.body.getLinearVelocity();

        // Update app body position vector and velocity in plain JS objects
        appBody.position = {
          x: origin.x(),
          y: origin.y(),
          z: origin.z(),
        };

        appBody.velocity = {
          x: vel.x(),
          y: vel.y(),
          z: vel.z(),
        };

        // free temporary transform
        this.Ammo.destroy(tmpTrans);
      }
    }
  }
}
