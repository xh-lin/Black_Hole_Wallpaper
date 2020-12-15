/* 
  Reference(s):
  Aerotwist - Creating Particles with Three.js
  https://aerotwist.com/tutorials/creating-particles-with-three-js/ 
*/


class BlackHole{

  constructor() {
    // black sphere (event horizon)
    const sphereGeo = new THREE.SphereGeometry( 90, 90, 90 );
    const darkMat = new THREE.MeshStandardMaterial({ color: 'black' });
    this.sphereMesh = new THREE.Mesh( sphereGeo, darkMat );
    
    // =========================================================================
    // disk
    noise.seed(Math.random());
    this.rotateAxis = new THREE.Vector3( 0, 1, 0 );
    this.diskStart = 100;
    this.diskRange = 1000;
    this.diskThickness = 30;
    
   // particle variables (acceleration disk)
    this.diskParticleCount = 30000;
    this.diskParticles = new THREE.Geometry();
    const diskParticleMat = new THREE.PointsMaterial({
      size: 10,
      vertexColors: true
    });

    // create individual disk particles
    for (var p = 0; p < this.diskParticleCount; p++) {
      // position
      const theta = Math.random() * 2*Math.PI;
      const radius = Math.random()*this.diskRange + this.diskStart + 200*noise.perlin2(1, theta*300);
      const x = radius * Math.cos( theta );
      const y = Math.random()*this.diskThickness - this.diskThickness/2;
      const z = radius * Math.sin( theta );
      var particle = new THREE.Vector3( x, y, z );
      this.diskParticles.vertices.push( particle );
      // color
      const r = noise.perlin2( x/1000, radius/200 )/2 + 0.5;
      const g = 0.5;
      const b = 0.5;
      var color = new THREE.Color( r, g, b );
      this.diskParticles.colors.push( color );
    }

    this.diskParticleSystem = new THREE.Points( this.diskParticles, diskParticleMat );

    // =========================================================================
    // jet
    this.isJetting = true;
    this.jettingInterval = 0;
    this.jetCountDown = 0;
    this.jetNext = 0;
    this.jetDirection = 1; // 1 / -1

    // particle variables (astrophysical jet)
    this.jetParticleCount = 30000;
    this.jetParticles = new THREE.Geometry();
    const jetParticleMat = new THREE.PointsMaterial({
      size: 30,
      color: 0x3030ff
    });

    // create individual jet particles
    for (var p = 0; p < this.jetParticleCount; p++) {
      var particle = new THREE.Vector3( 0, 0, 0 );
      particle.velocity = new THREE.Vector3( 0, 0, 0 );
      particle.jetted = false;
      this.jetParticles.vertices.push( particle );
    }

    this.jetParticleSystem = new THREE.Points( this.jetParticles, jetParticleMat );
  }

  show(scene) {
    scene.add( this.sphereMesh );
    scene.add( this.diskParticleSystem );
    scene.add( this.jetParticleSystem );
  }

  onAnimate() {
    // for each disk particle
    var dpCount = this.diskParticleCount;
    while (dpCount--) {
      var dParticle = this.diskParticles.vertices[dpCount];
      // update particle position
      const dst = dParticle.distanceTo( this.sphereMesh.position );
      const c = 30;
      const p = 1.7;
      const d = 50;
      const angular_velocity = c / Math.pow(dst-this.diskStart+d, p);
      dParticle.applyAxisAngle( this.rotateAxis, angular_velocity );
    }

    // flag to the particle system that we've changed its vertices.
    this.diskParticleSystem.geometry.verticesNeedUpdate = true;

    // =========================================================================
    // launch next jet particle
    if (this.isJetting && !this.jetCountDown--) {
      var jParticle = this.jetParticles.vertices[this.jetNext];
      if (jParticle.jetted) {
        // reuse
        jParticle.set( 0, 0, 0 );
        jParticle.velocity.set( 0, 0, 0 );
      }
      else {
        jParticle.jetted = true;
      }
      // set velocity
      const radius = Math.random()/1.5;
      const theta = Math.random() * 2*Math.PI;
      const x = radius * Math.cos( theta );
      const y = 8 * (this.jetDirection *= -1);
      const z = radius * Math.sin( theta );
      jParticle.velocity.set( x, y, z );
      // get ready for next one
      this.jetNext = ++this.jetNext % this.jetParticleCount
      this.jetCountDown = this.jettingInterval;
    }

    // for each launched jet particle
    var jpCount = this.jetParticleCount;
    while (jpCount--) {
      var jParticle = this.jetParticles.vertices[jpCount];
      if (jParticle.jetted) {
        // update particle position
        const angular_velocity = 0.08;
        jParticle.applyAxisAngle( this.rotateAxis, angular_velocity );
        jParticle.velocity.applyAxisAngle( this.rotateAxis, angular_velocity );
        jParticle.add(jParticle.velocity);
      }
    }

    // flag to the particle system that we've changed its vertices.
    this.jetParticleSystem.geometry.verticesNeedUpdate = true;
  }

}